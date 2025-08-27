import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchServices = async () => {
      setLoading(true);
      setError(null);
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
        if (mounted) setItems(arr as any[]);
      } catch (err: any) {
        if (mounted) setError(err.message || "Fetch failed");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchServices();
    return () => {
      mounted = false;
    };
  }, [jwtToken, baseUrl]);

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
    const id = item?.id ?? item?.service_id ?? "-";
    const title = item?.title ?? item?.name ?? item?.subject_name ?? "—";
    const date = item?.created_at ?? item?.date ?? item?.time ?? "—";
    const status = item?.status ?? item?.state ?? "—";

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
    <ScrollView contentContainerStyle={{ padding: 12 }}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>გეგმიური</Text>
        {items.length === 0 ? (
          <Text style={styles.empty}>ჩანაწერები არაა</Text>
        ) : (
          items.map(renderCard)
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

export default Services;
