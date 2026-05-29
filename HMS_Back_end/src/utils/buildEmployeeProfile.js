const medicalFields = new Set([
    "DOCTOR",
    "NURSE",
    "LAB_TECH",
    "PHARMACIST"
]);

const specializationFields = new Set([
    "DOCTOR",
    "LAB_TECH"
]);

const buildEmployeeProfile = (employee) => {

    const profile = {
        employeeCode: employee.employeeCode,
        name: employee.name,
        phone: employee.phone,
        email: employee.email,
        department: employee.department,
        designation: employee.designation,
        joiningDate: employee.joiningDate,
        qualification: employee.qualification,
    };

    // Add medical registration number for medical staff
    if (medicalFields.has(employee.designation)) {
        profile.medicalRegistrationNumber = employee.medicalRegistrationNumber;
    }

    // Add specialization for doctors and lab technicians
    if (specializationFields.has(employee.designation)) {
        profile.specialization = employee.specialization;
    }

    // Add doctor-only fields
    if (employee.designation === "DOCTOR") {
        profile.consultationFee = employee.consultationFee;
        profile.availabilitySlots = employee.availabilitySlots;
    }

    return profile;
};

module.exports = buildEmployeeProfile;