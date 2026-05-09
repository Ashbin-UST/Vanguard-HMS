const mongoose = require('mongoose');
const Counter = require('./counterModel'); // import counter model

const patientSchema = new mongoose.Schema({
  UHID: {
    type: String,
    trim: true,
    unique: true,
  },
  name: {
    type: String,
    trim: true,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  dob: {
    type: Date ,
    required: true,
  },
  address: {
    line1:    { type: String },
    city:     { type: String },
    postcode: { type: String }
  },
  emergencyContact: {
    type: String,
    optional: true,
    unique: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'], 
    default: 'ACTIVE',
  },

},
  {timestamps: true},
);

patientSchema.pre('save', async function (next) {
  try {
    // Only generate if uhid is NOT already set
    if (!this.uhid) {
      const seq = await Counter.getNextSequence('uhid');

      // Format: UHID-0001, UHID-0002, UHID-0023, UHID-0100 ...
      this.uhid = `UHID-${String(seq).padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Patient', patientSchema);

// id
// UHID (unique hospital id)
// name
// phone, 
// email
// gender, 
// dob
// address
// emergencyContact (optional)
// status → ACTIVE | INACTIVE