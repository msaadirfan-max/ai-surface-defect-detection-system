import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Pressable,
} from "react-native";
import type { Inspection } from "../types/index";
import { getConfidenceColor } from "../utils/confidence";

interface InspectionModalProps {
  inspection: Inspection | null; // null means hidden
  onClose: () => void; // called when user closes it
}

export const InspectionItem = ({ inspection, onClose }: InspectionModalProps) => {
  // If inspection is null, render nothing
  if (!inspection) return null;

  const isDefective = inspection.status?.toLowerCase() === "defective";

  const confidenceStyles = getConfidenceColor(inspection.confidence);
  const confidencePct = (
    inspection.confidence <= 1
      ? inspection.confidence * 100
      : inspection.confidence
  ).toFixed(1);

  // Format Base64 image URL if applicable
  const gradCamSource = inspection.gradCamUrl
    ? inspection.gradCamUrl.startsWith("http") ||
      inspection.gradCamUrl.startsWith("data:")
      ? inspection.gradCamUrl
      : `data:image/png;base64,${inspection.gradCamUrl}`
    : null;

  return (
    <Modal
      visible={!!inspection}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Outer overlay container */}
      <View style={styles.overlay}>
        {/* Backdrop press listener to close modal */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Inner white modal card */}
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.headerTitle}>Inspection Details</Text>
              <View
                style={[
                  styles.badge,
                  isDefective ? styles.badgeDefective : styles.badgeNormal,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isDefective
                      ? styles.badgeTextDefective
                      : styles.badgeTextNormal,
                  ]}
                >
                  {inspection.status}
                </Text>
              </View>
            </View>

            {/* Close (X) button */}
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Body content scroll view */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Metrics summary */}
            <View style={styles.metricsContainer}>
              {/* CONFIDENCE METRIC */}
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>CONFIDENCE</Text>
                <View
                  style={[styles.confidenceBadge, confidenceStyles.container]}
                >
                  <Text style={[styles.confidenceText, confidenceStyles.text]}>
                    {confidencePct}%
                  </Text>
                </View>
              </View>

              {/* INFERENCE TIME METRIC */}
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>INFERENCE TIME</Text>
                <Text style={styles.metricValue}>
                  {inspection.inferenceTimeMs} ms
                </Text>
              </View>

              {/* DATE METRIC */}
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>DATE</Text>
                <Text style={styles.metricDateValue}>
                  {new Date(
                    inspection.createdAt || Date.now(),
                  ).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Side-by-side images comparison */}
            <View style={styles.imagesGrid}>
              {/* Original Uploaded Image */}
              <View style={styles.imageColumn}>
                <View style={styles.columnTitleRow}>
                  <View style={[styles.dot, styles.dotBlue]} />
                  <Text style={styles.columnTitle}>Original Image</Text>
                </View>
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: inspection.imageUrl }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Grad-CAM Visualization */}
              <View style={styles.imageColumn}>
                <View style={styles.columnTitleRow}>
                  <View style={[styles.dot, styles.dotPurple]} />
                  <Text style={styles.columnTitle}>Prediction Heatmap</Text>
                </View>
                <View style={styles.imageWrapper}>
                  {gradCamSource ? (
                    <Image
                      source={{ uri: gradCamSource }}
                      style={styles.image}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.placeholderContainer}>
                      <Text style={styles.placeholderTextMain}>
                        Heatmap not available
                      </Text>
                      <Text style={styles.placeholderTextSub}>
                        Re-upload this image to generate a heatmap
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 640,
    maxHeight: "85%",
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  badgeNormal: {
    backgroundColor: "#dcfce7",
    borderColor: "#bbf7d0",
  },
  badgeDefective: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  badgeTextNormal: {
    color: "#15803d",
  },
  badgeTextDefective: {
    color: "#b91c1c",
  },
  closeButton: {
    padding: 4,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: "#9ca3af",
    fontWeight: "600",
  },
  body: {
    maxHeight: "75%",
  },
  bodyContent: {
    padding: 20,
    gap: 20,
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  metricItem: {
    flex: 1,
    alignItems: "flex-start",
  },
  metricLabel: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 2,
  },
  metricDateValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 2,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 2,
  },
  confidenceText: {
    fontSize: 13,
    fontWeight: "700",
  },
  imagesGrid: {
    flexDirection: "row",
    gap: 16,
  },
  imageColumn: {
    flex: 1,
    gap: 8,
  },
  columnTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotBlue: {
    backgroundColor: "#3b82f6",
  },
  dotPurple: {
    backgroundColor: "#a855f7",
  },
  columnTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  imageWrapper: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#111827",
    height: 130,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    alignItems: "center",
    padding: 16,
    gap: 4,
  },
  placeholderTextMain: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
  },
  placeholderTextSub: {
    color: "#6b7280",
    fontSize: 11,
    textAlign: "center",
  },
});