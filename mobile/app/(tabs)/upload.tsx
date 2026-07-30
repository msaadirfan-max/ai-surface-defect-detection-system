import { View, Text, StyleSheet, Image } from "react-native";
import React, { useState, useRef } from "react";
import apiClient from "../../api/client";
import ResultCard from "../../components/ResultCard";
import type { InspectionResponse } from "../../types/index";

interface InspectionResult {
  status: "normal" | "defective";
  confidence: number;
  imageUrl: string;
  inferenceTimeMs: number;
  gradCamUrl?: string;
}

const UploadScreen = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [gradCam, setGradCam] = useState<string | null>(null);
  const [gradCamLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File) => {
    if (preview) URL.revokeObjectURL(preview);
    setResult(null);
    setGradCam(null);
    setError("");
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleAnalyze = async () => {
    if (!file) {
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setGradCam(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post<InspectionResponse>(
        "/api/inspect",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      const inspectionData = response.data.inspection;
      setResult(inspectionData);
      setGradCam(inspectionData.gradCamUrl || null);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Analysis failed. Make sure the AI service is running.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setResult(null);
    setGradCam(null);
    setError("");
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileChange(dropped);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.headerImage}
        />
        <Text style={styles.headerText}>AI Surface Defect Detection</Text>
      </View>

      <View style={styles.leftUploadContainer}>
        <View style={styles.PanelHeader}>
          <Text style={styles.Inspection}></Text>
          <Text style={styles.InspectionText}>Inspection</Text>
        </View>
      </View>

      <View style={styles.DropZone}>
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  headerContainer: {},
  headerImage: {},
  headerText: {},
  leftUploadContainer: {},
  PanelHeader: {},
  Inspection: {},
  InspectionText: {},
    DropZone: {},
  previewImage: {},
  buttonContainer: {},
});
