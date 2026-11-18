// SignupPage.jsx
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Navigation from "../components/navigation"
import Footer from "../components/footer"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Checkbox } from "../components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Eye, EyeOff, User, Mail, Lock, Phone, CheckCircle, Globe } from "lucide-react"
import authService from "../services/auth.service.js"
import { useTranslation } from 'react-i18next';

const countries = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo (Congo-Brazzaville)",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar (Burma)",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City", // Not UN member, but observer
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe"
].sort((a, b) => a.localeCompare(b));


export default function SignUpPage() {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const lang = i18n.language; 
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    nationality: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gender: "",
    agreeToTerms: false,
    subscribeNewsletter: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isVerificationCodeSent, setIsVerificationCodeSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")

  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.firstName.trim()) newErrors.firstName = lang==="am"?"የመጀመሪያ ስም ያስፈልጋል":"First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = lang==="am"?"የአያት ስም ያስፈልጋል":"Last name is required"
    if (!formData.nationality) newErrors.nationality =lang==="am"?"ዜግነት ያስፈልጋል": "Nationality is required"
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = lang==="am"?"ትክክለኛ ኢሜይል ያስፈልጋል":"Valid email required"
    if (!formData.phone || !/^\+?[\d\s-()]+$/.test(formData.phone)) newErrors.phone = lang==="am"?"ትክክለኛ ስልክ ያስፈልጋል":"Valid phone required"
    if (!formData.password || formData.password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) newErrors.password =lang==="am"?"የይለፍ ቃል 8+ ቁምፊዎች መሆን አለበት፣ ከትልቅ/ትንሽ እና ከቁጥር ጋር": "Password must be 8+ chars, with upper/lowercase and number"
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = lang==="am"?"የይለፍ ቃሎች አይዛመዱም።":"Passwords do not match"
    if (!formData.gender) newErrors.gender =lang==="am"?"ፆታ ያስፈልጋል": "Gender is required"
    if (!formData.agreeToTerms) newErrors.agreeToTerms = lang==="am"?"የአገልግሎት ውሎችን መቀበል አለብዎት":"You must accept terms"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)
    try {
      console.log('Form data sent to backend:', formData);

      const response = await authService.requestVisitorRegistration(formData.email);
      
      console.log("Response status:", response.status);
      console.log("Response data:", response.data);

      if (response.data.message === "sent") {
        setIsVerificationCodeSent(true);
      } else if (response.data.message === "User with this email already exists") {
        setErrors({ email: lang === "am" ? "ይህ ኢሜይል ቀድሞውኑ ተመዝግቧል" : "Email already registered" });
      } else {
        setErrors({ email: lang === "am" ? "ኮድ ለመላክ አልተሳካም. እባክዎ ደግመው ይሞክሩ።" : "Failed to send code. Try again." });
      }
    } catch (error) {
      console.error("Error sending code:", error);
      if (error.response && error.response.data && error.response.data.message === "User with this email already exists") {
        setErrors({ email: lang === "am" ? "ይህ ኢሜይል ቀድሞውኑ ተመዝግቧል" : "Email already registered" });
      } else {
        setErrors({ email: lang === "am" ? "ኮድ ለመላክ ስህተት ተከስቷል።" : "Error sending code." });
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setErrors({ verificationCode: lang === "am" ? "ኮድ ያስፈልጋል" : "Code required" });
      return;
    }
    setIsLoading(true);
    try {
      const response = await authService.verifyCode(formData, verificationCode);
      console.log("Verify Response status:", response.status);
      console.log("Verify Response data:", response.data);
      
      if (response.data.message === "successfully") {
        setIsSuccess(true);
        setTimeout(() => navigate("/signin"), 2000);
      } else {
        setErrors({ verificationCode: response.data.message || (lang === "am" ? "ልክ ያልሆነ ወይም ጊዜው ያለፈ ኮድ" : "Invalid or expired code") });
      }
    } catch (error) {
      console.error("Verification error:", error);
      if (error.response && error.response.data) {
        setErrors({ verificationCode: error.response.data.message || (lang === "am" ? "ማረጋገጫ አልተሳካም። እባክዎ ደግመው ይሞክሩ።" : "Verification failed. Try again.") });
      } else {
        setErrors({ verificationCode: lang === "am" ? "ማረጋገጫ አልተሳካም። እባክዎ ደግመው ይሞክሩ።" : "Verification failed. Try again." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    setIsLoading(true)
    try {
      await authService.resendVerificationCode(formData.email)
      // Optionally show success message
      console.log("Verification code resent successfully");
    } catch (error) {
      console.error("Error resending code:", error);
      setErrors({ form: lang === "am" ? "ኮድ እንደገና ለመላክ አልተሳካም" : "Failed to resend code" })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <section className="py-32">
        <div className="container mx-auto px-6 text-center">
          <Card className="shadow-lg border-green-200 max-w-md mx-auto">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="text-green-600 w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{t("signup.accCreated")}</h2>
              <p className="text-gray-600 mb-6">{t("signup.redirect")}</p>
              <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white">
                <Link to="/signin">{t("signup.goToin")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  )

  if (isVerificationCodeSent) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <section className="py-32">
          <div className="container mx-auto px-6 max-w-md">
            <Card className="shadow-lg border-amber-200">
              <CardHeader>
                <CardTitle className="text-center">{t("signup.verifyCode")}</CardTitle>
                <CardDescription className="text-center">{t("signup.enterCode")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerificationSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="verificationCode">{lang==="am"?"ኮድ":"Code"}</Label>
                    <Input
                      id="verificationCode"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className={errors.verificationCode ? "border-red-500" : ""}
                    />
                    {errors.verificationCode && <p className="text-red-600 text-sm">{errors.verificationCode}</p>}
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                  >
                    {isLoading 
                      ? (lang === "am" ? "በማረጋገጥ ላይ..." : "Verifying...") 
                      : (lang === "am" ? "ኮድ ያረጋግጡ" : "Verify Code")
                    }
                  </Button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600">
                  {t("signup.codeNotReceived")}{' '}
                  <button onClick={resendCode} className="text-amber-600 hover:underline">{lang==="am"?"እንደገና ላክ":"Resend"}</button>
                </p>
                {errors.form && <p className="text-red-600 text-sm text-center mt-2">{errors.form}</p>}
              </CardContent>
            </Card>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <section className="py-32">
        <div className="container mx-auto px-6">
           <div className="max-w-md mx-auto">
           <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("signup.title")}</h1>
              <p className="text-gray-600">{t("signup.description")}</p>
           </div>
           <Card className="shadow-lg border-amber-200">
           <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-gray-900">{t("signup.card.title")}</CardTitle>
              <CardDescription className="text-center text-gray-600">{t("signup.card.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-700">
                          {t("signup.card.firstName")}
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input name="firstName" placeholder={t("signup.card.firstNameField")} value={formData.firstName} onChange={handleInputChange} className={`pl-10 ${
                            errors.firstName ? "border-red-500" : ""
                          }`} />
                      </div>
                      {errors.firstName && <p className="text-red-600 text-sm">{errors.firstName}</p>}
                  </div>
                   <div className="space-y-2">
                    <Label>{t("signup.card.lastName")}</Label>
                    <Input name="lastName" placeholder={t("signup.card.lastNameField")} value={formData.lastName} onChange={handleInputChange} className={`pl-10 ${
                            errors.firstName ? "border-red-500" : ""
                          }`} />
                    {errors.lastName && <p className="text-red-600 text-sm">{errors.lastName}</p>}
                  </div>
                </div>
                  <div className="space-y-2">
                  <Label>{t("signup.card.email")}</Label>
                   <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input name="email" placeholder={t("signup.card.emailField")} value={formData.email} onChange={handleInputChange} className={`pl-10 ${
                          errors.email ? "border-red-500" : ""
                        }`} />
                  </div>
                  {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700">
                      {t("signup.card.phoneNo")}
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input name="phone" placeholder= {t("signup.card.phoneNoField")} value={formData.phone} onChange={handleInputChange}  className={`pl-10 ${
                          errors.phone ? "border-red-500" : ""
                        }`}/>
                  </div>
                  {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label> {t("signup.card.password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} className={`pl-10 ${
                          errors.password ? "border-red-500" : ""
                        }`} />
                      <button type="button" className="absolute right-2 top-2" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}
                  </div>
                  <div>
                    <Label>{t("signup.card.confirmPass")}</Label>
                    <div className="relative">
                      <Input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className={errors.confirmPassword && "border-red-500"} />
                      <button type="button" className="absolute right-2 top-2" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-600 text-sm">{errors.confirmPassword}</p>}
                  </div>
                </div>
                <div>
                  <Label>{t("signup.card.gender")}</Label>
                  <Select onValueChange={(val) => handleSelectChange("gender", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("signup.card.selectGender")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">{t("signup.card.male")} </SelectItem>
                      <SelectItem value="Female">{t("signup.card.female")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-red-600 text-sm">{errors.gender}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="nationality" className="text-gray-700">
                      {t("signup.card.nationality")}
                    </Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                  <Select onValueChange={(val) => handleSelectChange("nationality", val)}>
                    <SelectTrigger className={`pl-10`}>
                      <SelectValue placeholder= {t("signup.card.selectNationality")} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </div>
                  {errors.nationality && <p className="text-red-600 text-sm">{errors.nationality}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox name="agreeToTerms" checked={formData.agreeToTerms} onCheckedChange={(val) => handleSelectChange("agreeToTerms", val)} />
                    <Label htmlFor="agreeToTerms" className="text-sm text-gray-600 leading-relaxed">
                        {lang === "am" ? (
                             <>
                              እባክዎ ከ{" "}
                               <Link
                              href="/terms"
                               className="text-amber-600 hover:text-amber-700 hover:underline"
                                    >
                                      የአገልግሎት ውል
                                    </Link>{" "}
                                    እና{" "}
                                    <Link
                                      href="/privacy"
                                      className="text-amber-600 hover:text-amber-700 hover:underline"
                                    >
                                      የግላዊነት ፖሊሲ
                                    </Link>{" "}
                                    ጋር እንደሚስማሙ ያረጋግጡ
                                  </>
                                ) : (
                                  <>
                                    I agree to the{" "}
                                    <Link
                                      href="/terms"
                                      className="text-amber-600 hover:text-amber-700 hover:underline"
                                    >
                                      Terms of Service
                                    </Link>{" "}
                                    and{" "}
                                    <Link
                                      href="/privacy"
                                      className="text-amber-600 hover:text-amber-700 hover:underline"
                                    >
                                      Privacy Policy
                                    </Link>
                                  </>
                                )}
                     </Label>
                </div>
                {errors.agreeToTerms && <p className="text-red-600 text-sm">{errors.agreeToTerms}</p>}
                
                <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                  >
                 {isLoading
                        ? lang === "am"
                          ? "በመላክ ላይ..."
                          : "Submitting..."
                        : lang === "am"
                        ? "መዝግብ"
                        : "Sign Up"}
                </Button>
              </form>
            </CardContent>
          </Card>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}