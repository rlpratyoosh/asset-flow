package models

import "time"

type MaintenanceRequest struct {
	ID             string `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	AssetID        string `gorm:"not null;index"`
	RaisedByID     string `gorm:"not null"` // User who found the issue
	IssueDesc      string `gorm:"not null"`
	Priority       string `gorm:"not null"`
	PhotoURL       string
	Status         string `gorm:"not null;default:'Pending'"` // Pending, Approved, Rejected, In Progress, Resolved
	TechnicianName string // Assigned if approved
	CreatedAt      time.Time
	UpdatedAt      time.Time
}
