import { Textbox } from "@/components/common/textbox";
import { resetPassword } from "@/services/authService";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { pwStyles as styles } from "@/styles/password.style";

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, msg: "at least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), msg: "an uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), msg: "a lowercase letter" },
  { test: (p: string) => /\d/.test(p), msg: "a number" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), msg: "a special character" },
];

export default function ResetPassword() {
  const router = useRouter();
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState({ resetToken: false, newPassword: false, confirmPassword: false });
  const [submitting, setSubmitting] = useState(false);

  const touch = (field: keyof typeof touched) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const newPasswordError = (() => {
    if (!newPassword) return "Required";
    const missing = PASSWORD_RULES.filter((r) => !r.test(newPassword)).map((r) => r.msg);
    return missing.length ? `Needs ${missing.join(", ")}` : undefined;
  })();

  const errors = {
    resetToken: !resetToken.trim() ? "Required" : undefined,
    newPassword: newPasswordError,
    confirmPassword: !confirmPassword
      ? "Required"
      : confirmPassword !== newPassword
      ? "Passwords do not match"
      : undefined,
  };

  const handleSubmit = async () => {
    setTouched({ resetToken: true, newPassword: true, confirmPassword: true });
    if (Object.values(errors).some(Boolean)) return;

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
    <KeyboardAwareScrollView style={styles.scrollView} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={20}>
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
            onBlur={() => touch("resetToken")}
            icon="key-outline"
            autoCapitalize="none"
            error={touched.resetToken ? errors.resetToken : undefined}
          />
          <Textbox
            label="New password"
            placeholder="Create a new password"
            value={newPassword}
            onChangeText={setNewPassword}
            onBlur={() => touch("newPassword")}
            icon="lock-closed-outline"
            secureTextEntry
            error={touched.newPassword ? errors.newPassword : undefined}
          />
          <Textbox
            label="Confirm password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onBlur={() => touch("confirmPassword")}
            icon="lock-closed-outline"
            secureTextEntry
            error={touched.confirmPassword ? errors.confirmPassword : undefined}
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
    </KeyboardAwareScrollView>
  );
}
