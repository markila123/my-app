import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";

type RepairDetailsProps = {
  id: number;
  jwtToken?: string;
  baseUrl?: string;
  onClose?: () => void;
};

const BASE_URL_DEFAULT = "https://testinvoice.inservice.ge/api";

const RepairDetails: React.FC<RepairDetailsProps> = ({
  id,
  jwtToken = "",
  baseUrl = BASE_URL_DEFAULT,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // Horizontal swipe to close details
  // No in-card pan responder; parent edge-swipe handles back

  useEffect(() => {
    let mounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${baseUrl}/app/repairs/${id}`, {
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

  const repair = data?.repair ?? data ?? null;
  const purchaser = repair?.purchaser ?? null;
  const performer = repair?.performer ?? null;

  // helper to map numeric status to label
  const formatStatus = (status?: number) => {
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

  // try to get initial order creation time from additional_data if available
  const initialOrderTime =
    data?.additional_data?.response_creation_time ??
    data?.additional_data?.last_response_date ??
    repair?.created_at ??
    null;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 12 }}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
    >
      {/* რეაგირების დეტალები */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>რეაგირების დეტალები</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>რემონტის ID</Text>
          <Text style={styles.rowValue}>{repair?.id ?? "—"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>შინაარსი</Text>
          <Text style={styles.rowValue}>{repair?.content ?? "—"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>შეკვეთის შექმნის დრო</Text>
          <Text style={styles.rowValue}>
            {initialOrderTime
              ? new Date(initialOrderTime).toLocaleString()
              : "—"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>რემონტის შექმნის დრო</Text>
          <Text style={styles.rowValue}>
            {repair?.created_at
              ? new Date(repair.created_at).toLocaleString()
              : "—"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>შემსრულებლის შენიშვნა</Text>
          <Text style={styles.rowValue}>{repair?.act_note ?? "—"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>შემსრულებელი</Text>
          <Text style={styles.rowValue}>
            {performer?.name ?? "არ არის განსაზღვრული"}
          </Text>
        </View>
      </View>

      {/* შეკვეთის დეტალები */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>შეკვეთის დეტალები</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>ობიექტი</Text>
          <Text style={styles.rowValue}>
            {purchaser?.name ?? repair?.subject_name ?? "—"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>რემონტის შინაარსი</Text>
          <Text style={styles.rowValue}>{repair?.content ?? "—"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>საწყისი შეკვეთის შექმნის დრო</Text>
          <Text style={styles.rowValue}>
            {initialOrderTime
              ? new Date(initialOrderTime).toLocaleString()
              : "—"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>რემონტის შექმნის დრო</Text>
          <Text style={styles.rowValue}>
            {repair?.created_at
              ? new Date(repair.created_at).toLocaleString()
              : "—"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>რემონტის სტატუსი</Text>
          <Text style={styles.rowValue}>{formatStatus(repair?.status)}</Text>
        </View>
      </View>

      {/* მოქმედებები */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>მოქმედებები</Text>
        <TouchableOpacity
          style={[
            styles.action,
            {
              backgroundColor: "#ec4899",
            },
          ]}
          activeOpacity={0.85}
        >
          <Text style={[styles.actionText, { color: "#ffffff" }]}>
            ✓ რეაგირების დადასტურება
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.action,
            {
              backgroundColor: "#fde2e9",
              borderColor: "#ec4899",
              borderWidth: 1,
              marginTop: 12,
            },
          ]}
          activeOpacity={0.85}
        >
          <Text style={[styles.actionText, { color: "#ec4899" }]}>
            ✕ რეაგირების უარყოფა
          </Text>
        </TouchableOpacity>
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
  action: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { color: "#ffffff", fontWeight: "700" },
});

export default RepairDetails;
