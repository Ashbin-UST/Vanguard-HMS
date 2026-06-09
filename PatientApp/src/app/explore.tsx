import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  cancelAppointment,
  getMyAppointments,
} from "@/services/appointmentService";
import type { Appointment, AppointmentStatus } from "@/services/types";

const TEAL = "#2e9466";
const STATUS_COLORS: Record<AppointmentStatus, string> = {
  BOOKED: "#2e9466",
  COMPLETED: "#6b7280",
  CANCELED: "#ef4444",
};

type Filter = "All" | AppointmentStatus;
const FILTERS: Filter[] = ["All", "BOOKED", "COMPLETED", "CANCELED"];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatApptDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const [all, setAll] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  // Cancellation modal state
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getMyAppointments();
      setAll(data.appointments);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const counts = useMemo(
    () => ({
      All: all.length,
      BOOKED: all.filter((a) => a.status === "BOOKED").length,
      COMPLETED: all.filter((a) => a.status === "COMPLETED").length,
      CANCELED: all.filter((a) => a.status === "CANCELED").length,
    }),
    [all],
  );

  const filtered =
    activeFilter === "All" ? all : all.filter((a) => a.status === activeFilter);

  const openCancel = (appt: Appointment) => {
    setCancelTarget(appt);
    setReason("");
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    if (!reason.trim()) {
      Alert.alert("Reason required", "Please enter a reason for cancelling.");
      return;
    }
    setCancelling(true);
    try {
      await cancelAppointment(cancelTarget.appointmentId, reason.trim());
      setCancelTarget(null);
      await load();
    } catch (err: any) {
      Alert.alert("Cancel Failed", err.message || "Something went wrong");
    } finally {
      setCancelling(false);
    }
  };

  const reschedule = (appt: Appointment) => {
    router.push({
      pathname: "/edit-appointment",
      params: {
        appointmentId: appt.appointmentId,
        doctorEmployeeId: appt.doctorEmployeeId,
        appointmentDate: appt.appointmentDate,
        timeSlot: appt.timeSlot,
      },
    });
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, { paddingBottom: BottomTabInset + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <SafeAreaView edges={["top"]}>
        <Text style={styles.screenTitle}>My Appointments</Text>

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === f && styles.filterPillTextActive,
                ]}
              >
                {f} ({counts[f]})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={TEAL} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No appointments found</Text>
          </View>
        ) : (
          filtered.map((appt) => (
            <View key={appt.appointmentId} style={styles.apptCard}>
              <View style={styles.apptRow}>
                <View style={styles.apptAvatarBox}>
                  <Text style={styles.apptAvatarText}>
                    {getInitials(appt.doctor?.name || "Dr")}
                  </Text>
                </View>
                <View style={styles.apptInfo}>
                  <Text style={styles.apptDoctor}>
                    Dr. {appt.doctor?.name || appt.doctorEmployeeId}
                  </Text>
                  {appt.doctor?.specialization ? (
                    <Text style={styles.apptSpecialty}>{appt.doctor.specialization}</Text>
                  ) : null}
                  <Text style={styles.apptDatetime}>
                    {formatApptDate(appt.appointmentDate)} · {appt.timeSlot}
                  </Text>
                </View>
                <Text style={[styles.statusBadge, { color: STATUS_COLORS[appt.status] }]}>
                  {appt.status}
                </Text>
              </View>

              {appt.status === "BOOKED" && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    activeOpacity={0.8}
                    onPress={() => openCancel(appt)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rescheduleButton}
                    activeOpacity={0.8}
                    onPress={() => reschedule(appt)}
                  >
                    <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                  </TouchableOpacity>
                </View>
              )}

              {appt.status === "CANCELED" && appt.cancellationReason ? (
                <Text style={styles.cancelReason}>
                  Reason: {appt.cancellationReason}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </SafeAreaView>

      {/* Cancellation reason modal */}
      <Modal
        visible={cancelTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cancel appointment</Text>
            <Text style={styles.modalSub}>
              Tell us why you're cancelling this appointment.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={reason}
              onChangeText={setReason}
              placeholder="Reason for cancellation"
              placeholderTextColor="#9ca3af"
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondary}
                onPress={() => setCancelTarget(null)}
                disabled={cancelling}
              >
                <Text style={styles.modalSecondaryText}>Keep it</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimary, cancelling && { opacity: 0.6 }]}
                onPress={confirmCancel}
                disabled={cancelling}
              >
                <Text style={styles.modalPrimaryText}>
                  {cancelling ? "Cancelling…" : "Cancel appointment"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: "#fff" },
  container: { paddingHorizontal: 20, backgroundColor: "#fff" },
  screenTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1f2937",
    paddingTop: 20,
    marginBottom: 20,
  },

  filtersRow: { gap: 10, paddingRight: 4, marginBottom: 20 },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  filterPillActive: { borderColor: TEAL, backgroundColor: "#f0fdf4" },
  filterPillText: { fontSize: 13, fontWeight: "500", color: "#6b7280" },
  filterPillTextActive: { color: TEAL, fontWeight: "700" },

  apptCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    marginBottom: 12,
  },
  apptRow: { flexDirection: "row", alignItems: "center" },
  apptAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0faf4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  apptAvatarText: { fontSize: 13, fontWeight: "700", color: TEAL },
  apptInfo: { flex: 1 },
  apptDoctor: { fontSize: 15, fontWeight: "700", color: "#1f2937" },
  apptSpecialty: { fontSize: 13, color: "#6b7280", marginBottom: 2 },
  apptDatetime: { fontSize: 13, color: TEAL, fontWeight: "500" },
  statusBadge: { fontSize: 12, fontWeight: "700" },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fca5a5",
    alignItems: "center",
  },
  cancelButtonText: { fontSize: 14, fontWeight: "600", color: "#ef4444" },
  rescheduleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    alignItems: "center",
  },
  rescheduleButtonText: { fontSize: 14, fontWeight: "600", color: TEAL },
  cancelReason: { marginTop: 10, fontSize: 13, color: "#6b7280", fontStyle: "italic" },

  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: "#9ca3af" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  modalCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1f2937", marginBottom: 6 },
  modalSub: { fontSize: 14, color: "#6b7280", marginBottom: 14 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1f2937",
    minHeight: 70,
    textAlignVertical: "top",
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  modalSecondaryText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  modalPrimary: {
    flex: 1.4,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#ef4444",
    alignItems: "center",
  },
  modalPrimaryText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
