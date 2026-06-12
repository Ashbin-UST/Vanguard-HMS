// Hospital timezone is Asia/Kolkata, a fixed +5:30 offset (no DST)
const TZ_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

// Epoch ms of "HH:mm" on the appointment's calendar day, interpreted in hospital time.
// Computed explicitly so it stays correct regardless of the host server's timezone.
const slotInstantMs = (appointmentDate, hhmm) => {
  const [hour, minute] = (hhmm || "").split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return Number.NaN;
  }
  const d = new Date(appointmentDate);
  return (
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour, minute) -
    TZ_OFFSET_MS
  );
};

module.exports = slotInstantMs;
