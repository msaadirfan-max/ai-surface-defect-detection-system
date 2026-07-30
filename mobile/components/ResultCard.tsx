import React from "react";
import { getConfidenceColor } from "../utils/confidence";
import { View, Text, Image, StyleSheet, ActivityIndicator } from "react-native";

// Define the props for the ResultCard component
interface ResultCardProps {
  status: "normal" | "defective";
  confidence: number;
  imageUrl: string;
  inferenceTimeMs: number;
  gradCam: string | null;
  gradCamLoading: boolean;
}

export default function ResultCard({
  status,
  confidence,
  imageUrl,
  inferenceTimeMs,
  gradCam,
  gradCamLoading,
}: ResultCardProps) {
  // Format percentage 
  const confidencePct = (
    confidence <= 1 ? confidence * 100 : confidence
  ).toFixed(1);
  
  

  return (
    <View style={styles.card}>
      {/* Dynamic Badge */}
      <View style={styles.badgeContainer}>
        {status === "normal" ? (
          <Text style={styles.passBadge}>✓ PASS</Text>
        ) : (
          <Text style={styles.failBadge}>✗ FAIL</Text>
        )}
      </View>

      {/* Metrics */}
      <View style={styles.metricsContainer}>
        <Text style={styles.metricText}>
          Confidence:{" "}
          <Text style={getConfidenceColor(confidence)}>
            {confidencePct}%
          </Text>
        </Text>

        <Text style={styles.metricText}>
          Inference Time:{" "}
          <Text style={styles.boldText}>{inferenceTimeMs} ms</Text>
        </Text>
      </View>

      {/* Two Column Grid */}
      <View style={styles.gridContainer}>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Original Image</Text>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        <View style={styles.column}>
          <Text style={styles.columnTitle}>Prediction Heatmap</Text>
          {gradCamLoading ? (
            <View style={styles.placeholderContainer}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={styles.placeholderText}>Loading...</Text>
            </View>
          ) : gradCam ? (
            <Image
              source={{ uri: gradCam }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>No Grad-CAM available</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginVertical: 10,
  },
  badgeContainer: {
    marginBottom: 16,
  },
  passBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: "#dcfce7",
    color: "#15803d",
    borderWidth: 1,
    borderColor: "#86efac",
    fontSize: 12,
    fontWeight: "bold",
  },
  failBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    borderWidth: 1,
    borderColor: "#fca5a5",
    fontSize: 12,
    fontWeight: "bold",
  },
  metricsContainer: {
    gap: 6,
    marginBottom: 20,
  },
  metricText: {
    fontSize: 14,
    color: "#374151",
  },
  confidenceBadge: {
    fontWeight: "bold",
  },
  boldText: {
    fontWeight: "600",
    color: "#111827",
  },
  gridContainer: {
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 8,
  },
  image: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  placeholderContainer: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  placeholderText: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 4,
  },
});
