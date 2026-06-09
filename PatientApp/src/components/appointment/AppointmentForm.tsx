import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomTabInset } from "@/constants/theme";
import {
  bookAppointment,
  getBookedSlots,
  getDoctors,
  updateAppointment,
} from "@/services/appointmentService";
import type { Doctor } from "@/services/types";

const TEAL = "#2e9466";
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

const pad = (n: number) => String(n).padStart(2, "0");
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const fromMinutes = (mins: number) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

// Split a doctor's availability window into selectable one-hour slots.
function buildHourlySlots(startTime: string, endTime: string) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const slots: string[] = [];
  for (let t = start; t + 60 <= end; t += 60) {
    slots.push(`${fromMinutes(t)}-${fromMinutes(t + 60)}`);
  }
  return slots;
}

function weekdayOf(dateStr: string): string | null {
  if (!DATE_REGEX.test(dateStr)) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  return WEEKDAYS[date.getDay()];
}

export type AppointmentFormProps = {
  mode: "book" | "edit";
  appointmentId?: string;
  initialDoctorCode?: string;
  initialDate?: string;
  initialTimeSlot?: string;
};

export default function AppointmentForm({
  mode,
  appointmentId,
  initialDoctorCode,
  initialDate,
  initialTimeSlot,
}: AppointmentFormProps) {
  const router = useRouter();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorOpen, setDoctorOpen] = useState(false);
  const [doctorCode, setDoctorCode] = useState(initialDoctorCode ?? "");
  const [date, setDate] = useState(initialDate ?? "");
  const [selectedSlot, setSelectedSlot] = useState(initialTimeSlot ?? "");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDoctors();
        setDoctors(data.doctors);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Could not load doctors");
      } finally {
        setLoadingDoctors(false);
      }
    })();
  }, []);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.employeeCode === doctorCode),
    [doctors, doctorCode],
  );

  // All hourly slots offered by the selected doctor on the selected weekday
  const candidateSlots = useMemo(() => {
    if (!selectedDoctor || !date) return [];
    const weekday = weekdayOf(date);
    if (!weekday) return [];
    const windows = (selectedDoctor.availabilitySlots ?? []).filter(
      (w) => w.day === weekday,
    );
    return windows.flatMap((w) => buildHourlySlots(w.startTime, w.endTime));
  }, [selectedDoctor, date]);

  // Refresh booked slots whenever a valid doctor + date is selected
  useEffect(() => {
    if (!doctorCode || !DATE_REGEX.test(date)) {
      setBookedSlots([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const data = await getBookedSlots(doctorCode, date);
        if (active) setBookedSlots(data.bookedSlots);
      } catch {
        if (active) setBookedSlots([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [doctorCode, date]);

  const onSelectDoctor = (code: string) => {
    setDoctorCode(code);
    setDoctorOpen(false);
    // Reset slot when the doctor changes (unless it's the prefilled edit slot)
    if (code !== initialDoctorCode) setSelectedSlot("");
  };

  const handleSubmit = async () => {
    if (!doctorCode) return Alert.alert("Validation", "Please select a doctor");
    if (!DATE_REGEX.test(date))
      return Alert.alert("Validation", "Enter a date as YYYY-MM-DD");
    if (!selectedSlot) return Alert.alert("Validation", "Please select a time slot");

    setSubmitting(true);
    try {
      if (mode === "book") {
        await bookAppointment(doctorCode, date, selectedSlot);
        Alert.alert("Booked", "Your appointment has been booked.");
      } else {
        await updateAppointment(appointmentId!, doctorCode, date, selectedSlot);
        Alert.alert("Updated", "Your appointment has been updated.");
      }
      router.replace("/explore");
    } catch (err: any) {
      Alert.alert(
        mode === "book" ? "Booking Failed" : "Update Failed",
        err.message || "Something went wrong",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDoctors) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={TEAL} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, { paddingBottom: BottomTabInset + 24 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <SafeAreaView edges={["top"]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {mode === "book" ? "Book appointment" : "Reschedule appointment"}
          </Text>
        </View>

        {/* Doctor picker */}
        <Text style={styles.fieldLabel}>Doctor</Text>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={() => setDoctorOpen(!doctorOpen)}
          activeOpacity={0.8}
        >
          <Text style={selectedDoctor ? styles.dropdownValue : styles.dropdownPlaceholder}>
            {selectedDoctor
              ? `Dr. ${selectedDoctor.name}${
                  selectedDoctor.specialization ? ` · ${selectedDoctor.specialization}` : ""
                }`
              : "Select a doctor"}
          </Text>
          <Ionicons name={doctorOpen ? "chevron-up" : "chevron-down"} size={18} color="#6b7280" />
        </TouchableOpacity>

        {doctorOpen && (
          <View style={styles.dropdownList}>
            {doctors.length === 0 ? (
              <Text style={styles.dropdownEmpty}>No doctors available</Text>
            ) : (
              doctors.map((d) => (
                <TouchableOpacity
                  key={d.employeeCode}
                  style={styles.dropdownItem}
                  onPress={() => onSelectDoctor(d.employeeCode)}
                >
                  <Text style={styles.dropdownItemName}>Dr. {d.name}</Text>
                  <Text style={styles.dropdownItemMeta}>
                    {[d.specialization, d.department].filter(Boolean).join(" · ") || "General"}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Date */}
        <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Date</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
        />

        {/* Time slots */}
        <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Time slot</Text>
        {!selectedDoctor || !DATE_REGEX.test(date) ? (
          <Text style={styles.hint}>Select a doctor and date to see available slots.</Text>
        ) : candidateSlots.length === 0 ? (
          <Text style={styles.hint}>
            Dr. {selectedDoctor.name} is not available on this day. Try another date.
          </Text>
        ) : (
          <View style={styles.slotsWrap}>
            {candidateSlots.map((slot) => {
              const isBooked = bookedSlots.includes(slot) && slot !== initialTimeSlot;
              const isActive = selectedSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.slot,
                    isActive && styles.slotActive,
                    isBooked && styles.slotBooked,
                  ]}
                  disabled={isBooked}
                  onPress={() => setSelectedSlot(slot)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.slotText,
                      isActive && styles.slotTextActive,
                      isBooked && styles.slotTextBooked,
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <Text style={styles.submitText}>
            {submitting
              ? "Saving…"
              : mode === "book"
                ? "Confirm booking"
                : "Save changes"}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: "#fff" },
  container: { paddingHorizontal: 20, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 12, marginBottom: 24 },
  backBtn: { marginRight: 8, padding: 4 },
  title: { fontSize: 22, fontWeight: "700", color: "#1f2937" },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  dropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dropdownValue: { fontSize: 15, color: "#1f2937", fontWeight: "500", flex: 1 },
  dropdownPlaceholder: { fontSize: 15, color: "#9ca3af", flex: 1 },
  dropdownList: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    marginTop: 6,
    overflow: "hidden",
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  dropdownItemName: { fontSize: 15, fontWeight: "600", color: "#1f2937" },
  dropdownItemMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  dropdownEmpty: { padding: 14, color: "#9ca3af", fontSize: 14 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#1f2937",
  },
  hint: { fontSize: 14, color: "#9ca3af", paddingVertical: 8 },
  slotsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slot: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  slotActive: { borderColor: TEAL, backgroundColor: "#f0fdf4" },
  slotBooked: { backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" },
  slotText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  slotTextActive: { color: TEAL },
  slotTextBooked: { color: "#9ca3af", textDecorationLine: "line-through" },
  submitButton: {
    backgroundColor: TEAL,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 28,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
