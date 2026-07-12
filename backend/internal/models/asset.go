package models

import "time"

type Asset struct {
	ID              string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	AssetTag        string    `gorm:"uniqueIndex;not null"` // e.g., AF-0001
	Name            string    `gorm:"not null"`
	CategoryID      string    `gorm:"not null;index"`
	Category        *Category `gorm:"foreignKey:CategoryID"` // To load category name
	SerialNumber    string    `gorm:"index"`
	AcquisitionDate time.Time
	AcquisitionCost float64 // Kept for reports, not accounting
	Condition       string  `gorm:"default:'Good'"`
	Location        string  `gorm:"index"`
	PhotoURL        string  // Store the S3/Cloudinary URL, not the file blob
	IsShared        bool    `gorm:"default:false"`       // The "shared/bookable" flag
	State           string  `gorm:"default:'Available'"` // Available, Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed
	CreatedAt       time.Time
	UpdatedAt       time.Time
}
