package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rlpratyoosh/asset-flow/internal/database"
	"github.com/rlpratyoosh/asset-flow/internal/models"
	"gorm.io/gorm"
)

// ListMaintenanceRequests handles GET /api/v1/maintenance
func ListMaintenanceRequests(c *gin.Context) {
	assetID := c.Query("asset_id")
	userID := c.GetString("userID")
	role := c.GetString("role")

	query := database.DB.Model(&models.MaintenanceRequest{}).Preload("Asset")

	if assetID != "" {
		query = query.Where("asset_id = ?", assetID)
	}

	// Employees only see their own requests.
	// Department Heads see their own requests (or maybe their dept's requests, but for simplicity, let's say they can see all or just theirs. PDF: "Keep every role informed").
	// Let's allow Admin and AssetManager to see all.
	if role == string(models.RoleEmployee) {
		query = query.Where("raised_by_id = ?", userID)
	}

	var requests []models.MaintenanceRequest
	if err := query.Order("created_at desc").Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch maintenance requests"})
		return
	}

	c.JSON(http.StatusOK, requests)
}

// RaiseMaintenanceRequest handles POST /api/v1/maintenance
func RaiseMaintenanceRequest(c *gin.Context) {
	userID := c.GetString("userID")

	var req struct {
		AssetID   string `json:"asset_id" binding:"required"`
		IssueDesc string `json:"issue_desc" binding:"required"`
		Priority  string `json:"priority" binding:"required"`
		PhotoURL  string `json:"photo_url"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var asset models.Asset
	if err := database.DB.Where("id = ?", req.AssetID).First(&asset).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Asset not found"})
		return
	}

	maintenance := models.MaintenanceRequest{
		AssetID:    req.AssetID,
		RaisedByID: userID,
		IssueDesc:  req.IssueDesc,
		Priority:   req.Priority,
		PhotoURL:   req.PhotoURL,
		Status:     "Pending",
	}

	if err := database.DB.Create(&maintenance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to raise maintenance request"})
		return
	}

	c.JSON(http.StatusCreated, maintenance)
}

// UpdateMaintenanceStatus handles PUT /api/v1/maintenance/:id/status
func UpdateMaintenanceStatus(c *gin.Context) {
	role := c.GetString("role")
	if role != string(models.RoleAssetManager) && role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: only Asset Managers and Admins can update maintenance status"})
		return
	}

	requestID := c.Param("id")

	var req struct {
		Status         string `json:"status" binding:"required"` // Approved, Rejected, In Progress, Resolved
		TechnicianName string `json:"technician_name"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validStatuses := map[string]bool{
		"Approved":    true,
		"Rejected":    true,
		"In Progress": true,
		"Resolved":    true,
	}

	if !validStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var maintenance models.MaintenanceRequest
		if err := tx.Where("id = ?", requestID).First(&maintenance).Error; err != nil {
			return fmt.Errorf("maintenance request not found")
		}

		maintenance.Status = req.Status
		if req.TechnicianName != "" {
			maintenance.TechnicianName = req.TechnicianName
		}
		maintenance.UpdatedAt = time.Now()

		if err := tx.Save(&maintenance).Error; err != nil {
			return err
		}

		var asset models.Asset
		if err := tx.Where("id = ?", maintenance.AssetID).First(&asset).Error; err != nil {
			return err
		}

		assetUpdated := false
		if req.Status == "Approved" || req.Status == "In Progress" {
			if asset.State != "Under Maintenance" {
				asset.State = "Under Maintenance"
				assetUpdated = true
			}
		} else if req.Status == "Resolved" {
			if asset.State == "Under Maintenance" {
				asset.State = "Available" // or Allocated if we want to restore old state, but PDF says "back to Available"
				assetUpdated = true
			}
		}

		if assetUpdated {
			if err := tx.Save(&asset).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		if err.Error() == "maintenance request not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Maintenance status updated successfully"})
}
