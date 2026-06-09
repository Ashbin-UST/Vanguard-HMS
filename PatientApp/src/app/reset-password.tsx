import { Textbox } from "@/components/common/textbox";
import { resetPassword } from "@/services/authService";
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

export default function ResetPassword() {
  const router = useRouter();
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!resetToken.trim() || !newPassword || !confirmPassword) {
      Alert.alert("Validation", "Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(resetToken.trim(), newPassword, confirmPassword);
      Alert.alert("Success", "Your password has been reset. Please log in.", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } catch (err: any) {
      Alert.alert("Reset Failed", err.message || "Something went wrong");
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

        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          Enter the reset code from your email and choose a new password.
        </Text>

        <View style={styles.form}>
          <Textbox
            label="Reset code"
            placeholder="Paste your reset code"
            value={resetToken}
            onChangeText={setResetToken}
            icon="key-outline"
            autoCapitalize="none"
          />
          <Textbox
            label="New password"
            placeholder="Create a new password"
            value={newPassword}
            onChangeText={setNewPassword}
            icon="lock-closed-outline"
            secureTextEntry
          />
          <Textbox
            label="Confirm password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            icon="lock-closed-outline"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.disabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? "Resetting…" : "Reset password"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
