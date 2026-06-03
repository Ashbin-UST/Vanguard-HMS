// src/app/home.tsx

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { COLORS } from "../constants/theme";
import { getPatientProfile } from "../services/authService";




const HomeScreen = () => {
    const [patientName, setPatientName] = useState("");
    const [patientEmail, setPatientEmail] = useState("");
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const loadPatientProfile = async () => {
            try {
                const data = await getPatientProfile();

                setPatientName(data.patient.name);
                setPatientEmail(data.patient.email);
            } catch (error: any) {
                console.log("Profile fetch error:", error.response?.data || error.message);
            } finally {
                setLoading(false);
            }
        };

        loadPatientProfile();
    }, []);
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerLabel}>Good morning</Text>
                    <Text style={styles.headerTitle}>
                        {loading ? "Loading..." : patientName}
                    </Text>
                    <Text style={styles.headerSub}>How are you feeling today?</Text>
                </View>

                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {patientName
                            ? patientName
                                .split(" ")
                                .map((word) => word[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()
                            : "P"}
                    </Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Quick actions</Text>

                <View style={styles.quickGrid}>
                    <Pressable
                        style={styles.quickCard}
                        onPress={() => router.push("/book-appointment")}
                    >
                        <Text style={styles.quickIcon}>＋</Text>
                        <Text style={styles.quickText}>Book appointment</Text>
                    </Pressable>

                    <Pressable style={styles.quickCard}>
                        <Text style={styles.quickIcon}>📄</Text>
                        <Text style={styles.quickText}>My records</Text>
                    </Pressable>

                    <Pressable style={styles.quickCard}>
                        <Text style={styles.quickIcon}>💊</Text>
                        <Text style={styles.quickText}>Prescriptions</Text>
                    </Pressable>

                    <Pressable style={styles.quickCard}>
                        <Text style={styles.quickIcon}>🩺</Text>
                        <Text style={styles.quickText}>Find doctor</Text>
                    </Pressable>
                </View>

                <Text style={styles.sectionTitle}>Upcoming appointments</Text>

                <View style={styles.appointmentCard}>
                    <View style={styles.apptIconBox}>
                        <Text style={styles.apptIcon}>🧠</Text>
                    </View>

                    <View style={styles.apptInfo}>
                        <Text style={styles.doctorName}>Dr. Priya Menon</Text>
                        <Text style={styles.specialization}>Neurologist</Text>
                        <Text style={styles.timeText}>Mon, 2 Jun · 10:30 AM</Text>
                    </View>

                    <View style={styles.confirmedBadge}>
                        <Text style={styles.confirmedText}>Confirmed</Text>
                    </View>
                </View>

                <View style={styles.appointmentCard}>
                    <View style={styles.apptIconBox}>
                        <Text style={styles.apptIcon}>❤</Text>
                    </View>

                    <View style={styles.apptInfo}>
                        <Text style={styles.doctorName}>Dr. Ravi Kumar</Text>
                        <Text style={styles.specialization}>Cardiologist</Text>
                        <Text style={styles.timeText}>Thu, 5 Jun · 3:00 PM</Text>
                    </View>

                    <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>Pending</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.bottomNav}>
                <Pressable style={styles.navItem}>
                    <Text style={styles.navIconActive}>⌂</Text>
                    <Text style={styles.navTextActive}>Home</Text>
                </Pressable>

                <Pressable
                    style={styles.navItem}
                    onPress={() => router.push("/appointments")}
                >
                    <Text style={styles.navIcon}>📅</Text>
                    <Text style={styles.navText}>Appointments</Text>
                </Pressable>

                <Pressable
                    style={styles.navItem}
                    onPress={() => router.push("/profile")}
                >
                    <Text style={styles.navIcon}>👤</Text>
                    <Text style={styles.navText}>Profile</Text>
                </Pressable>

                <Pressable style={styles.navItem}>
                    <Text style={styles.navIcon}>🔔</Text>
                    <Text style={styles.navText}>Alerts</Text>
                </Pressable>
            </View>
        </View>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    header: {
        backgroundColor: COLORS.g800,
        paddingTop: 52,
        paddingHorizontal: 20,
        paddingBottom: 34,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    headerLabel: {
        fontSize: 11,
        color: COLORS.g200,
        textTransform: "uppercase",
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: COLORS.white,
        marginTop: 4,
    },
    headerSub: {
        fontSize: 13,
        color: COLORS.g200,
        marginTop: 4,
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: COLORS.g400,
        borderWidth: 2,
        borderColor: COLORS.g200,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        color: COLORS.white,
        fontWeight: "700",
    },
    content: {
        flex: 1,
        paddingTop: 18,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.text,
        marginHorizontal: 16,
        marginBottom: 10,
    },
    quickGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    quickCard: {
        width: "48%",
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        padding: 14,
    },
    quickIcon: {
        fontSize: 22,
        marginBottom: 8,
        color: COLORS.g600,
    },
    quickText: {
        fontSize: 13,
        fontWeight: "500",
        color: COLORS.text,
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
    apptIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.g50,
        borderWidth: 1,
        borderColor: COLORS.g100,
        justifyContent: "center",
        alignItems: "center",
    },
    apptIcon: {
        fontSize: 18,
    },
    apptInfo: {
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
    },
    timeText: {
        fontSize: 12,
        color: COLORS.g600,
        marginTop: 2,
        fontWeight: "500",
    },
    confirmedBadge: {
        backgroundColor: "#eaf3de",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    confirmedText: {
        fontSize: 11,
        color: COLORS.g800,
        fontWeight: "700",
    },
    pendingBadge: {
        backgroundColor: "#faeeda",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    pendingText: {
        fontSize: 11,
        color: "#633806",
        fontWeight: "700",
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
    navIconActive: {
        fontSize: 20,
        color: COLORS.g600,
    },
    navIcon: {
        fontSize: 18,
        color: COLORS.muted,
    },
    navTextActive: {
        fontSize: 10,
        color: COLORS.g600,
        fontWeight: "600",
    },
    navText: {
        fontSize: 10,
        color: COLORS.muted,
    },
});