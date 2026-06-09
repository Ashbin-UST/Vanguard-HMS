import { Textbox } from "@/components/common/textbox";
import { registerPatient } from "@/services/authService";
import { useIsFocused, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "./styles/RegisterScreen.style";

type Gender = "Male" | "Female";

// Backend rules we mirror client-side to fail fast with a friendly message.
const PHONE_REGEX = /^(\+\d{1,3} )?\d{10}$/;
const DOB_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, msg: "at least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), msg: "an uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), msg: "a lowercase letter" },
  { test: (p: string) => /\d/.test(p), msg: "a number" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), msg: "a special character" },
];

const RegisterScreen = () => {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
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

  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const isFocused = useIsFocused();

  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isFocused) {
      slideAnim.setValue(30);
      opacityAnim.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();
  }, [isFocused, slideAnim, opacityAnim]);

  const validate = (): string | null => {
    if (
      !name ||
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
      return "Please fill in all fields";
    }
    if (!DOB_REGEX.test(dob)) return "Date of birth must be in YYYY-MM-DD format";
    if (!PHONE_REGEX.test(phone)) return "Phone must be 10 digits (optionally a +country code)";
    if (!PHONE_REGEX.test(contactNumber))
      return "Emergency contact number must be 10 digits (optionally a +country code)";
    const missing = PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.msg);
    if (missing.length) return `Password needs ${missing.join(", ")}`;
    return null;
  };

  const handleRegister = async () => {
    const error = validate();
    if (error) {
      Alert.alert("Validation Error", error);
      return;
    }

    setSubmitting(true);
    try {
      await registerPatient({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
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
      Alert.alert("Registered", "Your account has been created. You can now log in.");
      router.replace("/login");
    } catch (err: any) {
      Alert.alert("Registration Failed", err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
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
        />

        <View style={styles.halfRow}>
          <View style={styles.halfField}>
            <Textbox
              label="Date of birth"
              placeholder="YYYY-MM-DD"
              value={dob}
              icon="calendar-outline"
              onChangeText={setDob}
            />
          </View>
          <View style={styles.halfField}>
            <Textbox
              label="Phone number"
              placeholder="9876543210"
              value={phone}
              icon="call-outline"
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Gender</Text>
        <View style={styles.genderRow}>
          {(["Male", "Female"] as Gender[]).map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.genderOption, gender === g && styles.genderOptionActive]}
              onPress={() => setGender(g)}
              activeOpacity={0.8}
            >
              <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Textbox
          label="Email"
          placeholder="arjun@email.com"
          value={email}
          icon="mail-outline"
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Textbox
          label="Password"
          placeholder="Create a password"
          value={password}
          icon="lock-closed-outline"
          onChangeText={setPassword}
          secureTextEntry
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
            />
          </View>
          <View style={styles.halfField}>
            <Textbox
              label="House number"
              placeholder="12B"
              value={houseNumber}
              icon="business-outline"
              onChangeText={setHouseNumber}
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
            />
          </View>
          <View style={styles.halfField}>
            <Textbox
              label="Post code"
              placeholder="682001"
              value={postCode}
              icon="navigate-outline"
              onChangeText={setPostCode}
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
        />

        <View style={styles.halfRow}>
          <View style={styles.halfField}>
            <Textbox
              label="Relationship"
              placeholder="Sister"
              value={relationship}
              icon="people-outline"
              onChangeText={setRelationship}
            />
          </View>
          <View style={styles.halfField}>
            <Textbox
              label="Contact number"
              placeholder="9876543210"
              value={contactNumber}
              icon="call-outline"
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
            />
          </View>
        </View>

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
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

export default RegisterScreen;
