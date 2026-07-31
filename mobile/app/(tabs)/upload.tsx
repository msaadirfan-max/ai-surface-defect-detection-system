import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import React, { useState } from "react";
import apiClient from "../../api/client";
import ResultCard from "../../components/ResultCard";
import type { InspectionResponse } from "../../types/index";
import * as ImagePicker from "expo-image-picker";

interface InspectionResult {
  status: "normal" | "defective";
  confidence: number;
  imageUrl: string;
  inferenceTimeMs: number;
  gradCamUrl?: string;
}

const UploadScreen = () => {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [gradCam, setGradCam] = useState<string | null>(null);
  const [gradCamLoading] = useState(false);

  const handleReset = () => {
    setImageUri(null);
    setResult(null);
    setGradCam(null);
    setError("");
  };

  const handleLogout = async () => {
    await logout();
    router.replace("../(auth)/login");
  };

  // Gallery picker
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Permission to access media library is required.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!picked.canceled && picked.assets?.length > 0) {
      handleReset();
      setImageUri(picked.assets[0].uri);
    }
  };

  // Camera capture
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("Camera permission is required.");
      return;
    }
    const photo = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!photo.canceled && photo.assets?.length > 0) {
      handleReset();
      setImageUri(photo.assets[0].uri);
    }
  };

  const getMimeType = (uri: string): string => {
    const extension = uri.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "png":
        return "image/png";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "webp":
        return "image/webp";
      case "heic":
      case "heif":
        return "image/heic";
      default:
        return "image/jpeg";
    }
  };

  const handleAnalyze = async () => {
    if (!imageUri) return;
    setLoading(true);
    setError("");
    setResult(null);
    setGradCam(null);

    try {
      const filename = imageUri.split("/").pop() || "upload.jpg";
      const type = getMimeType(imageUri);

      const formData = new FormData();
      formData.append("file", { uri: imageUri, name: filename, type } as any);

      const response = await apiClient.post<InspectionResponse>(
        "/api/inspect",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      const inspectionData = response.data.inspection;
      setResult(inspectionData);
      // gradCamUrl from MongoDB is the base64 string saved by backend
      setGradCam(inspectionData.gradCamUrl || null);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Analysis failed. Make sure the AI service is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inspection Console</Text>
          <Text style={styles.headerSubtitle}>
            Welcome, {user?.username ?? "Operator"}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* Upload card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Surface Image</Text>

        {/* Image picker buttons */}
        <View style={styles.pickerRow}>
          <TouchableOpacity style={styles.pickerButton} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={18} color="#3b82f6" />
            <Text style={styles.pickerButtonText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerButton} onPress={pickImage}>
            <Ionicons name="images-outline" size={18} color="#3b82f6" />
            <Text style={styles.pickerButtonText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Preview zone */}
        <TouchableOpacity
          style={[styles.previewZone, imageUri && styles.previewZoneActive]}
          onPress={pickImage}
          activeOpacity={imageUri ? 1 : 0.7}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="cloud-upload-outline" size={32} color="#9ca3af" />
              <Text style={styles.placeholderTitle}>Tap to select image</Text>
              <Text style={styles.placeholderSub}>
                PNG · JPG · JPEG · Max 5MB
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Buttons */}
        <View style={styles.actionRow}>
          {imageUri && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              disabled={loading}
            >
              <Text style={styles.resetButtonText}>Remove</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.analyzeButton,
              (!imageUri || loading) && styles.analyzeButtonDisabled,
              imageUri && styles.analyzeButtonFull,
            ]}
            onPress={handleAnalyze}
            disabled={!imageUri || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.analyzeButtonText}>
                {imageUri ? "Analyse Surface" : "Select an image first"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Supported surfaces hint */}
        {!imageUri && (
          <Text style={styles.hint}>
            Supported: tile · carpet · leather · wood
          </Text>
        )}
      </View>

      {/* Result card */}
      {result && (
        <View style={styles.resultSection}>
          <Text style={styles.resultTitle}>Analysis Result</Text>
          <ResultCard
            status={result.status}
            confidence={result.confidence}
            imageUrl={imageUri!}
            inferenceTimeMs={result.inferenceTimeMs}
            gradCam={gradCam}
            gradCamLoading={gradCamLoading}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f3f4f6",
    flexGrow: 1,
    paddingTop: 56,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  pickerRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  pickerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#eff6ff",
  },
  pickerButtonText: {
    color: "#3b82f6",
    fontSize: 13,
    fontWeight: "600",
  },
  previewZone: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#d1d5db",
    borderRadius: 12,
    minHeight: 160,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#f9fafb",
  },
  previewZoneActive: {
    borderColor: "#3b82f6",
    borderStyle: "solid",
    backgroundColor: "#ffffff",
  },
  previewImage: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
  },
  placeholder: {
    alignItems: "center",
    padding: 20,
    gap: 6,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  placeholderSub: {
    fontSize: 11,
    color: "#9ca3af",
  },
  errorBox: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  resetButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 13,
  },
  analyzeButton: {
    flex: 1,
    backgroundColor: "#9ca3af",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  analyzeButtonFull: {
    backgroundColor: "#3b82f6",
  },
  analyzeButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  analyzeButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 13,
  },
  hint: {
    textAlign: "center",
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 8,
  },
  resultSection: {
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
});

export default UploadScreen;
