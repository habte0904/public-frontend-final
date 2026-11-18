import { useTranslation } from "react-i18next";
"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import Navigation from "../components/navigation"
import Footer from "../components/footer"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Checkbox } from "../components/ui/checkbox"
import { Separator } from "../components/ui/separator"
import { Alert, AlertDescription } from "../components/ui/alert"
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, RefreshCw, ArrowRight, Facebook, Twitter, Globe } from "lucide-react"
import { useAuth } from "../contexts/auth-context"
import { useLanguage } from "../components/language-provider"
import authService from "../services/auth.service"
import { toast } from "react-toastify"

export default function SignInPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
    captcha: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [captchaToken, setCaptchaToken] = useState("")        // server-signed token
  const [captchaImage, setCaptchaImage] = useState("")        // base64 SVG from server
  const [captchaLoading, setCaptchaLoading] = useState(false) // loading state for captcha
  const [isLockedOut, setIsLockedOut] = useState(false)       // account lockout flag
  const [lockoutEndTime, setLockoutEndTime] = useState(null)  // timestamp when lockout lifts
  const [lockoutCountdown, setLockoutCountdown] = useState("") // formatted countdown string
  const { signIn, user } = useAuth()

  // Fetch a server-generated CAPTCHA challenge
  const fetchCaptcha = async () => {
    setCaptchaLoading(true)
    try {
      const { data } = await authService.getCaptcha()
      setCaptchaToken(data.token)
      setCaptchaImage(data.imageUrl)
    } catch (err) {
      console.error("Failed to load captcha:", err)
      // Leave the previous captcha visible rather than clearing
    } finally {
      setCaptchaLoading(false)
    }
  }

  // Initialize captcha on component mount
  useEffect(() => {
    fetchCaptcha()
  }, [])

  // Countdown timer for account lockout
  useEffect(() => {
    if (!lockoutEndTime) return

    const tick = () => {
      const remaining = lockoutEndTime - Date.now()
      if (remaining <= 0) {
        setIsLockedOut(false)
        setLockoutEndTime(null)
        setLockoutCountdown("")
        setLoginError("")
        fetchCaptcha() // get a fresh captcha when lockout expires
        return
      }
      const mins = Math.floor(remaining / 60000)
      const secs = Math.floor((remaining % 60000) / 1000)
      setLockoutCountdown(`${mins}:${secs.toString().padStart(2, '0')}`)
    }

    tick() // run immediately
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [lockoutEndTime])


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
    setLoginError("")
  }

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.captcha) {
      newErrors.captcha = "Please enter the captcha code";
    }
    // Note: actual captcha correctness is validated server-side

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  setIsLoading(true);
  setLoginError("");

  try {
    // Pass captchaToken + captchaAnswer to server for server-side CAPTCHA validation
    const { data } = await authService.login(
      formData.email,
      formData.password,
      captchaToken,
      formData.captcha
    );

    if (data.accessToken && data.user) {
      signIn(data.user, data.accessToken);
      navigate("/");
    } else {
      setLoginError("Login response missing access token or user info.");
      await fetchCaptcha();
      setFormData((prev) => ({ ...prev, captcha: "" }));
    }
  } catch (error) {
    console.log("Login error:", error.response?.data?.message);

    const responseData = error.response?.data || {};
    const errorMsg = responseData.message || "Invalid email or password. Please try again.";
    setLoginError(errorMsg);

    // Handle account lockout from server
    if (responseData.locked && responseData.retryAfter) {
      setIsLockedOut(true)
      setLockoutEndTime(Date.now() + responseData.retryAfter * 1000)
      toast.error("Account locked — too many failed attempts")
    } else {
      toast.error("Login failed")
    }

    // Always refresh captcha after any failure (security: each captcha is single-use)
    await fetchCaptcha();
    setFormData((prev) => ({ ...prev, captcha: "" }));
  } finally {
    setIsLoading(false);
  }
};



  const refreshCaptcha = () => {
    fetchCaptcha()
    setFormData((prev) => ({ ...prev, captcha: "" }))
    if (errors.captcha) {
      setErrors((prev) => ({ ...prev, captcha: "" }))
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('signin.page_title')}</h1>
              <p className="text-gray-600">{t('signin.page_desc')}</p>
            </div>

            <Card className="shadow-lg border-amber-200">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center text-gray-900">{t('signin.form_title')}</CardTitle>
                <CardDescription className="text-center text-gray-600">
                  {t('signin.form_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {loginError && (
                    <Alert className={`${isLockedOut ? 'border-orange-300 bg-orange-50' : 'border-red-200 bg-red-50'}`}>
                      <AlertCircle className={`h-4 w-4 ${isLockedOut ? 'text-orange-600' : 'text-red-600'}`} />
                      <AlertDescription className={`${isLockedOut ? 'text-orange-800' : 'text-red-800'}`}>
                        {loginError}
                        {isLockedOut && lockoutCountdown && (
                          <span className="block mt-1 font-semibold">Time remaining: {lockoutCountdown}</span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">
                      {t('signin.email')}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder={t('signin.email_placeholder')}
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={isLockedOut}
                        className={`pl-10 border-gray-300 focus:border-amber-500 focus:ring-amber-500 ${errors.email ? "border-red-500" : ""} ${isLockedOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-red-600">{t(errors.email)}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700">
                      {t('signin.password')}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t('signin.password_placeholder')}
                        value={formData.password}
                        onChange={handleInputChange}
                        disabled={isLockedOut}
                        className={`pl-10 pr-10 border-gray-300 focus:border-amber-500 focus:ring-amber-500 ${errors.password ? "border-red-500" : ""} ${isLockedOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" title={t('signin.hide_password')} /> : <Eye className="h-4 w-4" title={t('signin.show_password')} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-red-600">{t('signin.password_short')}</p>}
                  </div>

                  {/* Captcha Section */}
                  <div className="space-y-2">
                    <Label htmlFor="captcha" className="text-gray-700">
                      {t('signin.captcha_label')}
                    </Label>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {captchaLoading ? (
                            <div className="border border-gray-300 rounded bg-gray-100 flex items-center justify-center" style={{ width: 160, height: 50 }}>
                              <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
                            </div>
                          ) : (
                            <img
                              src={captchaImage || "/placeholder.svg"}
                              alt="Captcha — type the digits you see"
                              className="border border-gray-300 rounded"
                              width={160}
                              height={50}
                            />
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={refreshCaptcha}
                            disabled={captchaLoading}
                            className="p-2 border-gray-300 hover:bg-gray-50 bg-transparent"
                            title="Refresh captcha"
                          >
                            <RefreshCw className={`h-4 w-4 ${captchaLoading ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                        <Input
                          id="captcha"
                          name="captcha"
                          type="text"
                          placeholder={t('signin.captcha_placeholder')}
                          value={formData.captcha}
                          onChange={handleInputChange}
                          disabled={isLockedOut}
                          className={`border-gray-300 focus:border-amber-500 focus:ring-amber-500 ${errors.captcha ? "border-red-500" : ""} ${isLockedOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                      </div>
                    </div>
                    {errors.captcha && <p className="text-sm text-red-600">{t('signin.captcha_incorrect')}</p>}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rememberMe"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, rememberMe: !!checked }))
                        }
                        className="border-gray-300"
                      />
                      <Label htmlFor="rememberMe" className="text-sm text-gray-600">
                        {t('signin.remember_me')}
                      </Label>
                    </div>
                    <Link to="/forgot-password" className="text-sm text-amber-600 hover:text-amber-700 hover:underline">
                      {t('signin.forgot_password')}
                    </Link>

                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || isLockedOut}
                    className={`w-full font-semibold py-2 px-4 rounded-lg transition-all duration-200 ${
                      isLockedOut
                        ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white'
                    }`}
                  >
                    {isLockedOut
                      ? `Locked (${lockoutCountdown})`
                      : isLoading
                        ? t('signin.signing_in')
                        : t('signin.sign_in')}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    {t('signin.no_account')} {" "}
                    <Link to="/signup" className="text-amber-600 hover:text-amber-700 font-medium hover:underline">
                      {t('signin.sign_up_here')}
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
