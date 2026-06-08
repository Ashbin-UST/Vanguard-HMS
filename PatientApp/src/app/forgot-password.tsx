import { Textbox } from "@/components/common/textbox";
import { forgotPassword } from "@/services/authService";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { pwStyles as styles } from "@/styles/password.style";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert("Validation", "Please enter your email");
      return;
    }
    setSubmitting(true);
    try {
      const res = await forgotPassword(email.trim());
      Alert.alert("Check your email", res.message, [
        { text: "Enter reset code", onPress: () => router.push("/reset-password") },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <SafeAreaView edges={["top"]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1f2937" />
        </TouchableOpacity>

        <Text style={styles.title}>Forgot password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we&apos;ll send you a reset code.
        </Text>

        <View style={styles.form}>
          <Textbox
            label="Email address"
            placeholder="you@email.com"
            value={email}
            onChangeText={setEmail}
            icon="mail-outline"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.disabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? "Sending…" : "Send reset code"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/reset-password")}>
            <Text style={styles.link}>I already have a reset code</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
