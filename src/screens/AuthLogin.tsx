import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import AppInput from "../components/AppInput";
import AppButton from "../components/AppButton";
import { STORAGE_KEYS, storageSet } from "../utils/LocalStorage";

type Props = {
  baseUrl?: string;
  onLoggedIn?: (token: string, email: string) => void;
  onNavigateRegister?: () => void;
  onNavigateForgot?: () => void;
  defaultEmail?: string;
};

const BASE_URL_DEFAULT = "https://testinvoice.inservice.ge/api";

const AuthLogin: React.FC<Props> = ({
  baseUrl = BASE_URL_DEFAULT,
  onLoggedIn,
  onNavigateRegister,
  onNavigateForgot,
  defaultEmail = "",
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("შეავსეთ ელფოსტა და პაროლი");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/app/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = {};
      }

      if (!res.ok) {
        const msg = json?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const token = json?.token || json?.access_token || json?.data?.token;
      const name =
        json?.user?.name || json?.data?.user?.name || json?.name || "";
      if (!token) throw new Error("ვერ მივიღეთ ტოკენი");

      await storageSet(STORAGE_KEYS.token, token);
      await storageSet(STORAGE_KEYS.email, email);
      if (name) await storageSet(STORAGE_KEYS.name, name);
      onLoggedIn?.(token, email);
    } catch (e: any) {
      setError(e.message || "დაფიქსირდა შეცდომა");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>მოგესალმებით</Text>
        <Text style={styles.subtitle}>გთხოვთ შევსოთ ველები ავტორიზაციაში</Text>

        <AppInput
          placeholder="ელ. ფოსტის მისამართი"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          style={{ marginTop: 18 }}
        />
        <AppInput
          placeholder="პაროლი"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{ marginTop: 12 }}
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <AppButton
          title="შესვლა"
          onPress={submit}
          loading={loading}
          style={{ marginTop: 18 }}
        />

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>დაგავიწყდა პაროლი?</Text>
          <TouchableOpacity onPress={onNavigateForgot}>
            <Text style={[styles.bottomText, styles.link]}>
              პაროლის აღდგენა
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>არ გაქვთ ანგარიში?</Text>
          <TouchableOpacity onPress={onNavigateRegister}>
            <Text style={[styles.bottomText, styles.link]}>რეგისტრაცია</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff", padding: 20 },
  card: {
    marginTop: 70,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f9a8d4",
  },
  title: {
    color: "#111827",
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: { color: "#ec4899", textAlign: "center", marginTop: 8 },
  link: { color: "#ec4899", marginLeft: 6 },
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  bottomText: { color: "#6b7280" },
  errorBox: {
    backgroundColor: "#EF4444",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  errorText: { color: "#fff" },
});

export default AuthLogin;
