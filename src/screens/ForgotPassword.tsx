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
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: "#d1fae5",
                borderColor: "#10b981",
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[styles.infoText, { color: "#065f46" }]}>
              {message}
            </Text>
          </View>
        ) : null}
        {error ? (
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: "#fee2e2",
                borderColor: "#ef4444",
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[styles.infoText, { color: "#991b1b" }]}>{error}</Text>
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
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: { color: "#ec4899", textAlign: "center", marginTop: 8 },
  infoBox: { padding: 12, borderRadius: 10, marginTop: 12 },
  infoText: { color: "#111827" },
});

export default ForgotPassword;
