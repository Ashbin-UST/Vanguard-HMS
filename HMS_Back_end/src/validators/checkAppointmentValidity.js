const Appointment = require("../models/Appointments");
const Patient = require("../models/Patients");
const validateEmployeeStatus = require("./validateEmployeeStatus");
const AppError = require("../utils/AppError");
const STATUS = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");

// Returns the filter with an appointmentId exclusion added when editing
const withExclusion = (filter, excludeAppointmentId) => {
  if (!excludeAppointmentId) return filter;
  return { ...filter, appointmentId: { $ne: excludeAppointmentId } };
};

// Validates all booking rules; throws on the first violation, returns patient and doctor
const checkAppointmentValidity = async ({
  patientId,
  doctorId,
  appointmentDate,
  timeSlot,
  excludeAppointmentId,
}) => {

  // Verify the patient exists
  const patient = await Patient.findOne({
    UHID: patientId,
  });

  if (!patient) {
    throw new AppError(STATUS.NOT_FOUND, MESSAGES.PATIENT.DOESNT_EXIST);
  }

  // Throws when the doctor is missing, not a DOCTOR, or inactive
  const doctor = await validateEmployeeStatus(doctorId, "DOCTOR");

  // Reject past dates
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const apptDay = new Date(appointmentDate);
  apptDay.setHours(0, 0, 0, 0);

  if (apptDay.getTime() < todayStart.getTime()) {
    throw new AppError(STATUS.CONFLICT, MESSAGES.APPOINTMENT.PAST_DATE);
  }

  // Reject dates more than 6 months ahead of today
  const maxBookingDay = new Date(todayStart);
  maxBookingDay.setMonth(maxBookingDay.getMonth() + 6);

  if (apptDay.getTime() > maxBookingDay.getTime()) {
    throw new AppError(STATUS.CONFLICT, MESSAGES.APPOINTMENT.TOO_FAR_AHEAD);
  }

  // For today's date, reject slots whose start time has already passed
  if (apptDay.getTime() === todayStart.getTime()) {
    const [slotStartHH, slotStartMM] = timeSlot
      .split("-")[0]
      .split(":")
      .map(Number);
    const slotStartMinutes = slotStartHH * 60 + slotStartMM;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (slotStartMinutes <= nowMinutes) {
      throw new AppError(STATUS.CONFLICT, MESSAGES.APPOINTMENT.PAST_TIME);
    }
  }

  // Reject dates before the doctor's joining date
  if (doctor.joiningDate) {
    const apptDay = new Date(appointmentDate);
    apptDay.setHours(0, 0, 0, 0);

    const joinDay = new Date(doctor.joiningDate);
    joinDay.setHours(0, 0, 0, 0);

    if (apptDay.getTime() < joinDay.getTime()) {
      const joinedOn = joinDay.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      throw new AppError(
        STATUS.CONFLICT,
        MESSAGES.APPOINTMENT.DOCTOR_NOT_JOINED(joinedOn)
      );
    }
  }

  // Derive the day-of-week from the appointment date and match it against the doctor's schedule
  const appointmentDay = new Date(appointmentDate)
    .toLocaleDateString("en-US", {
      weekday: "long",
    })
    .toUpperCase();

  const dayWindows = (doctor.availabilitySlots || []).filter(
    (slot) => slot.day === appointmentDay,
  );

  if (dayWindows.length === 0) {
    throw new AppError(STATUS.CONFLICT, MESSAGES.APPOINTMENT.DOCTOR_UNAVAILABLE_DAY);
  }

  const [appointmentStartTime, appointmentEndTime] = timeSlot.split("-");

  // Check that the requested time slot falls within any of the doctor's availability windows
  const isValidTimeSlot = dayWindows.some(
    (w) =>
      appointmentStartTime >= w.startTime &&
      appointmentEndTime <= w.endTime,
  );

  if (!isValidTimeSlot) {
    throw new AppError(STATUS.CONFLICT, MESSAGES.APPOINTMENT.DOCTOR_UNAVAILABLE_SLOT);
  }

  // Ensure the patient does not already have a non-cancelled appointment at this slot
  const patientAppointment = await Appointment.findOne(
    withExclusion(
      { patientId, appointmentDate, timeSlot, status: { $ne: "CANCELED" } },
      excludeAppointmentId,
    ),
  );

  if (patientAppointment) {
    throw new AppError(STATUS.CONFLICT, MESSAGES.APPOINTMENT.PATIENT_SLOT_CONFLICT);
  }

  // Ensure the doctor does not already have a non-cancelled appointment at this slot
  const doctorAppointment = await Appointment.findOne(
    withExclusion(
      { doctorEmployeeId: doctorId, appointmentDate, timeSlot, status: { $ne: "CANCELED" } },
      excludeAppointmentId,
    ),
  );

  if (doctorAppointment) {
    throw new AppError(STATUS.CONFLICT, MESSAGES.APPOINTMENT.DOCTOR_SLOT_CONFLICT);
  }

  return {
    patient,
    doctor,
  };
};

module.exports = checkAppointmentValidity;
