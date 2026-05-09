const mongoose = require("mongoose");
const Counter = require("./counterModel"); 
const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    roles: {
      type: [String],
      enum: [
        "OWNER",
        "ADMIN",
        "DOCTOR",
        "RECEPTIONIST",
        "CASHIER",
        "NURSE",
        "LAB_TECH",
        "PHARMACIST",
      ],
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);


userSchema.pre("save", async function () {
  if (!this.userId) {
    const seq = await Counter.getNextSequence("userId");
    this.userId = `USR-${String(seq).padStart(4, "0")}`;
  }
});

//
//
userSchema.pre("save", function () {
  const isOwnerOnly = this.roles.every((role) => role === "OWNER");

  if (!isOwnerOnly && !this.employeeId) {
    throw new Error(
      `employeeId is required for roles: ${this.roles.join(", ")}`
    );
  }
});

module.exports = mongoose.model("User", userSchema);

// User
 
// id
// username/email (unique)
// passwordHash
// status → ACTIVE | Inactive
// roles[] → OWNER | ADMIN | DOCTOR | RECEPTIONIST | CASHIER | NURSE | LAB_TECH | PHARMACIST
// employeeId → reference to Employee (required for all internal roles)
// createdAt, lastLoginAt
 