//go:build ignore

package main

import (
	"log"
	"time"

	"github.com/joho/godotenv"
	"github.com/rlpratyoosh/asset-flow/internal/auth"
	"github.com/rlpratyoosh/asset-flow/internal/database"
	"github.com/rlpratyoosh/asset-flow/internal/models"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using defaults")
	}

	log.Println("Connecting to database...")
	database.Connect()

	log.Println("Seeding Departments...")
	departments := []models.Department{
		{Name: "IT", Status: "Active"},
		{Name: "Engineering", Status: "Active"},
		{Name: "Sales", Status: "Active"},
		{Name: "HR", Status: "Active"},
	}

	for i := range departments {
		if err := database.DB.Where("name = ?", departments[i].Name).FirstOrCreate(&departments[i]).Error; err != nil {
			log.Fatalf("Failed to seed department %s: %v", departments[i].Name, err)
		}
	}

	log.Println("Seeding Users...")
	passwordHash, _ := auth.HashPassword("password")

	users := []models.User{
		{Username: "admin", Email: "admin@assetflow.local", FullName: "System Admin", Role: models.RoleAdmin, PasswordHash: passwordHash, DepartmentID: &departments[0].ID},
		{Username: "manager", Email: "manager@assetflow.local", FullName: "Asset Manager", Role: models.RoleAssetManager, PasswordHash: passwordHash, DepartmentID: &departments[0].ID},
		{Username: "eng_head", Email: "eng_head@assetflow.local", FullName: "Engineering Head", Role: models.RoleDepartmentHead, PasswordHash: passwordHash, DepartmentID: &departments[1].ID},
		{Username: "emp1", Email: "emp1@assetflow.local", FullName: "Alice (Eng)", Role: models.RoleEmployee, PasswordHash: passwordHash, DepartmentID: &departments[1].ID},
		{Username: "emp2", Email: "emp2@assetflow.local", FullName: "Bob (Sales)", Role: models.RoleEmployee, PasswordHash: passwordHash, DepartmentID: &departments[2].ID},
	}

	for i := range users {
		if err := database.DB.Where("username = ?", users[i].Username).FirstOrCreate(&users[i]).Error; err != nil {
			log.Fatalf("Failed to seed user %s: %v", users[i].Username, err)
		}
	}

	log.Println("Seeding Categories...")
	categories := []models.Category{
		{Name: "Laptops", Description: "Workstation laptops", CustomFields: "{}"},
		{Name: "Monitors", Description: "External displays", CustomFields: "{}"},
		{Name: "Furniture", Description: "Desks and chairs", CustomFields: "{}"},
		{Name: "Vehicles", Description: "Company cars and vans", CustomFields: "{}"},
		{Name: "Test Equipment", Description: "Engineering testing rigs", CustomFields: "{}"},
	}

	for i := range categories {
		if err := database.DB.Where("name = ?", categories[i].Name).FirstOrCreate(&categories[i]).Error; err != nil {
			log.Fatalf("Failed to seed category %s: %v", categories[i].Name, err)
		}
	}

	log.Println("Seeding Assets...")
	assets := []models.Asset{
		{
			AssetTag:        "AF-001",
			Name:            "Macbook Pro 16",
			CategoryID:      categories[0].ID,
			AcquisitionDate: time.Now().AddDate(-1, 0, 0),
			AcquisitionCost: 2500.0,
			Condition:       "Excellent",
			Location:        "HQ - Floor 2",
			IsShared:        false,
			State:           "Available",
		},
		{
			AssetTag:        "AF-002",
			Name:            "Herman Miller Chair",
			CategoryID:      categories[2].ID,
			AcquisitionDate: time.Now().AddDate(-2, 0, 0),
			AcquisitionCost: 1200.0,
			Condition:       "Good",
			Location:        "HQ - Floor 2",
			IsShared:        false,
			State:           "Available",
		},
		{
			AssetTag:        "AF-003",
			Name:            "Dell UltraSharp 27\"",
			CategoryID:      categories[1].ID,
			AcquisitionDate: time.Now().AddDate(0, -6, 0),
			AcquisitionCost: 400.0,
			Condition:       "Good",
			Location:        "HQ - Storage",
			IsShared:        false,
			State:           "Available",
		},
		{
			AssetTag:        "AF-004",
			Name:            "Conference Room Display",
			CategoryID:      categories[1].ID,
			AcquisitionDate: time.Now().AddDate(-3, 0, 0),
			AcquisitionCost: 1500.0,
			Condition:       "Good",
			Location:        "HQ - Boardroom",
			IsShared:        true,
			State:           "Available",
		},
		{
			AssetTag:        "AF-005",
			Name:            "Delivery Van",
			CategoryID:      categories[3].ID,
			AcquisitionDate: time.Now().AddDate(-4, 0, 0),
			AcquisitionCost: 35000.0,
			Condition:       "Damaged",
			Location:        "Warehouse",
			IsShared:        true,
			State:           "Available",
		},
	}

	for i := range assets {
		if err := database.DB.Where("asset_tag = ?", assets[i].AssetTag).FirstOrCreate(&assets[i]).Error; err != nil {
			log.Fatalf("Failed to seed asset %s: %v", assets[i].AssetTag, err)
		}
	}

	log.Println("Seeding Allocations...")
	// Allocate AF-001 and AF-002 to emp1 (Alice)
	allocations := []models.Allocation{
		{
			AssetID:            assets[0].ID,
			AssignedToUserID:   &users[3].ID,
			ExpectedReturnDate: time.Now().AddDate(1, 0, 0),
		},
		{
			AssetID:            assets[1].ID,
			AssignedToUserID:   &users[3].ID,
			ExpectedReturnDate: time.Now().AddDate(1, 0, 0),
		},
	}

	for i := range allocations {
		// Just try to insert them, ignoring errors for re-runs
		database.DB.FirstOrCreate(&allocations[i], models.Allocation{AssetID: allocations[i].AssetID})

		// Update asset state
		database.DB.Model(&models.Asset{}).Where("id = ?", allocations[i].AssetID).Update("state", "Allocated")
	}

	log.Println("Seeding Transfer Requests...")
	transfer := models.TransferRequest{
		AssetID:       assets[1].ID, // Herman Miller Chair
		RequestedByID: users[4].ID,  // Bob
		Status:        "Pending",
	}
	database.DB.FirstOrCreate(&transfer, models.TransferRequest{AssetID: transfer.AssetID, RequestedByID: transfer.RequestedByID})

	log.Println("Seeding Bookings...")
	booking := models.Booking{
		AssetID:    assets[3].ID, // Conference Room Display
		BookedByID: users[3].ID,  // Alice
		StartTime:  time.Now().AddDate(0, 0, 1),
		EndTime:    time.Now().AddDate(0, 0, 1).Add(2 * time.Hour),
		Status:     "Approved",
	}
	database.DB.FirstOrCreate(&booking, models.Booking{AssetID: booking.AssetID, BookedByID: booking.BookedByID})
	database.DB.Model(&models.Asset{}).Where("id = ?", booking.AssetID).Update("state", "Reserved")

	log.Println("Seeding Maintenance Requests...")
	maintenance := models.MaintenanceRequest{
		AssetID:       assets[4].ID, // Delivery Van
		RaisedByID:    users[4].ID,  // Bob
		IssueDesc:     "Engine knocking sound",
		Priority:      "High",
		Status:        "In Progress",
	}
	database.DB.FirstOrCreate(&maintenance, models.MaintenanceRequest{AssetID: maintenance.AssetID, RaisedByID: maintenance.RaisedByID})
	database.DB.Model(&models.Asset{}).Where("id = ?", maintenance.AssetID).Update("state", "Under Maintenance")

	log.Println("Seeding Audits...")
	audit := models.AuditCycle{
		StartDate: time.Now().AddDate(0, -1, 0),
		EndDate:   time.Now().AddDate(0, 1, 0),
		Status:    "Active",
	}
	database.DB.FirstOrCreate(&audit, models.AuditCycle{Status: "Active"})
	
	// Add Alice & Bob as auditors
	database.DB.Model(&audit).Association("Auditors").Append(&users[3], &users[4])

	auditItem := models.AuditItem{
		AuditCycleID: audit.ID,
		AssetID:      assets[1].ID, // Chair
		Status:       "Verified",
	}
	database.DB.FirstOrCreate(&auditItem, models.AuditItem{AuditCycleID: auditItem.AuditCycleID, AssetID: auditItem.AssetID})

	log.Println("Seeding Activity Logs & Notifications...")
	database.DB.Create(&models.ActivityLog{
		UserID:   users[1].ID, // Manager
		Action:   "AuditCycleStarted",
		Entity:   "AuditCycle",
		EntityID: audit.ID,
	})
	database.DB.Create(&models.Notification{
		UserID:  users[4].ID, // Bob
		Message: "Your transfer request for Herman Miller Chair is pending approval.",
		Type:    "TransferRequest",
	})
	database.DB.Create(&models.Notification{
		UserID:  users[3].ID, // Alice
		Message: "You have been assigned to Q3 Vehicle & Furniture Audit.",
		Type:    "AuditAssignment",
	})

	log.Println("Database seeded successfully!")
}
