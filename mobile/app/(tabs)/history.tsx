import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import apiClient from "../../api/client";
import type { Inspection } from "../../types/index";
import { InspectionItem } from "../../components/InspectionItem";
import { getConfidenceColor } from "../../utils/confidence";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HistoryScreen() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // State to track selected inspection for detail modal
  const [selectedInspection, setSelectedInspection] =
    useState<Inspection | null>(null);

  // Fetch Inspections from Backend
  const fetchInspections = useCallback(async () => {
    if (!refreshing) setLoading(inspections.length === 0);
    setError(null);
    try {
      const response = await apiClient.get("/api/inspections", {
        params: {
          page: currentPage,
          limit: 10,
          status: statusFilter === "all" ? undefined : statusFilter,
        },
      });

      // Adjust according to backend response payload shape:
      const data =response.data.inspections;
      const pages = response.data.totalPages || 1;

      setInspections( data);
      setTotalPages(pages);
    } catch (err) {
      setError("Failed to fetch inspections. Pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    
    fetchInspections();
  }, [fetchInspections]);

  // Handle Pull to Refresh Gesture
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInspections();
  }, [fetchInspections]);

  // Handle Page Changes
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  // Render individual list row
  const renderItem = ({ item }: { item: Inspection }) => {
    const isDefective = item.status?.toLowerCase() === "defective";
    const confidenceStyles = getConfidenceColor(item.confidence);
    const confidencePct = (
      item.confidence <= 1 ? item.confidence * 100 : item.confidence
    ).toFixed(1);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => setSelectedInspection(item)}
      >
        {/* Item Thumbnail */}
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />

        {/* Details Column */}
        <View style={styles.cardDetails}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              ID: #{item._id ? item._id.slice(0, 6) : "N/A"}
            </Text>

            {/* Status Badge */}
            <View
              style={[
                styles.badge,
                isDefective ? styles.badgeDefective : styles.badgeNormal,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  isDefective
                    ? styles.badgeTextDefective
                    : styles.badgeTextNormal,
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>

          {/* Date & Confidence Row */}
          <View style={styles.cardFooterRow}>
            <Text style={styles.cardDate}>
              {new Date(item.createdAt || Date.now()).toLocaleDateString()}
            </Text>

            <View style={[styles.confidenceBadge, confidenceStyles.container]}>
              <Text style={[styles.confidenceText, confidenceStyles.text]}>
                {confidencePct}%
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.container}>
        {/* 1. FILTER DROPDOWN HEADER */}
        <View style={styles.filterBar}>
          <Text style={styles.filterLabel}>Inspection History</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={statusFilter}
              onValueChange={(itemValue) => {
                setStatusFilter(itemValue);
                setCurrentPage(1);
              }}
              style={styles.picker}
              dropdownIconColor="#4b5563"
            >
              <Picker.Item style={styles.pickerItem} label="  All" value="all" />
              <Picker.Item style={styles.pickerItem} label="Defective" value="defective" />
              <Picker.Item style={styles.pickerItem} label="Normal" value="normal" />
            </Picker>
          </View>
        </View>
        {/* 2. LOADING STATE */}
        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          /* 3. INSPECTIONS LIST WITH PULL-TO-REFRESH */
          <FlatList
            data={inspections}
            keyExtractor={(item) =>
              item._id?.toString() || Math.random().toString()
            }
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#3b82f6"]}
                tintColor="#3b82f6"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No inspection records found.
                </Text>
              </View>
            }
            /* 4. PAGINATION FOOTER CONTROLS */
            ListFooterComponent={
              totalPages > 1 ? (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    style={[
                      styles.pageButton,
                      currentPage === 1 && styles.pageButtonDisabled,
                    ]}
                    onPress={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <Text style={styles.pageButtonText}>Previous</Text>
                  </TouchableOpacity>

                  <Text style={styles.pageIndicator}>
                    Page {currentPage} of {totalPages}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.pageButton,
                      currentPage === totalPages && styles.pageButtonDisabled,
                    ]}
                    onPress={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    <Text style={styles.pageButtonText}>Next</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        )}

        {/* 5. INSPECTION DETAIL MODAL */}
        <InspectionItem
          inspection={selectedInspection}
          onClose={() => setSelectedInspection(null)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingTop: 8,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  filterLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  pickerWrapper: {
    backgroundColor: "#f9fafb",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#d1d5db",
    overflow: "hidden",
    width: 100

  },
  picker: {
    height: 50,
    width: "100%",
    
  },
  pickerItem: {
    fontSize: 15,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#111827",
  },
  cardDetails: {
    flex: 1,
    gap: 6,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
    flex: 1,
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardDate: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
  },
  badgeNormal: {
    backgroundColor: "#dcfce7",
    borderColor: "#bbf7d0",
  },
  badgeDefective: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  badgeTextNormal: {
    color: "#15803d",
  },
  badgeTextDefective: {
    color: "#b91c1c",
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: "700",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: "#6b7280",
    fontSize: 14,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 24,
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  pageIndicator: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
});
