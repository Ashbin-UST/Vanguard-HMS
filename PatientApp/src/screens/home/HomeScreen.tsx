import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomTabInset } from "@/constants/theme";
import { getMyAppointments } from "@/services/appointmentService";
import { getMyProfile } from "@/services/patientService";
import type { Appointment } from "@/services/types";

const TEAL = "#2e9466";

const QUICK_ACTIONS = [
  { label: "My appointments", icon: "list-outline" as const, href: "/explore" },
  { label: "My profile", icon: "person-outline" as const, href: "/profile" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

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

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState("Patient");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [profile, appts] = await Promise.all([
        getMyProfile(),
        getMyAppointments("BOOKED"),
      ]);
      setUserName(profile.patient?.name || "Patient");
      const now = Date.now();
      const upcoming = appts.appointments
        .filter((a) => new Date(a.appointmentDate).getTime() >= now - 86400000)
        .sort(
          (a, b) =>
            new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime() ||
            a.timeSlot.localeCompare(b.timeSlot),
        );
      setAppointments(upcoming);
    } catch {
      // Profile/appointments screens surface errors in detail
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, { paddingBottom: BottomTabInset + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <SafeAreaView edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.patientName}>{userName}</Text>
            <Text style={styles.headerSub}>How are you feeling today?</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(userName)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              activeOpacity={0.75}
              onPress={() => router.push(action.href as any)}
            >
              <Ionicons name={action.icon} size={28} color={TEAL} />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Upcoming appointments</Text>
        {loading ? (
          <ActivityIndicator color={TEAL} style={{ marginTop: 16 }} />
        ) : appointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={36} color="#d1d5db" />
            <Text style={styles.emptyText}>No upcoming appointments</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push("/book-appointment")}
            >
              <Text style={styles.emptyButtonText}>Book one now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          appointments.map((appt) => (
            <View key={appt.appointmentId} style={styles.apptCard}>
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
              <Text style={styles.statusBadge}>{appt.status}</Text>
            </View>
          ))
        )}
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: "#fff" },
  container: { paddingHorizontal: 20, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 16,
    marginBottom: 28,
  },
  headerLeft: { flex: 1 },
  greeting: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  patientName: { fontSize: 28, fontWeight: "700", color: "#1f2937", marginBottom: 4 },
  headerSub: { fontSize: 14, color: "#6b7280" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  avatarText: { fontSize: 16, fontWeight: "700", color: TEAL },

  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1f2937", marginBottom: 14 },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
  actionCard: {
    width: "47%",
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 10,
  },
  actionLabel: { fontSize: 14, fontWeight: "500", color: "#374151" },

  apptCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    marginBottom: 10,
  },
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
  statusBadge: { fontSize: 12, fontWeight: "700", color: TEAL },

  emptyCard: {
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: { fontSize: 15, color: "#9ca3af" },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  emptyButtonText: { color: TEAL, fontWeight: "700", fontSize: 14 },
});
