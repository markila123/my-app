import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from "react-native";
import AppButton from "./AppButton";
import {
  loadStatusMap,
  mapStatusLabel,
  StatusMap,
} from "../utils/StatusDictionary";

type Props = {
  visible: boolean;
  onClose: () => void;
  token: string;
  baseUrl?: string;
  onLogout?: () => Promise<void> | void;
};

const BASE_URL_DEFAULT = "https://testinvoice.inservice.ge/api";

type SectionKey = "profile" | "contractDetails" | "contractInfo";

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
  const [contract, setContract] = useState<any>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [section, setSection] = useState<SectionKey>("profile");
  const [statusMap, setStatusMap] = useState<StatusMap>({});

  useEffect(() => {
    if (!visible) return;
    let mounted = true;

    const profileEndpoints = [
      `${baseUrl}/clients/me`,
      `${baseUrl}/app/me`,
      `${baseUrl}/me`,
      `${baseUrl}/user`,
    ];

    const contractEndpoints = [
      `${baseUrl}/app/contract`,
      `${baseUrl}/app/contracts/me`,
      `${baseUrl}/clients/contract`,
      `${baseUrl}/contract`,
      `${baseUrl}/contracts/me`,
      `${baseUrl}/client/contract`,
    ];

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) Fetch profile
        let lastErr: any = null;
        let fetchedProfile: any = null;
        for (const url of profileEndpoints) {
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
            const data = json?.data || json?.user || json?.client || json;
            fetchedProfile = data;
            if (mounted) setProfile(data);
            lastErr = null;
            break;
          } catch (e) {
            lastErr = e;
          }
        }
        if (lastErr) throw lastErr;

        // 2) Fetch contract
        lastErr = null;
        let fetchedContract: any = null;
        for (const url of contractEndpoints) {
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
            let c: any =
              json?.contract ??
              json?.data?.contract ??
              (Array.isArray(json?.contracts) ? json.contracts[0] : undefined) ??
              (Array.isArray(json?.data?.contracts) ? json.data.contracts[0] : undefined) ??
              json?.data ??
              json?.item ??
              json;
            if (Array.isArray(c)) c = c[0];
            fetchedContract = c;
            if (mounted) setContract(c);
            lastErr = null;
            break;
          } catch (e) {
            lastErr = e;
          }
        }

        // 3) Fallback: if no contract endpoint provided data, use client in profile
        if (!fetchedContract && fetchedProfile?.client) {
          if (mounted) setContract(fetchedProfile.client);
        }

        // 4) Optional: load status map (for status labels)
        try {
          const sm = await loadStatusMap(baseUrl, token, "services");
          if (mounted) setStatusMap(sm);
        } catch {}
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
      }).catch(() => {}); // ignore network errors
    } finally {
      setLoading(false);
      await onLogout?.();
    }
  };

  // derived values helpers
  const fmtDate = (v: any) => {
    if (!v) return "—";
    try {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return String(v);
      return d.toISOString().slice(0, 10);
    } catch {
      return String(v);
    }
  };

  const statusText = useMemo(() => {
    const raw = contract?.status ?? contract?.state ?? contract?.contract_status;
    return mapStatusLabel(statusMap, { status: raw });
  }, [contract, statusMap]);

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

          {/* Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tab, section === "profile" && styles.tabActive]}
              onPress={() => setSection("profile")}
            >
              <Text
                style={[
                  styles.tabLabel,
                  section === "profile" && styles.tabLabelActive,
                ]}
              >
                მომხმარებლის მონაცემები
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                section === "contractDetails" && styles.tabActive,
              ]}
              onPress={() => setSection("contractDetails")}
            >
              <Text
                style={[
                  styles.tabLabel,
                  section === "contractDetails" && styles.tabLabelActive,
                ]}
              >
                კონტრაქტის დეტალები
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                section === "contractInfo" && styles.tabActive,
              ]}
              onPress={() => setSection("contractInfo")}
            >
              <Text
                style={[
                  styles.tabLabel,
                  section === "contractInfo" && styles.tabLabelActive,
                ]}
              >
                საკონტრაქტო ინფორმაცია
              </Text>
            </TouchableOpacity>
          </View>

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
            <ScrollView style={{ width: "100%", maxHeight: 480 }}>
              {section === "profile" && (
                <View>
                  <Row
                    label="მომხმარებლის ID"
                    value={String(
                      profile?.id ??
                        profile?.user_id ??
                        profile?.client_id ??
                        "—"
                    )}
                  />
                  <Row
                    label="სახელი"
                    value={profile?.name || profile?.full_name || "—"}
                  />
                  <Row
                    label="ელ-ფოსტა"
                    value={profile?.email || profile?.mail || "—"}
                  />
                  {profile?.phone ? (
                    <Row label="ტელეფონი" value={profile.phone} />
                  ) : null}
                     {profile?.identification_code || profile?.companyCode ? (
                       <Row
                         label="საიდენტიფიკაციო კოდი"
                         value={String(profile?.identification_code ?? profile?.companyCode)}
                       />
                     ) : null}
                  <Row
                    label="შექმნის თარიღი"
                    value={fmtDate(
                      profile?.created_at ||
                        profile?.registered_at ||
                        profile?.createdAt
                    )}
                  />
                </View>
              )}

              {section === "contractDetails" && (
                <View>
                  <Row
                    label="კლიენტის სახელი"
                    value={
                      contract?.client?.name ||
                      contract?.client_name ||
                      contract?.name ||
                      "—"
                    }
                  />
                  <Row
                    label="საიდენტიფიციო კოდი"
                    value={String(
                      contract?.client?.identification_code ??
                        contract?.identification_code ??
                        contract?.tax_number ??
                        contract?.vat ??
                        "—"
                    )}
                  />
                  <Row
                    label="კლიენტის ID კოდი"
                    value={String(
                      contract?.client?.code ??
                        contract?.client_id ??
                        contract?.id_code ??
                        contract?.code ??
                        "—"
                    )}
                  />
                  <Row
                    label="იურიდიული სტატუსი"
                    value={
                      contract?.client?.juridical_status ||
                      contract?.juridical_status ||
                      contract?.legal_status ||
                      "—"
                    }
                  />
                  <Row
                    label="სერვისის სახელი"
                    value={
                      contract?.service_name ||
                      contract?.service_type ||
                      contract?.service ||
                      contract?.category ||
                      "—"
                    }
                  />
                  <Row
                    label="კონტრაქტის ტიპი"
                    value={
                      contract?.contract_service_type ||
                      contract?.contract_type ||
                      contract?.type ||
                      "—"
                    }
                  />
                  <Row
                    label="დაწყება"
                    value={fmtDate(
                      contract?.contract_start_date ||
                        contract?.start_date ||
                        contract?.date_from ||
                        contract?.contract_start
                    )}
                  />
                  <Row
                    label="დასრულება"
                    value={fmtDate(
                      contract?.contract_end_date ||
                        contract?.end_date ||
                        contract?.date_to ||
                        contract?.contract_end
                    )}
                  />
                  <Row
                    label="კონტრაქტის სტატუსი"
                    value={
                      statusText ||
                      String(
                        contract?.contract_status ??
                          contract?.status ??
                          contract?.state ??
                          "—"
                      )
                    }
                  />
                  <Row
                    label="საკონტაქტო პირი"
                    value={contract?.contact_name || "—"}
                  />
                  <Row
                    label="საკონტაქტო ნომერი"
                    value={contract?.contact_number || "—"}
                  />
                  <Row
                    label="გარანტიის დაწყება"
                    value={fmtDate(
                      contract?.guarantee_start_date || contract?.guarantee_from
                    )}
                  />
                  <Row
                    label="გარანტიის დასრულება"
                    value={fmtDate(
                      contract?.guarantee_end_date || contract?.guarantee_to
                    )}
                  />
                </View>
              )}

              {section === "contractInfo" && (
                <View>
                  <Row
                    label="საკონტრაქტო ტიპი"
                    value={contract?.contract_type || contract?.type || "—"}
                  />
                  <Row
                    label="საკონტრაქტო ნომერი"
                    value={String(
                      contract?.number ?? contract?.contract_number ?? "—"
                    )}
                  />
                </View>
              )}
            </ScrollView>
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
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "#f9a8d4",
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#fde2e9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "#ec4899",
  },
  tabLabel: { color: "#1f2937", fontSize: 12, textAlign: "center" },
  tabLabelActive: { color: "#ffffff", fontWeight: "700" },
  closeBtn: { position: "absolute", top: 12, right: 12, padding: 8 },
  title: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  row: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f9a8d4" },
  rowLabel: { color: "#6b7280", marginBottom: 4 },
  rowValue: { color: "#111827", fontSize: 16 },
});

export default AccountModal;
