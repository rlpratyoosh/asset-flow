"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 1. Get CSRF Token
      const csrfRes = await fetch("/api/v1/csrf-token");
      if (!csrfRes.ok) throw new Error("Failed to initialize secure session");
      const { csrf_token } = await csrfRes.json();

      // 2. Perform Registration
      const formData = new FormData();
      formData.append("fullname", fullname);
      formData.append("username", username);
      formData.append("password", password);
      if (profilePic) {
        formData.append("profile-pic", profilePic);
      }

      const res = await fetch("/api/v1/register", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrf_token,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }

      // 3. Redirect to login on success
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-container">
      <div className="glass-card">
        <h1>Create Account</h1>
        <p>Join us and start your journey today</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="fullname">Full Name</label>
            <input
              id="fullname"
              type="text"
              className="form-input"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-pic">Profile Picture (optional)</label>
            <input
              id="profile-pic"
              type="file"
              accept="image/*"
              className="form-input"
              onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="auth-link">
          Already have an account? <Link href="/login">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
