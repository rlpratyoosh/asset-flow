package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rlpratyoosh/asset-flow/internal/auth"
	"github.com/rlpratyoosh/asset-flow/internal/database"
	"github.com/rlpratyoosh/asset-flow/internal/models"
)

func CSRFToken(c *gin.Context) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate CSRF token"})
		return
	}
	token := hex.EncodeToString(bytes)

	c.SetCookie("csrf_token", token, 3600*24, "/", "", false, false)
	c.JSON(http.StatusOK, gin.H{"csrf_token": token})
}

func Register(c *gin.Context) {
	fullName := c.PostForm("fullname")
	username := c.PostForm("username")
	password := c.PostForm("password")

	if fullName == "" || username == "" || password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "fullname, username, and password are required"})
		return
	}

	var existingUser models.User
	if err := database.DB.Where("username = ?", username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
		return
	}

	hashedPassword, err := auth.HashPassword(password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	pfp, err := c.FormFile("profile-pic")
	profilePicPath := ""

	if err == nil {
		err := os.MkdirAll("./pfp/", 0755)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create pfp directory"})
			return
		}
		dst := filepath.Join("./pfp/", fmt.Sprintf("%d_%s", time.Now().Unix(), filepath.Base(pfp.Filename)))
		if err := c.SaveUploadedFile(pfp, dst); err == nil {
			profilePicPath = dst[1:]
		}
	} else {
		fmt.Println("Failed to get PFP")
	}

	user := models.User{
		FullName:     fullName,
		Username:     username,
		PasswordHash: hashedPassword,
		ProfilePic:   profilePicPath,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully"})
}

func Login(c *gin.Context) {
	type LoginRequest struct {
		Username string `json:"username" form:"username"`
		Password string `json:"password" form:"password"`
	}

	var req LoginRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var user models.User
	if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	if !auth.CheckPasswordHash(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	accessToken, refreshToken, err := auth.GenerateTokens(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	session := models.Session{
		UserID:       user.ID,
		RefreshToken: refreshToken,
		ExpiresAt:    time.Now().Add(7 * 24 * time.Hour).Unix(),
	}
	if err := database.DB.Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	c.SetCookie("access_token", accessToken, 15*60, "/", "", false, true)
	c.SetCookie("refresh_token", refreshToken, 7*24*60*60, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged in successfully",
	})
}

func Logout(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err == nil && refreshToken != "" {
		database.DB.Where("refresh_token = ?", refreshToken).Delete(&models.Session{})
	}

	c.SetCookie("access_token", "", -1, "/", "", false, true)
	c.SetCookie("refresh_token", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func Me(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user models.User
	if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"fullname": user.FullName,
		"username": user.Username,
		"pfp":      user.ProfilePic,
	})
}
