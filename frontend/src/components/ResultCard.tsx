import React from "react";


interface ResultCardProps {
  status: "normal" | "defective";
  confidence: number;
  imageUrl: string;
  inferenceTimeMs: number;
  gradCam: string | null;
  gradCamLoading: boolean;
}

const ResultCard: React.FC<ResultCardProps> = (props) => {
  return ( 
    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
      
      {/* Dynamic Badge */}
      <div className="mb-4">
        {props.status === "normal" ? (
          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 border border-green-300 rounded-full font-bold text-sm">
            ✓ PASS
          </span>
        ) : (
          <span className="inline-block px-3 py-1 bg-red-100 text-red-700 border border-red-300 rounded-full font-bold text-sm">
            ✗ FAIL
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="space-y-2 text-gray-700 mb-6">
        <p className="text-sm">
          <span className="font-semibold text-gray-900">Confidence:</span> {(props.confidence * 100).toFixed(1)}%
        </p>
        <p className="text-sm">
          <span className="font-semibold text-gray-900">Inference Time:</span> {props.inferenceTimeMs} ms
        </p>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left Col: Original Image */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Original Image</h4>
          <img src={props.imageUrl} alt="Result" className="rounded-lg max-h-64 object-cover w-full border border-gray-200" />
        </div>

        {/* Right Col: Heatmap Slot */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Grad-CAM Heatmap</h4>
          
          {props.gradCamLoading ? (
            <div className="flex items-center justify-center h-48 bg-gray-50 border border-dashed rounded-lg">
              <p className="text-sm text-gray-500 animate-pulse">Analyzing defects...</p>
            </div>
          ) : props.gradCam ? (
            <img 
              // Prefixes the base64 data string cleanly if not already prefixed
              src={props.gradCam.startsWith("data:") ? props.gradCam : `data:image/png;base64,${props.gradCam}`} 
              alt="Grad-CAM" 
              className="rounded-lg max-h-64 object-cover w-full border border-gray-200" 
            />
          ) : (
            <div className="flex items-center justify-center h-48 bg-gray-50 border border-dashed rounded-lg">
              <p className="text-xs text-gray-400">Heatmap unavailable</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultCard;