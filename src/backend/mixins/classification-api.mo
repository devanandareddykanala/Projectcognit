// mixins/classification-api.mo — Public Income Classification API
import Common "../types/Common";
import ClassLib "../lib/IncomeClassification";

mixin () {

  // Classify a single income/expense entry and return the auto-code
  public query func classifyIncome(
    module_ : Text,
    itemType : Text,
    marketChannel : Text,
  ) : async Common.Result<Common.ClassificationCode, Text> {
    ClassLib.classify(module_, itemType, marketChannel)
  };

  // Return all classification code entries for the UI code picker and CA PDF
  public query func getClassificationCodes() : async [Common.ClassificationEntry] {
    ClassLib.getAllCodes()
  };

};
