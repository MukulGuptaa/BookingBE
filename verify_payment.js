const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5002/api';

async function testBookingWithPayment() {
    try {
        const timestamp = Date.now();
        console.log('--- Registering User ---');
        const user = await registerUser(`userP_${timestamp}`);
        if (!user) return;

        const userId = user._id;
        const date = `2025-02-${Math.floor(Math.random() * 20 + 1)}`;
        console.log(`Testing with Date: ${date}`);

        // 1. Book Slot -> Should return Payment URL
        console.log('\n--- Initiating Booking ---');
        const bookingRes = await bookSlot(userId, date, '10:00');

        if (bookingRes.paymentUrl) {
            console.log('SUCCESS: Pamyent URL received:', bookingRes.paymentUrl);
            console.log('Booking Status (Should be PENDING):', bookingRes.booking.status);

            // 2. Check Status (Expect PENDING/FAILED since we didn't pay)
            console.log('\n--- Checking Payment Status ---');
            const statusRes = await fetch(`${BASE_URL}/payments/check-status/${bookingRes.booking._id}`);
            const statusData = await statusRes.json();
            console.log('Status Check Response:', statusData);

        } else {
            console.log('Booking Response:', bookingRes);
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

async function registerUser(prefix) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: prefix,
            email: `${prefix}@test.com`,
            password: 'password123',
            phoneNumber: `+1${Math.floor(Math.random() * 1000000000)}`
        })
    });
    const data = await res.json();
    if (res.status === 201) return data;
    console.error('Registration failed:', data);
    return null;
}

async function bookSlot(userId, date, time) {
    const res = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date, time, userId, duration: 60 })
    });
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

testBookingWithPayment();
