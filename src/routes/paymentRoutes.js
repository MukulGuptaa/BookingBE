const express = require('express');
const router = express.Router();
const PaymentService = require('../services/payment/PaymentService');
const Booking = require('../models/Booking');

// @desc    Handle Payment Callback from PhonePe
// @route   POST /api/payments/callback
router.post('/callback', async (req, res) => {
    try {
        console.log('Payment Callback Received:', JSON.stringify(req.body));

        // PhonePe sends Base64 encoded JSON in 'response' field usually
        // But for server-to-server callback, it might differ. 
        // Let's assume standard response structure for now.
        // Actually, typically they send { response: "base64..." }

        let decodedResponse = {};
        if (req.body.response) {
            const bufferObj = Buffer.from(req.body.response, "base64");
            decodedResponse = JSON.parse(bufferObj.toString("utf8"));
        } else {
            decodedResponse = req.body;
        }

        if (decodedResponse.code === 'PAYMENT_SUCCESS' && decodedResponse.data) {
            const { merchantTransactionId } = decodedResponse.data;

            // Update Booking
            const booking = await Booking.findOne({ transactionId: merchantTransactionId });
            if (booking) {
                booking.status = 'CONFIRMED';
                await booking.save();
                console.log(`Booking ${booking._id} CONFIRMED`);
            }

            // Success HTML
            res.send(`
                <html>
                    <head>
                        <title>Payment Successful</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <style>
                            body { font-family: sans-serif; text-align: center; padding: 20px; }
                            .success { color: #28a745; font-size: 24px; font-weight: bold; }
                            p { color: #555; }
                        </style>
                    </head>
                    <body>
                        <div class="success">✅ Payment Successful</div>
                        <p>Your booking has been confirmed.</p>
                        <p>You can verify this in the app.</p>
                        <button onclick="window.close()">Close Window</button>
                    </body>
                </html>
            `);

        } else {
            console.log('Payment Failed or Pending in Callback');
            // Failure HTML
            res.send(`
                <html>
                    <head>
                        <title>Payment Failed</title>
                         <meta name="viewport" content="width=device-width, initial-scale=1">
                         <style>
                            body { font-family: sans-serif; text-align: center; padding: 20px; }
                            .error { color: #dc3545; font-size: 24px; font-weight: bold; }
                            p { color: #555; }
                        </style>
                    </head>
                    <body>
                        <div class="error">❌ Payment Failed</div>
                        <p>We could not verify your payment.</p>
                        <p>Please try again or contact support.</p>
                        <button onclick="window.close()">Close Window</button>
                    </body>
                </html>
            `);
        }
    } catch (error) {
        console.error('Callback Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// @desc    Manually check payment status
// @route   GET /api/payments/check-status/:bookingId
router.get('/check-status/:bookingId', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (!booking.transactionId) return res.status(400).json({ message: 'No transaction ID associated' });

        const result = await PaymentService.verifyPayment(booking.transactionId);

        if (result.status === 'SUCCESS') {
            booking.status = 'CONFIRMED';
            await booking.save();
        } else if (result.status === 'FAILED') {
            booking.status = 'CANCELLED'; // Or keep pending? Let's say Cancelled on explicit fail
            await booking.save();
        }

        res.json({ status: booking.status, paymentStatus: result.status });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
