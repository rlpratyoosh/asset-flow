package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rlpratyoosh/asset-flow/internal/database"
	"github.com/rlpratyoosh/asset-flow/internal/models"
)

// ========================
// Department Management
// ========================

func ListDepartments(c *gin.Context) {
	var departments []models.Department
	if err := database.DB.Find(&departments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch departments"})
		return
	}
	c.JSON(http.StatusOK, departments)
}

func CreateDepartment(c *gin.Context) {
	role := c.GetString("role")
	if role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	var req struct {
		Name               string  `json:"name" binding:"required"`
		DepartmentHeadID   *string `json:"department_head_id"`
		ParentDepartmentID *string `json:"parent_department_id"`
		Status             string  `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Status == "" {
		req.Status = "Active"
	}

	dept := models.Department{
		Name:               req.Name,
		DepartmentHeadID:   req.DepartmentHeadID,
		ParentDepartmentID: req.ParentDepartmentID,
		Status:             req.Status,
	}

	if err := database.DB.Create(&dept).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create department"})
		return
	}

	c.JSON(http.StatusCreated, dept)
}

func UpdateDepartment(c *gin.Context) {
	role := c.GetString("role")
	if role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	id := c.Param("id")
	var dept models.Department
	if err := database.DB.First(&dept, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Department not found"})
		return
	}

	var req struct {
		Name               *string `json:"name"`
		DepartmentHeadID   *string `json:"department_head_id"`
		ParentDepartmentID *string `json:"parent_department_id"`
		Status             *string `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != nil {
		dept.Name = *req.Name
	}
	if req.DepartmentHeadID != nil {
		dept.DepartmentHeadID = req.DepartmentHeadID
	}
	if req.ParentDepartmentID != nil {
		dept.ParentDepartmentID = req.ParentDepartmentID
	}
	if req.Status != nil {
		dept.Status = *req.Status
	}

	if err := database.DB.Save(&dept).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update department"})
		return
	}

	c.JSON(http.StatusOK, dept)
}

// ========================
// Category Management
// ========================

func ListCategories(c *gin.Context) {
	var categories []models.Category
	if err := database.DB.Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}
	c.JSON(http.StatusOK, categories)
}

func CreateCategory(c *gin.Context) {
	role := c.GetString("role")
	if role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	var req struct {
		Name         string `json:"name" binding:"required"`
		Description  string `json:"description"`
		CustomFields string `json:"custom_fields"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category := models.Category{
		Name:         req.Name,
		Description:  req.Description,
		CustomFields: req.CustomFields,
	}

	if err := database.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category"})
		return
	}

	c.JSON(http.StatusCreated, category)
}

func UpdateCategory(c *gin.Context) {
	role := c.GetString("role")
	if role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	id := c.Param("id")
	var category models.Category
	if err := database.DB.First(&category, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	var req struct {
		Name         *string `json:"name"`
		Description  *string `json:"description"`
		CustomFields *string `json:"custom_fields"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != nil {
		category.Name = *req.Name
	}
	if req.Description != nil {
		category.Description = *req.Description
	}
	if req.CustomFields != nil {
		category.CustomFields = *req.CustomFields
	}

	if err := database.DB.Save(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category"})
		return
	}

	c.JSON(http.StatusOK, category)
}

// ========================
// Employee Directory
// ========================

func ListUsers(c *gin.Context) {
	var users []models.User
	// Exclude PasswordHash from being returned by selecting specific fields
	if err := database.DB.Select("id, full_name, username, email, department_id, role, status, created_at, updated_at").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func UpdateUserRole(c *gin.Context) {
	role := c.GetString("role")
	if role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	id := c.Param("id")
	var user models.User
	if err := database.DB.First(&user, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var req struct {
		Role         *models.Role `json:"role"`
		DepartmentID *string      `json:"department_id"`
		Status       *string      `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Role != nil {
		user.Role = *req.Role
	}
	if req.DepartmentID != nil {
		user.DepartmentID = req.DepartmentID
	}
	if req.Status != nil {
		user.Status = *req.Status
	}

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	// Scrub password hash before returning
	user.PasswordHash = ""
	c.JSON(http.StatusOK, user)
}
