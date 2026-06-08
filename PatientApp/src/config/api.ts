/**
 * Base URL for the HMS backend (the "sprint 3 back end" Express server).
 *
 * Set EXPO_PUBLIC_API_URL in PatientApp/.env to your machine's LAN IP so a
 * physical phone running Expo Go can reach the dev server, e.g.
 *   EXPO_PUBLIC_API_URL=http://192.168.1.5:5000/api
 *
 * Expo automatically inlines any env var prefixed with EXPO_PUBLIC_ at build time.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000/api";
