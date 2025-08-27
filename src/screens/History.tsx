import React, { useCallback, useEffect, useState } from "react";
import {
  loadStatusMap,
  mapStatusLabel as mapStatusLabelFromDict,
  StatusMap,
} from "../utils/StatusDictionary";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from "react-native";

type HistoryProps = {
  jwtToken?: string;
  baseUrl?: string;
  onOpen?: (id: number) => void;
  query?: string;
};

const BASE_URL_DEFAULT = "https://testinvoice.inservice.ge/api";

const History: React.FC<HistoryProps> = ({
  jwtToken = "",
  baseUrl = BASE_URL_DEFAULT,
  onOpen,
  query = "",
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [lastJson, setLastJson] = useState<any>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    "orders" | "repairs" | "works"
  >("orders");
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  // query comes from App header

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const year = new Date().getFullYear();
      const params = new URLSearchParams();
      // Done endpoints typically imply completed status already; keep only date filters
      params.append("date_from", `${year}-01-01`);
      params.append("date_to", `${year}-12-31`);

      let url = `${baseUrl}/app/responses-done?${params.toString()}`;
      if (selectedTab === "repairs") {
        url = `${baseUrl}/app/repairs-done?${params.toString()}`;
      } else if (selectedTab === "works") {
        url = `${baseUrl}/app/services-done?${params.toString()}`;
      }

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: jwtToken ? `Bearer ${jwtToken}` : "",
        },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status} - ${txt}`);
      }
      const json = await res.json();
      setLastJson(json);
      let arr: any = [];
      if (Array.isArray(json)) arr = json;
      else
        arr =
          json?.responses ??
          json?.repairs ??
          json?.services ??
          json?.items ??
          json?.data ??
          json ??
          [];
      if (!Array.isArray(arr)) {
        if (json?.data && Array.isArray(json.data.items)) arr = json.data.items;
        else if (json?.data && Array.isArray(json.data.responses))
          arr = json.data.responses;
        else if (json?.data && Array.isArray(json.data.repairs))
          arr = json.data.repairs;
        else arr = Object.values(arr || {});
      }
      setItems(arr as any[]);
    } catch (err: any) {
      setError(err.message || "Fetch failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jwtToken, baseUrl, selectedTab]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    (async () => {
      const type =
        selectedTab === "orders"
          ? "responses"
          : selectedTab === "repairs"
          ? "repairs"
          : "services";
      const map = await loadStatusMap(baseUrl, jwtToken, type as any);
      setStatusMap(map);
    })();
  }, [baseUrl, jwtToken, selectedTab]);

  const categorize = (it: any) => {
    const combined = [it.type, it.kind, it.response_type, it.category, it.name]
      .filter(Boolean)
      .join(" ")
      .toString()
      .toLowerCase();
    if (combined.includes("repair") || combined.includes("რემონტ"))
      return "repairs";
    if (
      combined.includes("work") ||
      combined.includes("job") ||
      combined.includes("სამუშაო")
    )
      return "works";
    return "orders";
  };

  // If we fetched a specific endpoint for the selected tab, items already contains the correct list.
  const orders =
    selectedTab === "orders"
      ? items
      : items.filter((i) => categorize(i) === "orders");
  const repairs =
    selectedTab === "repairs"
      ? items
      : items.filter((i) => categorize(i) === "repairs");
  const works =
    selectedTab === "works"
      ? items
      : items.filter((i) => categorize(i) === "works");

  if (loading && items.length === 0)
    return (
      <ActivityIndicator
        style={{ marginTop: 20 }}
        size="large"
        color="#ec4899"
      />
    );

  const getStatusLabel = (val: any) => mapStatusLabelFromDict(statusMap, val);

  const renderCard = (item: any) => {
    const id = item?.id ?? item?.response_id ?? item?.repair_id ?? "-";
    const title =
      item?.purchaser?.name ?? item?.subject_name ?? item?.title ?? "—";
    // date removed from UI, no need to compute
    const status = getStatusLabel(item);

    return (
      <TouchableOpacity
        key={`h-${id}`}
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => onOpen && typeof id === "number" && onOpen(id)}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.cardTitle}>#{id}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>

        <Text style={styles.cardSubtitle}>{title}</Text>

        {/* removed calendar row as requested */}
      </TouchableOpacity>
    );
  };

  const q = (query || "").trim().toLowerCase();
  const source =
    selectedTab === "orders"
      ? orders
      : selectedTab === "repairs"
      ? repairs
      : works;
  const filtered = q
    ? source.filter((o) =>
        [
          o?.purchaser?.name,
          o?.subject_name,
          o?.title,
          o?.status,
          o?.state,
          String(o?.id ?? o?.response_id ?? o?.repair_id ?? ""),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
    : source;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "orders" && styles.tabActive]}
          onPress={() => setSelectedTab("orders")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "orders" && styles.tabTextActive,
            ]}
          >
            შეკვეთები
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "repairs" && styles.tabActive]}
          onPress={() => setSelectedTab("repairs")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "repairs" && styles.tabTextActive,
            ]}
          >
            რემონტი
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "works" && styles.tabActive]}
          onPress={() => setSelectedTab("works")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "works" && styles.tabTextActive,
            ]}
          >
            სამუშაოები
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={{ color: "#F97316" }}>დაფიქსირდა შეცდომა: {error}</Text>
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(i) =>
          String(i?.id ?? i?.response_id ?? i?.repair_id ?? Math.random())
        }
        renderItem={({ item }) => renderCard(item)}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={
          <View>
            <Text style={styles.empty}>ჩანაწერები არაა</Text>
            <TouchableOpacity
              onPress={() => setShowRaw((s) => !s)}
              style={{ marginTop: 8 }}
            >
              <Text style={{ color: "#ec4899" }}>
                {showRaw ? "Hide raw response" : "Show raw response"}
              </Text>
            </TouchableOpacity>
            {showRaw && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  {JSON.stringify(lastJson, null, 2)}
                </Text>
              </View>
            )}
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchHistory();
            }}
            colors={["#ec4899"]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", padding: 20 },
  section: {},
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#fde2e9",
    borderRadius: 14,
    padding: 6,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#ec4899",
  },
  tabText: { color: "#374151", fontWeight: "700" },
  tabTextActive: { color: "#ffffff" },
  sectionTitle: {
    color: "#E6EEF8",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  empty: { color: "#6b7280" },
  card: {
    backgroundColor: "#fde2e9",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f9a8d4",
  },
  cardTitle: { color: "#111827", fontWeight: "700", fontSize: 16 },
  cardSubtitle: { color: "#6b7280", marginTop: 6 },
  // meta row removed
  statusPill: {
    backgroundColor: "#ec4899",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  statusText: { color: "#ffffff", fontWeight: "700" },
  // search input moved to App header
});

export default History;
