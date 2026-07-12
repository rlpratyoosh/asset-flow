package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/rlpratyoosh/asset-flow/internal/auth"
	"github.com/rlpratyoosh/asset-flow/internal/database"
	"github.com/rlpratyoosh/asset-flow/internal/handlers"
	"github.com/rlpratyoosh/asset-flow/internal/middleware"
)

var PORT string
var ENV string
var FRONTEND_URL string

func main() {
	r := gin.Default()
	r.SetTrustedProxies(nil)

	err := godotenv.Load()
	if err == nil {
		PORT = os.Getenv("PORT")
		if PORT == "" {
			fmt.Println("Warning: Failed to get PORT, defaulting to 8080")
			PORT = "8080"
		}

		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret != "" {
			auth.JWTSecret = []byte(jwtSecret)
		} else {
			fmt.Println("Warning: JWT_SECRET not found in .env, using default")
		}

		ENV = os.Getenv("ENV")
		FRONTEND_URL = os.Getenv("FRONTEND_URL")
	} else {
		fmt.Println("Warning: .env file not found, using defaults")
		PORT = "8080"
	}

	database.Connect()

	r.Use(middleware.CORSMiddleware(ENV, FRONTEND_URL))

	v1 := r.Group("/api/v1")
	v1.Use(middleware.CSRFMiddleware())
	{
		v1.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"message": "pong",
			})
		})

		v1.GET("/csrf-token", handlers.CSRFToken)

		v1.POST("/register", handlers.Register)
		v1.POST("/login", handlers.Login)
		v1.POST("/logout", handlers.Logout)

		v1.GET("/me", middleware.AuthMiddleware(), handlers.Me)
		v1.GET("/dashboard", middleware.AuthMiddleware(), handlers.Dashboard)

		v1.POST("/assets", middleware.AuthMiddleware(), handlers.RegisterAsset)
		v1.GET("/assets", middleware.AuthMiddleware(), handlers.ListAssets)
		v1.GET("/assets/:id/history", middleware.AuthMiddleware(), handlers.AssetHistory)
		v1.POST("/assets/:id/allocate", middleware.AuthMiddleware(), handlers.AllocateAsset)
		v1.POST("/assets/:id/return", middleware.AuthMiddleware(), handlers.ReturnAsset)

		// Asset Transfer requests
		v1.POST("/assets/:id/transfer", middleware.AuthMiddleware(), handlers.RequestTransfer)
		v1.POST("/assets/transfers/:request_id/approve", middleware.AuthMiddleware(), handlers.ApproveTransfer)
		v1.GET("/assets/transfers", middleware.AuthMiddleware(), handlers.ListTransferRequests)

		// Resource Bookings
		v1.GET("/bookings", middleware.AuthMiddleware(), handlers.ListBookings)
		v1.POST("/bookings", middleware.AuthMiddleware(), handlers.CreateBooking)
		v1.PUT("/bookings/:id/cancel", middleware.AuthMiddleware(), handlers.CancelBooking)
		v1.PUT("/bookings/:id/reschedule", middleware.AuthMiddleware(), handlers.RescheduleBooking)

		// Maintenance Management
		v1.GET("/maintenance", middleware.AuthMiddleware(), handlers.ListMaintenanceRequests)
		v1.POST("/maintenance", middleware.AuthMiddleware(), handlers.RaiseMaintenanceRequest)
		v1.PUT("/maintenance/:id/status", middleware.AuthMiddleware(), handlers.UpdateMaintenanceStatus)

		// Audit Management
		v1.GET("/audits", middleware.AuthMiddleware(), handlers.ListAuditCycles)
		v1.POST("/audits", middleware.AuthMiddleware(), handlers.CreateAuditCycle)
		v1.GET("/audits/:id/items", middleware.AuthMiddleware(), handlers.GetAuditItems)
		v1.POST("/audits/:id/items", middleware.AuthMiddleware(), handlers.LogAuditItem)
		v1.PUT("/audits/:id/close", middleware.AuthMiddleware(), handlers.CloseAuditCycle)

		// Reports & Analytics
		v1.GET("/reports/depreciation", middleware.AuthMiddleware(), handlers.GetDepreciationReport)
		v1.GET("/reports/condition", middleware.AuthMiddleware(), handlers.GetConditionSummary)
		v1.GET("/reports/allocation", middleware.AuthMiddleware(), handlers.GetAllocationSummary)
		v1.GET("/reports/export", middleware.AuthMiddleware(), handlers.ExportReport)

		// Activity Logs & Notifications
		v1.GET("/logs", middleware.AuthMiddleware(), handlers.ListActivityLogs)
		v1.GET("/notifications", middleware.AuthMiddleware(), handlers.ListNotifications)
		v1.PUT("/notifications/:id/read", middleware.AuthMiddleware(), handlers.MarkNotificationRead)

		// Organization Setup
		v1.GET("/departments", middleware.AuthMiddleware(), handlers.ListDepartments)
		v1.POST("/departments", middleware.AuthMiddleware(), handlers.CreateDepartment)
		v1.PUT("/departments/:id", middleware.AuthMiddleware(), handlers.UpdateDepartment)
		v1.DELETE("/departments/:id", middleware.AuthMiddleware(), handlers.DeleteDepartment)

		v1.GET("/categories", middleware.AuthMiddleware(), handlers.ListCategories)
		v1.POST("/categories", middleware.AuthMiddleware(), handlers.CreateCategory)
		v1.PUT("/categories/:id", middleware.AuthMiddleware(), handlers.UpdateCategory)
		v1.DELETE("/categories/:id", middleware.AuthMiddleware(), handlers.DeleteCategory)

		v1.GET("/users", middleware.AuthMiddleware(), handlers.ListUsers)
		v1.PUT("/users/:id/role", middleware.AuthMiddleware(), handlers.UpdateUserRole)
		v1.DELETE("/users/:id", middleware.AuthMiddleware(), handlers.DeleteUser)
	}

	r.Static("/pfp", "./pfp")

	r.Run(":" + PORT)
}
