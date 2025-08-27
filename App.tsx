import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import AppButton from "./src/components/AppButton";
import AppInput from "./src/components/AppInput";
import BottomNav, { TabKey } from "./src/components/BottomNav";
import Repairs from "./src/screens/Repairs";
import RepairDetails from "./src/screens/RepairDetails";
import Orders from "./src/screens/Orders";
import OrderDetails from "./src/screens/OrderDetails";
import Services from "./src/screens/Services";
import History from "./src/screens/History";
import AuthLogin from "./src/screens/AuthLogin";
import AuthRegister from "./src/screens/AuthRegister";
import ForgotPassword from "./src/screens/ForgotPassword";
import {
  STORAGE_KEYS,
  storageGet,
  storageRemove,
} from "./src/utils/LocalStorage";
import AccountModal from "./src/components/AccountModal";

export default function App() {
  const [mode, setMode] = useState<"contract" | "noncontract">("contract");
  const [activeTab, setActiveTab] = useState<TabKey>("rea");
  const [openRepairId, setOpenRepairId] = useState<number | null>(null);
  const [openOrderId, setOpenOrderId] = useState<number | null>(null);
  const [openServiceId, setOpenServiceId] = useState<number | null>(null);
  const [openHistoryOrderId, setOpenHistoryOrderId] = useState<number | null>(
    null
  );

  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [authScreen, setAuthScreen] = useState<"login" | "register" | "forgot">(
    "login"
  );
  const [accountOpen, setAccountOpen] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [knownEmail, setKnownEmail] = useState<string>("");

  // Restore saved auth on mount
  useEffect(() => {
    (async () => {
      const t = await storageGet(STORAGE_KEYS.token);
      const e = (await storageGet(STORAGE_KEYS.email)) || "";
      const n = await storageGet(STORAGE_KEYS.name);
      if (t) setToken(t);
      if (e) setKnownEmail(e);
      if (n) setProfileName(n);
    })();
  }, []);

  // contract inputs
  const [branch, setBranch] = useState("");
  const [description, setDescription] = useState("");

  // non-contract inputs
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  // errors
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const validate = () => {
    const next: Record<string, string | null> = {};

    if (mode === "contract") {
      if (!branch.trim()) next.branch = "ფილიალი აუცილებელია";
      if (!description.trim()) next.description = "აღწერა აუცილებელია";
    } else {
      if (!name.trim()) next.name = "სახელი აუცილებელია";
      if (!address.trim()) next.address = "მისამართი აუცილებელია";
      if (!description.trim()) next.description = "აღწერა აუცილებელია";
    }

    setErrors(next);

    const hasError = Object.keys(next).length > 0;
    if (!hasError) {
      Alert.alert("Success", "წარმატებით შეიქმნა");
    }
  };

  const tabLabels: Record<TabKey, string> = {
    rea1: "რეაგირება1",
    remont: "რემონტი",
    rea: "რეაგირება",
    ghegmiri: "გეგმიური",
    istoria: "ისტორია",
  };

  // If no token, show auth flow immediately
  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        {authScreen === "login" ? (
          <AuthLogin
            onLoggedIn={(t, e) => {
              setToken(t);
              if (e) setKnownEmail(e);
              // best-effort update of name from storage (set by login screen if provided)
              (async () => {
                const n = await storageGet(STORAGE_KEYS.name);
                if (n) setProfileName(n);
              })();
            }}
            onNavigateRegister={() => setAuthScreen("register")}
            onNavigateForgot={() => setAuthScreen("forgot")}
            defaultEmail={knownEmail}
          />
        ) : authScreen === "register" ? (
          <AuthRegister
            onRegistered={(t, e) => {
              if (t) setToken(t);
              if (e) setKnownEmail(e);
              // if no token returned, navigate to login with email filled
              if (!t) setAuthScreen("login");
              (async () => {
                const n = await storageGet(STORAGE_KEYS.name);
                if (n) setProfileName(n);
              })();
            }}
            onNavigateLogin={() => setAuthScreen("login")}
          />
        ) : (
          <ForgotPassword
            onBackToLogin={() => setAuthScreen("login")}
            defaultEmail={knownEmail}
          />
        )}
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSpacer} />

      <View style={styles.form}>
        {/* Header: centered title with account icon on the right */}
        <View style={styles.headerRow}>
          <View style={{ width: 36 }} />
          <Text
            style={[
              styles.title,
              { flex: 1, textAlign: "center", marginBottom: 0 },
            ]}
          >
            შეკვეთის შექმნა
          </Text>
          <TouchableOpacity
            onPress={() => setAccountOpen(true)}
            activeOpacity={0.85}
            style={{ width: 36, alignItems: "flex-end" }}
          >
            <View style={styles.avatar}>
              <Text style={{ color: "#fff", fontWeight: "800" }}>
                {(profileName?.[0] || knownEmail?.[0] || "👤")
                  .toString()
                  .toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {activeTab === "rea" ? (
          <>
            <View style={styles.tabsRow}>
              <TouchableOpacity
                onPress={() => setMode("contract")}
                activeOpacity={0.85}
                style={[styles.tab, mode === "contract" && styles.tabActive]}
              >
                <Text
                  style={[
                    styles.tabText,
                    mode === "contract" && styles.tabTextActive,
                  ]}
                >
                  საკონტრაქტო
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMode("noncontract")}
                activeOpacity={0.85}
                style={[styles.tab, mode === "noncontract" && styles.tabActive]}
              >
                <Text
                  style={[
                    styles.tabText,
                    mode === "noncontract" && styles.tabTextActive,
                  ]}
                >
                  არასაკონტრაქტო
                </Text>
              </TouchableOpacity>
            </View>

            {mode === "contract" ? (
              // First screen layout (საკონტრაქტო)
              <>
                <AppInput
                  label="ფილიალი"
                  placeholder="აირჩიეთ ფილიალი..."
                  value={branch}
                  onChangeText={setBranch}
                  error={errors.branch ?? null}
                />
                <AppInput
                  label="სამუშოს აღწერა"
                  placeholder="ანგრესთ შესას..."
                  style={{ marginTop: 12, height: 140 }}
                  multiline
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                  error={errors.description ?? null}
                />
              </>
            ) : (
              // Second screen layout (არასაკონტრაქტო)
              <>
                <AppInput
                  label="სახელი"
                  placeholder="შეიყვანეთ სახელი..."
                  value={name}
                  onChangeText={setName}
                  error={errors.name ?? null}
                />
                <AppInput
                  label="მისამართი"
                  placeholder="შეიყვანეთ მისამართი..."
                  style={{ marginTop: 12 }}
                  value={address}
                  onChangeText={setAddress}
                  error={errors.address ?? null}
                />
                <AppInput
                  label="სამუშოს აღწერა"
                  placeholder="ადნმერეთ შესას..."
                  style={{ marginTop: 12, height: 140 }}
                  multiline
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                  error={errors.description ?? null}
                />
              </>
            )}

            <AppButton
              title="შექმნა"
              style={{ marginTop: 20 }}
              onPress={validate}
            />
          </>
        ) : activeTab === "remont" ? (
          openRepairId ? (
            <RepairDetails
              id={openRepairId}
              jwtToken={token || undefined}
              onClose={() => setOpenRepairId(null)}
            />
          ) : (
            <Repairs
              jwtToken={token || undefined}
              onOpen={(id) => setOpenRepairId(id)}
            />
          )
        ) : activeTab === "rea1" ? (
          openOrderId ? (
            <OrderDetails
              id={openOrderId}
              jwtToken={token || undefined}
              onClose={() => setOpenOrderId(null)}
            />
          ) : (
            <Orders
              jwtToken={token || undefined}
              onOpen={(id) => setOpenOrderId(id)}
            />
          )
        ) : activeTab === "ghegmiri" ? (
          openServiceId ? (
            <OrderDetails
              id={openServiceId}
              jwtToken={token || undefined}
              onClose={() => setOpenServiceId(null)}
            />
          ) : (
            <Services
              jwtToken={token || undefined}
              onOpen={(id) => setOpenServiceId(id)}
            />
          )
        ) : activeTab === "istoria" ? (
          openHistoryOrderId ? (
            <OrderDetails
              id={openHistoryOrderId}
              jwtToken={token || undefined}
              onClose={() => setOpenHistoryOrderId(null)}
            />
          ) : (
            <History
              jwtToken={token || undefined}
              onOpen={(id) => setOpenHistoryOrderId(id)}
            />
          )
        ) : (
          // Placeholder for other bottom tabs — same title remains on top
          <View style={styles.placeholder}>
            <Text style={styles.placeholderTitle}>{tabLabels[activeTab]}</Text>
            <Text style={styles.placeholderHint}>
              ამ გვერდზე მალე დამატებული ფუნქციები გამოჩნდება
            </Text>
          </View>
        )}
      </View>

      <BottomNav active={activeTab} onSelect={(t) => setActiveTab(t)} />

      <AccountModal
        visible={accountOpen}
        onClose={() => setAccountOpen(false)}
        token={token}
        onLogout={async () => {
          setAccountOpen(false);
          setToken(null);
          await storageRemove(STORAGE_KEYS.token);
          await storageRemove(STORAGE_KEYS.email);
          await storageRemove(STORAGE_KEYS.name);
        }}
      />

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1724",
  },
  topSpacer: {
    height: 36,
  },
  topBar: {
    height: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    padding: 20,
    flex: 1,
  },
  title: {
    textAlign: "center",
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderTitle: {
    color: "#E6EEF8",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  placeholderHint: {
    color: "#94A3B8",
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    borderRadius: 14,
    padding: 6,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "#3B82F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#fff",
  },
});
