//go:build ignore

package main

import (
	"log"

	"github.com/joho/godotenv"
	"github.com/rlpratyoosh/asset-flow/internal/database"
	"github.com/rlpratyoosh/asset-flow/internal/models"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using defaults")
	}

	log.Println("Connecting to database...")
	database.Connect()

	log.Println("Running AutoMigrate...")
	err := database.DB.AutoMigrate(
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

	log.Println("Applying schema patches...")
	database.DB.Exec("ALTER TABLE sessions ALTER COLUMN id SET DEFAULT gen_random_uuid();")

	log.Println("Migration completed successfully!")
}
