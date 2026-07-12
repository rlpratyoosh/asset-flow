# Resource Booking Screen API Documentation

Base URL: `/api/v1`

**Note:** State-changing requests (POST, PUT) require the `X-CSRF-Token` header.

---

## 1. Create a Booking
* **URL:** `/bookings`
* **Method:** `POST`
* **Role Required:** Authenticated user
* **Description:** Books a shared resource. Fails if the asset is not shared or if the requested time slot overlaps with an existing `Upcoming` or `Ongoing` booking.
* **Body:**
  * `asset_id` (string, required)
  * `start_time` (datetime, required)
  * `end_time` (datetime, required)
* **Response:**
  * `201 Created`: Resource booked successfully.
  * `409 Conflict`: "time slot overlaps with an existing booking".
  * `400 Bad Request`: "asset is not a shared/bookable resource" or "end time must be after start time" or "cannot book in the past".

---

## 2. List Bookings (Calendar View)
* **URL:** `/bookings`
* **Method:** `GET`
* **Role Required:** Authenticated user
* **Query Parameters:**
  * `asset_id` (string, optional): Filter bookings for a specific resource (for calendar view).
  * `user_id` (string, optional): Filter bookings made by a specific user (for "My Bookings").
* **Response:** Array of `Booking` objects ordered chronologically by `start_time`.

---

## 3. Cancel Booking
* **URL:** `/bookings/:id/cancel`
* **Method:** `PUT`
* **Role Required:** Authenticated user
* **Description:** Cancels an upcoming booking. Users can only cancel their own bookings. Admins and Asset Managers can cancel any booking.
* **Response:**
  * `200 OK`: Booking cancelled successfully.
  * `403 Forbidden`: "You can only cancel your own bookings".
  * `400 Bad Request`: "Only upcoming bookings can be cancelled".

---

## 4. Reschedule Booking
* **URL:** `/bookings/:id/reschedule`
* **Method:** `PUT`
* **Role Required:** Authenticated user
* **Description:** Modifies the time slot of an existing upcoming booking. Fails if the new slot overlaps with another booking.
* **Body:**
  * `start_time` (datetime, required)
  * `end_time` (datetime, required)
* **Response:**
  * `200 OK`: Booking rescheduled successfully.
  * `409 Conflict`: "time slot overlaps with an existing booking".
  * `403 Forbidden`: "forbidden: you can only reschedule your own bookings".
