// src/app/_layout.tsx

import React from "react";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="home" />
      <Stack.Screen name="appointments" />
      <Stack.Screen name="book-appointment" />
      <Stack.Screen name="edit-appointment" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="edit-profile" />
    </Stack>
  );
}