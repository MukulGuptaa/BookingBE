const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5001/api';

async function testBooking() {
    try {
        const timestamp = Date.now();
        // 1. Create two users
        // Since auth middleware is gone, we don't *need* to register to get a token,
        // but we need a valid User ID for the Booking model reference.
        // So we will still register users to get their IDs.
        console.log('--- Registering Users ---');
        const user1 = await registerUser(`userA_${timestamp}`);
        const user2 = await registerUser(`userB_${timestamp}`);

        if (!user1 || !user2) return;

        // Note: user1 and user2 objects now contain { _id, ... } but we don't need 'token' anymore.
        const userId1 = user1._id;
        const userId2 = user2._id;

        // Use a random date to ensure clean state
        const date = `2025-01-${Math.floor(Math.random() * 20 + 10)}`;
        console.log(`Testing with Date: ${date}`);

        // 2. User 1 checks slots (All should be available)
        // Pass userId in query
        console.log('\n--- User 1 Checking Slots (Initial) ---');
        await checkSlots(userId1, date);

        // 3. User 1 books 10:00
        // Pass userId in body
        console.log('\n--- User 1 Booking 10:00 ---');
        await bookSlot(userId1, date, '10:00');

        // 4. User 1 checks slots (10:00 should be BOOKED_BY_ME)
        console.log('\n--- User 1 Checking Slots (After Booking) ---');
        await checkSlots(userId1, date);

        // 5. User 2 checks slots (10:00 should be BOOKED_BY_OTHERS)
        console.log('\n--- User 2 Checking Slots ---');
        await checkSlots(userId2, date);

        // 6. User 2 tries to book 10:00 (Should fail)
        console.log('\n--- User 2 Booking 10:00 (Should Fail) ---');
        await bookSlot(userId2, date, '10:00');

        // 7. User 1 cancels 10:00
        console.log('\n--- User 1 Canceling 10:00 ---');
        // We need the booking ID first
        const slots = await getSlots(userId1, date);
        const bookingId = slots.find(s => s.time === '10:00').bookingId;
        await cancelBooking(userId1, bookingId);

        // 8. User 2 books 10:00 (Should success)
        console.log('\n--- User 2 Booking 10:00 (Should Success) ---');
        await bookSlot(userId2, date, '10:00');

        console.log('\n--- Final Check (User 2) ---');
        await checkSlots(userId2, date);

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

async function getSlots(userId, date) {
    // Modified: userId in query param
    const res = await fetch(`${BASE_URL}/bookings/slots?date=${date}&userId=${userId}`);
    return await res.json();
}

async function checkSlots(userId, date) {
    const slots = await getSlots(userId, date);
    // Print a summary
    const summary = slots.map(s => {
        if (s.status === 'AVAILABLE') return '.';
        if (s.status === 'BOOKED_BY_ME') return 'M';
        if (s.status === 'BOOKED_BY_OTHERS') return 'O';
        return '?';
    }).join(' ');
    console.log(`Slots: ${summary}`);
    // Also print exact status of 10:00
    const slot10 = slots.find(s => s.time === '10:00');
    console.log(`10:00 Status: ${slot10 ? slot10.status : 'UNKNOWN'}`);
}

async function bookSlot(userId, date, time) {
    // Modified: userId in body
    const res = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date, time, userId, duration: 60 })
    });
    console.log(`Booking ${time}:`, res.status, await res.text());
}

async function cancelBooking(userId, id) {
    // Modified: userId in body
    const res = await fetch(`${BASE_URL}/bookings/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
    });
    console.log(`Canceling ${id}:`, res.status, await res.text());
}

testBooking();
