import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";

type HistoryProps = {
  jwtToken?: string;
  baseUrl?: string;
  onOpen?: (id: number) => void;
};

const BASE_URL_DEFAULT = "https://testinvoice.inservice.ge/api";

const History: React.FC<HistoryProps> = ({
  jwtToken = "",
  baseUrl = BASE_URL_DEFAULT,
  onOpen,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [lastJson, setLastJson] = useState<any>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    "orders" | "repairs" | "works"
  >("orders");

  useEffect(() => {
    let mounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        // build server-side filters based on selected tab
        const year = new Date().getFullYear();
        const params = new URLSearchParams();
        // only completed items (status=3)
        params.append("status", "3");
        // restrict to current year by default
        params.append("date_from", `${year}-01-01`);
        params.append("date_to", `${year}-12-31`);

        // choose endpoint per tab
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
        if (mounted) setLastJson(json);
        // try to normalize to array — handle several possible shapes
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

        // if data is an object containing arrays under keys, prefer those
        if (!Array.isArray(arr)) {
          // try common nested places
          if (json?.data && Array.isArray(json.data.items))
            arr = json.data.items;
          else if (json?.data && Array.isArray(json.data.responses))
            arr = json.data.responses;
          else if (json?.data && Array.isArray(json.data.repairs))
            arr = json.data.repairs;
          else arr = Object.values(arr || {});
        }
        if (mounted) setItems(arr as any[]);
      } catch (err: any) {
        if (mounted) setError(err.message || "Fetch failed");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchHistory();
    return () => {
      mounted = false;
    };
  }, [jwtToken, baseUrl, selectedTab]);

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

  if (loading)
    return (
      <ActivityIndicator
        style={{ marginTop: 20 }}
        size="large"
        color="#3B82F6"
      />
    );
  if (error)
    return (
      <View style={styles.center}>
        <Text style={{ color: "#F97316" }}>დაფიქსირდა შეცდომა: {error}</Text>
      </View>
    );

  const renderCard = (item: any) => {
    const id = item?.id ?? item?.response_id ?? item?.repair_id ?? "-";
    const title =
      item?.purchaser?.name ?? item?.subject_name ?? item?.title ?? "—";
    const rawDate =
      item?.created_at ??
      item?.additional_data?.response_creation_time ??
      item?.date ??
      item?.time ??
      null;
    const date = rawDate ? new Date(rawDate).toLocaleString() : "—";
    const status = item?.status ?? item?.state ?? "—";

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

        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>📅</Text>
          <Text style={styles.metaText}>{date}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 12 }}>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {selectedTab === "orders"
            ? "შეკვეთები"
            : selectedTab === "repairs"
            ? "რემონტი"
            : "სამუშაოები"}
        </Text>
        {selectedTab === "orders" ? (
          orders.length === 0 ? (
            <View>
              <Text style={styles.empty}>ჩანაწერები არაა</Text>
              <TouchableOpacity
                onPress={() => setShowRaw((s) => !s)}
                style={{ marginTop: 8 }}
              >
                <Text style={{ color: "#3B82F6" }}>
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
          ) : (
            orders.map(renderCard)
          )
        ) : selectedTab === "repairs" ? (
          repairs.length === 0 ? (
            <View>
              <Text style={styles.empty}>ჩანაწერები არაა</Text>
              <TouchableOpacity
                onPress={() => setShowRaw((s) => !s)}
                style={{ marginTop: 8 }}
              >
                <Text style={{ color: "#3B82F6" }}>
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
          ) : (
            repairs.map(renderCard)
          )
        ) : works.length === 0 ? (
          <View>
            <Text style={styles.empty}>ჩანაწერები არაა</Text>
            <TouchableOpacity
              onPress={() => setShowRaw((s) => !s)}
              style={{ marginTop: 8 }}
            >
              <Text style={{ color: "#3B82F6" }}>
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
        ) : (
          works.map(renderCard)
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", padding: 20 },
  section: {
    backgroundColor: "#082033",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#163147",
    marginBottom: 12,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#0F1724",
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
    backgroundColor: "#3B82F6",
  },
  tabText: { color: "#94A3B8", fontWeight: "700" },
  tabTextActive: { color: "#fff" },
  sectionTitle: {
    color: "#E6EEF8",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  empty: { color: "#94A3B8" },
  card: {
    backgroundColor: "#062032",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#123245",
  },
  cardTitle: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cardSubtitle: { color: "#94A3B8", marginTop: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  metaIcon: { marginRight: 8, color: "#94A3B8" },
  metaText: { color: "#94A3B8" },
  statusPill: {
    backgroundColor: "#0F766E",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  statusText: { color: "#E6FFF7", fontWeight: "700" },
});

export default History;
