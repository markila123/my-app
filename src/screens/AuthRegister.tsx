import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import AppInput from "../components/AppInput";
import AppButton from "../components/AppButton";
import { STORAGE_KEYS, storageSet } from "../utils/LocalStorage";

type Props = {
  baseUrl?: string;
  onRegistered?: (token?: string, email?: string) => void;
  onNavigateLogin?: () => void;
};

const BASE_URL_DEFAULT = "https://testinvoice.inservice.ge/api";

const AuthRegister: React.FC<Props> = ({
  baseUrl = BASE_URL_DEFAULT,
  onRegistered,
  onNavigateLogin,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !companyCode.trim()
    ) {
      setError("გთხოვთ შევსოთ ყველა ველი");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name,
        email,
        password,
        password_confirmation: password,
        companyCode,
      };
      const res = await fetch(`${baseUrl}/app/clients/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
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
      const returnedName = json?.user?.name || json?.name || name;
      if (token) {
        await storageSet(STORAGE_KEYS.token, token);
        await storageSet(STORAGE_KEYS.email, email);
        if (returnedName) await storageSet(STORAGE_KEYS.name, returnedName);
      }
      onRegistered?.(token, email);
    } catch (e: any) {
      setError(e.message || "დაფიქსირდა შეცდომა");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>რეგისტრაცია</Text>
        <Text style={styles.subtitle}>შეამғунით ახალი ანგარიში</Text>

        <AppInput
          placeholder="სახლი და გვარი"
          value={name}
          onChangeText={setName}
          style={{ marginTop: 18 }}
        />
        <AppInput
          placeholder="ელ. ფოსტის მისამართი"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ marginTop: 12 }}
        />
        <AppInput
          placeholder="პაროლი"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ marginTop: 12 }}
        />
        <AppInput
          placeholder="კომპანიის კოდი"
          value={companyCode}
          onChangeText={setCompanyCode}
          style={{ marginTop: 12 }}
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <AppButton
          title="რეგისტრაცია"
          onPress={submit}
          loading={loading}
          style={{ marginTop: 18 }}
        />

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>უკვე გაქვთ ანგარიში?</Text>
          <TouchableOpacity onPress={onNavigateLogin}>
            <Text style={[styles.bottomText, styles.link]}>შესვლა</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F1724", padding: 20 },
  card: {
    marginTop: 70,
    backgroundColor: "#0B2036",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: { color: "#60A5FA", textAlign: "center", marginTop: 8 },
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  bottomText: { color: "#9AA9B8" },
  link: { color: "#60A5FA", marginLeft: 6 },
  errorBox: {
    backgroundColor: "#EF4444",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  errorText: { color: "#fff" },
});

export default AuthRegister;
