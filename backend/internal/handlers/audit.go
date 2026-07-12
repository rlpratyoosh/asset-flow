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

// CreateAuditCycle handles POST /api/v1/audits
func CreateAuditCycle(c *gin.Context) {
	role := c.GetString("role")
	if role != string(models.RoleAdmin) && role != string(models.RoleAssetManager) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: only Admin or Asset Manager can create audits"})
		return
	}

	var req struct {
		ScopeDeptID *string   `json:"scope_dept_id"`
		StartDate   time.Time `json:"start_date" binding:"required"`
		EndDate     time.Time `json:"end_date" binding:"required"`
		AuditorIDs  []string  `json:"auditor_ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var auditors []models.User
		if err := tx.Where("id IN ?", req.AuditorIDs).Find(&auditors).Error; err != nil {
			return err
		}

		if len(auditors) != len(req.AuditorIDs) {
			return fmt.Errorf("one or more auditor IDs are invalid")
		}

		audit := models.AuditCycle{
			ScopeDeptID: req.ScopeDeptID,
			StartDate:   req.StartDate,
			EndDate:     req.EndDate,
			Status:      "Active",
			Auditors:    auditors,
		}

		if err := tx.Create(&audit).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Audit cycle created successfully"})
}

// ListAuditCycles handles GET /api/v1/audits
func ListAuditCycles(c *gin.Context) {
	var audits []models.AuditCycle
	if err := database.DB.Preload("Auditors").Order("start_date desc").Find(&audits).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch audits"})
		return
	}

	c.JSON(http.StatusOK, audits)
}

// LogAuditItem handles POST /api/v1/audits/:id/items
func LogAuditItem(c *gin.Context) {
	auditID := c.Param("id")
	userID := c.GetString("userID")

	var req struct {
		AssetID string `json:"asset_id" binding:"required"`
		Status  string `json:"status" binding:"required"` // Verified, Missing, Damaged
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validStatuses := map[string]bool{"Verified": true, "Missing": true, "Damaged": true}
	if !validStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	var audit models.AuditCycle
	if err := database.DB.Preload("Auditors").Where("id = ?", auditID).First(&audit).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Audit cycle not found"})
		return
	}

	if audit.Status != "Active" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Audit cycle is not active"})
		return
	}

	// Verify user is an auditor
	isAuditor := false
	for _, auditor := range audit.Auditors {
		if auditor.ID == userID {
			isAuditor = true
			break
		}
	}

	role := c.GetString("role")
	if !isAuditor && role != string(models.RoleAdmin) && role != string(models.RoleAssetManager) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: you are not assigned as an auditor for this cycle"})
		return
	}

	item := models.AuditItem{
		AuditCycleID: auditID,
		AssetID:      req.AssetID,
		Status:       req.Status,
	}

	// Check if already logged, if so update
	var existingItem models.AuditItem
	if err := database.DB.Where("audit_cycle_id = ? AND asset_id = ?", auditID, req.AssetID).First(&existingItem).Error; err == nil {
		existingItem.Status = req.Status
		database.DB.Save(&existingItem)
	} else {
		if err := database.DB.Create(&item).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log audit item"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Audit item logged"})
}

// GetAuditItems handles GET /api/v1/audits/:id/items
func GetAuditItems(c *gin.Context) {
	auditID := c.Param("id")

	type AuditItemResponse struct {
		AssetID  string `json:"asset_id"`
		AssetTag string `json:"asset_tag"`
		Name     string `json:"name"`
		Status   string `json:"status"`
	}

	var results []AuditItemResponse
	query := database.DB.Table("audit_items").
		Select("audit_items.asset_id, assets.asset_tag, assets.name, audit_items.status").
		Joins("JOIN assets ON assets.id = audit_items.asset_id").
		Where("audit_items.audit_cycle_id = ?", auditID)

	if err := query.Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch audit items"})
		return
	}

	c.JSON(http.StatusOK, results)
}

// CloseAuditCycle handles PUT /api/v1/audits/:id/close
func CloseAuditCycle(c *gin.Context) {
	role := c.GetString("role")
	if role != string(models.RoleAdmin) && role != string(models.RoleAssetManager) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: only Admin or Asset Manager can close audits"})
		return
	}

	auditID := c.Param("id")

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var audit models.AuditCycle
		if err := tx.Where("id = ?", auditID).First(&audit).Error; err != nil {
			return fmt.Errorf("audit cycle not found")
		}

		if audit.Status == "Closed" {
			return fmt.Errorf("audit cycle is already closed")
		}

		audit.Status = "Closed"
		if err := tx.Save(&audit).Error; err != nil {
			return err
		}

		var items []models.AuditItem
		if err := tx.Where("audit_cycle_id = ?", auditID).Find(&items).Error; err != nil {
			return err
		}

		for _, item := range items {
			var asset models.Asset
			if err := tx.Where("id = ?", item.AssetID).First(&asset).Error; err == nil {
				assetUpdated := false
				if item.Status == "Missing" {
					asset.State = "Lost"
					assetUpdated = true
				} else if item.Status == "Damaged" {
					asset.Condition = "Damaged"
					assetUpdated = true
				}

				if assetUpdated {
					tx.Save(&asset)
				}
			}
		}

		return nil
	})

	if err != nil {
		if err.Error() == "audit cycle not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Audit cycle closed and asset statuses updated"})
}
