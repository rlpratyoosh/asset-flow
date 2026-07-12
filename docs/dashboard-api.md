# Dashboard API Documentation

Base URL: `/api/v1`

---

## 1. Get Dashboard Analytics
Retrieves key performance indicators (KPIs) and overdue allocations. The response data is dynamically filtered based on the authenticated user's role (RBAC).

* **URL:** `/dashboard`
* **Method:** `GET`
* **Headers:** 
  * `X-CSRF-Token` (If CSRF is globally enforced for GET requests, though standard implementations may only require it for state-changing methods)
* **Cookies:**
  * `access_token` (Required for authentication)
* **Body:** None
* **Role-Based Access Control (RBAC):**
  * **Admin:** Views organization-wide analytics.
  * **Department Head:** Views analytics restricted to assets allocated to their specific department.
  * **Employee:** Views analytics restricted only to assets allocated directly to them.
* **Response:**
  * **200 OK:**
    ```json
    {
      "status": "success",
      "data": {
        "kpis": {
          "assets_available": 142,
          "assets_allocated": 87,
          "maintenance_today": 4,
          "active_bookings": 12,
          "pending_transfers": 3,
          "upcoming_returns": 5,
          "overdue_returns": 2
        },
        "overdue_allocations": [
          {
            "allocation_id": "uuid-here",
            "asset_tag": "AF-0114",
            "asset_name": "Dell XPS 15",
            "assigned_to": "Priya Sharma",
            "expected_return_date": "2026-07-10T18:00:00Z",
            "days_overdue": 2
          }
        ],
        "activity_logs": [
          {
            "log_id": "uuid-here",
            "user_id": "uuid-here",
            "action": "Checked out",
            "entity": "Asset",
            "entity_id": "uuid-here",
            "created_at": "2026-07-11T10:00:00Z"
          }
        ]
      }
    }
    ```
  * **401 Unauthorized:** `{"error": "Unauthorized"}`
