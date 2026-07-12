package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func CORSMiddleware(env, frontendURL string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		allowedOrigin := ""
		if env == "prod" || env == "production" {
			allowedOrigin = frontendURL
		} else {
			if origin != "" {
				allowedOrigin = origin
			} else {
				allowedOrigin = "*"
			}
		}

		if allowedOrigin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		}

		if allowedOrigin != "*" {
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func CSRFMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == "GET" || c.Request.Method == "OPTIONS" || c.Request.Method == "HEAD" {
			c.Next()
			return
		}

		cookieToken, err := c.Cookie("csrf_token")
		if err != nil || cookieToken == "" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF token missing from cookies"})
			return
		}

		headerToken := c.Request.Header.Get("X-CSRF-Token")
		if headerToken == "" || headerToken != cookieToken {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Invalid CSRF token"})
			return
		}

		c.Next()
	}
}
