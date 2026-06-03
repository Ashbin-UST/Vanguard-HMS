// src/app/index.tsx

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";

const Index = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logoIcon}>❤</Text>
      </View>

      <Text style={styles.appName}>MediCare+</Text>
      <Text style={styles.title}>Patient Mobile App</Text>
      <Text style={styles.subtitle}>
        Book appointments, manage your profile, and track your care easily.
      </Text>

      <Pressable style={styles.loginButton} onPress={() => router.push("/login")}>
        <Text style={styles.loginButtonText}>Login</Text>
      </Pressable>

      <Pressable
        style={styles.registerButton}
        onPress={() => router.push("/register")}
      >
        <Text style={styles.registerButtonText}>Register</Text>
      </Pressable>
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7faf8",
    justifyContent: "center",
    padding: 24,
  },
  logoBox: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: "#0f4a30",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logoIcon: {
    color: "#ffffff",
    fontSize: 30,
  },
  appName: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0f4a30",
    textAlign: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e7a50",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#5a7d6b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 34,
  },
  loginButton: {
    backgroundColor: "#1e7a50",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  loginButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  registerButton: {
    borderWidth: 1.5,
    borderColor: "#1e7a50",
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  registerButtonText: {
    color: "#1e7a50",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});