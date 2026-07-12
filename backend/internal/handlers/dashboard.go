package handlers

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rlpratyoosh/asset-flow/internal/database"
	"github.com/rlpratyoosh/asset-flow/internal/models"
)

type DashboardResponse struct {
	Status string        `json:"status"`
	Data   DashboardData `json:"data"`
}

type DashboardData struct {
	KPIs               KPIs                  `json:"kpis"`
	OverdueAllocations []OverdueAllocation   `json:"overdue_allocations"`
	ActivityLogs       []ActivityLogResponse `json:"activity_logs"`
}

type KPIs struct {
	AssetsAvailable  int64 `json:"assets_available"`
	AssetsAllocated  int64 `json:"assets_allocated"`
	MaintenanceToday int64 `json:"maintenance_today"`
	ActiveBookings   int64 `json:"active_bookings"`
	PendingTransfers int64 `json:"pending_transfers"`
	UpcomingReturns  int64 `json:"upcoming_returns"`
	OverdueReturns   int64 `json:"overdue_returns"`
}

type OverdueAllocation struct {
	AllocationID       string `json:"allocation_id"`
	AssetTag           string `json:"asset_tag"`
	AssetName          string `json:"asset_name"`
	AssignedTo         string `json:"assigned_to"`
	ExpectedReturnDate string `json:"expected_return_date"`
	DaysOverdue        int    `json:"days_overdue"`
}

type ActivityLogResponse struct {
	LogID     string `json:"log_id"`
	UserID    string `json:"user_id"`
	Action    string `json:"action"`
	Entity    string `json:"entity"`
	EntityID  string `json:"entity_id"`
	CreatedAt string `json:"created_at"`
}

func Dashboard(c *gin.Context) {
	userID := c.GetString("userID")
	role := c.GetString("role")
	deptID := c.GetString("deptID")

	var kpis KPIs
	var overdueAllocations []OverdueAllocation
	var activityLogs []ActivityLogResponse
	var wg sync.WaitGroup

	db := database.DB

	assetScope := db.Model(&models.Asset{})
	allocationScope := db.Model(&models.Allocation{})
	bookingScope := db.Model(&models.Booking{})
	transferScope := db.Model(&models.TransferRequest{})
	maintenanceScope := db.Model(&models.MaintenanceRequest{})
	activityLogScope := db.Model(&models.ActivityLog{})

	if role == string(models.RoleEmployee) {
		allocationScope = allocationScope.Where("assigned_to_user_id = ?", userID)
		bookingScope = bookingScope.Where("booked_by_id = ?", userID)
		transferScope = transferScope.Where("requested_by_id = ?", userID)
		maintenanceScope = maintenanceScope.Where("raised_by_id = ?", userID)
		assetScope = assetScope.Joins("JOIN allocations ON allocations.asset_id = assets.id").Where("allocations.assigned_to_user_id = ? AND allocations.returned_at IS NULL", userID)
		activityLogScope = activityLogScope.Where("user_id = ?", userID)
	} else if role == string(models.RoleDepartmentHead) && deptID != "" {
		allocationScope = allocationScope.Where("assigned_to_dept_id = ?", deptID)
		assetScope = assetScope.Joins("JOIN allocations ON allocations.asset_id = assets.id").Where("allocations.assigned_to_dept_id = ? AND allocations.returned_at IS NULL", deptID)
		activityLogScope = activityLogScope.Joins("JOIN users ON users.id = activity_logs.user_id").Where("users.department_id = ?", deptID)
	}

	wg.Add(7)

	go func() {
		defer wg.Done()
		assetScope.Where("assets.state = ?", "Available").Count(&kpis.AssetsAvailable)
	}()
	go func() {
		defer wg.Done()
		assetScope.Where("assets.state = ?", "Allocated").Count(&kpis.AssetsAllocated)
	}()
	go func() {
		defer wg.Done()
		bookingScope.Where("status = ?", "Ongoing").Count(&kpis.ActiveBookings)
	}()
	go func() {
		defer wg.Done()
		transferScope.Where("status = ?", "Pending").Count(&kpis.PendingTransfers)
	}()

	now := time.Now()
	endOfDay := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 0, now.Location())
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	go func() {
		defer wg.Done()
		maintenanceScope.Where("created_at >= ? AND created_at <= ?", startOfDay, endOfDay).Count(&kpis.MaintenanceToday)
	}()

	go func() {
		defer wg.Done()
		allocationScope.Where("expected_return_date > ? AND expected_return_date <= ? AND returned_at IS NULL", now, endOfDay).Count(&kpis.UpcomingReturns)
	}()

	go func() {
		defer wg.Done()
		allocationScope.Where("expected_return_date < ? AND returned_at IS NULL", now).Count(&kpis.OverdueReturns)
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		type OverdueResult struct {
			AllocationID       string
			AssetTag           string
			AssetName          string
			AssignedTo         string
			ExpectedReturnDate time.Time
		}
		var results []OverdueResult

		query := db.Table("allocations").
			Select("allocations.id as allocation_id, assets.asset_tag, assets.name as asset_name, users.full_name as assigned_to, allocations.expected_return_date").
			Joins("JOIN assets ON assets.id = allocations.asset_id").
			Joins("LEFT JOIN users ON users.id = allocations.assigned_to_user_id").
			Where("allocations.expected_return_date < ? AND allocations.returned_at IS NULL", now)

		if role == string(models.RoleEmployee) {
			query = query.Where("allocations.assigned_to_user_id = ?", userID)
		} else if role == string(models.RoleDepartmentHead) && deptID != "" {
			query = query.Where("allocations.assigned_to_dept_id = ?", deptID)
		}

		query.Scan(&results)

		for _, r := range results {
			days := int(now.Sub(r.ExpectedReturnDate).Hours() / 24)
			overdueAllocations = append(overdueAllocations, OverdueAllocation{
				AllocationID:       r.AllocationID,
				AssetTag:           r.AssetTag,
				AssetName:          r.AssetName,
				AssignedTo:         r.AssignedTo,
				ExpectedReturnDate: r.ExpectedReturnDate.Format(time.RFC3339),
				DaysOverdue:        days,
			})
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		var logs []models.ActivityLog
		activityLogScope.Order("created_at desc").Limit(20).Find(&logs)

		for _, l := range logs {
			activityLogs = append(activityLogs, ActivityLogResponse{
				LogID:     l.ID,
				UserID:    l.UserID,
				Action:    l.Action,
				Entity:    l.Entity,
				EntityID:  l.EntityID,
				CreatedAt: l.CreatedAt.Format(time.RFC3339),
			})
		}
	}()

	wg.Wait()

	if overdueAllocations == nil {
		overdueAllocations = []OverdueAllocation{}
	}
	if activityLogs == nil {
		activityLogs = []ActivityLogResponse{}
	}

	c.JSON(http.StatusOK, DashboardResponse{
		Status: "success",
		Data: DashboardData{
			KPIs:               kpis,
			OverdueAllocations: overdueAllocations,
			ActivityLogs:       activityLogs,
		},
	})
}
