package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rlpratyoosh/asset-flow/internal/database"
	"github.com/rlpratyoosh/asset-flow/internal/models"
)

// ListActivityLogs handles GET /api/v1/logs
func ListActivityLogs(c *gin.Context) {
	// Only Admin or AssetManager can view global activity logs
	role := c.GetString("role")
	if role != string(models.RoleAdmin) && role != string(models.RoleAssetManager) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: only Admin or Asset Manager can view logs"})
		return
	}

	query := database.DB.Model(&models.ActivityLog{})

	if action := c.Query("action"); action != "" {
		query = query.Where("action = ?", action)
	}
	if userID := c.Query("user_id"); userID != "" {
		query = query.Where("user_id = ?", userID)
	}
	if startDate := c.Query("start_date"); startDate != "" {
		if t, err := time.Parse(time.RFC3339, startDate); err == nil {
			query = query.Where("created_at >= ?", t)
		}
	}
	if endDate := c.Query("end_date"); endDate != "" {
		if t, err := time.Parse(time.RFC3339, endDate); err == nil {
			query = query.Where("created_at <= ?", t)
		}
	}

	var logs []models.ActivityLog
	if err := query.Order("created_at desc").Limit(100).Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch logs"})
		return
	}

	// For UI purposes, let's join user info manually or just send raw
	type LogResponse struct {
		ID        string    `json:"id"`
		UserID    string    `json:"user_id"`
		UserName  string    `json:"user_name"`
		Action    string    `json:"action"`
		Entity    string    `json:"entity"`
		EntityID  string    `json:"entity_id"`
		CreatedAt time.Time `json:"created_at"`
	}

	var responses []LogResponse
	for _, l := range logs {
		var user models.User
		userName := "Unknown"
		if err := database.DB.Where("id = ?", l.UserID).First(&user).Error; err == nil {
			userName = user.FullName
		}
		responses = append(responses, LogResponse{
			ID:        l.ID,
			UserID:    l.UserID,
			UserName:  userName,
			Action:    l.Action,
			Entity:    l.Entity,
			EntityID:  l.EntityID,
			CreatedAt: l.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, responses)
}

// ListNotifications handles GET /api/v1/notifications
func ListNotifications(c *gin.Context) {
	userID := c.GetString("userID")

	var notifications []models.Notification
	if err := database.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}

	c.JSON(http.StatusOK, notifications)
}

// MarkNotificationRead handles PUT /api/v1/notifications/:id/read
func MarkNotificationRead(c *gin.Context) {
	notificationID := c.Param("id")
	userID := c.GetString("userID")

	var notification models.Notification
	if err := database.DB.Where("id = ? AND user_id = ?", notificationID, userID).First(&notification).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	notification.IsRead = true
	if err := database.DB.Save(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

// LogActivity is a helper function to be called from other handlers to log actions
func LogActivity(userID, action, entity, entityID string) {
	log := models.ActivityLog{
		UserID:   userID,
		Action:   action,
		Entity:   entity,
		EntityID: entityID,
	}
	database.DB.Create(&log)
}

// CreateNotification is a helper function to be called from other handlers to create a notification
func CreateNotification(userID, message, notifType string) {
	n := models.Notification{
		UserID:  userID,
		Message: message,
		Type:    notifType,
	}
	database.DB.Create(&n)
}
