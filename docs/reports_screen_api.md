# Reports & Analytics Screen API Documentation

Base URL: `/api/v1`

---

## 1. Depreciation Tracking
* **URL:** `/reports/depreciation`
* **Method:** `GET`
* **Role Required:** Authenticated user (typically Admin or AssetManager)
* **Description:** Returns a list of assets with their straight-line depreciation calculated on the fly. Assumes a standard expected life of 5 years.
* **Response:** Array of objects containing `asset_id`, `asset_tag`, `name`, `acquisition_cost`, `current_value`, and `age_in_years`.

---

## 2. Condition Summary
* **URL:** `/reports/condition`
* **Method:** `GET`
* **Role Required:** Authenticated user
* **Description:** Groups assets by their physical `Condition` and returns the count for each group. Useful for generating pie charts.
* **Response:** Array of objects: `[{"condition": "Good", "count": 12}, ...]`

---

## 3. Allocation Summary
* **URL:** `/reports/allocation`
* **Method:** `GET`
* **Role Required:** Authenticated user
* **Description:** Groups active asset allocations by `Department Name` and returns the count for each group.
* **Response:** Array of objects: `[{"department_name": "Engineering", "asset_count": 5}, ...]`

---

## 4. Export Report
* **URL:** `/reports/export`
* **Method:** `GET`
* **Role Required:** Authenticated user
* **Query Parameters:**
  * `format` (string, optional): Pass `csv` to download a `.csv` file. Otherwise returns JSON.
* **Description:** Generates a comprehensive export of all assets in the system.
* **Response:** 
  * If `format=csv`: Returns a file stream with `Content-Type: text/csv` and `Content-Disposition: attachment; filename=assets_report.csv`.
  * Default: Returns the raw JSON array of Asset objects.
