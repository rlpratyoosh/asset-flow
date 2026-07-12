# Asset Registration and Directory Screen API Documentation

Base URL: `/api/v1`

**Note:** All routes below require an active session via the `access_token` cookie. State-changing requests (POST, PUT, DELETE) also require the `X-CSRF-Token` header and corresponding cookie.

---

## 1. Register Asset
Registers a new physical asset into the system. The `AssetTag` is automatically generated based on the highest existing tag (e.g., `AF-XXXX`). State defaults to `Available`.

* **URL:** `/assets`
* **Method:** `POST`
* **Role Required:** `AssetManager`, `Admin`
* **Headers:** 
  * `X-CSRF-Token` (Required)
* **Cookies:**
  * `access_token` (Required)
  * `csrf_token` (Required)
* **Body (application/json):**
  * `name` (string, required): Name of the asset.
  * `category_id` (string, required): Associated Category ID.
  * `serial_number` (string, optional): Manufacturer serial number.
  * `acquisition_date` (datetime, optional): ISO-8601 timestamp.
  * `acquisition_cost` (float, optional): Cost for accounting reports.
  * `condition` (string, optional): Current condition. Defaults to `"Good"`.
  * `location` (string, optional): Location details.
  * `photo_url` (string, optional): Cloud storage URL for the asset's photo.
  * `is_shared` (boolean, optional): Bookable by the hour if `true`. Defaults to `false`.
* **Response:**
  * **201 Created:** Returns the created `Asset` JSON object.
  * **400 Bad Request:** Validation errors.
  * **403 Forbidden:** User lacks the required role.

---

## 2. Directory & Dynamic Search
Returns a list of all assets applying dynamic filters based on provided query parameters.

* **URL:** `/assets`
* **Method:** `GET`
* **Role Required:** All Roles (`Admin`, `AssetManager`, `DepartmentHead`, `Employee`)
* **Headers:** None
* **Cookies:**
  * `access_token` (Required)
* **Query Parameters (All Optional):**
  * `q` (string): Search string. Matches against `asset_tag`, `name`, and `serial_number`.
  * `category_id` (string): Filters assets by a specific category.
  * `state` (string): Filters assets by state (e.g., `Available`, `Allocated`, `Under Maintenance`).
  * `location` (string): Sub-string search for location (e.g., `Room 101`).
* **Response:**
  * **200 OK:**
    ```json
    [
      {
        "ID": "uuid",
        "AssetTag": "AF-0043",
        "Name": "Dell XPS 15",
        "CategoryID": "uuid",
        "Category": {
           // Preloaded category details
        },
        "State": "Available",
        "Condition": "Good"
        // ...
      }
    ]
    ```

---

## 3. Asset History Aggregation
Retrieves the complete historical logs for an asset, containing both its allocation history and maintenance history, bundled together in one fast JSON payload.

* **URL:** `/assets/:id/history`
* **Method:** `GET`
* **Role Required:** All Roles (`Admin`, `AssetManager`, `DepartmentHead`, `Employee`)
* **Headers:** None
* **Cookies:**
  * `access_token` (Required)
* **URL Parameters:**
  * `id` (string, required): The UUID of the asset to look up.
* **Response:**
  * **200 OK:**
    ```json
    {
      "allocations": [
        {
          "ID": "uuid",
          "AssetID": "uuid",
          "AssignedToUserID": "uuid",
          "ExpectedReturnDate": "2026-07-20T00:00:00Z",
          "ReturnedAt": "2026-07-15T00:00:00Z",
          "ReturnNotes": "Screen has slight scratch",
          "CreatedAt": "2026-07-01T00:00:00Z"
        }
      ],
      "maintenance": [
        {
          "ID": "uuid",
          "AssetID": "uuid",
          "RaisedByID": "uuid",
          "IssueDesc": "Overheating issues",
          "Priority": "High",
          "Status": "Resolved",
          "CreatedAt": "2026-05-10T00:00:00Z"
        }
      ]
    }
    ```
