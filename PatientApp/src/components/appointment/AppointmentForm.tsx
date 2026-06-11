import DateTimePicker, { DateTimePickerChangeEvent } from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ALERT_TITLES, MESSAGES } from "@/constants/messages";
import { showError, showSuccess } from "@/utils/alerts";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomTabInset, KeyboardScrollPadding } from "@/constants/theme";
import { useGuardedRouter } from "@/hooks/useGuardedRouter";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
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

// Slot length in minutes — kept consistent with the Angular web app.
const SLOT_MINUTES = 30;

const pad = (n: number) => String(n).padStart(2, "0");
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const fromMinutes = (mins: number) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

function buildSlots(startTime: string, endTime: string) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const slots: string[] = [];
  for (let t = start; t + SLOT_MINUTES <= end; t += SLOT_MINUTES) {
    slots.push(`${fromMinutes(t)}-${fromMinutes(t + SLOT_MINUTES)}`);
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

function isRealDate(dateStr: string): boolean {
  if (!DATE_REGEX.test(dateStr)) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Booking window: today through 6 months ahead.
const MIN_DATE = new Date();
MIN_DATE.setHours(0, 0, 0, 0);

const MAX_DATE = new Date();
MAX_DATE.setHours(0, 0, 0, 0);
MAX_DATE.setMonth(MAX_DATE.getMonth() + 6);

function isBeyondMax(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getTime() > MAX_DATE.getTime();
}

export type AppointmentFormProps = {
  mode: "book" | "edit";
  appointmentId?: string;
  initialDoctorCode?: string;
  initialDate?: string;
  initialTimeSlot?: string;
  // Rendered inside another screen (e.g. the Appointments tab): no top safe
  // area inset and no header/back button — the host screen provides those.
  embedded?: boolean;
  // Called after a successful submit instead of router.replace("/explore").
  onDone?: () => void;
};

export default function AppointmentForm({
  mode,
  appointmentId,
  initialDoctorCode,
  initialDate,
  initialTimeSlot,
  embedded = false,
  onDone,
}: AppointmentFormProps) {
  const router = useRouter();
  const guarded = useGuardedRouter();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorOpen, setDoctorOpen] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorCode, setDoctorCode] = useState(initialDoctorCode ?? "");
  const [date, setDate] = useState(initialDate ?? "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState<Date>(() => new Date());
  const [selectedSlot, setSelectedSlot] = useState(initialTimeSlot ?? "");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [touched, setTouched] = useState({ doctor: false, date: false, timeSlot: false });
  const touch = (field: keyof typeof touched) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  // Dirty when the selection has moved away from its initial state.
  const isDirty =
    mode === "book"
      ? Boolean(doctorCode || date || selectedSlot)
      : doctorCode !== (initialDoctorCode ?? "") ||
        date !== (initialDate ?? "") ||
        selectedSlot !== (initialTimeSlot ?? "");
  useUnsavedChanges(isDirty);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDoctors();
        setDoctors(data.doctors);
      } catch (err) {
        showError(err);
      } finally {
        setLoadingDoctors(false);
      }
    })();
  }, []);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.employeeCode === doctorCode),
    [doctors, doctorCode],
  );

  const candidateSlots = useMemo(() => {
    if (!selectedDoctor || !date) return [];
    const weekday = weekdayOf(date);
    if (!weekday) return [];
    const windows = (selectedDoctor.availabilitySlots ?? []).filter(
      (w) => w.day === weekday,
    );
    const slots = windows.flatMap((w) => buildSlots(w.startTime, w.endTime));
    // Hide slots whose start time already passed when booking for today
    // (mirrors the web app; the backend rejects them with 409). A passed
    // initialTimeSlot is intentionally hidden too — saving it would 409 anyway.
    const now = new Date();
    if (date !== formatDate(now)) return slots;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return slots.filter((slot) => toMinutes(slot.slice(0, 5)) > nowMinutes);
  }, [selectedDoctor, date]);

  // Hide slots already booked by others; keep the slot being edited (RN does not
  // pass excludeAppointmentId, so the current appointment's own slot would show
  // as booked otherwise). Cancelled appointments are excluded server-side, so a
  // freed slot reappears here automatically.
  const availableSlots = useMemo(
    () =>
      candidateSlots.filter(
        (slot) => !bookedSlots.includes(slot) || slot === initialTimeSlot,
      ),
    [candidateSlots, bookedSlots, initialTimeSlot],
  );

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

  // Filter doctors by name, specialization, or department for the dropdown search.
  const filteredDoctors = useMemo(() => {
    const q = doctorSearch.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter((d) =>
      [d.name, d.specialization, d.department]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [doctors, doctorSearch]);

  const onSelectDoctor = (code: string) => {
    setDoctorCode(code);
    setDoctorOpen(false);
    setDoctorSearch("");
    if (code !== initialDoctorCode) setSelectedSlot("");
  };

  // Collapsing the dropdown without a selection counts as leaving the field, so
  // the "required" error surfaces. Called from every other control on the form.
  const blurDoctor = () => {
    if (doctorOpen) {
      setDoctorOpen(false);
      touch("doctor");
    }
  };

  const onDateValueChange = (_: DateTimePickerChangeEvent, selected: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      touch("date");
    }
    setDatePickerDate(selected);
    setDate(formatDate(selected));
  };

  const onDatePickerDismiss = () => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      touch("date");
    }
  };

  const errors = {
    doctor: !doctorCode ? "Please select a doctor" : undefined,
    date: !date
      ? "Required"
      : !DATE_REGEX.test(date)
      ? "Use YYYY-MM-DD format"
      : !isRealDate(date)
      ? "Enter a valid calendar date"
      : isBeyondMax(date)
      ? "Appointments can only be booked up to 6 months in advance"
      : undefined,
    timeSlot: availableSlots.length > 0 && !selectedSlot
      ? "Please select a time slot"
      : undefined,
  };

  const handleSubmit = async () => {
    blurDoctor();
    setTouched({ doctor: true, date: true, timeSlot: true });
    if (Object.values(errors).some(Boolean)) return;

    setSubmitting(true);
    try {
      if (mode === "book") {
        await bookAppointment(doctorCode, date, selectedSlot);
        showSuccess(MESSAGES.APPOINTMENT_BOOKED, ALERT_TITLES.BOOKED);
      } else {
        await updateAppointment(appointmentId!, doctorCode, date, selectedSlot);
        showSuccess(MESSAGES.APPOINTMENT_UPDATED, ALERT_TITLES.UPDATED);
      }
      if (onDone) {
        onDone();
      } else {
        router.replace("/explore");
      }
    } catch (err) {
      showError(
        err,
        mode === "book" ? ALERT_TITLES.BOOKING_FAILED : ALERT_TITLES.UPDATE_FAILED,
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
    <KeyboardAwareScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.container,
        embedded && styles.containerEmbedded,
        { paddingBottom: BottomTabInset + KeyboardScrollPadding },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
    >
      <SafeAreaView edges={embedded ? [] : ["top"]}>
        {!embedded && (
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => {
                blurDoctor();
                guarded.back();
              }}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.title}>
              {mode === "book" ? "Book appointment" : "Reschedule appointment"}
            </Text>
          </View>
        )}

        {/* Doctor picker */}
        <Text style={styles.fieldLabel}>Doctor</Text>
        <TouchableOpacity
          style={[
            styles.dropdownTrigger,
            touched.doctor && errors.doctor ? styles.dropdownTriggerError : undefined,
          ]}
          onPress={() => {
            // Mark touched only when closing the dropdown (leaving the field),
            // so the "required" error doesn't flash the moment it's opened.
            if (doctorOpen) touch("doctor");
            setDoctorOpen(!doctorOpen);
          }}
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
        {touched.doctor && errors.doctor ? (
          <Text style={styles.errorText}>{errors.doctor}</Text>
        ) : null}

        {doctorOpen && (
          <View style={styles.dropdownList}>
            <View style={styles.dropdownSearch}>
              <Ionicons name="search-outline" size={16} color="#9ca3af" />
              <TextInput
                style={styles.dropdownSearchInput}
                value={doctorSearch}
                onChangeText={setDoctorSearch}
                placeholder="Search by name or specialization..."
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {filteredDoctors.length === 0 ? (
              <Text style={styles.dropdownEmpty}>No results found</Text>
            ) : (
              filteredDoctors.map((d) => (
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

        {/* Consultation fee — read-only, mirrors the web app's fee pill */}
        {selectedDoctor && (
          <>
            <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Consultation fee</Text>
            <View style={styles.feePill}>
              <Ionicons name="cash-outline" size={18} color={TEAL} />
              <Text style={styles.feeText}>
                {selectedDoctor.consultationFee != null
                  ? `₹ ${selectedDoctor.consultationFee}`
                  : "Not set"}
              </Text>
            </View>
          </>
        )}

        {/* Date — tapping opens the native date picker */}
        <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Date</Text>
        <TouchableOpacity
          style={[
            styles.dropdownTrigger,
            touched.date && errors.date ? styles.dropdownTriggerError : undefined,
          ]}
          onPress={() => {
            blurDoctor();
            if (date && isRealDate(date)) {
              const [y, m, d] = date.split("-").map(Number);
              setDatePickerDate(new Date(y, m - 1, d));
            }
            setShowDatePicker(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={date ? styles.dropdownValue : styles.dropdownPlaceholder}>
            {date || "Select a date"}
          </Text>
          <Ionicons name="calendar-outline" size={18} color="#6b7280" />
        </TouchableOpacity>
        {touched.date && errors.date ? (
          <Text style={styles.errorText}>{errors.date}</Text>
        ) : null}

        {/* Time slots */}
        <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Time slot</Text>
        {!selectedDoctor || !DATE_REGEX.test(date) ? (
          <Text style={styles.hint}>Select a doctor and date to see available slots.</Text>
        ) : candidateSlots.length === 0 ? (
          <Text style={styles.hint}>
            Dr. {selectedDoctor.name} is not available on this day. Try another date.
          </Text>
        ) : availableSlots.length === 0 ? (
          <Text style={styles.hint}>
            All slots for this day are booked. Try another date.
          </Text>
        ) : (
          <>
            <View style={styles.slotsWrap}>
              {availableSlots.map((slot) => {
                const isActive = selectedSlot === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slot, isActive && styles.slotActive]}
                    onPress={() => {
                      setSelectedSlot(slot);
                      touch("timeSlot");
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.slotText, isActive && styles.slotTextActive]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {touched.timeSlot && errors.timeSlot ? (
              <Text style={styles.errorText}>{errors.timeSlot}</Text>
            ) : null}
          </>
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

        {/* Android: DateTimePicker renders as a native dialog */}
        {Platform.OS === "android" && showDatePicker && (
          <DateTimePicker
            value={datePickerDate}
            mode="date"
            display="default"
            minimumDate={MIN_DATE}
            maximumDate={MAX_DATE}
            onValueChange={onDateValueChange}
            onDismiss={onDatePickerDismiss}
          />
        )}

        {/* iOS: DateTimePicker shown in a bottom-sheet modal */}
        {Platform.OS === "ios" && (
          <Modal visible={showDatePicker} transparent animationType="slide">
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerSheet}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Appointment date</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowDatePicker(false);
                      touch("date");
                    }}
                  >
                    <Text style={styles.pickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={datePickerDate}
                  mode="date"
                  display="spinner"
                  minimumDate={MIN_DATE}
                  maximumDate={MAX_DATE}
                  onValueChange={onDateValueChange}
                  onDismiss={onDatePickerDismiss}
                  style={{ width: "100%" }}
                />
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: "#fff" },
  container: { paddingHorizontal: 20, backgroundColor: "#fff" },
  containerEmbedded: { paddingTop: 8 },
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
  dropdownTriggerError: {
    borderColor: "#ef4444",
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
  dropdownEmpty: { padding: 14, color: "#9ca3af", fontSize: 14, textAlign: "center" },
  dropdownSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownSearchInput: {
    flex: 1,
    paddingVertical: 4,
    fontSize: 14,
    color: "#1f2937",
  },
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
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
    marginLeft: 2,
  },
  hint: { fontSize: 14, color: "#9ca3af", paddingVertical: 8 },
  feePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  feeText: { fontSize: 15, fontWeight: "600", color: "#1f2937" },
  slotsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  slot: {
    width: "48%",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  slotActive: { borderColor: TEAL, backgroundColor: "#f0fdf4" },
  slotText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  slotTextActive: { color: TEAL },
  submitButton: {
    backgroundColor: TEAL,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 28,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  pickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  pickerSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  pickerTitle: { fontSize: 16, fontWeight: "700", color: "#1f2937" },
  pickerDone: { fontSize: 16, fontWeight: "700", color: TEAL },
});
