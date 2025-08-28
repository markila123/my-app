import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

export type TabKey = "rea1" | "remont" | "rea" | "ghegmiri" | "istoria";

export type BottomNavProps = {
  active: TabKey;
  onSelect: (t: TabKey) => void;
};

const labels: Record<TabKey, string> = {
  rea1: "რეაგირება",
  remont: "რემონტი",
  rea: "რეაგირება",
  ghegmiri: "გეგმიური",
  istoria: "ისტორია",
};

const BottomNav: React.FC<BottomNavProps> = ({ active, onSelect }) => {
  const tabs: TabKey[] = ["rea1", "remont", "rea", "ghegmiri", "istoria"];

  return (
    <View style={styles.container}>
      {tabs.map((t) => {
        const isActive = t === active;
        return (
          <TouchableOpacity
            key={t}
            style={styles.tab}
            onPress={() => onSelect(t)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, isActive && styles.iconActive]} />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {labels[t]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 72,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#f9a8d4",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fde2e9",
    marginBottom: 6,
  },
  iconActive: {
    backgroundColor: "#ec4899",
  },
  label: {
    color: "#374151",
    fontSize: 12,
  },
  labelActive: {
    color: "#111827",
    fontWeight: "700",
  },
});

export default BottomNav;
