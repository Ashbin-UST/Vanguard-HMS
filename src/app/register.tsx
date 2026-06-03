// src/app/register.tsx

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
import { registerPatient } from "../services/authService";

const RegisterScreen = () => {
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [houseName, setHouseName] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [city, setCity] = useState("");
  const [postCode, setPostCode] = useState("");

  const [contactName, setContactName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const handleRegister = async () => {
    if (
      !fullName ||
      !dob ||
      !gender ||
      !phone ||
      !email ||
      !password ||
      !houseName ||
      !houseNumber ||
      !city ||
      !postCode ||
      !contactName ||
      !relationship ||
      !contactNumber
    ) {
      Alert.alert("Validation Error", "Please fill all fields");
      return;
    }

    try {
      await registerPatient({
        name: fullName,
        phone,
        email,
        password,
        gender,
        dob,
        address: {
          houseName,
          houseNumber,
          city,
          postCode,
        },
        emergencyContact: {
          contactName,
          relationship,
          contactNumber,
        },
      });

      Alert.alert("Success", "Registration successful. Please login.");
      router.push("/login");
    } catch (error: any) {
      Alert.alert(
        "Registration Failed",
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
          Create your{"\n"}patient account
        </Text>
        <Text style={styles.subtitle}>
          Register to book and manage appointments
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.tabRow}>
          <Pressable
            style={styles.tabButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.tabText}>Sign in</Text>
          </Pressable>

          <View style={[styles.tabButton, styles.activeTab]}>
            <Text style={styles.activeTabText}>Register</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Basic information</Text>

          <CustomInput
            label="Full name"
            placeholder="Arjun Sharma"
            value={fullName}
            onChangeText={setFullName}
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <CustomInput
                label="Date of birth"
                placeholder="YYYY-MM-DD"
                value={dob}
                onChangeText={setDob}
              />
            </View>

            <View style={styles.halfInput}>
              <CustomInput
                label="Gender"
                placeholder="Male / Female"
                value={gender}
                onChangeText={setGender}
              />
            </View>
          </View>

          <CustomInput
            label="Phone number"
            placeholder="9876543210"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <CustomInput
            label="Email"
            placeholder="arjun@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <CustomInput
            label="Password"
            placeholder="Password@123"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.sectionTitle}>Address</Text>

          <CustomInput
            label="House name"
            placeholder="Green Villa"
            value={houseName}
            onChangeText={setHouseName}
          />

          <CustomInput
            label="House number"
            placeholder="12A"
            value={houseNumber}
            onChangeText={setHouseNumber}
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <CustomInput
                label="City"
                placeholder="Chennai"
                value={city}
                onChangeText={setCity}
              />
            </View>

            <View style={styles.halfInput}>
              <CustomInput
                label="Post code"
                placeholder="600001"
                value={postCode}
                onChangeText={setPostCode}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Emergency contact</Text>

          <CustomInput
            label="Contact name"
            placeholder="Ravi Sharma"
            value={contactName}
            onChangeText={setContactName}
          />

          <CustomInput
            label="Relationship"
            placeholder="Father"
            value={relationship}
            onChangeText={setRelationship}
          />

          <CustomInput
            label="Contact number"
            placeholder="9876543211"
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
          />

          <CustomButton title="Create account" onPress={handleRegister} />

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Already have an account?</Text>
            <Pressable onPress={() => router.push("/login")}>
              <Text style={styles.linkAction}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default RegisterScreen;

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
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
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