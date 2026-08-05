import { StyleSheet, ViewStyle, TextStyle } from "react-native";

interface ConfidenceStylePair {
  container: ViewStyle;
  text: TextStyle;
}

export const getConfidenceColor = (confidence: number): ConfidenceStylePair => {
  const pct = confidence <= 1 ? confidence * 100 : confidence;

  if (pct >= 90) {
    return {
      container: styles.highConfidenceContainer,
      text: styles.highConfidenceText,
    };
  }
  if (pct >= 50) {
    return {
      container: styles.mediumConfidenceContainer,
      text: styles.mediumConfidenceText,
    };
  }
  return {
    container: styles.lowConfidenceContainer,
    text: styles.lowConfidenceText,
  };
};

const styles = StyleSheet.create({
  // High Confidence (Green)
  highConfidenceContainer: {
    backgroundColor: "#d1fae5",
    borderColor: "#10b981",
  },
  highConfidenceText: {
    color: "#065f46",
  },

  // Medium Confidence (Yellow)
  mediumConfidenceContainer: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
  },
  mediumConfidenceText: {
    color: "#92400e",
  },

  // Low Confidence (Red)
  lowConfidenceContainer: {
    backgroundColor: "#fee2e2",
    borderColor: "#ef4444",
  },
  lowConfidenceText: {
    color: "#991b1b",
  },
});