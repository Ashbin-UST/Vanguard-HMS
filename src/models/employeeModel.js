const mongoose = require('mongoose');
const Counter = require('./counterModel'); // import counter model

const employeeSchema = new mongoose.Schema({
  employeeCode: {
    type: String,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
    required: [true, 'Employee name is required'], 
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  department: {
    type: String,
    enum: {
        values: ['OPD', 'IPD', 'Lab', 'Pharmacy', 'Admin'],
        message: 'Department must be OPD, IPD, Lab, Pharmacy, or Admin',
      },
    required: [true, 'Department is required'],
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: {
        values: ['ACTIVE', 'INACTIVE'],
        message: 'Status must be ACTIVE or INACTIVE',
      },
    default: 'ACTIVE',
  },
  joiningDate: {
    type: Date,
    default: Date.now,
    required: true,
  },
  medicalRegistrationNo: {
    type: String,
    required: [true, 'Medical Registration Number is required'],
    unique: true,
    trim: true,
  },
  specialization: {
    type: String,
    trim: true,
  },
  qualification: [
    {
    type: String,
    trim: true,
    },
  ],
  consultationFee: {
    type: Number,
    min: [0, 'Consultation fee cannot be negative'],
  },
  availabilitySlots: [{
    type: String,
    match: [
          /^\d{2}:\d{2}-\d{2}:\d{2}$/,
          'Slot must be in HH:MM-HH:MM format (e.g. 09:00-12:00)',
        ],
    trim: true,
  }],

},
  {timestamps: true},
);

employeeSchema.pre('save', async function () {
  try {
    if (!this.employeeCode) {
      const seq = await Counter.getNextSequence('employeeCode');

      this.employeeCode = `EMP-${String(seq).padStart(4, '0')}`;
    }
  } catch (error) {
    throw error;
  }
});

module.exports = mongoose.model('Employee', employeeSchema);

// Employee
 
// id
// employeeCode (unique)
// name
// phone, email
// department (OPD/IPD/Lab/Pharmacy/Admin)
// designation (Doctor/Nurse/Receptionist/etc.)
// status → ACTIVE | INACTIVE
// joiningDate
// medicalRegistrationNo (unique)
// specialization
// qualification[]
// consultationFee
// availabilitySlots[]