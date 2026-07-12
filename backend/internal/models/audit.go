package models

import "time"

type AuditCycle struct {
	ID          string  `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ScopeDeptID *string // Null if location-based
	StartDate   time.Time
	EndDate     time.Time
	Status      string `gorm:"default:'Active'"` // Active, Closed
	// GORM many-to-many for Auditors
	Auditors []User `gorm:"many2many:audit_cycle_auditors;"`
}

type AuditItem struct {
	ID           string `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	AuditCycleID string `gorm:"not null;index"`
	AssetID      string `gorm:"not null"`
	Status       string `gorm:"not null"` // Verified, Missing, Damaged
}
