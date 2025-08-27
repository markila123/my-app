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
} from "react-native";

type ServicesProps = {
  jwtToken?: string;
  baseUrl?: string;
  onOpen?: (id: number) => void;
};

const BASE_URL_DEFAULT = "https://testinvoice.inservice.ge/api";

const Services: React.FC<ServicesProps> = ({
  jwtToken = "",
  baseUrl = BASE_URL_DEFAULT,
  onOpen,
}) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [statusMap, setStatusMap] = useState<StatusMap>({});

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
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );

  const renderCard = (item: any) => {
    const id = item?.id ?? item?.service_id ?? "-";
    const title = item?.title ?? item?.name ?? item?.subject_name ?? "—";
    const date = item?.created_at ?? item?.date ?? item?.time ?? "—";
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

        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>📅</Text>
          <Text style={styles.metaText}>{date}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {error ? (
        <View style={styles.center}>
          <Text style={{ color: "#F97316" }}>დაფიქსირდა შეცდომა: {error}</Text>
        </View>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(i) => String(i?.id ?? i?.service_id ?? Math.random())}
        renderItem={({ item }) => renderCard(item)}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchServices();
            }}
            colors={["#3B82F6"]}
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

export default Services;
