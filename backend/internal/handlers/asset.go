package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rlpratyoosh/asset-flow/internal/database"
	"github.com/rlpratyoosh/asset-flow/internal/models"
	"gorm.io/gorm"
)

func RegisterAsset(c *gin.Context) {
	role := c.GetString("role")
	if role != string(models.RoleAssetManager) && role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: insufficient permissions"})
		return
	}

	var req struct {
		Name            string  `json:"name" binding:"required"`
		CategoryID      string  `json:"category_id" binding:"required"`
		SerialNumber    string  `json:"serial_number"`
		Condition       string  `json:"condition"`
		Location        string  `json:"location"`
		IsShared        bool    `json:"is_shared"`
		AcquisitionCost float64 `json:"acquisition_cost"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Condition == "" {
		req.Condition = "Good"
	}

	var count int64
	database.DB.Model(&models.Asset{}).Count(&count)
	assetTag := fmt.Sprintf("AF-%04d", count+1)

	asset := models.Asset{
		AssetTag:        assetTag,
		Name:            req.Name,
		CategoryID:      req.CategoryID,
		SerialNumber:    req.SerialNumber,
		Condition:       req.Condition,
		Location:        req.Location,
		IsShared:        req.IsShared,
		AcquisitionCost: req.AcquisitionCost,
		State:           "Available",
	}

	if err := database.DB.Create(&asset).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create asset"})
		return
	}

	c.JSON(http.StatusCreated, asset)
}

func ListAssets(c *gin.Context) {
	search := c.Query("search")
	categoryID := c.Query("category_id")
	state := c.Query("state")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	query := database.DB.Model(&models.Asset{})

	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("name ILIKE ? OR asset_tag ILIKE ?", searchPattern, searchPattern)
	}

	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	if state != "" {
		query = query.Where("state = ?", state)
	}

	var total int64
	query.Count(&total)

	var assets []models.Asset
	if err := query.Offset(offset).Limit(limit).Order("created_at desc").Find(&assets).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assets"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  assets,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func AllocateAsset(c *gin.Context) {
	role := c.GetString("role")
	if role != string(models.RoleAssetManager) && role != string(models.RoleDepartmentHead) && role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: insufficient permissions"})
		return
	}

	assetID := c.Param("id")

	var req struct {
		AssignedToUserID   string    `json:"assigned_to_user_id" binding:"required"`
		ExpectedReturnDate time.Time `json:"expected_return_date" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var asset models.Asset
		if err := tx.Where("id = ?", assetID).First(&asset).Error; err != nil {
			return err // Will return 500 later, but handled below
		}

		if asset.State != "Available" {
			return fmt.Errorf("Asset is currently held/unavailable")
		}

		allocation := models.Allocation{
			AssetID:            assetID,
			AssignedToUserID:   &req.AssignedToUserID,
			ExpectedReturnDate: req.ExpectedReturnDate,
		}

		if err := tx.Create(&allocation).Error; err != nil {
			return err
		}

		asset.State = "Allocated"
		if err := tx.Save(&asset).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		if err.Error() == "Asset is currently held/unavailable" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Asset allocated successfully"})
}

func ReturnAsset(c *gin.Context) {
	role := c.GetString("role")
	if role != string(models.RoleAssetManager) && role != string(models.RoleDepartmentHead) && role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: insufficient permissions"})
		return
	}

	assetID := c.Param("id")

	var req struct {
		ReturnNotes string `json:"return_notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var allocation models.Allocation
		if err := tx.Where("asset_id = ? AND returned_at IS NULL", assetID).First(&allocation).Error; err != nil {
			return fmt.Errorf("active allocation not found")
		}

		now := time.Now()
		allocation.ReturnedAt = &now
		allocation.ReturnNotes = req.ReturnNotes

		if err := tx.Save(&allocation).Error; err != nil {
			return err
		}

		var asset models.Asset
		if err := tx.Where("id = ?", assetID).First(&asset).Error; err != nil {
			return err
		}

		asset.State = "Available"
		if err := tx.Save(&asset).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		if err.Error() == "active allocation not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Asset returned successfully"})
}
