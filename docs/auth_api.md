# Auth API Documentation

Base URL: `/api/v1`

**Note:** All routes in the `/api/v1` group use the `CSRFMiddleware`. Therefore, all state-changing requests (POST, PUT, DELETE, PATCH) typically require the `X-CSRF-Token` header and the `csrf_token` cookie, depending on your CSRF middleware implementation.

---

## 1. Get CSRF Token
Generates a new CSRF token and sets it as a cookie.

* **URL:** `/csrf-token`
* **Method:** `GET`
* **Headers:** None
* **Cookies:** None
* **Body:** None
* **Response:**
  * **200 OK:**
    * **Cookies Set:** `csrf_token`
    * **Body:** `{"csrf_token": "<token_string>"}`

---

## 2. Register User
Registers a new user account. Role is automatically set to `Employee` upon registration and can only be modified by an Admin.

* **URL:** `/register`
* **Method:** `POST`
* **Headers:** 
  * `X-CSRF-Token` (Required for CSRF protection)
* **Cookies:**
  * `csrf_token` (Required for CSRF protection)
* **Body (multipart/form-data):**
  * `fullname` (string, required): Full name of the user.
  * `username` (string, required): Unique username.
  * `password` (string, required): User's password.
  * `profile-pic` (file, optional): Profile picture image file.
* **Response:**
  * **201 Created:** `{"message": "User registered successfully"}`
  * **400 Bad Request:** `{"error": "fullname, username, and password are required"}`
  * **409 Conflict:** `{"error": "Username already exists"}`
  * **500 Internal Server Error:** `{"error": "<error_message>"}`

---

## 3. Login
Authenticates a user and sets session cookies.

* **URL:** `/login`
* **Method:** `POST`
* **Headers:**
  * `X-CSRF-Token` (Required for CSRF protection)
* **Cookies:**
  * `csrf_token` (Required for CSRF protection)
* **Body (application/json or application/x-www-form-urlencoded):**
  * `username` (string, required)
  * `password` (string, required)
* **Response:**
  * **200 OK:**
    * **Cookies Set:** `access_token` (HttpOnly), `refresh_token` (HttpOnly)
    * **Body:** `{"message": "Logged in successfully"}`
  * **400 Bad Request:** `{"error": "Invalid request"}`
  * **401 Unauthorized:** `{"error": "Invalid username or password"}`

---

## 4. Logout
Logs out the current user, invalidating their session and clearing cookies.

* **URL:** `/logout`
* **Method:** `POST`
* **Headers:**
  * `X-CSRF-Token` (Required for CSRF protection)
* **Cookies:**
  * `csrf_token` (Required for CSRF protection)
  * `refresh_token` (Used to identify and delete the session from the database)
* **Body:** None
* **Response:**
  * **200 OK:** 
    * **Cookies Cleared:** `access_token`, `refresh_token`
    * **Body:** `{"message": "Logged out successfully"}`

---

## 5. Get Current User (Me)
Retrieves the profile information of the currently authenticated user.

* **URL:** `/me`
* **Method:** `GET`
* **Headers:** None
* **Cookies:**
  * `access_token` (Required for authentication)
  * `refresh_token` (Used as a fallback to generate a new `access_token` if expired)
* **Body:** None
* **Response:**
  * **200 OK:**
    ```json
    {
      "fullname": "John Doe",
      "username": "johndoe123",
      "pfp": "/pfp/1234567890_image.png",
      "role": "Employee"
    }
    ```
  * **401 Unauthorized:** `{"error": "Unauthorized"}`
  * **404 Not Found:** `{"error": "User not found"}`
