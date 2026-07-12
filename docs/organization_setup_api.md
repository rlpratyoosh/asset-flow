# Organization Setup Screen API Documentation

Base URL: `/api/v1`

**Note:** The Organization Setup module contains master data that everything else in AssetFlow depends on. Therefore, modifying these records is restricted to the `Admin` role. State-changing requests (POST, PUT) require the `X-CSRF-Token` header.

---

## 1. Department Management (Tab A)

### List Departments
* **URL:** `/departments`
* **Method:** `GET`
* **Role Required:** Authenticated user
* **Response:** Array of `Department` objects.

### Create Department
* **URL:** `/departments`
* **Method:** `POST`
* **Role Required:** `Admin`
* **Body:** 
  * `name` (string, required)
  * `department_head_id` (string, optional)
  * `parent_department_id` (string, optional)
  * `status` (string, optional): `"Active"` or `"Inactive"`
* **Response:** 201 Created with the `Department` object.

### Edit/Deactivate Department
* **URL:** `/departments/:id`
* **Method:** `PUT`
* **Role Required:** `Admin`
* **Body:** Same as Create, all fields optional.
* **Response:** 200 OK with the updated `Department`.

---

## 2. Asset Category Management (Tab B)

### List Categories
* **URL:** `/categories`
* **Method:** `GET`
* **Role Required:** Authenticated user
* **Response:** Array of `Category` objects.

### Create Category
* **URL:** `/categories`
* **Method:** `POST`
* **Role Required:** `Admin`
* **Body:** 
  * `name` (string, required)
  * `description` (string, optional)
  * `custom_fields` (string, optional): JSON string for category-specific fields (e.g. `{"warranty_period": "years"}`)
* **Response:** 201 Created with the `Category` object.

### Edit Category
* **URL:** `/categories/:id`
* **Method:** `PUT`
* **Role Required:** `Admin`
* **Body:** Same as Create, all fields optional.
* **Response:** 200 OK with the updated `Category`.

---

## 3. Employee Directory (Tab C)

### List Employees
* **URL:** `/users`
* **Method:** `GET`
* **Role Required:** Authenticated user
* **Response:** Array of `User` objects containing `id`, `full_name`, `username`, `email`, `department_id`, `role`, and `status`.

### Update Employee Role / Status
* **URL:** `/users/:id/role`
* **Method:** `PUT`
* **Role Required:** `Admin`
* **Description:** This is the ONLY place where roles are assigned. An admin can promote an employee to `DepartmentHead` or `AssetManager`, assign them to a department, or deactivate their account.
* **Body:** 
  * `role` (string, optional): `"Admin"`, `"AssetManager"`, `"DepartmentHead"`, or `"Employee"`
  * `department_id` (string, optional): UUID of the department
  * `status` (string, optional): `"Active"` or `"Inactive"`
* **Response:** 200 OK with the updated `User` object (password hash scrubbed).
