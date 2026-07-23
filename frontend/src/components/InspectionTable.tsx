import React from "react";
import type { Inspection } from "../types/index";

interface InspectionTableProps {
  inspections: Inspection[];
  loading: boolean;
  onRowClick?: (inspection: Inspection) => void; // Optional callback for row click
  showUser?: boolean;
}

const InspectionTable: React.FC<InspectionTableProps> = ({
  inspections, // Destructured prop for the list of inspections
  loading,
  onRowClick,
  showUser = true, // Default to showing user column
}) => {
  // --- 1. SKELETON LOADING STATE ---
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Inspection ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Confidence
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Inference Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Thumbnail
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* [...Array(5)] creates iterable items */}
            {[...Array(5)].map((_, index) => (
              <tr key={index}>
                {[...Array(7)].map((_, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-4">
                    <div className="bg-gray-200 h-4 rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // --- 2. REAL DATA TABLE ---
  return (
    <div className="overflow-x-auto shadow rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Inspection ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              User
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Confidence
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Inference Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Thumbnail
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {inspections.map((inspection, index) => (
            <tr
              key={inspection._id}
              className="hover:bg-gray-50 transition"
              onClick={() => onRowClick?.(inspection)}
            >
              {/* Row Number */}
              <td className="px-4 py-4 text-sm text-gray-500">{index + 1}</td>

              {/* Truncated Inspection ID */}
              <td className="px-4 py-4 text-sm font-mono text-gray-600">
                {inspection._id.slice(-6)}
              </td>
              {/* User Info */}
              {showUser && (
                <td className="px-4 py-4 text-sm text-gray-700">
                  {typeof inspection.userId === "object"
                    ? inspection.userId.username
                    : "Unknown"}
                </td>
              )}

              {/* Date */}
              <td className="px-4 py-4 text-sm text-gray-700">
                {new Date(inspection.createdAt).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>

              {/* Status Badge */}
              <td className="px-4 py-4 text-sm">
                {inspection.status === "normal" ? (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300">
                    ✓ PASS
                  </span>
                ) : (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">
                    ✗ FAIL
                  </span>
                )}
              </td>

              {/* Confidence */}
              <td className="px-4 py-4 text-sm text-gray-700">
                {(inspection.confidence * 100).toFixed(1)}%
              </td>

              {/* Inference Time */}
              <td className="px-4 py-4 text-sm text-gray-700">
                {inspection.inferenceTimeMs} ms
              </td>

              {/* Image Thumbnail */}
              <td className="px-4 py-4">
                <img
                  src={inspection.imageUrl}
                  alt="Inspection Thumbnail"
                  className="w-12 h-12 rounded object-cover border border-gray-200"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InspectionTable;
