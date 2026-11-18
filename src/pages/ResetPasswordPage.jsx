import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import authService from "../services/auth.service";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"; // Add Eye icons
import {  useEffect } from "react"
export default function ResetPasswordPage() {
     const { i18n, t } = useTranslation();
    const [lang, setLang] = useState(i18n.language || "en");
    const [params] = useSearchParams();
    const token = params.get("token");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false); // Visibility toggle
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Visibility toggle
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const changeLanguage = (lng) => {
      i18n.changeLanguage(lng);
      setLang(lng);
      localStorage.setItem("lang", lng); // ✅ save to localStorage
    };
     useEffect(() => {
      // load language from localStorage on mount
      const savedLang = localStorage.getItem("lang");
      if (savedLang && savedLang !== lang) {
        i18n.changeLanguage(savedLang);
        setLang(savedLang);
      }
    }, []);

    const validatePassword = (password) => {
        const minLength = /.{8,}/;
        const uppercase = /[A-Z]/;
        const lowercase = /[a-z]/;
        const number = /[0-9]/;
        const specialChar = /[!@#$%^&*(),.?":{}|<>]/;

        if (!minLength.test(password)) return t('reset_password.password_too_short');
        if (!uppercase.test(password)) return t('reset_password.password_uppercase');
        if (!lowercase.test(password)) return t('reset_password.password_lowercase');
        if (!number.test(password)) return t('reset_password.password_number');
        if (!specialChar.test(password)) return t('reset_password.password_special');
        return "";
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("");
        setError("");

        // ✅ Validate password strength
        const validationError = validatePassword(newPassword);
        if (validationError) {
            setError(validationError);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t('reset_password.passwords_no_match'));
            return;
        }

        try {
            const data = await authService.resetPassword(token, newPassword);
            if (data) {
                setStatus(t('reset_password.success'));
                setTimeout(() => navigate("/signin"), 2000);
            } else {
                setError(t('reset_password.error'));
            }
        } catch (error) {
            setError(t('reset_password.error_generic'));
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-white relative">
            {/* Language toggle at top right */}
            <div className="absolute top-4 right-4 z-10">
                <div className="flex items-center border border-amber-400 rounded-full overflow-hidden w-24 h-8">
                    <button
                        type="button"
                        onClick={() => changeLanguage("en")}
                        className={`w-1/2 h-full text-xs font-semibold transition-colors duration-200 focus:outline-none ${
                            lang === "en"
                                ? "bg-amber-400 text-black"
                                : "bg-black text-amber-400 hover:bg-amber-400/20"
                        }`}
                        aria-label="Switch to English"
                    >
                        EN
                    </button>
                    <button
                        type="button"
                        onClick={() => changeLanguage("am")}
                        className={`w-1/2 h-full text-xs font-semibold transition-colors duration-200 focus:outline-none ${
                            lang === "am"
                                ? "bg-amber-400 text-black"
                                : "bg-black text-amber-400 hover:bg-amber-400/20"
                        }`}
                        aria-label="Switch to Amharic"
                    >
                        አማ
                    </button>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="max-w-md w-full space-y-4 p-6 border rounded shadow">
                <h2 className="text-2xl font-bold mb-2">{t('reset_password.title')}</h2>
                <p className="mb-4 text-gray-600">{t('reset_password.desc')}</p>
                {status && (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">{status}</AlertDescription>
                    </Alert>
                )}
                {error && (
                    <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                )}
                <div className="relative">
                    <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder={t('reset_password.new_password_placeholder')}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                    />
                    <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                        onClick={() => setShowNewPassword(v => !v)}
                        aria-label={showNewPassword ? t('reset_password.hide_password') : t('reset_password.show_password')}
                    >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </span>
                </div>
                <div className="relative">
                    <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={t('reset_password.confirm_password_placeholder')}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                    />
                    <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                        onClick={() => setShowConfirmPassword(v => !v)}
                        aria-label={showConfirmPassword ? t('reset_password.hide_password') : t('reset_password.show_password')}
                    >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </span>
                </div>
                <Button type="submit" className="w-full bg-amber-500 text-white">{t('reset_password.reset')}</Button>
            </form>
        </div>
    );
}