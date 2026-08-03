import { View, Text, StyleSheet } from "react-native";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color: "blue" | "green" | "red" | "amber";
}

export const StatCard = ({ title, value, subtitle, color }: StatCardProps) => {
  const colorStyles = {
    blue: {
      backgroundColor: "#eff6ff",
      borderColor: "#bfdbfe",
      color: "#1d4ed8",
    },
    green: {
      backgroundColor: "#ecfdf5",
      borderColor: "#bbf7d0",
      color: "#166534",
    },
    red: {
      backgroundColor: "#fef2f2",
      borderColor: "#fecaca",
      color: "#991b1b",
    },
    amber: {
      backgroundColor: "#fffbeb",
      borderColor: "#fef3c7",
      color: "#78350f",
    },
  };

  const valueStyles = {
    blue: { color: "#1d4ed8" },
    green: { color: "#166534" },
    red: { color: "#991b1b" },
    amber: { color: "#78350f" },
  };

  return (
    <View style={[styles.card, colorStyles[color]]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, valueStyles[color]]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    width: "48%", // ← exactly half width with gap
    marginBottom: 0, // ← remove marginBottom, gap handles spacing
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    color: "#6b7280",
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
});
