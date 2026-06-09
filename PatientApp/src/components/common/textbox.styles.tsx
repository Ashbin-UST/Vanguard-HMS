import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    color: "#333",
    marginBottom: 8,
    fontSize: 15,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#d3d3d3",
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
  },
  icon: {
    marginRight: 10,
    color: "#8a8a8a",
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 12,
    color: "#111",
    fontSize: 16,
  },
});