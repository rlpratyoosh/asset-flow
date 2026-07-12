package models

import (
	"time"
)

type Role string

const (
	RoleAdmin          Role = "Admin"
	RoleAssetManager   Role = "AssetManager"
	RoleDepartmentHead Role = "DepartmentHead"
	RoleEmployee       Role = "Employee"
)

type User struct {
	ID           string `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	FullName     string `gorm:"not null"`
	Username     string `gorm:"uniqueIndex;not null"`
	PasswordHash string `gorm:"not null"`
	ProfilePic   string
	Role         Role   `gorm:"type:varchar(50);default:'Employee';not null"`
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
