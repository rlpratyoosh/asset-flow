# Maintenance Management Screen API Documentation

Base URL: `/api/v1`

**Note:** State-changing requests (POST, PUT) require the `X-CSRF-Token` header.

---

## 1. Raise Maintenance Request
* **URL:** `/maintenance`
* **Method:** `POST`
* **Role Required:** Authenticated user
* **Description:** Submits a new maintenance request for an asset. Status defaults to `Pending`.
* **Body:**
  * `asset_id` (string, required)
  * `issue_desc` (string, required)
  * `priority` (string, required): e.g., 'Low', 'Medium', 'High', 'Critical'
  * `photo_url` (string, optional)
* **Response:**
  * `201 Created`: Request raised successfully.

---

## 2. List Maintenance Requests
* **URL:** `/maintenance`
* **Method:** `GET`
* **Role Required:** Authenticated user
* **Query Parameters:**
  * `asset_id` (string, optional): Filter requests by asset.
* **Description:** 
  * `Employee`: Returns requests raised by the calling employee.
  * `Admin` / `AssetManager`: Returns all requests.
* **Response:** Array of `MaintenanceRequest` objects.

---

## 3. Update Maintenance Status
* **URL:** `/maintenance/:id/status`
* **Method:** `PUT`
* **Role Required:** `Admin`, `AssetManager`
* **Description:** Updates the status of the request (e.g., to `Approved`, `In Progress`, `Resolved`, `Rejected`).
  * If updated to `Approved` or `In Progress`, the asset's overall state automatically updates to `Under Maintenance`.
  * If updated to `Resolved`, the asset's overall state automatically updates back to `Available`.
* **Body:**
  * `status` (string, required): 'Approved', 'Rejected', 'In Progress', 'Resolved'
  * `technician_name` (string, optional): Can be assigned when Approved.
* **Response:**
  * `200 OK`: Maintenance status updated successfully.
  * `403 Forbidden`: Insufficient permissions.
  * `400 Bad Request`: Invalid status provided.
