package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"sync"
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
		Name            string    `json:"name" binding:"required"`
		CategoryID      string    `json:"category_id" binding:"required"`
		SerialNumber    string    `json:"serial_number"`
		AcquisitionDate time.Time `json:"acquisition_date"`
		AcquisitionCost float64   `json:"acquisition_cost"`
		Condition       string    `json:"condition"`
		Location        string    `json:"location"`
		PhotoURL        string    `json:"photo_url"`
		IsShared        bool      `json:"is_shared"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Condition == "" {
		req.Condition = "Good"
	}

	var lastAsset models.Asset
	database.DB.Unscoped().Order("asset_tag desc").First(&lastAsset)
	nextID := 1
	if lastAsset.AssetTag != "" && len(lastAsset.AssetTag) > 3 {
		if id, err := strconv.Atoi(lastAsset.AssetTag[3:]); err == nil {
			nextID = id + 1
		}
	}
	assetTag := fmt.Sprintf("AF-%04d", nextID)

	asset := models.Asset{
		AssetTag:        assetTag,
		Name:            req.Name,
		CategoryID:      req.CategoryID,
		SerialNumber:    req.SerialNumber,
		AcquisitionDate: req.AcquisitionDate,
		AcquisitionCost: req.AcquisitionCost,
		Condition:       req.Condition,
		Location:        req.Location,
		PhotoURL:        req.PhotoURL,
		IsShared:        req.IsShared,
		State:           "Available",
	}

	if err := database.DB.Create(&asset).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create asset"})
		return
	}

	c.JSON(http.StatusCreated, asset)
}

func ListAssets(c *gin.Context) {
	q := c.Query("q")
	categoryID := c.Query("category_id")
	state := c.Query("state")
	location := c.Query("location")

	query := database.DB.Model(&models.Asset{}).Preload("Category")

	if q != "" {
		query = query.Where("asset_tag ILIKE ? OR name ILIKE ? OR serial_number ILIKE ?", "%"+q+"%", "%"+q+"%", "%"+q+"%")
	}

	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	if state != "" {
		query = query.Where("state = ?", state)
	}

	if location != "" {
		query = query.Where("location ILIKE ?", "%"+location+"%")
	}

	var assets []models.Asset
	if err := query.Find(&assets).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assets"})
		return
	}

	c.JSON(http.StatusOK, assets)
}

func AllocateAsset(c *gin.Context) {
	role := c.GetString("role")
	if role != string(models.RoleAssetManager) && role != string(models.RoleDepartmentHead) && role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: insufficient permissions"})
		return
	}

	assetID := c.Param("id")

	var req struct {
		AssignedToUserID   *string   `json:"assigned_to_user_id"`
		AssignedToDeptID   *string   `json:"assigned_to_dept_id"`
		ExpectedReturnDate time.Time `json:"expected_return_date"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.AssignedToUserID == nil && req.AssignedToDeptID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Must assign to either a user or department"})
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
			AssignedToUserID:   req.AssignedToUserID,
			AssignedToDeptID:   req.AssignedToDeptID,
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

func AssetHistory(c *gin.Context) {
	assetID := c.Param("id")

	var allocations []models.Allocation
	var maintenance []models.MaintenanceRequest

	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		database.DB.Where("asset_id = ?", assetID).Order("created_at desc").Find(&allocations)
	}()

	go func() {
		defer wg.Done()
		database.DB.Where("asset_id = ?", assetID).Order("created_at desc").Find(&maintenance)
	}()

	wg.Wait()

	if allocations == nil {
		allocations = []models.Allocation{}
	}
	if maintenance == nil {
		maintenance = []models.MaintenanceRequest{}
	}

	c.JSON(http.StatusOK, gin.H{
		"allocations": allocations,
		"maintenance": maintenance,
	})
}

func RequestTransfer(c *gin.Context) {
	assetID := c.Param("id")
	userID := c.GetString("userID")

	var asset models.Asset
	if err := database.DB.Where("id = ?", assetID).First(&asset).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Asset not found"})
		return
	}

	if asset.State == "Available" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Asset is available, please allocate directly"})
		return
	}

	transfer := models.TransferRequest{
		AssetID:       assetID,
		RequestedByID: userID,
		Status:        "Pending",
	}

	if err := database.DB.Create(&transfer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transfer request"})
		return
	}

	c.JSON(http.StatusCreated, transfer)
}

func ApproveTransfer(c *gin.Context) {
	role := c.GetString("role")
	if role != string(models.RoleAssetManager) && role != string(models.RoleDepartmentHead) && role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: insufficient permissions"})
		return
	}

	requestID := c.Param("request_id")
	approverID := c.GetString("userID")

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var transfer models.TransferRequest
		if err := tx.Where("id = ?", requestID).First(&transfer).Error; err != nil {
			return fmt.Errorf("transfer request not found")
		}

		if transfer.Status != "Pending" {
			return fmt.Errorf("transfer request is already %s", transfer.Status)
		}

		// Update transfer request
		transfer.Status = "Approved"
		transfer.ApprovedByID = &approverID
		if err := tx.Save(&transfer).Error; err != nil {
			return err
		}

		// Return the old allocation
		now := time.Now()
		var oldAllocation models.Allocation
		if err := tx.Where("asset_id = ? AND returned_at IS NULL", transfer.AssetID).First(&oldAllocation).Error; err == nil {
			oldAllocation.ReturnedAt = &now
			oldAllocation.ReturnNotes = "Auto-returned via transfer"
			if err := tx.Save(&oldAllocation).Error; err != nil {
				return err
			}
		}

		// Create a new allocation for the requester (no expected return date by default, can be updated later)
		newAllocation := models.Allocation{
			AssetID:          transfer.AssetID,
			AssignedToUserID: &transfer.RequestedByID,
		}
		if err := tx.Create(&newAllocation).Error; err != nil {
			return err
		}

		// Ensure asset remains Allocated
		var asset models.Asset
		if err := tx.Where("id = ?", transfer.AssetID).First(&asset).Error; err != nil {
			return err
		}
		asset.State = "Allocated"
		if err := tx.Save(&asset).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		if err.Error() == "transfer request not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transfer approved and asset re-allocated successfully"})
}

func ListTransferRequests(c *gin.Context) {
	role := c.GetString("role")
	deptID := c.GetString("deptID")
	userID := c.GetString("userID")

	query := database.DB.Model(&models.TransferRequest{})

	if role == string(models.RoleEmployee) {
		query = query.Where("requested_by_id = ?", userID)
	} else if role == string(models.RoleDepartmentHead) && deptID != "" {
		// Department head sees transfers requested by their employees
		query = query.Joins("JOIN users ON users.id = transfer_requests.requested_by_id").
			Where("users.department_id = ?", deptID)
	}

	var requests []models.TransferRequest
	if err := query.Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transfer requests"})
		return
	}

	c.JSON(http.StatusOK, requests)
}
