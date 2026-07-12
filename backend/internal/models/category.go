package models

import "time"

type Category struct {
	ID           string `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name         string `gorm:"uniqueIndex;not null"`
	Description  string
	CustomFields string `gorm:"type:jsonb"` // To store optional fields like warranty
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
