// src/app/appointments.tsx

import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { COLORS } from "../constants/theme";

const appointments = [
  {
    id: 1,
    doctor: "Dr. Priya Menon",
    specialization: "Neurologist",
    dateTime: "Mon, 2 Jun · 10:30 AM",
    status: "Confirmed",
    icon: "🧠",
  },
  {
    id: 2,
    doctor: "Dr. Ravi Kumar",
    specialization: "Cardiologist",
    dateTime: "Thu, 5 Jun · 3:00 PM",
    status: "Confirmed",
    icon: "❤",
  },
  {
    id: 3,
    doctor: "Dr. Anita Rao",
    specialization: "Dermatologist",
    dateTime: "Sat, 7 Jun · 9:00 AM",
    status: "Completed",
    icon: "🩺",
  },
];

const AppointmentsScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <Text style={styles.headerTitle}>My Appointments</Text>
        <Text style={styles.headerSub}>
          View your booked and completed appointments
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topAction}>
          <Pressable
            style={styles.bookButton}
            onPress={() => router.push("/book-appointment")}
          >
            <Text style={styles.bookButtonText}>+ Book New Appointment</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Upcoming appointments</Text>

        {appointments.map((appointment) => (
          <View key={appointment.id} style={styles.appointmentCard}>
            <View style={styles.iconBox}>
              <Text style={styles.iconText}>{appointment.icon}</Text>
            </View>

            <View style={styles.info}>
              <Text style={styles.doctorName}>{appointment.doctor}</Text>
              <Text style={styles.specialization}>
                {appointment.specialization}
              </Text>
              <Text style={styles.dateTime}>{appointment.dateTime}</Text>
            </View>

            <View
              style={[
                styles.badge,
                appointment.status === "Completed"
                  ? styles.completedBadge
                  : styles.confirmedBadge,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  appointment.status === "Completed"
                    ? styles.completedText
                    : styles.confirmedText,
                ]}
              >
                {appointment.status}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={() => router.push("/home")}>
          <Text style={styles.navIcon}>⌂</Text>
          <Text style={styles.navText}>Home</Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <Text style={styles.navIconActive}>📅</Text>
          <Text style={styles.navTextActive}>Appointments</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => router.push("/profile")}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navText}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default AppointmentsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    backgroundColor: COLORS.g800,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backText: {
    color: COLORS.g200,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.white,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.g200,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  topAction: {
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  bookButton: {
    backgroundColor: COLORS.g600,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  bookButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  appointmentCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.g50,
    borderWidth: 1,
    borderColor: COLORS.g100,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 18,
  },
  info: {
    flex: 1,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  specialization: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  dateTime: {
    fontSize: 12,
    color: COLORS.g600,
    fontWeight: "500",
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  confirmedBadge: {
    backgroundColor: "#eaf3de",
  },
  completedBadge: {
    backgroundColor: COLORS.g50,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  confirmedText: {
    color: COLORS.g800,
  },
  completedText: {
    color: COLORS.muted,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: 12,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
  },
  navIcon: {
    fontSize: 18,
    color: COLORS.muted,
  },
  navIconActive: {
    fontSize: 18,
    color: COLORS.g600,
  },
  navText: {
    fontSize: 10,
    color: COLORS.muted,
  },
  navTextActive: {
    fontSize: 10,
    color: COLORS.g600,
    fontWeight: "700",
  },
});