// src/app/login.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { router } from "expo-router";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { COLORS } from "../constants/theme";
import { loginPatient } from "../services/authService";
import { saveToken } from "../utils/storage";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

 const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert("Validation Error", "Please enter email and password");
    return;
  }

  try {
    const data = await loginPatient({
      email,
      password,
    });

    await saveToken(data.token);

    Alert.alert("Success", "Login successful");
    router.replace("/home");
  } catch (error: any) {
    Alert.alert(
      "Login Failed",
      error.response?.data?.message || "Something went wrong"
    );
  }
};

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>❤</Text>
          </View>
          <Text style={styles.brandName}>MediCare+</Text>
        </View>

        <Text style={styles.title}>
          Your health,{"\n"}in your hands
        </Text>
        <Text style={styles.subtitle}>
          Book appointments, track your care
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.tabRow}>
          <View style={[styles.tabButton, styles.activeTab]}>
            <Text style={styles.activeTabText}>Sign in</Text>
          </View>

          <Pressable
            style={styles.tabButton}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.tabText}>Register</Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          <CustomInput
            label="Email address"
            placeholder="you@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <CustomInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <CustomButton title="Sign in" onPress={handleLogin} />

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Don't have an account?</Text>
            <Pressable onPress={() => router.push("/register")}>
              <Text style={styles.linkAction}>Register</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  hero: {
    backgroundColor: COLORS.g800,
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 44,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  brandIcon: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  brandIconText: {
    color: COLORS.white,
    fontSize: 20,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.white,
    lineHeight: 31,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.g200,
    marginTop: 6,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: COLORS.g50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 3,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.muted,
  },
  activeTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.g800,
  },
  form: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 18,
  },
  forgotText: {
    fontSize: 12,
    color: COLORS.g600,
    fontWeight: "600",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  linkText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  linkAction: {
    fontSize: 13,
    color: COLORS.g600,
    fontWeight: "600",
  },
});