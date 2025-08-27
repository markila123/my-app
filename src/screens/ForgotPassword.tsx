import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import AppInput from "../components/AppInput";
import AppButton from "../components/AppButton";

type Props = {
  baseUrl?: string;
  onBackToLogin?: () => void;
  defaultEmail?: string;
};

const BASE_URL_DEFAULT = "https://testinvoice.inservice.ge/api";

const ForgotPassword: React.FC<Props> = ({
  baseUrl = BASE_URL_DEFAULT,
  onBackToLogin,
  defaultEmail = "",
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setMessage(null);
    setError(null);
    if (!email.trim()) {
      setError("შეიყვანეთ ელ. ფოსტა");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/app/clients/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = {};
      }
      if (!res.ok) {
        throw new Error(json?.message || `HTTP ${res.status}`);
      }
      setMessage(
        json?.message ||
          "ელ. ფოსტა წარმატებით გაიგზავნა. გადაამოწმეთ საფოსტო ყუთი."
      );
    } catch (e: any) {
      setError(e.message || "დაფიქსირდა შეცდომა");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>პაროლის აღდგენა</Text>
        <Text style={styles.subtitle}>შეიყვანეთ ელ. ფოსტის მისამართი</Text>

        <AppInput
          placeholder="ელ. ფოსტის მისამართი"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ marginTop: 18 }}
        />

        {message ? (
          <View style={[styles.infoBox, { backgroundColor: "#065f46" }]}>
            <Text style={styles.infoText}>{message}</Text>
          </View>
        ) : null}
        {error ? (
          <View style={[styles.infoBox, { backgroundColor: "#EF4444" }]}>
            <Text style={styles.infoText}>{error}</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", marginTop: 16 }}>
          <AppButton
            title="გაუქმება"
            variant="secondary"
            onPress={onBackToLogin}
            style={{ flex: 1, marginRight: 8 }}
          />
          <AppButton
            title="გაგზავნა"
            onPress={submit}
            loading={loading}
            style={{ flex: 1, marginLeft: 8 }}
          />
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
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: { color: "#60A5FA", textAlign: "center", marginTop: 8 },
  infoBox: { padding: 12, borderRadius: 10, marginTop: 12 },
  infoText: { color: "#fff" },
});

export default ForgotPassword;
