# Activity Logs & Notifications Screen API Documentation

Base URL: `/api/v1`

---

## 1. List Activity Logs
* **URL:** `/logs`
* **Method:** `GET`
* **Role Required:** `Admin`, `AssetManager`
* **Query Parameters:**
  * `action` (string, optional): Filter by action type (e.g., 'Transfer', 'AuditClose').
  * `user_id` (string, optional): Filter by user ID.
  * `start_date` (datetime RFC3339, optional): Filter by start date.
  * `end_date` (datetime RFC3339, optional): Filter by end date.
* **Description:** Retrieves the global system audit trail.
* **Response:** Array of objects containing `id`, `user_id`, `user_name`, `action`, `entity`, `entity_id`, and `created_at`.

---

## 2. List Notifications
* **URL:** `/notifications`
* **Method:** `GET`
* **Role Required:** Authenticated user
* **Description:** Retrieves all notifications for the currently authenticated user.
* **Response:** Array of `Notification` objects.

---

## 3. Mark Notification as Read
* **URL:** `/notifications/:id/read`
* **Method:** `PUT`
* **Role Required:** Authenticated user
* **Description:** Marks a specific notification as read.
* **Response:**
  * `200 OK`: Notification marked as read.
