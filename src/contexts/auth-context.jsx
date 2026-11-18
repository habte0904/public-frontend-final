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
  // Stores the resulting token in memory ONLY — never in localStorage.
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
        
        // Zero-Storage Auth: User display data is kept in memory ONLY.
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


  // On every app load: attempt a silent refresh via the httpOnly rt cookie. 
  // We do this unconditionally because we no longer store ANY PII in localStorage
  // to tell us if the user was previously logged in. If the cookie is valid,
  // the server returns a fresh access token and user profile. If not, the user 
  // simply stays unauthenticated (no redirect from public pages).
  useEffect(() => {
    const initAuth = async () => {
      // Silently exchange the httpOnly cookie for a fresh access token & profile
      const refreshed = await refreshAccessToken()
      if (!refreshed) {
        setIsAuthenticated(false)
        setUser(null)
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])


  // Sign in — store token and user data in memory ONLY (Zero-Storage Auth)
  const signIn = async (user, accessToken) => {
    try {
      if (accessToken && user) {
        const userData = {
          email: user.email,
          name: user.name || user.email.split("@")[0],
          avatar: "/images/user-avatar.png",
        }

        setMemoryToken(accessToken)
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
      // The server verifies and revokes the token in the database.
      await axiosInstance.post("/public/logout")
    } catch (err) {
      console.error(err)
    } finally {
      clearMemoryToken()           // clear in-memory access token
      setUser(null)                // clear in-memory display data
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

