import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import InspectionTable from "../components/InspectionTable";
import InspectionModal from "../components/InspectionModal";
import apiClient from "../api/client";
import type { AdminStats, AdminUser, Inspection } from "../types/index";
import { toast } from "react-hot-toast/headless";

const AdminDashboard = () => {
  const { user: currentUser } = useAuth(); // Get the current logged-in user

  // State Declarations
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] =
    useState<Inspection | null>(null);

  // 1. Simultaneous Data Fetching with Promise.all
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, usersRes, inspectionsRes] = await Promise.all([
          apiClient.get("/api/admin/stats"),
          apiClient.get("/api/admin/users"),
          apiClient.get("/api/admin/inspections", {
            params: { page: currentPage, limit: 10 },
          }),
        ]);

        setStats(statsRes.data);
        setUsers(usersRes.data.users || usersRes.data);
        setInspections(inspectionsRes.data.inspections || []);
        setTotalPages(inspectionsRes.data.totalPages || 1);
      } catch (err: any) {
        console.error("Failed to load admin data:", err);
        setError("Failed to load admin dashboard statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentPage]);

  // 2. Role Toggle Handler with Optimistic UI Update
  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await apiClient.patch(`/api/admin/users/${userId}/role`, {
        role: newRole,
      });

      // Update state directly without extra refetching
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === userId ? { ...u, role: newRole as "admin" | "user" } : u,
        ),
      );
    } catch (err) {
      console.error("Role change failed:", err);
      toast.error("Failed to update user role.");
    }
  };

  // 3. Derived Derived Data Calculations
  const defectRate =
    stats && stats.totalInspections > 0
      ? ((stats.defectiveCount / stats.totalInspections) * 100).toFixed(1)
      : "0.0";

  const chartData =
    stats?.countsGroupedByDate?.map((item) => ({
      date: item._id.slice(5), // "2026-07-13" -> "07-13"
      count: item.count,
    })) || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Analytics</h1>
          <p className="text-sm text-gray-500">
            System-wide inspection statistics and user management
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* SECTION 1: Stat Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Inspections"
            value={stats?.totalInspections ?? 0}
            color="blue"
          />
          <StatCard
            title="Defective Found"
            value={stats?.defectiveCount ?? 0}
            color="red"
          />
          <StatCard
            title="Defect Rate"
            value={`${defectRate}%`}
            color="amber"
          />
          <StatCard
            title="Total Users"
            value={stats?.totalUsers ?? 0}
            color="green"
          />
          <StatCard
            title="Avg Confidence"
            value={
              stats ? `${(stats.averageConfidence * 100).toFixed(1)}%` : "0.0%"
            }
            subtitle="Across all predictions"
            color="blue"
          />
        </div>

        {/* SECTION 2: Daily Inspections Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Daily Inspections (Last 30 Days)
          </h2>
          {chartData.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              No historical data available yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* SECTION 3: System Users Table */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            User Accounts
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {u.username}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {u.email}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {/* Self-Guard: Cannot change your own role */}
                      {currentUser?.email !== u.email && (
                        <button
                          onClick={() => handleRoleChange(u._id, u.role)}
                          className={`text-xs font-semibold px-3 py-1 rounded transition ${
                            u.role === "admin"
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                          }`}
                        >
                          {u.role === "admin" ? "Remove Admin" : "Make Admin"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4: System-wide Inspections Table */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            System-wide Inspections
          </h2>
          <InspectionTable
            inspections={inspections}
            loading={loading}
            showUser={true}
            onRowClick={setSelectedInspection}
          />
          <InspectionModal
            inspection={selectedInspection}
            onClose={() => setSelectedInspection(null)}
          />

          {/* Pagination */}
          {!loading && inspections.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                ← Previous
              </button>
              <span className="text-xs text-gray-600 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
