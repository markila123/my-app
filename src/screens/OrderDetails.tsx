import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";

type OrderDetailsProps = {
  id: number;
  jwtToken?: string;
  baseUrl?: string;
  onClose?: () => void;
};

const BASE_URL_DEFAULT = "https://testinvoice.inservice.ge/api";

const OrderDetails: React.FC<OrderDetailsProps> = ({
  id,
  jwtToken = "",
  baseUrl = BASE_URL_DEFAULT,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${baseUrl}/app/responses/${id}`, {
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
        if (mounted) setData(json);
      } catch (err: any) {
        if (mounted) setError(err.message || "Fetch failed");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDetails();
    return () => {
      mounted = false;
    };
  }, [id, jwtToken, baseUrl]);

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
        <TouchableOpacity onPress={onClose} style={{ marginTop: 12 }}>
          <Text style={{ color: "#3B82F6" }}>უკან</Text>
        </TouchableOpacity>
      </View>
    );

  // response object might be under different keys
  const resp = data?.response ?? data?.responses ?? data ?? null;
  const purchaser = resp?.purchaser ?? null;
  const user = resp?.user ?? null;
  const additional = data?.additional_data ?? resp?.additional_data ?? null;

  return (
    <ScrollView contentContainerStyle={{ padding: 12 }}>
      <TouchableOpacity onPress={onClose} style={{ marginBottom: 12 }}>
        <Text style={{ color: "#fff" }}>{"< წინა"}</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>შეკვეთის დეტალები</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>შეკვეთის ID</Text>
          <Text style={styles.rowValue}>
            {resp?.id ?? resp?.response_id ?? id}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>ობიექტი</Text>
          <Text style={styles.rowValue}>
            {purchaser?.name ?? resp?.subject_name ?? "—"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>შეკვეთის შინაარსი</Text>
          <Text style={styles.rowValue}>
            {resp?.content ?? resp?.subject_name ?? "—"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>ობიექტის მისამართი</Text>
          <Text style={styles.rowValue}>{resp?.subject_address ?? "—"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>საწყისი შეკვეთის შექმნის დრო</Text>
          <Text style={styles.rowValue}>
            {additional?.response_creation_time ?? resp?.created_at ?? "—"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>შეკვეთის შექმნის დრო</Text>
          <Text style={styles.rowValue}>{resp?.created_at ?? "—"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>რეგისტრირებული მომხმარებელი</Text>
          <Text style={styles.rowValue}>
            {user?.name ?? user?.email ?? "—"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>სტატუსი</Text>
          <Text style={styles.rowValue}>{resp?.status ?? "—"}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", padding: 20 },
  section: {
    backgroundColor: "#082033",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#163147",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#E6EEF8",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  row: { borderTopWidth: 1, borderTopColor: "#123245", paddingTop: 12 },
  rowLabel: { color: "#94A3B8", marginBottom: 6 },
  rowValue: { color: "#fff", fontSize: 16 },
});

export default OrderDetails;
