package models

import "time"

type Asset struct {
	ID        string `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	AssetTag  string `gorm:"uniqueIndex;not null"`
	Name      string `gorm:"not null"`
	State     string `gorm:"not null;default:'Available'"` // Available, Allocated, Under Maintenance
	CreatedAt time.Time
	UpdatedAt time.Time
}
