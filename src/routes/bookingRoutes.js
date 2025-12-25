const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const PaymentService = require('../services/payment/PaymentService');
const crypto = require('crypto');

// @desc    Get slots status for a specific date
// @route   GET /api/bookings/slots?date=YYYY-MM-DD&userId=ID
// @access  Public
router.get('/slots', async (req, res) => {
    const { date, userId } = req.query;

    if (!date) {
        return res.status(400).json({ message: 'Date query parameter is required' });
    }

    try {
        const startHour = 9;
        const endHour = 17;
        const timeSlots = [];

        for (let i = startHour; i < endHour; i++) {
            const hour = i.toString().padStart(2, '0');
            timeSlots.push(`${hour}:00`);
        }

        const bookings = await Booking.find({
            date,
            status: { $in: ['CONFIRMED', 'PENDING'] } // Check PENDING too to avoid double booking during payment
        });

        const slotsWithStatus = timeSlots.map(time => {
            const booking = bookings.find(b => b.time === time);
            let status = 'AVAILABLE';
            let bookingId = null;

            if (booking) {
                if (userId && booking.user.toString() === userId) {
                    status = 'BOOKED_BY_ME';
                    if (booking.status === 'PENDING') status = 'PAYMENT_PENDING';
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

// @desc    Book a time slot and initiate payment
// @route   POST /api/bookings
// @access  Public
router.post('/', async (req, res) => {
    console.log('Request Body:', req.body);
    const { date, time, userId, duration, amount = 100 } = req.body; // Default amount 100 INR if not sent

    if (!date || !time || !userId || !duration) {
        return res.status(400).json({ message: 'Date, time, userId, and duration are required' });
    }

    try {
        // Check if slot is already booked (CONFIRMED or PENDING)
        const existingBooking = await Booking.findOne({
            date,
            time,
            status: { $in: ['CONFIRMED', 'PENDING'] }
        });

        console.log('Existing Booking:', existingBooking);

        if (existingBooking) {
            return res.status(400).json({ message: 'Slot already booked or reserved' });
        }

        // Generate a unique Order ID
        const orderId = `ORDER_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        const booking = await Booking.create({
            user: userId,
            date,
            time,
            duration,
            amount,
            status: 'PENDING',
            transactionId: orderId
        });

        // Initiate Payment
        const paymentResponse = await PaymentService.initiatePayment({
            amount,
            orderId,
            userId,
            mobileNumber: "9999999999" // In real app, fetch from User model
        });

        res.status(201).json({
            booking,
            paymentUrl: paymentResponse.redirectUrl
        });

    } catch (error) {
        // Rollback booking if payment init fails
        // await Booking.deleteOne({ _id: booking._id }); // Ideally
        res.status(500).json({ message: error.message });
    }
});

// @desc    Cancel a booking
// @route   DELETE /api/bookings/:id
// @access  Public
router.delete('/:id', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'userId is required (in body) to cancel' });
    }

    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.user.toString() !== userId) {
            return res.status(401).json({ message: 'Not authorized to cancel this booking' });
        }

        // If CONFIRMED, maybe refund? For now just delete/cancel.
        await booking.deleteOne();

        res.json({ message: 'Booking removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
