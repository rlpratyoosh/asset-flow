# Organization Setup API Documentation (Asset Module)

Base URL: `/api/v1`

**Note:** All routes in the `/api/v1` group use the `CSRFMiddleware`. Therefore, all state-changing requests (POST, PUT, DELETE, PATCH) typically require the `X-CSRF-Token` header and the `csrf_token` cookie. All routes below also require authentication (`access_token` cookie).

---

## 1. Register Asset
Registers a new physical asset into the organization's inventory. The `AssetTag` is automatically generated (e.g., `AF-0001`) and the default state is set to `Available`.

* **URL:** `/assets`
* **Method:** `POST`
* **Role required:** `AssetManager`, `Admin`
* **Headers:** 
  * `X-CSRF-Token` (Required)
* **Cookies:**
  * `access_token` (Required)
  * `csrf_token` (Required)
* **Body (application/json):**
  * `name` (string, required): Name of the asset.
  * `category_id` (string, required): Category identifier.
  * `serial_number` (string, optional): Manufacturer serial number.
  * `condition` (string, optional): Current condition. Defaults to `"Good"`.
  * `location` (string, optional): Physical location.
  * `is_shared` (boolean, optional): Whether the asset is shared and bookable by the hour. Defaults to `false`.
  * `acquisition_cost` (float, optional): Cost of the asset.
* **Response:**
  * **201 Created:** Returns the created `Asset` object.
  * **400 Bad Request:** Validation errors.
  * **403 Forbidden:** User lacks required role.
  * **500 Internal Server Error:** Database creation failure.

---

## 2. Directory & Search Assets
Returns a paginated list of assets in the organization.

* **URL:** `/assets`
* **Method:** `GET`
* **Role required:** All Roles (`Admin`, `AssetManager`, `DepartmentHead`, `Employee`)
* **Headers:** None
* **Cookies:**
  * `access_token` (Required)
* **Query Parameters:**
  * `search` (string, optional): Filters by `name` or `asset_tag` (case-insensitive search).
  * `category_id` (string, optional): Filters assets by exact category.
  * `state` (string, optional): Filters assets by state (e.g., `Available`, `Allocated`).
  * `page` (integer, optional): Page number for pagination. Defaults to `1`.
  * `limit` (integer, optional): Items per page. Defaults to `10`.
* **Response:**
  * **200 OK:**
    ```json
    {
      "data": [
        {
          "ID": "uuid",
          "AssetTag": "AF-0001",
          "Name": "MacBook Pro M3",
          "CategoryID": "cat-laptops",
          "State": "Available"
          // ... other fields
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 10
    }
    ```

---

## 3. Allocate Asset
Allocates a specific asset to a user. This automatically sets the asset's state to `Allocated`.

* **URL:** `/assets/:id/allocate`
* **Method:** `POST`
* **Role required:** `AssetManager`, `DepartmentHead`, `Admin`
* **Headers:** 
  * `X-CSRF-Token` (Required)
* **Cookies:**
  * `access_token` (Required)
  * `csrf_token` (Required)
* **URL Parameters:**
  * `id` (string, required): The UUID of the asset to allocate.
* **Body (application/json):**
  * `assigned_to_user_id` (string, required): UUID of the user receiving the asset.
  * `expected_return_date` (string/datetime, required): ISO-8601 timestamp for expected return.
* **Response:**
  * **200 OK:** `{"message": "Asset allocated successfully"}`
  * **400 Bad Request:** Validation errors.
  * **403 Forbidden:** User lacks required role.
  * **409 Conflict:** `{"error": "Asset is currently held/unavailable"}`
  * **500 Internal Server Error:** Database transaction failure.

---

## 4. Return Asset
Returns an allocated asset. This ends the active allocation, logs the return notes and timestamp, and changes the asset's state back to `Available`.

* **URL:** `/assets/:id/return`
* **Method:** `POST`
* **Role required:** `AssetManager`, `DepartmentHead`, `Admin`
* **Headers:** 
  * `X-CSRF-Token` (Required)
* **Cookies:**
  * `access_token` (Required)
  * `csrf_token` (Required)
* **URL Parameters:**
  * `id` (string, required): The UUID of the asset being returned.
* **Body (application/json):**
  * `return_notes` (string, optional): Notes describing the condition upon return.
* **Response:**
  * **200 OK:** `{"message": "Asset returned successfully"}`
  * **404 Not Found:** `{"error": "active allocation not found"}`
  * **403 Forbidden:** User lacks required role.
  * **500 Internal Server Error:** Database transaction failure.
