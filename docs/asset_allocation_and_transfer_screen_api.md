# Asset Allocation & Transfer Screen API Documentation

Base URL: `/api/v1`

**Note:** State-changing requests (POST) require the `X-CSRF-Token` header.

---

## 1. Allocate Asset
* **URL:** `/assets/:id/allocate`
* **Method:** `POST`
* **Role Required:** `Admin`, `AssetManager`, `DepartmentHead`
* **Body:** 
  * `assigned_to_user_id` (string, optional)
  * `assigned_to_dept_id` (string, optional)
  * `expected_return_date` (datetime, required)
  *(Note: Must assign to either a user or department)*
* **Response:**
  * `200 OK`: Allocation successful.
  * `409 Conflict`: "Asset is currently held/unavailable" (This triggers the frontend to offer a Transfer Request).

---

## 2. Request Transfer
* **URL:** `/assets/:id/transfer`
* **Method:** `POST`
* **Role Required:** Authenticated user
* **Description:** Creates a transfer request for an asset that is currently allocated.
* **Response:** 
  * `201 Created`: Transfer request created.
  * `400 Bad Request`: "Asset is available, please allocate directly".

---

## 3. Approve Transfer
* **URL:** `/assets/transfers/:request_id/approve`
* **Method:** `POST`
* **Role Required:** `Admin`, `AssetManager`, `DepartmentHead`
* **Description:** Approves a pending transfer request. Automatically marks the old allocation as returned and creates a new allocation for the requester.
* **Response:** 
  * `200 OK`: Transfer approved and asset re-allocated successfully.

---

## 4. List Pending Transfers
* **URL:** `/assets/transfers`
* **Method:** `GET`
* **Role Required:** Authenticated user
* **Description:** Returns transfer requests. Results are filtered by RBAC:
  * `Employee`: Only sees transfers they requested.
  * `DepartmentHead`: Sees transfers requested by employees in their department.
  * `Admin` / `AssetManager`: Sees all transfer requests.
* **Response:** Array of `TransferRequest` objects.

---

## 5. Return Asset
* **URL:** `/assets/:id/return`
* **Method:** `POST`
* **Role Required:** `Admin`, `AssetManager`, `DepartmentHead`
* **Body:** 
  * `return_notes` (string, optional): Condition check-in notes.
* **Response:** 
  * `200 OK`: Asset returned successfully and state reverted to `Available`.
