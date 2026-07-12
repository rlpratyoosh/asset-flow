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

// ListBookings handles GET /api/v1/bookings
func ListBookings(c *gin.Context) {
	assetID := c.Query("asset_id")
	userID := c.Query("user_id")

	query := database.DB.Model(&models.Booking{})
	if assetID != "" {
		query = query.Where("asset_id = ?", assetID)
	}
	if userID != "" {
		query = query.Where("booked_by_id = ?", userID)
	}

	var bookings []models.Booking
	// Sort by start time ascending for calendar view
	if err := query.Order("start_time asc").Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookings"})
		return
	}

	c.JSON(http.StatusOK, bookings)
}

// CreateBooking handles POST /api/v1/bookings
func CreateBooking(c *gin.Context) {
	userID := c.GetString("userID")

	var req struct {
		AssetID   string    `json:"asset_id" binding:"required"`
		StartTime time.Time `json:"start_time" binding:"required"`
		EndTime   time.Time `json:"end_time" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !req.EndTime.After(req.StartTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "End time must be after start time"})
		return
	}

	if req.StartTime.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot book in the past"})
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var asset models.Asset
		if err := tx.Where("id = ?", req.AssetID).First(&asset).Error; err != nil {
			return fmt.Errorf("asset not found")
		}

		if !asset.IsShared {
			return fmt.Errorf("asset is not a shared/bookable resource")
		}

		// Overlap validation
		var count int64
		if err := tx.Model(&models.Booking{}).
			Where("asset_id = ? AND status IN (?, ?) AND start_time < ? AND end_time > ?",
				req.AssetID, "Upcoming", "Ongoing", req.EndTime, req.StartTime).
			Count(&count).Error; err != nil {
			return err
		}

		if count > 0 {
			return fmt.Errorf("time slot overlaps with an existing booking")
		}

		booking := models.Booking{
			AssetID:    req.AssetID,
			BookedByID: userID,
			StartTime:  req.StartTime,
			EndTime:    req.EndTime,
			Status:     "Upcoming",
		}

		if err := tx.Create(&booking).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		if err.Error() == "time slot overlaps with an existing booking" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Resource booked successfully"})
}

// CancelBooking handles PUT /api/v1/bookings/:id/cancel
func CancelBooking(c *gin.Context) {
	bookingID := c.Param("id")
	userID := c.GetString("userID")
	role := c.GetString("role")

	var booking models.Booking
	if err := database.DB.Where("id = ?", bookingID).First(&booking).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	if booking.BookedByID != userID && role != string(models.RoleAdmin) && role != string(models.RoleAssetManager) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only cancel your own bookings"})
		return
	}

	if booking.Status != "Upcoming" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only upcoming bookings can be cancelled"})
		return
	}

	booking.Status = "Cancelled"
	if err := database.DB.Save(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel booking"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Booking cancelled successfully"})
}

// RescheduleBooking handles PUT /api/v1/bookings/:id/reschedule
func RescheduleBooking(c *gin.Context) {
	bookingID := c.Param("id")
	userID := c.GetString("userID")
	role := c.GetString("role")

	var req struct {
		StartTime time.Time `json:"start_time" binding:"required"`
		EndTime   time.Time `json:"end_time" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !req.EndTime.After(req.StartTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "End time must be after start time"})
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var booking models.Booking
		if err := tx.Where("id = ?", bookingID).First(&booking).Error; err != nil {
			return fmt.Errorf("booking not found")
		}

		if booking.BookedByID != userID && role != string(models.RoleAdmin) && role != string(models.RoleAssetManager) {
			return fmt.Errorf("forbidden: you can only reschedule your own bookings")
		}

		if booking.Status != "Upcoming" {
			return fmt.Errorf("only upcoming bookings can be rescheduled")
		}

		// Overlap validation (excluding this specific booking)
		var count int64
		if err := tx.Model(&models.Booking{}).
			Where("asset_id = ? AND id != ? AND status IN (?, ?) AND start_time < ? AND end_time > ?",
				booking.AssetID, booking.ID, "Upcoming", "Ongoing", req.EndTime, req.StartTime).
			Count(&count).Error; err != nil {
			return err
		}

		if count > 0 {
			return fmt.Errorf("time slot overlaps with an existing booking")
		}

		booking.StartTime = req.StartTime
		booking.EndTime = req.EndTime
		if err := tx.Save(&booking).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		if err.Error() == "time slot overlaps with an existing booking" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		} else if err.Error() == "forbidden: you can only reschedule your own bookings" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Booking rescheduled successfully"})
}
