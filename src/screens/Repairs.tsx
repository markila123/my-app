import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";

export type RepairItem = {
  id: number;
  subject_name?: string;
  subject_address?: string;
  content?: string;
  status?: number;
  created_at?: string;
};

type RepairsProps = {
  jwtToken?: string;
  baseUrl?: string;
  onOpen?: (id: number) => void; // new prop to open detail
};

const BASE_URL_DEFAULT = "https://testinvoice.inservice.ge/api";

const mapStatusLabel = (status?: number) => {
  switch (status) {
    case 1:
      return "ელოდება დადასტურებას";
    case 2:
      return "გადაეცემა შემსრულებელს";
    case 3:
      return "დასრულებული";
    default:
      return "სტატუსი უცნობია";
  }
};

const Repairs: React.FC<RepairsProps> = ({
  jwtToken = "",
  baseUrl = BASE_URL_DEFAULT,
  onOpen,
}) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [repairs, setRepairs] = useState<RepairItem[]>([]);
  const [error, setError] = useState<string | null>(null);

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
                {mapStatusLabel(item.status)}
              </Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>
            {item.subject_name ?? item.content ?? "----"}
          </Text>
          {item.subject_address ? (
            <Text style={styles.cardSub}>{item.subject_address}</Text>
          ) : null}

          {item.created_at ? (
            <Text style={styles.cardMeta}>
              შექმნილია: {new Date(item.created_at).toLocaleString()}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && repairs.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {error ? (
        <View style={styles.center}>
          <Text style={{ color: "#F97316" }}>დაფიქსირდა შეცდომა: {error}</Text>
        </View>
      ) : null}

      <FlatList
        data={repairs}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: "#082033",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#163147",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardId: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  statusPill: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
  },
  statusText: {
    color: "#082033",
    fontWeight: "700",
    fontSize: 12,
  },
  cardTitle: {
    color: "#E6EEF8",
    fontSize: 14,
    marginBottom: 6,
  },
  cardSub: {
    color: "#94A3B8",
    marginBottom: 8,
  },
  cardMeta: {
    color: "#60A5FA",
    marginTop: 6,
  },
});

export default Repairs;
