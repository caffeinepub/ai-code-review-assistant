import Types "../types/codereview";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Char "mo:core/Char";
import List "mo:core/List";

/// Domain logic for the AI Code Review Assistant.
/// Handles JSON request building and Gemini API response parsing.
/// All parsing functions are defensive — they never crash on malformed input.
module {
  public type CodeReview = Types.CodeReview;
  public type Bug = Types.Bug;

  // ---------------------------------------------------------------------------
  // CONSTANTS
  // ---------------------------------------------------------------------------

  /// Maximum allowed code length (characters). Rejects oversized inputs early.
  public let MAX_CODE_LENGTH : Nat = 50_000;

  // ---------------------------------------------------------------------------
  // INPUT VALIDATION
  // ---------------------------------------------------------------------------

  /// Validate code and language inputs before sending to Gemini.
  /// Returns null on success, or an error message Text on failure.
  /// Runs synchronously before any HTTP call — validation is cheap and fast.
  public func validateInputs(code : Text, language : Text) : ?Text {
    // Reject empty code
    if (code.size() == 0) {
      return ?"Code cannot be empty.";
    };
    // Reject excessively long code to prevent abuse and out-of-cycles errors
    if (code.size() > MAX_CODE_LENGTH) {
      return ?"Code exceeds the maximum allowed length of 50,000 characters.";
    };
    // Reject empty language identifier
    if (language.size() == 0) {
      return ?"Language must be specified.";
    };
    // Reject obviously-malicious language strings (> 100 chars)
    // The language is JSON-escaped before embedding, so this is a belt-and-suspenders check
    if (language.size() > 100) {
      return ?"Language identifier is too long.";
    };
    null // All checks passed
  };

  // ---------------------------------------------------------------------------
  // JSON ESCAPING
  // ---------------------------------------------------------------------------

  /// Map a 0–15 nibble to its lowercase hex ASCII character.
  /// Used internally to produce \uXXXX escape sequences for control characters.
  func nibbleToHex(n : Nat32) : Text {
    // 0-9  → '0'-'9'  (ASCII 48-57)
    // 10-15 → 'a'-'f' (ASCII 97-102)
    if (n < 10) {
      Text.fromChar(Char.fromNat32(48 + n)) // '0' + n
    } else {
      Text.fromChar(Char.fromNat32(87 + n)) // 'a' + (n - 10)  → 97 + n - 10 = 87 + n
    }
  };

  /// Escape a Text value so it can be safely embedded inside a JSON string literal.
  /// Handles:
  ///   - backslash  → \\
  ///   - double-quote → \"
  ///   - newline    → \n
  ///   - carriage return → \r
  ///   - tab        → \t
  ///   - null byte  → \u0000
  ///   - other ASCII control chars (0x01–0x1F) → \u00XX
  public func escapeJson(s : Text) : Text {
    // flatMap does a single pass over characters, building the escaped string.
    s.flatMap(func(c : Char) : Text {
      let cp = c.toNat32();
      if (c == '\\')    "\\\\"
      else if (cp == 34) "\\\"" // double-quote
      else if (c == '\n') "\\n"
      else if (c == '\r') "\\r"
      else if (c == '\t') "\\t"
      else if (cp == 0)   "\\u0000" // null byte
      else if (cp < 0x20) {
        // Other ASCII control characters: encode as \u00XX
        let hi = cp / 16;
        let lo = cp % 16;
        "\\u00" # nibbleToHex(hi) # nibbleToHex(lo)
      } else {
        Text.fromChar(c)
      }
    })
  };

  // ---------------------------------------------------------------------------
  // REQUEST BUILDING
  // ---------------------------------------------------------------------------

  /// Build the JSON payload for the Google Gemini generateContent API.
  /// The prompt instructs Gemini to return ONLY valid JSON matching our schema.
  /// Both user-controlled inputs (code, language) are JSON-escaped before embedding.
  public func buildRequestBody(code : Text, language : Text) : Text {
    let escapedLang = escapeJson(language);
    let escapedCode = escapeJson(code);

    // The schema is encoded with escaped quotes so it embeds correctly inside a JSON string
    let prompt =
      "You are an expert code reviewer. Review this " # escapedLang #
      " code and return a JSON object with this EXACT structure: " #
      "{\\\"bugs\\\": [{\\\"severity\\\": \\\"high|medium|low\\\", \\\"message\\\": \\\"description\\\"}], " #
      "\\\"improvements\\\": [\\\"suggestion1\\\"], " #
      "\\\"explanation\\\": \\\"plain English explanation\\\", " #
      "\\\"bestPractices\\\": [\\\"practice1\\\"], " #
      "\\\"qualityScore\\\": 85}. " #
      "qualityScore MUST be an integer from 0 to 100 using these grade bands: " #
      "0-49 = Poor, 50-69 = Fair, 70-84 = Good, 85-100 = Excellent. " #
      "Return ONLY valid JSON with no markdown, no code fences, no prose.\\n\\n" #
      "Code to review:\\n\\n" # escapedCode;

    "{" #
    "\"contents\":[{" #
      "\"parts\":[{" #
        "\"text\":\"" # prompt # "\"" #
      "}]" #
    "}]" #
    "}"
  };

  // ---------------------------------------------------------------------------
  // SUBSTRING SEARCH
  // ---------------------------------------------------------------------------

  /// Find the starting character index of needle in haystack.
  /// Returns null if needle is not found. Uses a sliding-window scan — O(n*m).
  func findSubstring(haystack : Text, needle : Text) : ?Nat {
    let hSize = haystack.size();
    let nSize = needle.size();
    if (nSize == 0) return ?0;
    if (hSize < nSize) return null;
    var i : Nat = 0;
    let limit : Nat = hSize - nSize + 1;
    label search while (i < limit) {
      let slice = Text.fromIter(haystack.toIter().drop(i).take(nSize));
      if (slice == needle) return ?i;
      i += 1;
    };
    null
  };

  // ---------------------------------------------------------------------------
  // FIELD EXTRACTORS
  // ---------------------------------------------------------------------------

  /// Extract a JSON string field value by field name.
  /// Tries both "field":"value" and "field": "value" (with optional space).
  /// Handles JSON escape sequences: \n \r \t \\ \" \/ and pass-through for others.
  public func extractStringField(json : Text, fieldName : Text) : ?Text {
    let needle1 = "\"" # fieldName # "\":\"";
    let needle2 = "\"" # fieldName # "\": \"";
    let startOpt : ?(Nat, Nat) = switch (findSubstring(json, needle1)) {
      case (?i) ?(i, needle1.size());
      case null {
        switch (findSubstring(json, needle2)) {
          case (?i) ?(i, needle2.size());
          case null null;
        }
      };
    };
    switch startOpt {
      case null null;
      case (?(idx, needleSize)) {
        let afterNeedle = Text.fromIter(json.toIter().drop(idx + needleSize));
        var value = "";
        var escaped = false;
        var found = false;
        label inner for (c in afterNeedle.toIter()) {
          if (escaped) {
            switch (c) {
              case ('n')  { value #= "\n" };
              case ('r')  { value #= "\r" };
              case ('t')  { value #= "\t" };
              case ('\\') { value #= "\\" };
              case ('/')  { value #= "/" };  // \/ is a valid JSON escape
              case (_)    { value #= Text.fromChar(c) };
            };
            escaped := false;
          } else if (c == '\\') {
            escaped := true;
          } else if (c.toNat32() == 34) { // closing double-quote
            found := true;
            break inner;
          } else {
            value #= Text.fromChar(c);
          };
        };
        if (found) ?value else null
      };
    }
  };

  /// Extract a JSON number field as Nat (non-negative integer).
  /// Skips leading whitespace after the colon.
  /// Returns null for negative numbers or unparseable values (caller uses a default).
  public func extractNatField(json : Text, fieldName : Text) : ?Nat {
    let needle = "\"" # fieldName # "\":";
    switch (findSubstring(json, needle)) {
      case null null;
      case (?idx) {
        var rest = Text.fromIter(json.toIter().drop(idx + needle.size()));
        // Skip leading whitespace (Gemini may emit "qualityScore": 85 with a space)
        var skipped = 0;
        label ws for (c in rest.toIter()) {
          if (c == ' ' or c == '\n' or c == '\r' or c == '\t') {
            skipped += 1;
          } else {
            break ws;
          };
        };
        if (skipped > 0) {
          rest := Text.fromIter(rest.toIter().drop(skipped));
        };
        // Reject negative numbers — Nat cannot represent them
        switch (rest.toIter().next()) {
          case (?'-') return null;
          case _ {};
        };
        // Collect digit characters to form the number
        var digits = "";
        label inner for (c in rest.toIter()) {
          if (c >= '0' and c <= '9') {
            digits #= Text.fromChar(c);
          } else {
            break inner;
          };
        };
        if (digits.size() == 0) return null;
        Nat.fromText(digits)
      };
    }
  };

  // ---------------------------------------------------------------------------
  // JSON STRING / ARRAY PARSING HELPERS
  // ---------------------------------------------------------------------------

  /// Parse one JSON string value starting AFTER the opening double-quote.
  /// Returns (parsedValue, charsConsumed) where consumed includes the closing quote.
  /// Returns null if the string is unterminated (malformed JSON).
  func parseJsonString(text : Text) : ?(Text, Nat) {
    var value = "";
    var escaped = false;
    var consumed = 0;
    var found = false;
    label inner for (c in text.toIter()) {
      consumed += 1;
      if (escaped) {
        switch (c) {
          case ('n')  { value #= "\n" };
          case ('r')  { value #= "\r" };
          case ('t')  { value #= "\t" };
          case ('\\') { value #= "\\" };
          case ('/')  { value #= "/" };
          case (_)    { value #= Text.fromChar(c) };
        };
        escaped := false;
      } else if (c == '\\') {
        escaped := true;
      } else if (c.toNat32() == 34) { // closing double-quote
        found := true;
        break inner;
      } else {
        value #= Text.fromChar(c);
      };
    };
    if (found) ?(value, consumed) else null
  };

  /// Skip leading whitespace. Returns (trimmedText, charsSkipped).
  func skipWhitespace(text : Text) : (Text, Nat) {
    var skipped = 0;
    label ws for (c in text.toIter()) {
      if (c == ' ' or c == '\n' or c == '\r' or c == '\t') {
        skipped += 1;
      } else {
        break ws;
      };
    };
    (Text.fromIter(text.toIter().drop(skipped)), skipped)
  };

  /// Parse a JSON array of strings for the named field.
  /// Tries both "field":[ and "field": [ forms.
  /// Defensive — returns [] on any malformed input without trapping.
  func parseStringArray(json : Text, fieldName : Text) : [Text] {
    let needle1 = "\"" # fieldName # "\":[";
    let needle2 = "\"" # fieldName # "\": [";
    let startOpt : ?(Nat, Nat) = switch (findSubstring(json, needle1)) {
      case (?i) ?(i, needle1.size());
      case null {
        switch (findSubstring(json, needle2)) {
          case (?i) ?(i, needle2.size());
          case null null;
        }
      };
    };
    switch startOpt {
      case null [];
      case (?(idx, needleSize)) {
        var cur = Text.fromIter(json.toIter().drop(idx + needleSize));
        let items = List.empty<Text>();
        label outer loop {
          let (trimmed, _) = skipWhitespace(cur);
          cur := trimmed;
          if (cur.size() == 0) break outer;

          let firstChar = switch (cur.toIter().next()) {
            case (?c) c;
            case null { break outer };
          };

          if (firstChar == ']') break outer; // End of array

          // Skip comma separators between elements
          if (firstChar == ',') {
            cur := Text.fromIter(cur.toIter().drop(1));
            let (t2, _) = skipWhitespace(cur);
            cur := t2;
          };

          // Expect a string element starting with double-quote
          switch (cur.toIter().next()) {
            case (?c) {
              if (c.toNat32() == 34) {
                cur := Text.fromIter(cur.toIter().drop(1)); // skip opening quote
                switch (parseJsonString(cur)) {
                  case (?(val, consumed)) {
                    items.add(val);
                    cur := Text.fromIter(cur.toIter().drop(consumed));
                  };
                  case null { break outer }; // unterminated string
                };
              } else {
                break outer; // unexpected token
              };
            };
            case null { break outer };
          };
        };
        items.toArray()
      };
    }
  };

  /// Parse the "bugs" array from a Gemini JSON response.
  /// Each bug object: { "severity": "high|medium|low", "message": "..." }
  /// Missing/invalid severity defaults to "medium". Missing message defaults to "Unknown issue".
  /// Defensive — never traps on malformed input.
  func parseBugsArray(json : Text) : [Bug] {
    let needle1 = "\"bugs\":[";
    let needle2 = "\"bugs\": [";
    let startOpt : ?(Nat, Nat) = switch (findSubstring(json, needle1)) {
      case (?i) ?(i, needle1.size());
      case null {
        switch (findSubstring(json, needle2)) {
          case (?i) ?(i, needle2.size());
          case null null;
        }
      };
    };
    switch startOpt {
      case null [];
      case (?(idx, needleSize)) {
        var cur = Text.fromIter(json.toIter().drop(idx + needleSize));
        let bugs = List.empty<Bug>();
        label outer loop {
          let (trimmed, _) = skipWhitespace(cur);
          cur := trimmed;
          if (cur.size() == 0) break outer;

          let firstChar = switch (cur.toIter().next()) {
            case (?c) c;
            case null { break outer };
          };

          if (firstChar == ']') break outer; // End of bugs array

          // Skip comma separators
          if (firstChar == ',') {
            cur := Text.fromIter(cur.toIter().drop(1));
            let (t2, _) = skipWhitespace(cur);
            cur := t2;
          };

          // Each bug is a JSON object starting with '{'
          switch (cur.toIter().next()) {
            case (?'{') {
              cur := Text.fromIter(cur.toIter().drop(1));
              // Collect everything up to the matching closing brace
              var depth = 1;
              var objContent = "";
              var consumed = 0;
              label obj for (c in cur.toIter()) {
                consumed += 1;
                if (c == '{') {
                  depth += 1;
                  objContent #= Text.fromChar(c);
                } else if (c == '}') {
                  depth -= 1;
                  if (depth == 0) break obj
                  else objContent #= Text.fromChar(c);
                } else {
                  objContent #= Text.fromChar(c);
                };
              };
              // Parse fields with defensive defaults
              let severity = switch (extractStringField(objContent, "severity")) {
                case (?s) {
                  let sl = s.toLower();
                  if (sl == "high" or sl == "medium" or sl == "low") sl
                  else "medium"
                };
                case null "medium";
              };
              let message = switch (extractStringField(objContent, "message")) {
                case (?m) if (m.size() > 0) m else "Unknown issue";
                case null "Unknown issue";
              };
              bugs.add({ severity; message });
              cur := Text.fromIter(cur.toIter().drop(consumed));
            };
            case _ { break outer }; // unexpected token
          };
        };
        bugs.toArray()
      };
    }
  };

  // ---------------------------------------------------------------------------
  // RESPONSE PARSING
  // ---------------------------------------------------------------------------

  /// Extract the generated text from a Gemini generateContent HTTP response.
  /// Gemini's response structure: { "candidates": [{ "content": { "parts": [{ "text": "..." }] } }] }
  /// We extract the "text" field which contains the model output.
  public func extractGeminiContent(responseText : Text) : ?Text {
    extractStringField(responseText, "text")
  };

  /// Strip markdown code fences if Gemini wrapped the JSON in a code block.
  /// Gemini sometimes returns ``` json \\n { ... } \\n ``` despite explicit instructions not to.
  public func stripCodeFences(s : Text) : Text {
    let fence = "```";
    switch (findSubstring(s, fence)) {
      case null s; // No fence — return as-is
      case (?start) {
        let afterFence = Text.fromIter(s.toIter().drop(start + fence.size()));
        // Skip optional language tag line (e.g. "json\n" or "\n")
        var innerStart = 0;
        label skip for (c in afterFence.toIter()) {
          innerStart += 1;
          if (c == '\n') break skip;
        };
        let inner = Text.fromIter(afterFence.toIter().drop(innerStart));
        // Take everything before the closing fence
        switch (findSubstring(inner, fence)) {
          case null inner;
          case (?endIdx) Text.fromIter(inner.toIter().take(endIdx));
        };
      };
    }
  };

  /// Parse the full Gemini HTTP response body into a CodeReview record.
  /// Returns #ok(review) on success or #err(message) on any failure.
  /// The quality score is clamped to [0, 100] to handle out-of-range Gemini output.
  public func parseReviewResponse(responseText : Text) : { #ok : CodeReview; #err : Text } {
    // Step 1: Extract the model's generated text from the Gemini envelope
    let rawContent = switch (extractGeminiContent(responseText)) {
      case (?c) c;
      case null {
        // Try to surface an API-level error message (e.g. quota exceeded)
        let apiError = switch (extractStringField(responseText, "message")) {
          case (?m) "Gemini API error: " # m;
          case null "Could not extract content from Gemini response";
        };
        return #err(apiError);
      };
    };

    // Step 2: Strip code fences if Gemini wrapped the JSON in markdown
    let content = stripCodeFences(rawContent);

    // Step 3: Parse each field with safe defaults for missing/invalid values
    let bugs = parseBugsArray(content);
    let improvements = parseStringArray(content, "improvements");
    let explanation = switch (extractStringField(content, "explanation")) {
      case (?e) if (e.size() > 0) e else "No explanation provided.";
      case null "No explanation provided.";
    };
    let bestPractices = parseStringArray(content, "bestPractices");

    // Step 4: Extract and clamp quality score to valid range [0, 100]
    // Gemini may return values > 100; we normalise to prevent display bugs
    let rawScore = switch (extractNatField(content, "qualityScore")) {
      case (?n) n;
      case null 50; // Default to 50 if field is missing or non-numeric
    };
    let qualityScore : Nat = Nat.min(rawScore, 100);

    #ok({
      bugs;
      improvements;
      explanation;
      bestPractices;
      qualityScore;
    })
  };
};
