"use client"

import { createContext, useContext, useState, useEffect } from "react"
import {jwtDecode} from "jwt-decode"
import authService from "../services/auth.service"
import axiosInstance, { setMemoryToken, clearMemoryToken } from "../services/axiosInstance"
import { useNavigate } from "react-router-dom"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Decode JWT and check expiry (still used to guard refreshAccessToken calls)
  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token)
      const now = Date.now() / 1000
      return decoded.exp < now
    } catch (err) {
      return true
    }
  }

  // Refresh access token using the httpOnly rt cookie (set by the server on login).
  // Stores the resulting token in memory ONLY — never in localStorage (Finding 1 fix).
  // Returns true on success, false on failure.
  // Does NOT call signOut() — callers decide what to do on failure.
  const refreshAccessToken = async () => {
    try {
      const data = await authService.refreshAccessToken()
      if (data?.accessToken && data?.user) {
        const userData = {
          email: data.user.email,
          name: data.user.name || data.user.email.split("@")[0],
          avatar: "/images/user-avatar.png",
        }

        // Store token in memory only — no localStorage write for the JWT
        setMemoryToken(data.accessToken)
        // User display data (name, email, avatar) is not a credential — keep for UI
        localStorage.setItem("user", JSON.stringify(userData))

        setUser(userData)
        setIsAuthenticated(true)
        return true
      }
      // Server returned a response but no valid token — treat as unauthenticated
      return false
    } catch (err) {
      // Network error or 401 — treat as unauthenticated, do NOT redirect here.
      // Mid-session expiry redirects are handled by the axios 401 interceptor.
      return false
    }
  }


  // On every app load: if the user was previously logged in (has a stored display
  // user), attempt a silent refresh via the httpOnly rt cookie. If the cookie is
  // valid the server returns a fresh access token stored in memory. If not, clean
  // up state without redirecting — public pages must remain accessible.
  // Users who were never logged in skip the refresh entirely.
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem("user")

      if (!storedUser) {
        // Never logged in — nothing to restore, just finish loading
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      // Pre-populate the display user from localStorage for immediate UI render
      // (this contains only name/email/avatar, no auth tokens)
      try { setUser(JSON.parse(storedUser)) } catch {}

      // Silently exchange the httpOnly cookie for a fresh access token
      const refreshed = await refreshAccessToken()
      if (!refreshed) {
        // Cookie expired or invalid — user is logged out; clear stale display data
        // but do NOT navigate to /signin here (public pages must stay accessible)
        setIsAuthenticated(false)
        setUser(null)
        localStorage.removeItem("user")
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])


  // Sign in — store token in memory, user data in localStorage for display only
  const signIn = async (user, accessToken) => {
    try {
      if (accessToken && user) {
        const userData = {
          email: user.email,
          name: user.name || user.email.split("@")[0],
          avatar: "/images/user-avatar.png",
        }

        // Token goes to memory ONLY — never written to localStorage (Finding 1 fix)
        setMemoryToken(accessToken)
        localStorage.setItem("user", JSON.stringify(userData))

        setUser(userData)
        setIsAuthenticated(true)
        return { success: true }
      }
      return { success: false, error: "Login failed" }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  }

  const signOut = async () => {
    try {
      // Sends the httpOnly rt cookie automatically (withCredentials: true).
      // The server verifies and revokes the token in the database (Finding 2 fix).
      await axiosInstance.post("/public/logout")
    } catch (err) {
      console.error(err)
    } finally {
      clearMemoryToken()           // clear in-memory access token
      localStorage.removeItem("user")   // clear display data
      setUser(null)
      setIsAuthenticated(false)
      navigate("/signin")
    }
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    refreshAccessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

