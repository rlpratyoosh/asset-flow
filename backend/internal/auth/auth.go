package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var JWTSecret = []byte("secret-key")

type Claims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func GenerateTokens(userID string, username string) (accessToken string, refreshToken string, err error) {
	// Access Token
	expirationTimeAccess := time.Now().Add(15 * time.Minute)
	claimsAccess := &Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTimeAccess),
		},
	}
	tokenAccess := jwt.NewWithClaims(jwt.SigningMethodHS256, claimsAccess)
	accessToken, err = tokenAccess.SignedString(JWTSecret)
	if err != nil {
		return "", "", err
	}

	// Refresh Token
	expirationTimeRefresh := time.Now().Add(7 * 24 * time.Hour)
	claimsRefresh := &Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTimeRefresh),
		},
	}
	tokenRefresh := jwt.NewWithClaims(jwt.SigningMethodHS256, claimsRefresh)
	refreshToken, err = tokenRefresh.SignedString(JWTSecret)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return JWTSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
