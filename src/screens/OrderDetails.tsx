import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
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

  // Horizontal swipe to close details
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (
        _evt: GestureResponderEvent,
        gesture: PanResponderGestureState
      ) => {
        const dx = Math.abs(gesture.dx);
        const dy = Math.abs(gesture.dy);
        // Only claim gesture on meaningful horizontal movement
        return dx > 25 && dx > dy * 1.2;
      },
      onPanResponderRelease: (
        _evt: GestureResponderEvent,
        gesture: PanResponderGestureState
      ) => {
        const { dx, vx, dy } = gesture;
        const isHorizontal = Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy);
        const intended = Math.abs(vx) > 0.2 || Math.abs(dx) > 60;
        if (isHorizontal && intended) {
          onClose?.();
        }
      },
    })
  ).current;

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
        color="#ec4899"
      />
    );
  if (error)
    return (
      <View style={styles.center}>
        <Text style={{ color: "#b91c1c" }}>დაფიქსირდა შეცდომა: {error}</Text>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 12 }}>
          <Text style={{ color: "#ec4899" }}>უკან</Text>
        </TouchableOpacity>
      </View>
    );

  // response object might be under different keys
  const resp = data?.response ?? data?.responses ?? data ?? null;
  const purchaser = resp?.purchaser ?? null;
  const user = resp?.user ?? null;
  const additional = data?.additional_data ?? resp?.additional_data ?? null;

  return (
    <ScrollView contentContainerStyle={{ padding: 12 }} {...panResponder.panHandlers}>
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
    backgroundColor: "#fde2e9",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f9a8d4",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  row: { borderTopWidth: 1, borderTopColor: "#f9a8d4", paddingTop: 12 },
  rowLabel: { color: "#6b7280", marginBottom: 6 },
  rowValue: { color: "#111827", fontSize: 16 },
});

export default OrderDetails;
