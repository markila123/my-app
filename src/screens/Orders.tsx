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

export type OrderItem = {
  id: number;
  subject_name?: string;
  content?: string;
  status?: number;
  created_at?: string;
};

type OrdersProps = {
  jwtToken?: string;
  baseUrl?: string;
  onOpen?: (id: number) => void;
};

const BASE_URL_DEFAULT = "https://testinvoice.inservice.ge/api";

const mapStatusLabel = (status?: number) => {
  switch (status) {
    case 1:
      return "ელოდება დადასტურებას";
    case 2:
      return "გამოსწორება მიმდინარეობს";
    case 3:
      return "დასრულებული";
    default:
      return "სტატუსი უცნობია";
  }
};

const Orders: React.FC<OrdersProps> = ({
  jwtToken = "",
  baseUrl = BASE_URL_DEFAULT,
  onOpen,
}) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/app/responses`, {
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
      let list: any[] = [];
      if (Array.isArray(json)) list = json;
      else if (Array.isArray(json.responses)) list = json.responses;
      else if (Array.isArray(json.data)) list = json.data;
      else if (Array.isArray(json.items)) list = json.items;
      else if (Array.isArray(json.response)) list = json.response;
      else if (json.response)
        list = Array.isArray(json.response) ? json.response : [json.response];
      else list = [];

      setOrders(list);
    } catch (err: any) {
      setError(err.message || "Fetch failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jwtToken, baseUrl]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const renderItem = ({ item }: { item: OrderItem }) => {
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

          {item.created_at ? (
            <Text style={styles.cardMeta}>
              შექმნილია: {new Date(item.created_at).toLocaleString()}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && orders.length === 0) {
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
        data={orders}
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
  cardMeta: {
    color: "#60A5FA",
    marginTop: 6,
  },
});

export default Orders;
