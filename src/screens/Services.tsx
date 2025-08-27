import React, { useEffect, useState, useCallback } from "react";
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

type ServicesProps = {
  jwtToken?: string;
  baseUrl?: string;
  onOpen?: (id: number) => void;
  query?: string;
};

const BASE_URL_DEFAULT = "https://testinvoice.inservice.ge/api";

const Services: React.FC<ServicesProps> = ({
  jwtToken = "",
  baseUrl = BASE_URL_DEFAULT,
  onOpen,
  query = "",
}) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  // query comes from App header

  const fetchServices = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/app/services`, {
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
      // normalize array
      let arr: any = [];
      if (Array.isArray(json)) arr = json;
      else arr = json?.services ?? json?.data ?? json?.items ?? json ?? [];
      if (!Array.isArray(arr)) arr = Object.values(arr || {});
      setItems(arr as any[]);
    } catch (err: any) {
      setError(err.message || "Fetch failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jwtToken, baseUrl]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    (async () => {
      const map = await loadStatusMap(baseUrl, jwtToken, "services");
      setStatusMap(map);
    })();
  }, [baseUrl, jwtToken]);

  if (loading && items.length === 0)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ec4899" />
      </View>
    );

  const renderCard = (item: any) => {
    const id = item?.id ?? item?.service_id ?? "-";
    const title = item?.title ?? item?.name ?? item?.subject_name ?? "—";
    const statusRaw = item?.status ?? item?.state ?? "—";
    const status =
      mapStatusLabelFromDict(statusMap, { status: statusRaw }) ||
      (typeof statusRaw === "number" ? String(statusRaw) : statusRaw);

    return (
      <TouchableOpacity
        key={`s-${id}`}
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
  const filtered = q
    ? items.filter((o) =>
        [o.title, o.name, o.subject_name, o.status, o.state, String(o.id)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
    : items;

  return (
    <View style={{ flex: 1 }}>
      {error ? (
        <View style={styles.center}>
          <Text style={{ color: "#F97316" }}>დაფიქსირდა შეცდომა: {error}</Text>
        </View>
      ) : null}
      <FlatList
        data={filtered}
        keyExtractor={(i) => String(i?.id ?? i?.service_id ?? Math.random())}
        renderItem={({ item }) => renderCard(item)}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ padding: 12 }}
        ListHeaderComponent={<View style={{ height: 0 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchServices();
            }}
            colors={["#ec4899"]}
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>ჩანაწერები არაა</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", padding: 20 },
  section: {},
  sectionTitle: { color: "#E6EEF8" },
  empty: { color: "#6b7280" },
  card: {
    backgroundColor: "#fde2e9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
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

export default Services;
