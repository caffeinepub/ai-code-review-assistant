module {
  public type Bug = {
    severity : Text;
    message : Text;
  };

  public type CodeReview = {
    bugs : [Bug];
    improvements : [Text];
    explanation : Text;
    bestPractices : [Text];
    qualityScore : Nat;
  };
};
