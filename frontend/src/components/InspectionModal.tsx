import React, { useEffect } from "react";
import type { Inspection } from "../types/index";

interface InspectionModalProps {
  inspection: Inspection | null; // null means hidden
  onClose: () => void; // called when user closes it
}

const InspectionModal: React.FC<InspectionModalProps> = ({
  inspection,
  onClose,
}) => {
  // Close modal when pressing the Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (inspection) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspection, onClose]);

  // If inspection is null, render nothing
  if (!inspection) return null;

  const isDefective = inspection.status.toLowerCase() === "defective";

  return (
    /* Outer div — fixed overlay covering full screen */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity animate-fadeIn"
      onClick={onClose}
    >
      {/* Inner div — the white modal card (centered) */}
      <div
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-3xl overflow-hidden transform transition-all"
        onClick={(e) =>
          e.stopPropagation()
        } /* Prevents closing when clicking inside */
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800">
              Inspection Details
            </h2>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
                isDefective
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-green-100 text-green-700 border border-green-200"
              }`}
            >
              {inspection.status}
            </span>
          </div>

          {/* Close button (X) */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors focus:outline-none"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Metrics summary */}
          <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">
                Confidence
              </p>
              <p className="text-lg font-semibold text-gray-800">
                {(inspection.confidence * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">
                Inference Time
              </p>
              <p className="text-lg font-semibold text-gray-800">
                {inspection.inferenceTimeMs} ms
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">
                Date
              </p>
              <p className="text-sm font-semibold text-gray-800 mt-1">
                {new Date(
                  inspection.createdAt || Date.now(),
                ).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Side by side images comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Uploaded Image */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Original Image
              </h3>
              <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-900 flex items-center justify-center min-h-[200px]">
                <img
                  src={inspection.imageUrl}
                  alt="Original Surface Inspection"
                  className="max-h-64 object-contain"
                />
              </div>
            </div>

            {/* Grad-CAM Visualization */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Grad-CAM Heatmap
              </h3>
              <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-900 flex items-center justify-center min-h-[200px]">
                {inspection.gradCamUrl ? (
                  <img
                    src={
                      inspection.gradCamUrl.startsWith("data:")
                        ? inspection.gradCamUrl
                        : `data:image/png;base64,${inspection.gradCamUrl}`
                    }
                    alt="Grad-CAM Heatmap"
                    className="max-h-64 object-contain"
                  />
                ) : (
                  <div className="text-center space-y-2 p-6">
                    <p className="text-gray-400 text-sm">
                      Heatmap not available
                    </p>
                    <p className="text-gray-300 text-xs">
                      Re-upload this image to generate a heatmap
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InspectionModal;
