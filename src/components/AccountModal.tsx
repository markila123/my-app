import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from "react-native";
import AppButton from "./AppButton";

type Props = {
  visible: boolean;
  onClose: () => void;
  token: string;
  baseUrl?: string;
  onLogout?: () => Promise<void> | void;
};

const BASE_URL_DEFAULT = "https://testinvoice.inservice.ge/api";

const AccountModal: React.FC<Props> = ({
  visible,
  onClose,
  token,
  baseUrl = BASE_URL_DEFAULT,
  onLogout,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let mounted = true;

    const endpoints = [
      `${baseUrl}/app/Clients/me`,
      `${baseUrl}/app/clients/me`,
      `${baseUrl}/app/me`,
      `${baseUrl}/app/user`,
      `${baseUrl}/app/profile`,
    ];

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        let lastErr: any = null;
        for (const url of endpoints) {
          try {
            const res = await fetch(url, {
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
            const text = await res.text();
            let json: any = {};
            try {
              json = text ? JSON.parse(text) : {};
            } catch {
              json = {};
            }
            if (!res.ok) {
              lastErr = new Error(json?.message || `HTTP ${res.status} ${url}`);
              continue;
            }
            const data = json?.data || json?.user || json;
            if (mounted) setProfile(data);
            lastErr = null;
            break;
          } catch (e) {
            lastErr = e;
          }
        }
        if (lastErr) throw lastErr;
      } catch (e: any) {
        if (mounted) setError(e?.message || "პროფილის მიღება ვერ მოხერხდა");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [visible, token, baseUrl, reloadKey]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await fetch(`${baseUrl}/app/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {}); // ignore network errors, still clear local
    } finally {
      setLoading(false);
      await onLogout?.();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.card}
          onPress={() => {
            /* keep open when card pressed */
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            <Text style={{ color: "#94A3B8", fontSize: 22 }}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.title}>ანგარიში</Text>

          {loading ? (
            <ActivityIndicator color="#3B82F6" style={{ marginVertical: 20 }} />
          ) : error ? (
            <View>
              <Text style={{ color: "#F97316" }}>{error}</Text>
              <TouchableOpacity onPress={() => setReloadKey((k) => k + 1)}>
                <Text style={{ color: "#60A5FA", marginTop: 8 }}>
                  სცადეთ თავიდან
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ width: "100%" }}>
              <Row
                label="სახელი"
                value={profile?.name || profile?.full_name || "—"}
              />
              <Row
                label="ელ-ფოსტა"
                value={profile?.email || profile?.mail || "—"}
              />
              {profile?.company?.name ? (
                <Row label="კომპანია" value={profile.company.name} />
              ) : null}
              {profile?.phone ? (
                <Row label="ტელეფონი" value={profile.phone} />
              ) : null}
            </View>
          )}

          <AppButton
            title="გამოსვლა"
            onPress={handleLogout}
            style={{ marginTop: 16, alignSelf: "stretch" }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#0B2036",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "#163147",
  },
  closeBtn: { position: "absolute", top: 12, right: 12, padding: 8 },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  row: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#123245" },
  rowLabel: { color: "#94A3B8", marginBottom: 4 },
  rowValue: { color: "#fff", fontSize: 16 },
});

export default AccountModal;
