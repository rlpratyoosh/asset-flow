package middleware

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rlpratyoosh/asset-flow/internal/auth"
	"github.com/rlpratyoosh/asset-flow/internal/database"
	"github.com/rlpratyoosh/asset-flow/internal/models"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		accessToken, err := c.Cookie("access_token")
		var claims *auth.Claims
		var validAccess bool

		if err == nil {
			claims, err = auth.ValidateToken(accessToken)
			if err == nil {
				validAccess = true
			}
		}

		if !validAccess {
			refreshToken, err := c.Cookie("refresh_token")
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
				c.Abort()
				return
			}

			var session models.Session
			if err := database.DB.Where("refresh_token = ?", refreshToken).First(&session).Error; err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: session not found"})
				c.Abort()
				return
			}

			claims, err = auth.ValidateToken(refreshToken)
			if err != nil {
				database.DB.Delete(&session)
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: invalid token"})
				c.Abort()
				return
			}

			newAccess, newRefresh, err := auth.GenerateTokens(claims.UserID, claims.Username)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to rotate tokens"})
				c.Abort()
				return
			}

			session.RefreshToken = newRefresh
			session.ExpiresAt = time.Now().Add(7 * 24 * time.Hour).Unix()
			database.DB.Save(&session)

			c.SetCookie("access_token", newAccess, 15*60, "/", "", false, true)
			c.SetCookie("refresh_token", newRefresh, 7*24*60*60, "/", "", false, true)
		}

		c.Set("userID", claims.UserID)

		var user models.User
		if err := database.DB.Where("id = ?", claims.UserID).First(&user).Error; err == nil {
			c.Set("role", string(user.Role))
			if user.DepartmentID != nil {
				c.Set("deptID", *user.DepartmentID)
			} else {
				c.Set("deptID", "")
			}
		} else {
			c.Set("role", string(models.RoleEmployee))
			c.Set("deptID", "")
		}

		c.Next()
	}
}
