package models

import "time"

type Department struct {
	ID                 string  `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name               string  `gorm:"uniqueIndex;not null"`
	DepartmentHeadID   *string `gorm:"index"`
	ParentDepartmentID *string `gorm:"index"`
	Status             string  `gorm:"default:'Active'"` // Active or Inactive
	CreatedAt          time.Time
	UpdatedAt          time.Time
}
