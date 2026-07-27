// Upload.tsx
import React, { useState, useRef } from "react";
import apiClient from "../api/client";
import ResultCard from "../components/ResultCard";
import Navbar from "../components/Navbar";
import type { InspectionResponse } from "../types/index";
import { toast } from "react-hot-toast";

interface InspectionResult {
  status: "normal" | "defective";
  confidence: number;
  imageUrl: string;
  inferenceTimeMs: number;
  gradCamUrl?: string;
}

const Upload = () => {
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
      toast.error("Please select an image first.");
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
      toast.success("Analysis complete.");
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Analysis failed. Make sure the AI service is running.";
      setError(msg);
      toast.error(msg);
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
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Navbar />

      {/* Two column layout fills remaining height — no scrolling */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANEL ─────────────────────────────────────────── */}
        <div className="w-full md:w-1/2 flex flex-col border-r border-gray-200 bg-white overflow-y-auto">
          {/* Panel header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <h1 className="text-lg font-bold text-gray-800">
              Inspection Console
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Upload a surface image to run the defect detection model
            </p>
          </div>

          <div className="flex flex-col flex-1 px-6 py-5 gap-4">
            {/* Drop zone */}
            <div
              onDragOver={onDragOver}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => !preview && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer
                ${preview ? "min-h-[200px] cursor-default" : "min-h-[180px]"}
                ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : preview
                      ? "border-gray-200 bg-gray-50 cursor-default"
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

              {preview ? (
                /* Image preview fills the drop zone */
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-64 max-w-full object-contain rounded-lg"
                />
              ) : (
                /* Empty drop zone prompt */
                <div className="text-center px-4 py-6">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${isDragging ? "bg-blue-100" : "bg-gray-100"}`}
                  >
                    <svg
                      className={`w-6 h-6 ${isDragging ? "text-blue-500" : "text-gray-400"}`}
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
                  <p className="text-sm font-medium text-gray-600">
                    {isDragging ? "Release to upload" : "Drop image here"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    or click to browse
                  </p>
                  <p className="text-xs text-gray-300 mt-2">
                    JPG, JPEG, PNG · Max 5MB
                  </p>
                </div>
              )}
            </div>

            {/* File name + remove row — only when file selected */}
            {file && (
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 min-w-0">
                  <svg
                    className="w-4 h-4 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs text-gray-600 truncate">
                    {file.name}
                  </span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-gray-400 hover:text-red-500 transition flex-shrink-0 ml-2"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Analyse button — always visible at bottom */}
            <div className="mt-auto pt-2">
              <button
                onClick={
                  file ? handleAnalyze : () => fileInputRef.current?.click()
                }
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition duration-200 flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    file
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300"
                  }`}
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
                ) : file ? (
                  "Analyse Surface"
                ) : (
                  "Select an Image to Begin"
                )}
              </button>

              {/* Hint text under button */}
              {!file && (
                <p className="text-center text-xs text-gray-400 mt-2">
                  Supported surfaces: tile · carpet · leather · wood
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────── */}
        <div className="hidden md:flex w-1/2 flex-col overflow-y-auto bg-gray-50">
          {result ? (
            /* Result fills the right panel */
            <div className="flex-1 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Analysis Result
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Based on ResNet-50 fine-tuned on MVTec AD
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg transition"
                >
                  Analyse another
                </button>
              </div>
              <ResultCard
                status={result.status}
                confidence={result.confidence}
                imageUrl={result.imageUrl}
                inferenceTimeMs={result.inferenceTimeMs}
                gradCam={gradCam}
                gradCamLoading={gradCamLoading}
              />
            </div>
          ) : (
            /* Idle state — shown before any analysis */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              {loading ? (
                /* Loading state */
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                    <svg
                      className="animate-spin h-7 w-7 text-blue-500"
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
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Running ResNet-50
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Analysing surface patterns...
                    </p>
                  </div>
                  {/* Animated steps */}
                  <div className="space-y-2 text-left w-48 mx-auto">
                    {[
                      "Preprocessing image",
                      "Forward pass",
                      "Generating Grad-CAM",
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"
                          style={{ animationDelay: `${i * 200}ms` }}
                        />
                        <span className="text-xs text-gray-500">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* No image selected yet */
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <svg
                      className="w-7 h-7 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    Results will appear here
                  </p>
                  <p className="text-xs text-gray-400 max-w-xs">
                    Upload a surface image on the left and click Analyse Surface
                    to get a prediction with Grad-CAM heatmap.
                  </p>

                  {/* How it works mini-guide */}
                  <div className="mt-6 text-left space-y-3 w-full max-w-xs mx-auto">
                    {[
                      {
                        step: "1",
                        label: "Upload",
                        desc: "Drop or select a surface image",
                      },
                      {
                        step: "2",
                        label: "Analyse",
                        desc: "ResNet-50 runs inference",
                      },
                      {
                        step: "3",
                        label: "Review",
                        desc: "PASS/FAIL with Grad-CAM heatmap",
                      },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {item.step}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-gray-600">
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-400">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Mobile result — shown below on small screens */}
      {result && (
        <div className="md:hidden px-6 pb-6">
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
  );
};

export default Upload;
