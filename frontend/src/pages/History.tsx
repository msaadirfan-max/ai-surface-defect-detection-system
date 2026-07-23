import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import Navbar from "../components/Navbar";
import InspectionTable from "../components/InspectionTable";
import apiClient from "../api/client";
import type { Inspection } from "../types/index";
import InspectionModal from "../components/InspectionModal";
import  toast  from "react-hot-toast";
const History = () => {
  // State Definitions
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInspection, setSelectedInspection] =
    useState<Inspection | null>(null);

  // Fetch Logic inside useEffect
  useEffect(() => {
    const fetchInspections = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get("/api/inspections", {
          params: {
            page: currentPage,
            limit: 10,
            status: statusFilter === "all" ? undefined : statusFilter,
          },
        });

        // Extracting arrays and pagination counts from response.data
        setInspections(response.data.inspections || []);
        setTotalPages(response.data.totalPages || 1);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch inspection history.");
        toast.error("Failed to fetch inspection history.");
      } finally {
        setLoading(false);
      }
    };

    fetchInspections();
  }, [currentPage, statusFilter]);

  // Handler for changing filter: Resets back to page 1!
  const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Header Block */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Inspection History
            </h1>
            <p className="text-sm text-gray-500">
              View and filter past visual quality checks
            </p>
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="filter"
              className="text-sm font-medium text-gray-700"
            >
              Filter Status:
            </label>
            <select
              id="filter"
              value={statusFilter}
              onChange={handleFilterChange}
              className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Inspections</option>
              <option value="normal">✓ PASS Only</option>
              <option value="defective">✗ FAIL Only</option>
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          toast.error(error)
        )}

        {/* Main Content Area */}
        {!loading && inspections.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-500 text-lg font-medium">
              No inspections found.
            </p>
            {statusFilter !== "all" && (
              <p className="text-gray-400 text-sm mt-1">
                Try changing your status filter above.
              </p>
            )}
          </div>
        ) : (
          // Using React Fragment to wrap multiple components without adding extra nodes to the DOM
          <>
            <InspectionTable
              inspections={inspections}
              loading={loading}
              onRowClick={setSelectedInspection}
            />
            <InspectionModal
              inspection={selectedInspection}
              onClose={() => setSelectedInspection(null)}
            />
          </>
        )}

        {/* Pagination Controls */}
        {!loading && inspections.length > 0 && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <span className="text-sm text-gray-600 font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
