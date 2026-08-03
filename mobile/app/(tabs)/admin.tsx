import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart } from "react-native-chart-kit";
import { useAuth } from "../../context/AuthContext";
import { StatCard } from "../../components/StatCard";
import { InspectionItem } from "../../components/InspectionItem";
import apiClient from "../../api/client";
import type { Inspection, AdminStats, AdminUser } from "../../types/index";

const screenWidth = Dimensions.get("window").width - 48;

export default function AdminScreen() {
  const { user: currentUser } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [stats, setStats]                     = useState<AdminStats | null>(null);
  const [users, setUsers]                     = useState<AdminUser[]>([]);
  const [inspections, setInspections]         = useState<Inspection[]>([]);
  const [totalPages, setTotalPages]           = useState<number>(1);
  const [currentPage, setCurrentPage]         = useState<number>(1);
  const [loading, setLoading]                 = useState<boolean>(true);
  const [inspLoading, setInspLoading]         = useState<boolean>(false);
  const [refreshing, setRefreshing]           = useState<boolean>(false);
  const [error, setError]                     = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  // ── Fetch stats + users (runs once on mount, and on pull-to-refresh) ───────
  const fetchStatsAndUsers = useCallback(async () => {
    setError(null);
    try {
      const [statsRes, usersRes] = await Promise.all([
        apiClient.get("/api/admin/stats"),
        apiClient.get("/api/admin/users"),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch {
      setError("Failed to load dashboard data. Pull down to refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatsAndUsers();
  }, [fetchStatsAndUsers]);

  // ── Fetch inspections (reruns when page changes) ───────────────────────────
  useEffect(() => {
    const fetchInspections = async () => {
      setInspLoading(true);
      try {
        const response = await apiClient.get("/api/admin/inspections", {
          params: { page: currentPage, limit: 10 },
        });
        setInspections(response.data.inspections || []);
        setTotalPages(response.data.totalPages || 1);
      } catch {
        console.error("Failed to fetch inspections");
      } finally {
        setInspLoading(false);
      }
    };
    fetchInspections();
  }, [currentPage]);

  // ── Pull-to-refresh ────────────────────────────────────────────────────────
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStatsAndUsers();
  }, [fetchStatsAndUsers]);

  // ── Role change ────────────────────────────────────────────────────────────
  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await apiClient.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, role: newRole as "user" | "admin" } : u
        )
      );
    } catch {
      console.error("Failed to change user role");
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const defectRate =
    stats && stats.totalInspections > 0
      ? ((stats.defectiveCount / stats.totalInspections) * 100).toFixed(1)
      : "0.0";

  const chartData = {     // for BarChart getting total counts grouped by date (last 30 days)
    labels: stats?.countsGroupedByDate?.map((item) => item._id.slice(5)) || [],
    datasets: [
      {
        data:
          stats?.countsGroupedByDate?.map((item) => item.count) || [0],
      },
    ],
  };

  // ── Dashboard header (rendered above FlatList) ─────────────────────────────
  const renderDashboardHeader = () => (
    <View style={styles.headerContainer}>

      {/* Screen title */}
      <Text style={styles.screenTitle}>Admin Dashboard</Text>

      {/* ── STAT CARDS ── */}
      <View style={styles.statsGrid}>
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
            stats
              ? `${(stats.averageConfidence * 100).toFixed(1)}%`
              : "0.0%"
          }
          subtitle="Across all predictions"
          color="blue"
        />
      </View>

      {/* ── BAR CHART ── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Daily Inspections (Last 30 Days)</Text>
        {chartData.labels.length > 0 ? (
          <BarChart
            data={chartData}
            width={screenWidth}
            height={200}
            yAxisLabel=""
            yAxisSuffix=""
            showValuesOnTopOfBars={true}
            withInnerLines={false}
            fromZero={true}
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: () => "#6b7280",
              barPercentage: 0.6,
              propsForLabels: { fontSize: 9 },
              propsForVerticalLabels: { fontSize: 9 },
            }}
            style={{ borderRadius: 8, marginLeft: -16 }}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyText}>No activity data yet</Text>
          </View>
        )}
      </View>

      {/* ── USER MANAGEMENT ── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>User Accounts</Text>
        {users.length === 0 ? (
          <Text style={styles.emptyText}>No users found</Text>
        ) : (
          users.map((item) => {
            const isSelf = currentUser?.email === item.email;
            return (
              <View key={item._id} style={styles.userRow}>
                {/* User info */}
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {item.username || "—"}
                  </Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                </View>

                {/* Role badge + action */}
                <View style={styles.userAction}>
                  <View
                    style={[
                      styles.roleBadge,
                      item.role === "admin"
                        ? styles.adminBadge
                        : styles.userBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        item.role === "admin"
                          ? styles.adminRoleText
                          : styles.userRoleText,
                      ]}
                    >
                      {item.role.toUpperCase()}
                    </Text>
                  </View>

                  {/* Hide button for current logged-in user */}
                  {!isSelf ? (
                    <TouchableOpacity
                      onPress={() => handleRoleChange(item._id, item.role)}
                      style={[
                        styles.roleButton,
                        item.role === "admin"
                          ? styles.roleButtonDemote
                          : styles.roleButtonPromote,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          item.role === "admin"
                            ? styles.roleButtonTextDemote
                            : styles.roleButtonTextPromote,
                        ]}
                      >
                        {item.role === "admin" ? "Remove Admin" : "Make Admin"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.youLabel}>You</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* ── INSPECTIONS SECTION HEADER ── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>System Inspections Log</Text>
        {inspLoading && (
          <View style={styles.inspLoadingRow}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={styles.inspLoadingText}>Loading...</Text>
          </View>
        )}
      </View>
    </View>
  );

  // ── Pagination footer ──────────────────────────────────────────────────────
  const renderPaginationFooter = () => (
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        disabled={currentPage <= 1 || inspLoading}
        onPress={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        style={[
          styles.pageButton,
          (currentPage <= 1 || inspLoading) && styles.pageButtonDisabled,
        ]}
      >
        <Text style={styles.pageButtonText}>← Previous</Text>
      </TouchableOpacity>

      <Text style={styles.pageInfoText}>
        Page {currentPage} of {totalPages}
      </Text>

      <TouchableOpacity
        disabled={currentPage >= totalPages || inspLoading}
        onPress={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        style={[
          styles.pageButton,
          (currentPage >= totalPages || inspLoading) && styles.pageButtonDisabled,
        ]}
      >
        <Text style={styles.pageButtonText}>Next →</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Inspection card ───────────────────────────
  const renderInspectionCard = ({ item }: { item: Inspection }) => {
    const isDefective = item.status?.toLowerCase() === "defective";
    return (
      <TouchableOpacity
        style={styles.cardItem}
        onPress={() => setSelectedInspection(item)}
        activeOpacity={0.7}
      >
        {/* Thumbnail */}
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.cardThumbnail}
          resizeMode="cover"
        />

        {/* Details */}
        <View style={styles.cardDetails}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardId}>
              #{item._id ? item._id.slice(-6) : "N/A"}
            </Text>
            <View
              style={[
                styles.cardBadge,
                isDefective ? styles.cardBadgeFail : styles.cardBadgePass,
              ]}
            >
              <Text
                style={[
                  styles.cardBadgeText,
                  isDefective
                    ? styles.cardBadgeTextFail
                    : styles.cardBadgeTextPass,
                ]}
              >
                {isDefective ? "✗ FAIL" : "✓ PASS"}
              </Text>
            </View>
          </View>

          <Text style={styles.cardDate}>
            {new Date(item.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>

          <View style={styles.cardFooterRow}>
            <Text style={styles.cardConfidence}>
              {(item.confidence * 100).toFixed(1)}% confidence
            </Text>
            <Text style={styles.cardTime}>
              {item.inferenceTimeMs?.toFixed(0)} ms
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Full-screen loading ────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Admin Console...</Text>
      </View>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={inspections}
        keyExtractor={(item) => item._id}
        renderItem={renderInspectionCard}
        ListHeaderComponent={renderDashboardHeader}
        ListFooterComponent={renderPaginationFooter}
        ListEmptyComponent={
          !inspLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No inspection records found.</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listPadding}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
          />
        }
      />

      {/* Inspection detail modal */}
      <InspectionItem
        inspection={selectedInspection}
        onClose={() => setSelectedInspection(null)}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  loadingText: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 14,
  },
  listPadding: {
    paddingBottom: 32,
  },

  // ── Header ──
  headerContainer: {
    padding: 16,
    gap: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  // ── Stat cards ──
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },

  // ── Section card ──
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  emptyChart: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
  },

  // ── User rows ──
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  userEmail: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  userAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  adminBadge: {
    backgroundColor: "#dbeafe",
  },
  userBadge: {
    backgroundColor: "#f3f4f6",
  },
  roleText: {
    fontSize: 10,
    fontWeight: "700",
  },
  adminRoleText: {
    color: "#1e40af",
  },
  userRoleText: {
    color: "#4b5563",
  },
  roleButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleButtonPromote: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  roleButtonDemote: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  roleButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },
  roleButtonTextPromote: {
    color: "#15803d",
  },
  roleButtonTextDemote: {
    color: "#dc2626",
  },
  youLabel: {
    fontSize: 11,
    color: "#9ca3af",
    fontStyle: "italic",
  },

  // ── Inspections section header ──
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 4,
  },
  inspLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inspLoadingText: {
    fontSize: 12,
    color: "#6b7280",
  },

  // ── Inspection card ──
  cardItem: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  cardThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#111827",
  },
  cardDetails: {
    flex: 1,
    gap: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardId: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  cardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardBadgePass: {
    backgroundColor: "#dcfce7",
    borderColor: "#bbf7d0",
  },
  cardBadgeFail: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardBadgeTextPass: {
    color: "#15803d",
  },
  cardBadgeTextFail: {
    color: "#b91c1c",
  },
  cardDate: {
    fontSize: 11,
    color: "#6b7280",
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardConfidence: {
    fontSize: 11,
    color: "#4b5563",
    fontWeight: "600",
  },
  cardTime: {
    fontSize: 11,
    color: "#9ca3af",
  },

  // ── Pagination ──
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  pageButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#3b82f6",
    borderRadius: 6,
  },
  pageButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  pageButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  pageInfoText: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "500",
  },

  // ── Empty / error ──
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
  errorBanner: {
    backgroundColor: "#fee2e2",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: {
    color: "#991b1b",
    fontSize: 12,
    textAlign: "center",
  },
});