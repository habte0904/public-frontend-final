"use client"

import { createContext, useContext, useState, useEffect } from "react"
import {jwtDecode} from "jwt-decode"
import authService from "../services/auth.service"
import axiosInstance from "../services/axiosInstance"
import { useNavigate } from "react-router-dom"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Decode JWT and check expiry
  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token)
      const now = Date.now() / 1000
      return decoded.exp < now
    } catch (err) {
      return true
    }
  }

  // Refresh access token using backend refresh endpoint
 const refreshAccessToken = async () => {
  try {
    const data = await authService.refreshAccessToken()
    if (data?.accessToken && data?.user) {
      const userData = {
        email: data.user.email,
        name: data.user.name || data.user.email.split("@")[0],
        avatar: "/images/user-avatar.png",
      }

      localStorage.setItem("a_v_t", data.accessToken)
      localStorage.setItem("user", JSON.stringify(userData))

      setAccessToken(data.accessToken)
      setUser(userData)
      setIsAuthenticated(true)
      return true
    }
    signOut()
    return false
  } catch (err) {
    signOut()
    return false
  }
}


 // Check authentication on app load
 useEffect(() => {
  const initAuth = async () => {
    const storedToken = localStorage.getItem("a_v_t")
    const storedUser = localStorage.getItem("user")

    if (storedToken && storedUser) {
      if (isTokenExpired(storedToken)) {
        // If expired, try to refresh
        const refreshed = await refreshAccessToken()
        if (!refreshed) {
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }
      } else {
        setAccessToken(storedToken)
        setUser(JSON.parse(storedUser))
        setIsAuthenticated(true)
      }
    }
    setIsLoading(false)
  }

  initAuth()
}, [])


  // Sign in
 const signIn = async (user, accessToken) => {
  try {
    if (accessToken && user) {
      const userData = {
        email: user.email,
        name: user.name || user.email.split("@")[0],
        avatar: "/images/user-avatar.png",
      }

      localStorage.setItem("a_v_t", accessToken)
      localStorage.setItem("user", JSON.stringify(userData))

      setAccessToken(accessToken)
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
    await axiosInstance.post("/public/logout")
  } catch (err) {
    console.error(err)
  } finally {
    setUser(null)
    setAccessToken(null)
    setIsAuthenticated(false)
    localStorage.removeItem("a_v_t")
    localStorage.removeItem("user")
    navigate("/signin")
  }
}

  const value = {
    user,
    accessToken,
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
