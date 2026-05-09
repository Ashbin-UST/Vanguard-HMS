// models/counterModel.js

const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,   // name of the counter e.g: "employeeCode", "uhid"
    required: true,
  },
  seq: {
    type: Number,
    default: 0,     // starts from 0, first record will be 1
  },
});

// Static method to get next sequence number
counterSchema.statics.getNextSequence = async function (name) {
  const counter = await this.findByIdAndUpdate(
    name,                        // find counter by name
    { $inc: { seq: 1 } },        // increment seq by 1
    { new: true, upsert: true }  // create if not exists, return updated doc
  );
  return counter.seq;
};

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;