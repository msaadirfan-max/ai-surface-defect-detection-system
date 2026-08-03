import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

interface ResultCardProps {
  status: "normal" | "defective";
  confidence: number;
  imageUrl: string;
  inferenceTimeMs: number;
  gradCam: string | null;
  gradCamLoading: boolean;
}

export const ResultCard = ({status,confidence,imageUrl,inferenceTimeMs,gradCam,gradCamLoading}: ResultCardProps) => {
  const isPass = status === "normal";

  // Build the base64 URI for Grad-CAM
  const gradCamUri = gradCam
    ? gradCam.startsWith("data:")
      ? gradCam
      : `data:image/png;base64,${gradCam}`
    : null;

  return (
    <View style={styles.card}>

      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={[styles.badge, isPass ? styles.badgePass : styles.badgeFail]}>
          <Text style={[styles.badgeText, isPass ? styles.badgeTextPass : styles.badgeTextFail]}>
            {isPass ? "✓ PASS" : "✗ FAIL"}
          </Text>
        </View>
        <View style={styles.metrics}>
          <Text style={[styles.confidence, isPass ? styles.confidencePass : styles.confidenceFail]}>
            {(confidence * 100).toFixed(1)}%
          </Text>
          <Text style={styles.inferenceTime}>{inferenceTimeMs.toFixed(0)} ms</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Images side by side */}
      <View style={styles.imagesRow}>

        {/* Original image */}
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>Original</Text>
          <View style={styles.imageBox}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Grad-CAM */}
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>Prediction Heatmap</Text>
          <View style={styles.imageBox}>
            {gradCamLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text style={styles.loadingText}>Generating...</Text>
              </View>
            ) : gradCamUri ? (
              // React Native uses source={{ uri }} not src=""
              <Image
                source={{ uri: gradCamUri }}
                style={styles.image}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.loadingBox}>
                <Text style={styles.unavailableText}>Not available</Text>
              </View>
            )}
          </View>
        </View>

      </View>

      {/* Status bar */}
      <View style={[styles.statusBar, isPass ? styles.statusBarPass : styles.statusBarFail]}>
        <Text style={[styles.statusText, isPass ? styles.statusTextPass : styles.statusTextFail]}>
          {isPass
            ? "No defects detected"
            : "Defect detected"}
        </Text>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgePass: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  badgeFail: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  badgeTextPass: { color: "#15803d" },
  badgeTextFail: { color: "#dc2626" },
  metrics: {
    alignItems: "flex-end",
  },
  confidence: {
    fontSize: 22,
    fontWeight: "700",
  },
  confidencePass: { color: "#16a34a" },
  confidenceFail: { color: "#dc2626" },
  inferenceTime: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginBottom: 12,
  },
  imagesRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  imageContainer: {
    flex: 1,
  },
  imageLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  imageBox: {
    height: 140,
    backgroundColor: "#111827",
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  loadingText: {
    fontSize: 11,
    color: "#6b7280",
  },
  unavailableText: {
    fontSize: 11,
    color: "#9ca3af",
  },
  statusBar: {
    borderRadius: 8,
    padding: 10,
  },
  statusBarPass: { backgroundColor: "#f0fdf4" },
  statusBarFail: { backgroundColor: "#fef2f2" },
  statusText: {
    fontSize: 12,
    textAlign: "center",
  },
  statusTextPass: { color: "#15803d" },
  statusTextFail: { color: "#dc2626" },
});

export default ResultCard;