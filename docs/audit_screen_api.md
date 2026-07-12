# Asset Audit Screen API Documentation

Base URL: `/api/v1`

**Note:** State-changing requests (POST, PUT) require the `X-CSRF-Token` header.

---

## 1. Create Audit Cycle
* **URL:** `/audits`
* **Method:** `POST`
* **Role Required:** `Admin`, `AssetManager`
* **Description:** Initializes a new audit cycle and assigns specific users as auditors.
* **Body:**
  * `scope_dept_id` (string, optional): Restrict audit to a specific department.
  * `start_date` (datetime, required)
  * `end_date` (datetime, required)
  * `auditor_ids` (array of strings, required): User IDs of the assigned auditors.
* **Response:**
  * `201 Created`: Audit cycle created successfully.

---

## 2. List Audit Cycles
* **URL:** `/audits`
* **Method:** `GET`
* **Role Required:** Authenticated user
* **Response:** Array of `AuditCycle` objects, including the assigned `Auditors`.

---

## 3. Log Audit Item
* **URL:** `/audits/:id/items`
* **Method:** `POST`
* **Role Required:** Assigned Auditor, `Admin`, or `AssetManager`
* **Description:** Records an asset's condition during the active audit cycle.
* **Body:**
  * `asset_id` (string, required)
  * `status` (string, required): Must be 'Verified', 'Missing', or 'Damaged'.
* **Response:**
  * `200 OK`: Audit item logged/updated successfully.

---

## 4. Get Audit Items
* **URL:** `/audits/:id/items`
* **Method:** `GET`
* **Role Required:** Authenticated user
* **Description:** Returns the discrepancy report/logged items for a specific audit cycle.
* **Response:** Array of logged items, containing `asset_id`, `asset_tag`, `name`, and `status`.

---

## 5. Close Audit Cycle
* **URL:** `/audits/:id/close`
* **Method:** `PUT`
* **Role Required:** `Admin`, `AssetManager`
* **Description:** Locks the audit cycle (changes status to `Closed`) and automatically applies the discrepancy results to the master asset records:
  * If an item was logged as `Missing`, the asset's state changes to `Lost`.
  * If an item was logged as `Damaged`, the asset's condition changes to `Damaged`.
* **Response:**
  * `200 OK`: Audit cycle closed and asset statuses updated.
