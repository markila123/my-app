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
    <ScrollView contentContainerStyle={{ padding: 12 }}>
      <TouchableOpacity onPress={onClose} style={{ marginBottom: 12 }}>
        <Text style={{ color: "#fff" }}>{"< წინა"}</Text>
      </TouchableOpacity>

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
          style={[styles.action, { backgroundColor: "#10B981" }]}
          activeOpacity={0.85}
        >
          <Text style={styles.actionText}>✓ რეაგირების დადასტურება</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.action, { backgroundColor: "#EF4444", marginTop: 12 }]}
          activeOpacity={0.85}
        >
          <Text style={styles.actionText}>✕ რეაგირების უარყოფა</Text>
        </TouchableOpacity>
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
  action: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { color: "#fff", fontWeight: "700" },
});

export default RepairDetails;
