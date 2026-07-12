package models

import (
	"time"
)

type User struct {
	ID           string `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	FullName     string `gorm:"not null"`
	Username     string `gorm:"uniqueIndex;not null"`
	PasswordHash string `gorm:"not null"`
	ProfilePic   string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type Session struct {
	ID           string `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID       string `gorm:"index"`
	RefreshToken string `gorm:"uniqueIndex"`
	ExpiresAt    int64
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
