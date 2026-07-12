package models

import "time"

type Allocation struct {
	ID                 string  `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	AssetID            string  `gorm:"not null;index"`
	AssignedToUserID   *string `gorm:"index"` // Nullable: can be assigned to User OR Dept
	AssignedToDeptID   *string `gorm:"index"`
	ExpectedReturnDate time.Time
	ReturnedAt         *time.Time // If null, the allocation is active. If set, it's returned.
	ReturnNotes        string     // Condition check-in notes
	CreatedAt          time.Time
}

type TransferRequest struct {
	ID            string  `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	AssetID       string  `gorm:"not null;index"`
	RequestedByID string  `gorm:"not null"` // User requesting it
	ApprovedByID  *string // Asset Manager or Dept Head
	Status        string  `gorm:"not null;default:'Pending'"` // Pending, Approved, Rejected
	CreatedAt     time.Time
}
