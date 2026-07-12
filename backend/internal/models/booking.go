package models

import "time"

type Booking struct {
	ID         string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	AssetID    string    `gorm:"not null;index"`
	BookedByID string    `gorm:"not null"`
	StartTime  time.Time `gorm:"not null;index"`
	EndTime    time.Time `gorm:"not null"`
	Status     string    `gorm:"not null;default:'Upcoming'"` // Upcoming, Ongoing, Completed, Cancelled
	CreatedAt  time.Time
}
