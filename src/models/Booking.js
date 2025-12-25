const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true
    },
    time: {
        type: String, // Format: HH:mm
        required: true
    },
    duration: {
        type: Number, // Duration in minutes
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure a slot is unique per day
// Actually, we want to allow different users to check status, but ONE booking per slot.
// So (date, time) must be unique.
bookingSchema.index({ date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
