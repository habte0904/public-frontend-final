import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

import {
    Card,
    CardHeader,
    CardContent,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
    Alert,
    AlertTitle,
    AlertDescription,
} from "@/components/ui/alert";

import {
    ArrowLeft,
    Check,
    Download,
    XCircle,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import { api1 } from "../baseUrl.js";

import { translateField } from "@/utils/translate";

import {
    formatEthiopian,
    formatEthiopianTime,
} from "@/utils/ethiopianDate";

const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;

const convertTo12Hour = (time24) => {
    const [hour, minute] = time24.split(":").map(Number);

    const period = hour >= 12 ? "PM" : "AM";

    const hour12 = hour % 12 === 0 ? 12 : hour % 12;

    return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
};

const EventConfirmationPage = () => {
    const { t, i18n } = useTranslation();

    const lang = i18n.language;

    const { tx_ref } = useParams();

    const navigate = useNavigate();

    const [booking, setBooking] = useState(null);

    const [loading, setLoading] = useState(true);

    const [checkingStatus, setCheckingStatus] = useState(false);

    const [showNotFound, setShowNotFound] = useState(false);

    const [retryCount, setRetryCount] = useState(0);

    /**
     * Fetch event booking
     */
    const fetchBooking = async () => {
        try {
            const res = await axios.get(
                `${api1}/booking-event-confirmation/${tx_ref}`
            );

            if (res.data) {
                setBooking(res.data);
                return true;
            }

            return false;
        } catch (err) {
            console.error("Event booking fetch failed:", err);
            return false;
        }
    };

    /**
     * Check Telebirr payment status
     */
    const checkPaymentStatus = async () => {
        try {
            setCheckingStatus(true);

            const statusRes = await axios.get(
                `${api1}/event/status/telebirr/${tx_ref}`
            );

            console.log("Event payment status:", statusRes.data);

            return statusRes.data?.status;
        } catch (err) {
            console.error("Event payment status check failed:", err);
            return null;
        } finally {
            setCheckingStatus(false);
        }
    };

    /**
     * Main verification flow
     */
    useEffect(() => {
        let cancelled = false;

        const verifyBooking = async () => {
            if (!tx_ref) return;

            setLoading(true);

            setShowNotFound(false);

            try {
                /**
                 * STEP 1:
                 * Try fetching booking immediately
                 */
                const initialFound = await fetchBooking();

                if (cancelled) return;

                if (initialFound) {
                    setLoading(false);
                    return;
                }

                /**
                 * STEP 2:
                 * If not found yet,
                 * verify payment and retry
                 */
                for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                    if (cancelled) return;

                    setRetryCount(attempt);

                    console.log(`Event retry attempt ${attempt}`);

                    const paymentStatus = await checkPaymentStatus();

                    if (cancelled) return;

                    /**
                     * Payment successful
                     * Wait a bit for DB commit/webhook
                     */
                    if (paymentStatus === "SUCCESS") {
                        await new Promise((resolve) =>
                            setTimeout(resolve, RETRY_DELAY)
                        );

                        const foundAfterSuccess = await fetchBooking();

                        if (cancelled) return;

                        if (foundAfterSuccess) {
                            setLoading(false);
                            return;
                        }
                    } else if (
                        paymentStatus === "PENDING" ||
                        paymentStatus === "PAYING" ||
                        paymentStatus === "PROCESSING"
                    ) {
                        /**
                         * Payment still processing
                         */
                        await new Promise((resolve) =>
                            setTimeout(resolve, RETRY_DELAY)
                        );
                    } else if (
                        paymentStatus === "NOT_FOUND" ||
                        paymentStatus === "FAILED" ||
                        paymentStatus === "ERROR"
                    ) {
                        break;
                    } else {
                        /**
                         * Unknown status
                         */
                        await new Promise((resolve) =>
                            setTimeout(resolve, RETRY_DELAY)
                        );
                    }
                }

                /**
                 * STEP 3:
                 * Final fetch before showing error
                 */
                const finalAttempt = await fetchBooking();

                if (cancelled) return;

                if (!finalAttempt) {
                    setShowNotFound(true);
                }
            } catch (err) {
                console.error("Event verification flow failed:", err);

                if (!cancelled) {
                    setShowNotFound(true);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        verifyBooking();

        return () => {
            cancelled = true;
        };
    }, [tx_ref]);

    /**
     * LOADING UI
     */
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navigation />

                <section className="py-8 sm:py-16">
                    <div className="container mx-auto px-4 sm:px-6 max-w-2xl">
                        <Card className="shadow-lg">
                            <CardContent className="flex flex-col items-center justify-center py-20">
                                <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-6"></div>

                                <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">
                                    {checkingStatus
                                        ? lang === "am"
                                            ? "ክፍያውን በማረጋገጥ ላይ..."
                                            : "Verifying payment..."
                                        : lang === "am"
                                            ? "የቦታ ማስያዣዎን በማሰናዳት ላይ..."
                                            : "Preparing your booking..."}
                                </h2>

                                <p className="text-gray-500 text-center max-w-md">
                                    {lang === "am"
                                        ? "እባክዎን ጥቂት ጊዜ ይጠብቁ። የቲኬት መረጃዎትን በመፈለግ ላይ ነን።"
                                        : "Please wait a moment while we fetch your ticket details."}
                                </p>

                                {retryCount > 0 && (
                                    <p className="text-sm text-gray-400 mt-4">
                                        {lang === "am"
                                            ? `እንደገና በመሞከር ላይ (${retryCount}/${MAX_RETRIES})`
                                            : `Retrying (${retryCount}/${MAX_RETRIES})`}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <Footer />
            </div>
        );
    }

    /**
     * NOT FOUND UI
     */
    if (showNotFound || !booking) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navigation />

                <section className="py-8 sm:py-16">
                    <div className="container mx-auto px-4 sm:px-6 max-w-2xl">
                        <Alert
                            variant="destructive"
                            className="max-w-xl mx-auto"
                        >
                            <XCircle className="w-6 h-6 text-red-500" />

                            <AlertTitle>
                                {lang === "am"
                                    ? "መያዣ አልተገኘም"
                                    : "Booking Not Found"}
                            </AlertTitle>

                            <AlertDescription>
                                {lang === "am"
                                    ? "ይቅርታ፣ የክስተቱን ቦታ ማስያዝ ልናገኘው አልቻልንም። እባክዎን ጥቂት ጊዜ ቆይተው እንደገና ይሞክሩ።"
                                    : "Sorry, we couldn't find your booking yet. Please wait a moment and try again."}
                            </AlertDescription>
                        </Alert>

                        <div className="mt-6 text-center">
                            <Button
                                variant="ghost"
                                onClick={() => navigate("/events")}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />

                                {t("eventConfirmation.bookingDetail.backEvent")}
                            </Button>
                        </div>
                    </div>
                </section>

                <Footer />
            </div>
        );
    }

    /**
     * SUCCESS UI
     */
    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <section className="py-8 sm:py-16">
                <div className="container mx-auto px-4 sm:px-6 max-w-2xl">
                    <Card className="shadow-lg">
                        <CardHeader className="text-center bg-green-50 border-b">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 mt-6 sm:mt-8">
                                <Check className="w-8 h-8 text-white" />
                            </div>

                            <CardTitle className="text-2xl text-green-700">
                                {t("eventConfirmation.confirmTitle")}
                            </CardTitle>

                            <CardDescription className="text-green-600">
                                {t("eventConfirmation.confirmDescription")}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-4 sm:p-8 space-y-6">
                            <div className="bg-amber-50 p-4 sm:p-6 rounded-lg">
                                <h3 className="font-semibold text-amber-800 mb-3 text-lg">
                                    {t("eventConfirmation.bookingDetail.title")}
                                </h3>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>
                                            {t("eventConfirmation.bookingDetail.event")}
                                        </span>

                                        <span className="font-medium">
                                            {translateField(
                                                booking.data.event,
                                                lang,
                                                "title"
                                            ) || "N/A"}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>
                                            {t("eventConfirmation.bookingDetail.date")}
                                        </span>

                                        <span className="font-medium">
                                            {booking.data.event?.date
                                                ? lang === "am"
                                                    ? formatEthiopian(
                                                        new Date(booking.data.event.date),
                                                        { amharic: true }
                                                    )
                                                    : new Date(
                                                        booking.data.event.date
                                                    ).toLocaleDateString()
                                                : "N/A"}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>
                                            {t("eventConfirmation.bookingDetail.time")}
                                        </span>

                                        <span className="font-medium">
                                            {booking.data.event?.start_time &&
                                                booking.data.event?.end_time
                                                ? lang === "am"
                                                    ? `${formatEthiopianTime(
                                                        `${booking.data.event.start_time}`,
                                                        {
                                                            clock: "ethiopian",
                                                            amharic: true,
                                                        }
                                                    )} - ${formatEthiopianTime(
                                                        `${booking.data.event.end_time}`,
                                                        {
                                                            clock: "ethiopian",
                                                            amharic: true,
                                                        }
                                                    )}`
                                                    : `${convertTo12Hour(
                                                        booking.data.event.start_time
                                                    )} - ${convertTo12Hour(
                                                        booking.data.event.end_time
                                                    )}`
                                                : "N/A"}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>
                                            {t("eventConfirmation.bookingDetail.location")}
                                        </span>

                                        <span className="font-medium">
                                            {translateField(
                                                booking.data.event,
                                                lang,
                                                "location"
                                            ) || "N/A"}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mt-3">
                                        <span className="font-medium">
                                            {t("eventConfirmation.bookingDetail.tickets")}
                                        </span>

                                        {(booking.data.ticketSummary || []).map(
                                            (ti) => (
                                                <div
                                                    key={ti.ticket_id}
                                                    className="flex flex-col gap-1 ml-4 border-b border-amber-100 pb-2 mb-2"
                                                >
                                                    <div className="flex justify-between">
                                                        <span>
                                                            {translateField(
                                                                ti,
                                                                lang,
                                                                "type"
                                                            ) || "N/A"}{" "}
                                                            x{ti.quantity}
                                                        </span>

                                                        <span className="font-medium">
                                                            {ti.price?.toLocaleString() || "0"}{" "}
                                                            {t("currency.currencyETB")}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-3 items-center mt-1">
                                                        {(booking.data.tickets || [])
                                                            .filter(
                                                                (t) =>
                                                                    t.ticket_id === ti.ticket_id
                                                            )
                                                            .map((ticketObj, idx) => (
                                                                <div
                                                                    key={
                                                                        ticketObj.ticket_id +
                                                                        "-" +
                                                                        idx
                                                                    }
                                                                    className="flex flex-col items-start gap-1 border border-gray-100 rounded p-2 bg-white/60"
                                                                >
                                                                    <span className="text-xs text-gray-700">
                                                                        <span className="font-semibold">
                                                                            Type ID:
                                                                        </span>{" "}
                                                                        {ticketObj.type_id || "-"}
                                                                    </span>

                                                                    {ticketObj.qr_code && (
                                                                        <img
                                                                            src={ticketObj.qr_code}
                                                                            alt="QR Code"
                                                                            className="w-14 h-14 rounded bg-white border p-1"
                                                                        />
                                                                    )}

                                                                    <span className="text-xs text-gray-700">
                                                                        <span className="font-semibold">
                                                                            Email:
                                                                        </span>{" "}
                                                                        {ticketObj.email ||
                                                                            booking.data.email ||
                                                                            "-"}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    {booking.data.totalPaid && (
                                        <div className="flex justify-between font-semibold mt-2">
                                            <span>
                                                {t(
                                                    "eventConfirmation.bookingDetail.totalPaid"
                                                )}
                                            </span>

                                            <span className="text-amber-600">
                                                {booking.data.totalPaid.toLocaleString()}{" "}
                                                {t("currency.currencyETB")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 w-full">
                                <Button
                                    asChild
                                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center text-base px-4 py-2"
                                >
                                    <a
                                        href={`${api1}/event/tickets/${tx_ref}/pdf`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center w-full h-full"
                                    >
                                        <Download className="w-4 h-4 mr-2" />

                                        {t(
                                            "eventConfirmation.bookingDetail.downloadButton"
                                        )}
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-6 text-center">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/events")}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />

                            {t("eventConfirmation.bookingDetail.backEvent")}
                        </Button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default EventConfirmationPage;
