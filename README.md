# Booking System Implementation Plan

## Goal Description
Implement a time slot booking system where users can view available slots, see slots booked by others, and manage their own bookings. The system will ensure no double bookings and provide a clear UI for slot status.

## Proposed Changes

### Database Schema (MongoDB)
We will introduce a new model `Booking` to track reserved time slots.

#### `src/models/Booking.js`
Fields:
- `user`: ObjectId (Ref: User) - The user who made the booking.
- `date`: String (Format: YYYY-MM-DD) - The day of the booking.
- `time`: String (Format: HH:mm) - Start time of the slot (e.g., "09:00").
- `createdAt`: Date.

*Note: We don't store "Available" slots in drag DB. We calculate them on the fly to save space.*

### API Layer
New routes to handle booking logic.

#### `src/routes/bookingRoutes.js`
- `GET /api/bookings/slots?date=YYYY-MM-DD`
    - **Logic**:
        1. Generate a list of all potential slots for the day (e.g., 9:00, 10:00... 17:00).
        2. Query `Booking` collection for the given date.
        3. Map over potential slots and assign status:
            - `AVAILABLE`: No booking exists.
            - `BOOKED_BY_ME`: Booking exists and `user.id` matches.
            - `BOOKED_BY_OTHERS`: Booking exists and `user.id` does not match.
- `POST /api/bookings`
    - Body: `{ date, time }`
    - **Logic**:
        1. Check if slot is already booked. If yes, return 400.
        2. Create new `Booking`.
- `DELETE /api/bookings/:id`
    - Cancel a booking (only if owned by user).

### Component Architecture (Conceptual Frontend)
If we were to implement a frontend, these would be the key components:

1.  **DateSelector**: Allows user to pick a day.
2.  **SlotGrid**: Displays the list of time slots.
    -   Receives `slots` array from API.
    -   Renders `SlotItem` for each.
3.  **SlotItem**:
    -   Displays time (e.g., "10:00 AM").
    -   **Color Coding**:
        -   Green: Available (Clickable -> Booking Action).
        -   Red: Booked by Others (Disabled).
        -   Blue: Booked by Me (Clickable -> Cancel Action).
