package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/rlpratyoosh/asset-flow/internal/auth"
	"github.com/rlpratyoosh/asset-flow/internal/database"
	"github.com/rlpratyoosh/asset-flow/internal/handlers"
	"github.com/rlpratyoosh/asset-flow/internal/middleware"
	"github.com/rlpratyoosh/asset-flow/internal/models"
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

	err = database.DB.AutoMigrate(
		&models.User{},
		&models.Session{},
		&models.Department{},
		&models.Category{},
		&models.Asset{},
		&models.Allocation{},
		&models.TransferRequest{},
		&models.Booking{},
		&models.MaintenanceRequest{},
		&models.AuditCycle{},
		&models.AuditItem{},
		&models.Notification{},
		&models.ActivityLog{},
	)
	if err != nil {
		log.Fatalf("Auto-migration failed: %v", err)
	}

	// Workaround for GORM not updating existing columns with new default values
	database.DB.Exec("ALTER TABLE sessions ALTER COLUMN id SET DEFAULT gen_random_uuid();")

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

		// Organization Setup
		v1.GET("/departments", middleware.AuthMiddleware(), handlers.ListDepartments)
		v1.POST("/departments", middleware.AuthMiddleware(), handlers.CreateDepartment)
		v1.PUT("/departments/:id", middleware.AuthMiddleware(), handlers.UpdateDepartment)

		v1.GET("/categories", middleware.AuthMiddleware(), handlers.ListCategories)
		v1.POST("/categories", middleware.AuthMiddleware(), handlers.CreateCategory)
		v1.PUT("/categories/:id", middleware.AuthMiddleware(), handlers.UpdateCategory)

		v1.GET("/users", middleware.AuthMiddleware(), handlers.ListUsers)
		v1.PUT("/users/:id/role", middleware.AuthMiddleware(), handlers.UpdateUserRole)
	}

	r.Static("/pfp", "./pfp")

	r.Run(":" + PORT)
}
