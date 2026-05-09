const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    unique: true,
    trim: true,
  },
  patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient Id is required'],
  },
  doctorEmployeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Doctor ID is required'],
  },
  date: {
    type: Date,
    required: [true, 'Appointment date is required'],
  },
  timeSlot: {
    type: String,
    required: [true, 'Time slot is required'],
    trim: true,
    match: [
      /^\d{2}:\d{2}-\d{2}:\d{2}$/,
      'Time slot must be in HH:MM-HH:MM format (e.g. 09:00-09:30)',
    ],
  },
  status: {
    type: String,
    enum: {
      values: ['BOOKED', 'CANCELLED', 'COMPLETED'],
      message: 'Status must be BOOKED, CANCELLED, or COMPLETED',
    },
    default: 'BOOKED',
  },
  createdByEmployeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Created by Employee ID is required'],
  },

});

appointmentSchema.pre('save', async function (next) {
  try {
    if (!this.appointmentId) {
      const seq = await Counter.getNextSequence('appointmentId');

      // Format: APT-0001, APT-0002 ... APT-9999
      this.appointmentId = `APT-${String(seq).padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});


module.exports = mongoose.model('Appointment', appointmentSchema);

// Appointment
 
// id
// patientId → Patient
// doctorEmployeeId → Employee (designation Doctor)
// date
// timeSlot
// status → BOOKED | CANCELLED | COMPLETED
// createdByEmployeeId → Employee (Receptionist / Admin)