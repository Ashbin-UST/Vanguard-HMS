import React from "react";
import { Text, TextInput, StyleSheet, View, TextInputProps } from "react-native";
import { COLORS } from "../constants/theme";

type CustomInputProps = TextInputProps & {
  label: string;
};

const CustomInput = ({ label, ...props }: CustomInputProps) => {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={COLORS.muted}
        {...props}
      />
    </View>
  );
};

export default CustomInput;

const styles = StyleSheet.create({
  group: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.g800,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
});