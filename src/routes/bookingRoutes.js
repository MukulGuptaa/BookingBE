const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// @desc    Get slots status for a specific date
// @route   GET /api/bookings/slots?date=YYYY-MM-DD&userId=ID
// @access  Public
router.get('/slots', async (req, res) => {
    const { date, userId } = req.query;

    if (!date) {
        return res.status(400).json({ message: 'Date query parameter is required' });
    }

    try {
        // 1. Define business hours (9 AM to 5 PM)
        const startHour = 9;
        const endHour = 17;
        const timeSlots = [];

        for (let i = startHour; i < endHour; i++) {
            const hour = i.toString().padStart(2, '0');
            timeSlots.push(`${hour}:00`);
        }

        // 2. Fetch all bookings for this date
        const bookings = await Booking.find({ date });

        // 3. Map slots to status
        const slotsWithStatus = timeSlots.map(time => {
            const booking = bookings.find(b => b.time === time);
            let status = 'AVAILABLE';
            let bookingId = null;

            if (booking) {
                // If userId is provided, we can distinguish 'BOOKED_BY_ME'
                if (userId && booking.user.toString() === userId) {
                    status = 'BOOKED_BY_ME';
                    bookingId = booking._id;
                } else {
                    status = 'BOOKED_BY_OTHERS';
                }
            }

            return {
                time,
                status,
                bookingId
            };
        });

        res.json(slotsWithStatus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Book a time slot
// @route   POST /api/bookings
// @access  Public
router.post('/', async (req, res) => {
    const { date, time, userId, duration } = req.body;

    if (!date || !time || !userId || !duration) {
        return res.status(400).json({ message: 'Date, time, userId, and duration are required' });
    }

    try {
        // Check if slot is already booked
        const existingBooking = await Booking.findOne({ date, time });

        if (existingBooking) {
            return res.status(400).json({ message: 'Slot already booked' });
        }

        const booking = await Booking.create({
            user: userId,
            date,
            time,
            duration
        });

        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Cancel a booking
// @route   DELETE /api/bookings/:id
// @access  Public
router.delete('/:id', async (req, res) => {
    const { userId } = req.body; // Need userId to verify ownership

    if (!userId) {
        return res.status(400).json({ message: 'userId is required (in body) to cancel' });
    }

    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check ownership
        if (booking.user.toString() !== userId) {
            return res.status(401).json({ message: 'Not authorized to cancel this booking' });
        }

        await booking.deleteOne();

        res.json({ message: 'Booking removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
