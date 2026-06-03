import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { COLORS } from "../constants/theme";

type CustomButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline";
};

const CustomButton = ({
  title,
  onPress,
  variant = "primary",
}: CustomButtonProps) => {
  const isOutline = variant === "outline";

  return (
    <Pressable
      style={[styles.button, isOutline ? styles.outlineButton : styles.primaryButton]}
      onPress={onPress}
    >
      <Text style={[styles.text, isOutline ? styles.outlineText : styles.primaryText]}>
        {title}
      </Text>
    </Pressable>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  button: {
    width: "100%",
    padding: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: COLORS.g600,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.g400,
  },
  text: {
    fontSize: 15,
    fontWeight: "600",
  },
  primaryText: {
    color: COLORS.white,
  },
  outlineText: {
    color: COLORS.g600,
  },
});