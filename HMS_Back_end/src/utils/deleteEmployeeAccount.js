const User = require("../models/Users");
const Employee = require("../models/Employees");

// Deletes both the Employee record and the linked User account for a code.
async function deleteEmployeeAccount(employeeCode) {
  await Promise.all([
    Employee.deleteOne({ employeeCode }),
    User.deleteOne({ employeeCode }),
  ]);
}

module.exports = deleteEmployeeAccount;