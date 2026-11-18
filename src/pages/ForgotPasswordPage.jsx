import { useState } from "react";
import { useTranslation } from "react-i18next";
import authService from "../services/auth.service";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"; // Loader2 for spinner

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("");
        setError("");
        setLoading(true);
        try {
            const data = await authService.forgotPassword(email);
            if (data) {
                setStatus(t("forgot_password.success"));
            } else {
                setError(t("forgot_password.error"));
            }
        } catch (error) {
            setError(t("forgot_password.error_generic"));
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <form onSubmit={handleSubmit} className="max-w-md w-full space-y-4 p-6 border rounded shadow">
                <h2 className="text-2xl font-bold mb-2">{t("forgot_password.title")}</h2>
                <p className="mb-4 text-gray-600">{t("forgot_password.desc")}</p>
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
                <input
                    type="email"
                    placeholder={t("forgot_password.email_placeholder")}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded"
                />
                <Button type="submit" className="w-full bg-amber-500 text-white" disabled={loading}>
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <Loader2 className="animate-spin mr-2" size={18} />
                            {t("forgot_password.sending")}
                        </span>
                    ) : (
                        t("forgot_password.send")
                    )}
                </Button>
            </form>
        </div>
    );
}