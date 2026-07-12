package models

import "time"

type Notification struct {
	ID        string `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID    string `gorm:"not null;index"` // Who gets the alert
	Message   string `gorm:"not null"`
	Type      string `gorm:"not null"` // e.g., 'Overdue', 'MaintenanceApproved'
	IsRead    bool   `gorm:"default:false"`
	CreatedAt time.Time
}

type ActivityLog struct {
	ID        string `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID    string `gorm:"not null"` // Who did it
	Action    string `gorm:"not null"` // What they did
	Entity    string `gorm:"not null"` // Asset, Booking, etc.
	EntityID  string `gorm:"not null"`
	CreatedAt time.Time
}
