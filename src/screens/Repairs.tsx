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
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from "react-native";

export type RepairItem = {
  id: number;
  subject_name?: string;
  subject_address?: string;
  content?: string;
  status?: any;
  status_text?: string;
  status_label?: string;
  created_at?: string;
};

type RepairsProps = {
  jwtToken?: string;
  baseUrl?: string;
  onOpen?: (id: number) => void; // new prop to open detail
  query?: string;
};

const BASE_URL_DEFAULT = "https://testinvoice.inservice.ge/api";

const getStatusLabel = (item: RepairItem) => {
  const s = item?.status;
  if (typeof s === "string") return s;
  if (s && typeof s === "object")
    return s.name ?? s.label ?? s.title ?? s.text ?? String(s.id ?? "");
  return (
    item.status_text ||
    item.status_label ||
    (s != null ? String(s) : "სტატუსი უცნობია")
  );
};

const Repairs: React.FC<RepairsProps> = ({
  jwtToken = "",
  baseUrl = BASE_URL_DEFAULT,
  onOpen,
  query = "",
}) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [repairs, setRepairs] = useState<RepairItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusMap, setStatusMap] = useState<StatusMap>({});

  const fetchRepairs = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/app/repairs`, {
        headers: {
          Accept: "application/json",
          Authorization: jwtToken ? `Bearer ${jwtToken}` : "",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} - ${text}`);
      }

      const json = await res.json();
      // handle different possible shapes
      let list: any[] = [];
      if (Array.isArray(json)) list = json;
      else if (Array.isArray(json.repairs)) list = json.repairs;
      else if (Array.isArray(json.data)) list = json.data;
      else if (Array.isArray(json.items)) list = json.items;
      else if (Array.isArray(json.response)) list = json.response;
      else if (json.repair) list = [json.repair];
      else list = [];

      setRepairs(list);
    } catch (err: any) {
      setError(err.message || "Fetch failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jwtToken, baseUrl]);

  useEffect(() => {
    fetchRepairs();
  }, [fetchRepairs]);

  useEffect(() => {
    (async () => {
      const map = await loadStatusMap(baseUrl, jwtToken, "repairs");
      setStatusMap(map);
    })();
  }, [baseUrl, jwtToken]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRepairs();
  }, [fetchRepairs]);

  const renderItem = ({ item }: { item: RepairItem }) => {
    return (
      <TouchableOpacity onPress={() => onOpen?.(item.id)} activeOpacity={0.85}>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardId}>#{item.id}</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>
                {mapStatusLabelFromDict(statusMap, item) ||
                  getStatusLabel(item)}
              </Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>
            {item.subject_name ?? item.content ?? "----"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && repairs.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ec4899" />
      </View>
    );
  }

  const q = (query || "").trim().toLowerCase();
  const filtered = q
    ? repairs.filter((o) =>
        [o.subject_name, o.content, o.status_text, o.status_label, String(o.id)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
    : repairs;

  return (
    <View style={{ flex: 1 }}>
      {error ? (
        <View style={styles.center}>
          <Text style={{ color: "#F97316" }}>დაფიქსირდა შეცდომა: {error}</Text>
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ padding: 12 }}
        ListHeaderComponent={<View style={{ height: 0 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#ec4899"]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: "#fde2e9",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f9a8d4",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardId: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 16,
  },
  statusPill: {
    backgroundColor: "#ec4899",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
  },
  statusText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  cardTitle: {
    color: "#111827",
    fontSize: 14,
    marginBottom: 6,
  },
  // search input moved to App header
});

export default Repairs;
