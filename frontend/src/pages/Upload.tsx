// Upload.tsx
import React, { useState, useRef } from "react";
import apiClient from "../api/client";
import ResultCard from "../components/ResultCard";
import Navbar from "../components/Navbar";
import type {InspectionResponse} from "../types/index";

// Define the shape of the inspection result for type safety
interface InspectionResult {
  status: "normal" | "defective";
  confidence: number;
  imageUrl: string;
  inferenceTimeMs: number;
}

// Main Upload component
const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [gradCam, setGradCam] = useState<string | null>(null);
  const [gradCamLoading, setGradCamLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  

  // Handle file selection and reset previous results
  const handleFileChange = (selectedFile: File) => {
    if (preview) URL.revokeObjectURL(preview);
    setResult(null);
    setGradCam(null);
    setError("");
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };


  // Handle the main analysis request to the backend
  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select a file first.");
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
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const inspectionData = response.data.inspection;
      setResult(inspectionData);
      setGradCam(inspectionData.gradCamUrl || null);
      setGradCamLoading(false);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      {/* Page heading */}
      <div className="max-w-6xl mx-auto w-full px-4 pt-8 pb-2">
        <h1 className="text-2xl font-bold text-gray-800">Inspection Console</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload a surface image to run the defect detection model
        </p>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* LEFT — Upload panel */}
          <div
            className={`w-full transition-all duration-300 ${result ? "md:w-1/2" : "md:w-2/3 mx-auto"}`}
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Drop zone */}
              <div
                onDragOver={onDragOver}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[220px] ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) =>
                    e.target.files?.[0] && handleFileChange(e.target.files[0])
                  }
                  className="hidden"
                  accept=".jpg,.jpeg,.png"
                />

                {/* Upload icon */}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDragging ? "bg-blue-100" : "bg-gray-100"}`}
                >
                  <svg
                    className={`w-7 h-7 ${isDragging ? "text-blue-500" : "text-gray-400"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                </div>

                <p className="text-sm font-medium text-gray-700">
                  {isDragging ? "Release to upload" : "Drop image here"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  or click to browse files
                </p>
                <p className="text-xs text-gray-300 mt-3">
                  JPG, JPEG, PNG · Max 5MB
                </p>
              </div>

              {/* Preview + button */}
              {preview && (
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      Selected image
                    </p>
                    <button
                      onClick={() => {
                        URL.revokeObjectURL(preview);
                        setPreview(null);
                        setFile(null);
                        setResult(null);
                        setGradCam(null);
                        setError("");
                      }}
                      className="text-xs text-gray-400 hover:text-red-500 transition"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center max-h-72">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-72 object-contain"
                    />
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Running model...
                      </>
                    ) : (
                      "Analyse Surface"
                    )}
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Result panel */}
          {result && (
            <div className="w-full md:w-1/2">
              <ResultCard
                status={result.status}
                confidence={result.confidence}
                imageUrl={result.imageUrl}
                inferenceTimeMs={result.inferenceTimeMs}
                gradCam={gradCam}
                gradCamLoading={gradCamLoading}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Upload;
