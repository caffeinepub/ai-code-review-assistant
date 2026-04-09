import Types "../types/codereview";
import CodeReviewLib "../lib/codereview";
import Text "mo:core/Text";

/// Public API mixin for the AI Code Review Assistant.
/// Exposes analyzeCode to the frontend and handles all Gemini HTTP outcall logic.
///
/// Security notes:
///   - API key is stored here on the backend — never returned to callers
///   - Input validation rejects empty/overlong code before any HTTP call
///   - Error messages are sanitised to never include the API key or full URL
mixin () {
  // -------------------------------------------------------------------------
  // GEMINI API KEY — kept on the backend, never sent to the frontend
  // -------------------------------------------------------------------------
  // To update the key: edit this value and redeploy.
  let GEMINI_API_KEY : Text = "AIzaSyCTD6nnGQV2XPNTf8SHstyfoMUDySLmkl0";

  // -------------------------------------------------------------------------
  // IC MANAGEMENT CANISTER TYPE DEFINITIONS
  // The IC management canister (aaaaa-aa) provides the http_request method
  // that enables HTTP outcalls to external APIs from Motoko canisters.
  // -------------------------------------------------------------------------
  type HttpHeader = { name : Text; value : Text };
  type HttpRequestResult = {
    status : Nat;
    headers : [HttpHeader];
    body : Blob;
  };
  type TransformArgs = {
    response : HttpRequestResult;
    context : Blob;
  };

  let ic = actor "aaaaa-aa" : actor {
    http_request : shared ({
      url : Text;
      max_response_bytes : ?Nat64;
      method : { #get; #head; #post };
      headers : [HttpHeader];
      body : ?Blob;
      transform : ?{
        function : shared query (TransformArgs) -> async HttpRequestResult;
        context : Blob;
      };
      is_replicated : ?Bool;
    }) -> async HttpRequestResult;
  };

  // -------------------------------------------------------------------------
  // TRANSFORM FUNCTION
  // Required by the IC HTTP outcalls system for consensus on replicated calls.
  // Strips non-deterministic response headers (timestamps, request IDs, etc.)
  // so that all subnet nodes agree on the identical response body and status.
  //
  // With is_replicated = ?false (non-replicated mode) the transform is not
  // strictly required, but we provide it for forward compatibility and so
  // replicated mode can be enabled without code changes.
  // -------------------------------------------------------------------------
  public query func transform(input : TransformArgs) : async HttpRequestResult {
    {
      status  = input.response.status;
      body    = input.response.body;
      headers = []; // Strip all headers — only status + body need to be deterministic
    }
  };

  // -------------------------------------------------------------------------
  // analyzeCode
  // -------------------------------------------------------------------------

  /// Analyse a code snippet using the Google Gemini API and return structured feedback.
  ///
  /// Parameters:
  ///   code     — the source code to review (any language)
  ///   language — the programming language name (e.g. "Python", "JavaScript")
  ///
  /// Returns:
  ///   #ok(CodeReview)  — structured feedback with bugs, improvements, score, etc.
  ///   #err(Text)       — human-readable error message (never contains the API key)
  ///
  /// IC HTTP outcall notes:
   ///   - cycles = 500_000_000 must be attached; the minimum required is ~365_580_800 cycles (bumped for cost increases)
  ///   - is_replicated = ?false uses the cheaper non-replicated path (one node calls out)
  ///   - transform = null is safe for non-replicated mode (consensus is not required)
  public shared func analyzeCode(
    code : Text,
    language : Text,
  ) : async { #ok : Types.CodeReview; #err : Text } {

    // Step 1 — Validate inputs synchronously (no cycles wasted on bad requests)
    switch (CodeReviewLib.validateInputs(code, language)) {
      case (?errMsg) { return #err(errMsg) };
      case null {};
    };

    // Step 2 — Build the Gemini request JSON payload
    let requestBody = CodeReviewLib.buildRequestBody(code, language);
    let bodyBlob = requestBody.encodeUtf8();

    // Step 3 — Build the Gemini API URL
    // The API key is in the URL query parameter as required by Gemini's REST API.
    // IMPORTANT: Do NOT log or return this URL in error messages.
    let url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" # GEMINI_API_KEY;

    // Step 4 — Make the HTTP outcall to Gemini
    // IC HTTP outcalls require cycles to be explicitly attached (compute fee).
    // Minimum required: ~365,580,800 cycles. We attach 500,000,000 for a safe margin
    // given Gemini API cost increases since March 2026.
    // Using non-replicated mode (is_replicated = ?false) which is cheaper and
    // sufficient for AI code review where exact consensus is not critical.
    let response = try {
      await (with cycles = 500_000_000) ic.http_request({
        url             = url;
        max_response_bytes = ?30_000; // Cap response at 30 KB to limit cycle consumption
        method          = #post;
        headers         = [
          { name = "Content-Type"; value = "application/json" },
        ];
        body            = ?bodyBlob;
        transform       = null; // Safe to omit for non-replicated calls
        is_replicated   = ?false; // Non-replicated: cheaper, single-node HTTP call
      })
    } catch (e) {
      let msg = e.message();
      let safeMsg = msg.replace(#text(GEMINI_API_KEY), "[REDACTED]");
      if (safeMsg.size() > 300) {
        return #err("HTTP request failed: network error or cycles exhausted. Try again.");
      };
      return #err("HTTP request failed: " # safeMsg);
    };

    // Step 5 — Check HTTP status code
    let statusCode = response.status;

    if (statusCode == 400) {
      let rawError = switch (response.body.decodeUtf8()) {
        case (?t) t;
        case null "";
      };
      let safeError = rawError.replace(#text(GEMINI_API_KEY), "[REDACTED]");
      return #err("Gemini API error: invalid request or API key rejected (400). " # safeError);
    };

    if (statusCode == 401 or statusCode == 403) {
      return #err("Gemini API error: API key is invalid or unauthorized (" # statusCode.toText() # "). Please check the API key configuration.");
    };

    if (statusCode == 429) {
      return #err("Gemini API rate limit reached. Please wait a moment and try again.");
    };

    if (statusCode >= 500) {
      let rawError = switch (response.body.decodeUtf8()) {
        case (?t) t.replace(#text(GEMINI_API_KEY), "[REDACTED]");
        case null "no body";
      };
      return #err("Gemini server error (" # statusCode.toText() # "): " # rawError);
    };

    if (statusCode < 200 or statusCode >= 300) {
      let rawError = switch (response.body.decodeUtf8()) {
        case (?t) t;
        case null "Unknown error (body could not be decoded)";
      };
      let safeError = rawError.replace(#text(GEMINI_API_KEY), "[REDACTED]");
      return #err("Gemini API error (status " # statusCode.toText() # "): " # safeError);
    };

    // Step 6 — Decode the response body
    let responseText = switch (response.body.decodeUtf8()) {
      case (?t) t;
      case null { return #err("Failed to decode Gemini response body as UTF-8") };
    };

    // Step 7 — Parse the Gemini response into a CodeReview record
    switch (CodeReviewLib.parseReviewResponse(responseText)) {
      case (#ok(review)) #ok(review);
      case (#err(e))     #err("Failed to parse review response: " # e);
    }
  };
};
