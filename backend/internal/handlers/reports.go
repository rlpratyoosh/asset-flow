package handlers

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rlpratyoosh/asset-flow/internal/database"
	"github.com/rlpratyoosh/asset-flow/internal/models"
)

// GetDepreciationReport handles GET /api/v1/reports/depreciation
func GetDepreciationReport(c *gin.Context) {
	assets := []models.Asset{}
	if err := database.DB.Preload("Category").Find(&assets).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assets"})
		return
	}

	type DepreciationEntry struct {
		AssetID         string  `json:"asset_id"`
		AssetTag        string  `json:"asset_tag"`
		Name            string  `json:"name"`
		CategoryName    string  `json:"category_name"`
		AcquisitionCost float64 `json:"acquisition_cost"`
		CurrentValue    float64 `json:"current_value"`
		AgeInYears      float64 `json:"age_in_years"`
	}

	report := []DepreciationEntry{}
	now := time.Now()
	expectedLifeYears := 5.0 // Standard 5 year lifespan assumption for simplicity

	for _, asset := range assets {
		if asset.AcquisitionDate.IsZero() {
			continue // skip assets without an acquisition date
		}

		ageInYears := now.Sub(asset.AcquisitionDate).Hours() / (24 * 365.25)
		if ageInYears < 0 {
			ageInYears = 0
		}

		currentValue := asset.AcquisitionCost
		if ageInYears >= expectedLifeYears {
			currentValue = 0 // fully depreciated
		} else {
			depreciation := asset.AcquisitionCost * (ageInYears / expectedLifeYears)
			currentValue = asset.AcquisitionCost - depreciation
		}

		catName := "Unknown"
		if asset.Category != nil {
			catName = asset.Category.Name
		}

		report = append(report, DepreciationEntry{
			AssetID:         asset.ID,
			AssetTag:        asset.AssetTag,
			Name:            asset.Name,
			CategoryName:    catName,
			AcquisitionCost: asset.AcquisitionCost,
			CurrentValue:    currentValue,
			AgeInYears:      ageInYears,
		})
	}

	c.JSON(http.StatusOK, report)
}

// GetConditionSummary handles GET /api/v1/reports/condition
func GetConditionSummary(c *gin.Context) {
	type Result struct {
		Condition string `json:"condition"`
		Count     int    `json:"count"`
	}

	results := []Result{}
	if err := database.DB.Model(&models.Asset{}).
		Select("condition, count(*) as count").
		Group("condition").
		Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch condition summary"})
		return
	}

	c.JSON(http.StatusOK, results)
}

// GetAllocationSummary handles GET /api/v1/reports/allocation
func GetAllocationSummary(c *gin.Context) {
	type Result struct {
		DepartmentName string `json:"department_name"`
		AssetCount     int    `json:"asset_count"`
	}

	results := []Result{}
	query := `
		SELECT d.name as department_name, COUNT(a.id) as asset_count
		FROM allocations aa
		JOIN users u ON u.id = aa.assigned_to_user_id
		JOIN departments d ON d.id = u.department_id
		JOIN assets a ON a.id = aa.asset_id
		WHERE aa.returned_at IS NULL
		GROUP BY d.name
	`
	if err := database.DB.Raw(query).Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch allocation summary"})
		return
	}

	c.JSON(http.StatusOK, results)
}

// ExportReport handles GET /api/v1/reports/export
func ExportReport(c *gin.Context) {
	format := c.Query("format") // "json" or "csv"

	var assets []models.Asset
	if err := database.DB.Preload("Category").Find(&assets).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assets"})
		return
	}

	if format == "csv" {
		var buf bytes.Buffer
		writer := csv.NewWriter(&buf)

		// Header
		writer.Write([]string{"AssetTag", "Name", "Category", "Condition", "State", "AcquisitionCost", "AcquisitionDate"})

		for _, a := range assets {
			catName := ""
			if a.Category != nil {
				catName = a.Category.Name
			}
			dateStr := ""
			if !a.AcquisitionDate.IsZero() {
				dateStr = a.AcquisitionDate.Format("2006-01-02")
			}
			writer.Write([]string{
				a.AssetTag,
				a.Name,
				catName,
				a.Condition,
				a.State,
				fmt.Sprintf("%.2f", a.AcquisitionCost),
				dateStr,
			})
		}
		writer.Flush()

		c.Header("Content-Disposition", "attachment; filename=assets_report.csv")
		c.Data(http.StatusOK, "text/csv", buf.Bytes())
		return
	}

	// Default JSON
	c.JSON(http.StatusOK, assets)
}
