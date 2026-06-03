// src/app/book-appointment.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { router } from "expo-router";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { COLORS } from "../constants/theme";

const BookAppointmentScreen = () => {
  const [department, setDepartment] = useState("");
  const [doctor, setDoctor] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");

  const departments = [
    "Cardiology",
    "Neurology",
    "General Medicine",
    "Dermatology",
    "Orthopedics",
  ];

  const doctors = [
    {
      name: "Dr. Priya Menon",
      specialization: "Neurologist",
      experience: "12 yrs exp",
      initials: "PM",
      department: "Neurology",
    },
    {
      name: "Dr. Ravi Kumar",
      specialization: "Cardiologist",
      experience: "10 yrs exp",
      initials: "RK",
      department: "Cardiology",
    },
    {
      name: "Dr. Anita Rao",
      specialization: "Dermatologist",
      experience: "8 yrs exp",
      initials: "AR",
      department: "Dermatology",
    },
  ];

  const availableSlots = [
    "Mon, 2 Jun · 10:30 AM",
    "Mon, 2 Jun · 11:00 AM",
    "Tue, 3 Jun · 2:00 PM",
    "Tue, 3 Jun · 4:00 PM",
  ];

  const filteredDoctors = department
    ? doctors.filter((item) => item.department === department)
    : doctors;

  const handleBookAppointment = () => {
    if (!department || !doctor || !selectedSlot || !reason) {
      Alert.alert("Validation Error", "Please select all appointment details");
      return;
    }

    Alert.alert(
      "Appointment Booked",
      `Your appointment with ${doctor} is booked for ${selectedSlot}`
    );

    // Later API integration will come here
    // After successful API call:
    // router.push("/appointments");

    router.push("/appointments");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Book Appointment</Text>
        <Text style={styles.headerSub}>
          Choose an available slot and confirm your appointment
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select department</Text>

          <View style={styles.chipContainer}>
            {departments.map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.chip,
                  department === item && styles.activeChip,
                ]}
                onPress={() => {
                  setDepartment(item);
                  setDoctor("");
                  setSelectedSlot("");
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    department === item && styles.activeChipText,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Available doctors</Text>

          {filteredDoctors.map((item) => (
            <Pressable
              key={item.name}
              style={[
                styles.doctorCard,
                doctor === item.name && styles.selectedDoctorCard,
              ]}
              onPress={() => {
                setDoctor(item.name);
                setSelectedSlot("");
              }}
            >
              <View style={styles.doctorAvatar}>
                <Text style={styles.doctorAvatarText}>{item.initials}</Text>
              </View>

              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{item.name}</Text>
                <Text style={styles.doctorSpec}>
                  {item.specialization} · {item.experience}
                </Text>
                <Text style={styles.doctorAvail}>Available slots shown below</Text>
              </View>

              <Text style={styles.selectText}>
                {doctor === item.name ? "Selected" : "Select"}
              </Text>
            </Pressable>
          ))}

          {doctor ? (
            <>
              <Text style={styles.sectionTitle}>Available slots</Text>

              <View style={styles.slotContainer}>
                {availableSlots.map((slot) => (
                  <Pressable
                    key={slot}
                    style={[
                      styles.slotCard,
                      selectedSlot === slot && styles.selectedSlotCard,
                    ]}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        selectedSlot === slot && styles.selectedSlotText,
                      ]}
                    >
                      {slot}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Select a doctor to view available slots
              </Text>
            </View>
          )}

          <CustomInput
            label="Reason for visit"
            placeholder="Describe symptoms briefly..."
            value={reason}
            onChangeText={setReason}
            multiline
          />

          <CustomButton title="Book Appointment" onPress={handleBookAppointment} />
        </View>

        
      </ScrollView>
    </View>
  );
};

export default BookAppointmentScreen;

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
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  activeChip: {
    backgroundColor: COLORS.g600,
    borderColor: COLORS.g600,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.muted,
  },
  activeChipText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  selectedDoctorCard: {
    borderColor: COLORS.g600,
    backgroundColor: COLORS.g50,
  },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.g400,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  doctorAvatarText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 13,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  doctorSpec: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  doctorAvail: {
    fontSize: 11,
    color: COLORS.g600,
    fontWeight: "500",
    marginTop: 2,
  },
  selectText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.g600,
  },
  slotContainer: {
    gap: 8,
    marginBottom: 14,
  },
  slotCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: COLORS.white,
  },
  selectedSlotCard: {
    backgroundColor: COLORS.g50,
    borderColor: COLORS.g600,
  },
  slotText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "500",
  },
  selectedSlotText: {
    color: COLORS.g800,
    fontWeight: "700",
  },
  emptyBox: {
    backgroundColor: COLORS.g50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
  },
  mailBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eaf3de",
    borderWidth: 1,
    borderColor: "#c0dd97",
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  mailIcon: {
    fontSize: 16,
    color: COLORS.g600,
  },
  mailText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.g800,
    fontWeight: "500",
  },
});