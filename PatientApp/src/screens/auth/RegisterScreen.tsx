import DateTimePicker, { DateTimePickerChangeEvent } from "@react-native-community/datetimepicker";
import { Textbox } from "@/components/common/textbox";
import { registerPatient } from "@/services/authService";
import { useIsFocused, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { ALERT_TITLES, MESSAGES } from "@/constants/messages";
import { showError, showSuccess } from "@/utils/alerts";
import { useGuardedRouter } from "@/hooks/useGuardedRouter";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { styles } from "./styles/RegisterScreen.style";

type Gender = "Male" | "Female";

const PHONE_REGEX = /^(\+\d{1,3} )?\d{10}$/;
const DOB_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const NAME_REGEX = /^[a-zA-Z]+([ '-][a-zA-Z]+)*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, msg: "at least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), msg: "an uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), msg: "a lowercase letter" },
  { test: (p: string) => /\d/.test(p), msg: "a number" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), msg: "a special character" },
];

const ALL_FIELDS = [
  "name", "dob", "phone", "email", "password", "confirmPassword", "gender",
  "houseName", "houseNumber", "city", "postCode",
  "contactName", "relationship", "contactNumber",
] as const;
type Field = (typeof ALL_FIELDS)[number];

function isRealDate(s: string): boolean {
  if (!DOB_REGEX.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MAX_DOB = new Date();
MAX_DOB.setHours(0, 0, 0, 0);

const MIN_DOB = new Date();
MIN_DOB.setFullYear(MIN_DOB.getFullYear() - 120);

const RegisterScreen = () => {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [dobPickerDate, setDobPickerDate] = useState<Date>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 25);
    return d;
  });
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [gender, setGender] = useState<Gender | "">("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [houseName, setHouseName] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [city, setCity] = useState("");
  const [postCode, setPostCode] = useState("");

  const [contactName, setContactName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const guarded = useGuardedRouter();
  const isFocused = useIsFocused();

  // Dirty when any field holds input; guards accidental navigation away.
  const isDirty =
    !!(name || dob || phone || email || password || confirmPassword ||
      houseName || houseNumber || city || postCode ||
      contactName || relationship || contactNumber) || gender !== "";
  useUnsavedChanges(isDirty);

  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isFocused) {
      slideAnim.setValue(30);
      opacityAnim.setValue(0);
      setTouched({});
      return;
    }
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();
  }, [isFocused, slideAnim, opacityAnim]);

  const touch = (field: Field) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const onDobValueChange = (_: DateTimePickerChangeEvent, selected: Date) => {
    if (Platform.OS === "android") {
      setShowDobPicker(false);
      touch("dob");
    }
    setDobPickerDate(selected);
    setDob(formatDate(selected));
  };

  const onDobDismiss = () => {
    if (Platform.OS === "android") {
      setShowDobPicker(false);
      touch("dob");
    }
  };

  const passwordError = (() => {
    if (!password) return "Required";
    const missing = PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.msg);
    return missing.length ? `Needs ${missing.join(", ")}` : undefined;
  })();

  const dobError = (() => {
    if (!dob) return "Required";
    if (!isRealDate(dob)) return "Enter a valid calendar date";
    const [y, m, d] = dob.split("-").map(Number);
    const dobLocal = new Date(y, m - 1, d);
    if (dobLocal > MAX_DOB) return "Date of birth cannot be a future date";
    return undefined;
  })();

  const errors: Record<Field, string | undefined> = {
    name: !name.trim()
      ? "Required"
      : !NAME_REGEX.test(name.trim())
      ? "Only letters, spaces, hyphens, and apostrophes"
      : undefined,
    dob: dobError,
    phone: !phone
      ? "Required"
      : !PHONE_REGEX.test(phone)
      ? "10 digits, optional +country code (e.g. +91 9876543210)"
      : undefined,
    email: !email.trim()
      ? "Required"
      : !EMAIL_REGEX.test(email.trim())
      ? "Enter a valid email address"
      : undefined,
    password: passwordError,
    confirmPassword: !confirmPassword
      ? "Required"
      : confirmPassword !== password
      ? "Passwords do not match"
      : undefined,
    gender: !gender ? "Please select a gender" : undefined,
    houseName: !houseName.trim() ? "Required" : undefined,
    houseNumber: !houseNumber.trim() ? "Required" : undefined,
    city: !city.trim() ? "Required" : undefined,
    postCode: !postCode.trim() ? "Required" : undefined,
    contactName: !contactName.trim() ? "Required" : undefined,
    relationship: !relationship.trim() ? "Required" : undefined,
    contactNumber: !contactNumber
      ? "Required"
      : !PHONE_REGEX.test(contactNumber)
      ? "10 digits, optional +country code"
      : undefined,
  };

  const err = (field: Field) => (touched[field] ? errors[field] : undefined);

  const handleRegister = async () => {
    const allTouched = Object.fromEntries(ALL_FIELDS.map((f) => [f, true])) as Record<Field, boolean>;
    setTouched(allTouched);

    if (Object.values(errors).some(Boolean)) return;

    setSubmitting(true);
    try {
      await registerPatient({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        gender: gender as Gender,
        dob,
        address: {
          houseName: houseName.trim(),
          houseNumber: houseNumber.trim(),
          city: city.trim(),
          postCode: postCode.trim(),
        },
        emergencyContact: {
          contactName: contactName.trim(),
          relationship: relationship.trim(),
          contactNumber: contactNumber.trim(),
        },
      });
      showSuccess(MESSAGES.REGISTER_SUCCESS, ALERT_TITLES.REGISTERED);
      router.replace("/login");
    } catch (e) {
      showError(e, ALERT_TITLES.REGISTRATION_FAILED);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        <View style={styles.brandSection}>
          <Text style={styles.appName}>MediCare+</Text>
          <Text style={styles.heroText}>Create your account</Text>
          <Text style={styles.subtitle}>Join to book appointments and track your care</Text>
        </View>

        <Animated.View
          style={[
            styles.formBox,
            { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
          ]}
        >
          <Text style={styles.sectionLabel}>Personal details</Text>

          <Textbox
            label="Full name"
            placeholder="Arjun Sharma"
            value={name}
            icon="person-outline"
            onChangeText={setName}
            onBlur={() => touch("name")}
            error={err("name")}
          />

          {/* DOB — tapping opens native date picker */}
          <Textbox
            label="Date of birth"
            placeholder="Select date of birth"
            value={dob}
            icon="calendar-outline"
            onPress={() => setShowDobPicker(true)}
            editable={false}
            error={err("dob")}
          />

          {/* Phone — full width so all digits stay visible */}
          <Textbox
            label="Phone number"
            placeholder="9876543210"
            value={phone}
            icon="call-outline"
            onChangeText={setPhone}
            onBlur={() => touch("phone")}
            keyboardType="phone-pad"
            error={err("phone")}
          />

          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={styles.genderRow}>
            {(["Male", "Female"] as Gender[]).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderOption, gender === g && styles.genderOptionActive]}
                onPress={() => {
                  setGender(g);
                  touch("gender");
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {err("gender") ? (
            <Text style={styles.fieldError}>{err("gender")}</Text>
          ) : null}

          <Textbox
            label="Email"
            placeholder="arjun@email.com"
            value={email}
            icon="mail-outline"
            onChangeText={setEmail}
            onBlur={() => touch("email")}
            autoCapitalize="none"
            keyboardType="email-address"
            error={err("email")}
          />

          <Textbox
            label="Password"
            placeholder="Create a password"
            value={password}
            icon="lock-closed-outline"
            onChangeText={setPassword}
            onBlur={() => touch("password")}
            secureToggle
            error={err("password")}
          />

          <Textbox
            label="Confirm password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            icon="lock-closed-outline"
            onChangeText={setConfirmPassword}
            onBlur={() => touch("confirmPassword")}
            secureTextEntry
            error={err("confirmPassword")}
          />

          <Text style={styles.sectionLabel}>Address</Text>

          <View style={styles.halfRow}>
            <View style={styles.halfField}>
              <Textbox
                label="House name"
                placeholder="Maple Villa"
                value={houseName}
                icon="home-outline"
                onChangeText={setHouseName}
                onBlur={() => touch("houseName")}
                error={err("houseName")}
              />
            </View>
            <View style={styles.halfField}>
              <Textbox
                label="House number"
                placeholder="12B"
                value={houseNumber}
                icon="business-outline"
                onChangeText={setHouseNumber}
                onBlur={() => touch("houseNumber")}
                error={err("houseNumber")}
              />
            </View>
          </View>

          <View style={styles.halfRow}>
            <View style={styles.halfField}>
              <Textbox
                label="City"
                placeholder="Kochi"
                value={city}
                icon="location-outline"
                onChangeText={setCity}
                onBlur={() => touch("city")}
                error={err("city")}
              />
            </View>
            <View style={styles.halfField}>
              <Textbox
                label="Post code"
                placeholder="682001"
                value={postCode}
                icon="navigate-outline"
                onChangeText={setPostCode}
                onBlur={() => touch("postCode")}
                error={err("postCode")}
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>Emergency contact</Text>

          <Textbox
            label="Contact name"
            placeholder="Jane Sharma"
            value={contactName}
            icon="person-outline"
            onChangeText={setContactName}
            onBlur={() => touch("contactName")}
            error={err("contactName")}
          />

          <Textbox
            label="Relationship"
            placeholder="Sister"
            value={relationship}
            icon="people-outline"
            onChangeText={setRelationship}
            onBlur={() => touch("relationship")}
            error={err("relationship")}
          />

          {/* Contact number — full width so all digits stay visible */}
          <Textbox
            label="Contact number"
            placeholder="9876543210"
            value={contactNumber}
            icon="call-outline"
            onChangeText={setContactNumber}
            onBlur={() => touch("contactNumber")}
            keyboardType="phone-pad"
            error={err("contactNumber")}
          />

          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
            onPress={handleRegister}
            activeOpacity={0.85}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? "Creating account…" : "Create account"}
            </Text>
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => guarded.push("/login")}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>

      {/* Android: DateTimePicker renders as a native dialog */}
      {Platform.OS === "android" && showDobPicker && (
        <DateTimePicker
          value={dobPickerDate}
          mode="date"
          display="default"
          maximumDate={MAX_DOB}
          minimumDate={MIN_DOB}
          onValueChange={onDobValueChange}
          onDismiss={onDobDismiss}
        />
      )}

      {/* iOS: DateTimePicker shown in a bottom-sheet modal */}
      {Platform.OS === "ios" && (
        <Modal visible={showDobPicker} transparent animationType="slide">
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Date of Birth</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowDobPicker(false);
                    touch("dob");
                  }}
                >
                  <Text style={styles.pickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={dobPickerDate}
                mode="date"
                display="spinner"
                maximumDate={MAX_DOB}
                minimumDate={MIN_DOB}
                onValueChange={onDobValueChange}
                onDismiss={onDobDismiss}
                style={{ width: "100%" }}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

export default RegisterScreen;
