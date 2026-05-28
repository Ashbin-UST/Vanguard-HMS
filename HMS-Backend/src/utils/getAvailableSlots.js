const { generateBookableSlots } = require('../utils/slotGenerator');

exports.getAvailableSlots = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date, duration } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required',
            });
        }

        const slotDuration = parseInt(duration, 10) || 30;

        if (![15, 30].includes(slotDuration)) {
            return res.status(400).json({
                success: false,
                message: 'Duration must be 15 or 30 minutes',
            });
        }

        const doctor = await Employee.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }

        if (!doctor.availabilitySlots || doctor.availabilitySlots.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Doctor has no availability slots configured',
                data: {
                    doctorName: doctor.name,
                    date: new Date(date),
                    availableSlots: [],
                    bookedSlots: [],
                    totalSlots: 0,
                    slotDuration,
                },
            });
        }

        const searchDate = new Date(date);
        const nextDay = new Date(searchDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const bookedAppointments = await Appointment.find({
            doctorEmployeeId: doctorId,
            date: { $gte: searchDate, $lt: nextDay },
            status: { $in: ['BOOKED', 'COMPLETED'] },
        }).select('timeSlot');

        const bookedSlots = bookedAppointments.map((apt) => apt.timeSlot);

        const { available, allGenerated, mergedRanges } = generateBookableSlots(
            doctor.availabilitySlots,
            bookedSlots,
            slotDuration,
        );

        return res.status(200).json({
            success: true,
            message: `${available.length} slot(s) available (${slotDuration}-min intervals)`,
            data: {
                doctorName: doctor.name,
                date: searchDate,
                slotDuration,
                mergedRanges,
                allSlots: allGenerated,
                availableSlots: available,
                bookedSlots,
                totalAvailable: available.length,
            },
        });
    } catch (error) {
        console.log('Get available slots error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};