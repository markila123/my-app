import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TextInputProps,
} from "react-native";

export type AppInputProps = TextInputProps & {
  label?: string;
  placeholder?: string;
  error?: string | null;
  style?: StyleProp<ViewStyle>; // container style
};

const AppInput: React.FC<AppInputProps> = ({
  label,
  placeholder,
  error,
  style,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...rest}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={[
          styles.input,
          focused && styles.inputFocused,
          rest.multiline && styles.inputMultiline,
        ]}
        onFocus={(e) => {
          setFocused(true);
          if (rest.onFocus) rest.onFocus(e as any);
        }}
        onBlur={(e) => {
          setFocused(false);
          if (rest.onBlur) rest.onBlur(e as any);
        }}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    color: "#E6EEF8",
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    minHeight: 52,
    backgroundColor: "#243343",
    borderRadius: 12,
    paddingHorizontal: 14,
    color: "#E6EEF8",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputMultiline: {
    minHeight: 120,
    paddingTop: 12,
    paddingBottom: 12,
  },
  inputFocused: {
    borderColor: "#3B82F6",
  },
  error: {
    color: "#F97316",
    marginTop: 6,
  },
});

export default AppInput;
