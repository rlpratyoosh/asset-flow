package models

import "time"

type Asset struct {
	ID              string `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	AssetTag        string `gorm:"uniqueIndex;not null"`
	Name            string `gorm:"not null"`
	CategoryID      string `gorm:"not null"`
	SerialNumber    string
	Condition       string `gorm:"default:'Good'"`
	Location        string
	IsShared        bool   `gorm:"default:false"`                // If true, it's bookable by hour
	State           string `gorm:"not null;default:'Available'"` // Available, Allocated, Under Maintenance, Lost, Retired
	AcquisitionCost float64
	CreatedAt       time.Time
	UpdatedAt       time.Time
}
