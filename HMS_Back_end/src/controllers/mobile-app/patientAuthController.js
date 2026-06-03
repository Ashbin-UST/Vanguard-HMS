const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Patient = require("../../models/Patients");
const PatientUser = require("../../models/PatientUser");

const generatePatientToken = (patientUser) => {
    return jwt.sign(
        {
            patientUHID: patientUser.patientUHID,
            email: patientUser.email,
            role: "PATIENT"
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );
};

const registerPatient = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            password,
            gender,
            dob,
            address,
            emergencyContact
        } = req.body;

        const existingPatientUser = await PatientUser.findOne({
            email
        });

        if (existingPatientUser) {
            return res.status(409).json({
                message: "Patient account already exists with this email"
            });
        }

        const existingPatient = await Patient.findOne({
            email
        });

        if (existingPatient) {
            return res.status(409).json({
                message: "Patient already exists with this email"
            });
        }

        const patient = await Patient.create({
            name,
            phone,
            email,
            gender,
            dob,
            address,
            emergencyContact
        });

        const passwordHash = await bcrypt.hash(password, 10);

        const patientUser = await PatientUser.create({
            email,
            passwordHash,
            patientUHID: patient.UHID,
            status: "ACTIVE"
        });


        return res.status(201).json({
            message: "Patient registered successfully",
        
            patient: {
                UHID: patient.UHID,
                name: patient.name,
                phone: patient.phone,
                email: patient.email,
                gender: patient.gender,
                dob: patient.dob,
                status: patient.status
            }
        });
    } catch (error) {
        console.error("Patient registration error:", error);

        return res.status(500).json({
            message: "Error registering patient"
        });
    }
};

const loginPatient = async (req, res) => {
    try {
        const { email, password } = req.body;

        const patientUser = await PatientUser.findOne({
            email
        });

        if (!patientUser) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (patientUser.status !== "ACTIVE") {
            return res.status(403).json({
                message: "Patient account is inactive"
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            patientUser.passwordHash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        patientUser.lastLoginAt = new Date();
        await patientUser.save();

        const patient = await Patient.findOne({
            UHID: patientUser.patientUHID
        });

        if (!patient) {
            return res.status(404).json({
                message: "Patient profile not found"
            });
        }

        const token = generatePatientToken(patientUser);

        return res.status(200).json({
            message: "Patient logged in successfully",
            token,
            patient: {
                UHID: patient.UHID,
                name: patient.name,
                phone: patient.phone,
                email: patient.email,
                gender: patient.gender,
                dob: patient.dob,
                status: patient.status
            }
        });
    } catch (error) {
        console.error("Patient login error:", error);

        return res.status(500).json({
            message: "Error logging in patient"
        });
    }
}; 

const getPatientProfile = async (req, res) => {
    try {
        const patient = await Patient.findOne({
            UHID: req.patient.patientUHID
        });

        if (!patient) {
            return res.status(404).json({
                message: "Patient profile not found"
            });
        }

        return res.status(200).json({
            message: "Patient profile fetched successfully",
            patient: {
                UHID: patient.UHID,
                name: patient.name,
                phone: patient.phone,
                email: patient.email,
                gender: patient.gender,
                dob: patient.dob,
                address: patient.address,
                emergencyContact: patient.emergencyContact,
                status: patient.status
            }
        });
    } catch (error) {
        console.error("Get patient profile error:", error);

        return res.status(500).json({
            message: "Error fetching patient profile"
        });
    }
};

module.exports = {
    registerPatient,
    loginPatient,
    getPatientProfile
};