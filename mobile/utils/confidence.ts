import {StyleSheet, ViewStyle, TextStyle} from "react-native";

export const getConfidenceColor = (confidence: number): (ViewStyle|TextStyle) => {
  const pct = confidence <= 1 ? confidence * 100 : confidence;
  if (pct >= 90) {
    return styles.highConfidence;
  }
  if (pct >= 50) {
    return styles.mediumConfidence;
  }
  
  return styles.lowConfidence;
};

const styles = StyleSheet.create({
  highConfidence: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
    borderColor: "#10b981",
    paddingHorizontal: 8,   
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  mediumConfidence: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    borderColor: "#f59e0b",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  lowConfidence: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
});

