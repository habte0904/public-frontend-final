import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

import Navigation from "@/components/navigation";
// import Footer from "@/components/footer";

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
  CheckCircle,
  XCircle,
  Ticket,
  Users,
  Calendar,
  Mail,
  Download,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import { api1 } from "../baseUrl";

import { formatEthiopian } from "@/utils/ethiopianDate";

const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;

const ConfirmationPage = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const { tx_ref } = useParams();

  const [bookingDetails, setBookingDetails] = useState(null);

  /**
   * SINGLE loading state
   * Page ONLY shows loading until everything finishes
   */
  const [loading, setLoading] = useState(true);

  /**
   * Only show not found AFTER all retries fail
   */
  const [showNotFound, setShowNotFound] = useState(false);

  /**
   * Optional loading message
   */
  const [loadingMessage, setLoadingMessage] = useState("");

  /**
   * Fetch booking details
   */
  const fetchBookingDetails = async () => {
    try {
      const res = await axios.get(
        `${api1}/booking-confirmation/${tx_ref}`
      );

      if (res.data?.data) {
        setBookingDetails(res.data.data);
        return true;
      }

      return false;
    } catch (err) {
      console.error("Booking fetch failed:", err);
      return false;
    }
  };

  /**
   * Check payment status
   */
  const checkPaymentStatus = async () => {
    try {
      const statusRes = await axios.get(
        `${api1}/status/telebirr/${tx_ref}`
      );

      console.log("Payment status:", statusRes.data);

      return statusRes.data?.status || null;
    } catch (err) {
      console.error("Status check failed:", err);
      return null;
    }
  };

  /**
   * Main flow
   */
  useEffect(() => {
    let cancelled = false;

    const sleep = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const verifyBooking = async () => {
      if (!tx_ref) return;

      setLoading(true);
      setShowNotFound(false);

      try {
        /**
         * STEP 1
         * Initial booking fetch
         */
        setLoadingMessage(
          lang === "am"
            ? "የትኬት መረጃውን በመፈለግ ላይ..."
            : "Fetching your booking details..."
        );

        const bookingFound = await fetchBookingDetails();

        if (cancelled) return;

        /**
         * Booking exists immediately
         */
        if (bookingFound) {
          setLoading(false);
          return;
        }

        /**
         * STEP 2
         * Payment verification + retries
         */
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          if (cancelled) return;

          setLoadingMessage(
            lang === "am"
              ? `ክፍያውን በማረጋገጥ ላይ... (${attempt}/${MAX_RETRIES})`
              : `Verifying payment status... (${attempt}/${MAX_RETRIES})`
          );

          const paymentStatus = await checkPaymentStatus();

          if (cancelled) return;

          console.log(
            `Attempt ${attempt} payment status:`,
            paymentStatus
          );

          /**
           * SUCCESS:
           * wait a little for DB commit/webhook
           */
          if (paymentStatus === "SUCCESS") {
            setLoadingMessage(
              lang === "am"
                ? "ትኬቱን በማዘጋጀት ላይ..."
                : "Preparing your ticket..."
            );

            await sleep(RETRY_DELAY);

            const successFetch = await fetchBookingDetails();

            if (cancelled) return;

            if (successFetch) {
              setLoading(false);
              return;
            }
          }

          /**
           * Still processing
           */
          else if (
            paymentStatus === "PENDING" ||
            paymentStatus === "PAYING" ||
            paymentStatus === "PROCESSING"
          ) {
            setLoadingMessage(
              lang === "am"
                ? "ክፍያው በሂደት ላይ ነው..."
                : "Payment is still processing..."
            );

            await sleep(RETRY_DELAY);
          }

          /**
           * Failed / not found
           */
          else if (
            paymentStatus === "FAILED" ||
            paymentStatus === "NOT_FOUND" ||
            paymentStatus === "ERROR"
          ) {
            break;
          }

          /**
           * Unknown state
           */
          else {
            await sleep(RETRY_DELAY);
          }

          /**
           * Retry fetching booking again
           */
          setLoadingMessage(
            lang === "am"
              ? "የትኬት መረጃውን እንደገና በመፈለግ ላይ..."
              : "Retrying booking lookup..."
          );

          const retryFetch = await fetchBookingDetails();

          if (cancelled) return;

          if (retryFetch) {
            setLoading(false);
            return;
          }
        }

        /**
         * FINAL fetch before failure
         */
        setLoadingMessage(
          lang === "am"
            ? "የመጨረሻ ሙከራ..."
            : "Final verification attempt..."
        );

        const finalFetch = await fetchBookingDetails();

        if (cancelled) return;

        if (!finalFetch) {
          setShowNotFound(true);
        }
      } catch (err) {
        console.error("Verification flow failed:", err);

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
  }, [tx_ref, lang]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navigation />

      <div className="flex-1 max-w-3xl mx-auto w-full mt-20 px-4 py-10 relative">

        {/* =========================
            LOADING SCREEN ONLY
        ========================== */}
        {loading ? (
          <div className="flex flex-col justify-center items-center min-h-[400px]">
            <div className="flex flex-col items-center gap-6">

              {/* Spinner */}
              <div className="relative">
                <div className="w-16 h-16 border-4 border-amber-200 rounded-full"></div>

                <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>

              {/* Main text */}
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-gray-800">
                  {lang === "am"
                    ? "እባክዎ ይጠብቁ..."
                    : "Please wait..."}
                </h2>

                <p className="text-gray-500 text-sm animate-pulse">
                  {loadingMessage}
                </p>
              </div>
            </div>
          </div>
        ) : showNotFound || !bookingDetails ? (
          <Alert
            variant="destructive"
            className="max-w-lg mx-auto mt-20"
          >
            <XCircle className="w-6 h-6 text-red-500" />

            <AlertTitle>
              {lang === "am"
                ? "መያዣ አልተገኘም"
                : "Booking Not Found"}
            </AlertTitle>

            <AlertDescription>
              {lang === "am"
                ? "ይቅርታ፣ ቦታ ማስያዝዎን ልናገኘው አልቻልንም። እባክዎ ቆይተው እንደገና ይሞክሩ።"
                : "Sorry, we couldn't find your booking. Please wait a moment and try again."}
            </AlertDescription>
          </Alert>
        ) : (
          <Card className="shadow-xl border-amber-100/60 bg-white/90">
            <CardHeader className="flex flex-col items-center gap-2 pb-2">
              <CheckCircle className="w-10 h-10 text-green-500 mb-2" />

              <CardTitle className="text-2xl font-bold text-center">
                {t("ticketConfirmation.title")}
              </CardTitle>

              <CardDescription className="text-center text-gray-600">
                {t("ticketConfirmation.description")}
              </CardDescription>

              <div className="flex flex-wrap gap-2 justify-center mt-2">
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-700 border-amber-200"
                >
                  {t("ticketConfirmation.bookingId")}{" "}
                  {bookingDetails.ticket_booking_id}
                </Badge>

                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 border-blue-200"
                >
                  {bookingDetails.is_group ? (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {t("ticketConfirmation.groupBooking")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Ticket className="w-4 h-4" />
                      {t("ticketConfirmation.individual")}
                    </span>
                  )}
                </Badge>

                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 border-green-200"
                >
                  <Calendar className="w-4 h-4 mr-1 inline" />

                  {lang === "am"
                    ? formatEthiopian(
                      new Date(bookingDetails.visit_date),
                      { amharic: true }
                    )
                    : new Date(
                      bookingDetails.visit_date
                    ).toLocaleDateString()}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4 text-amber-500" />

                    <span className="font-medium">
                      {bookingDetails.email}
                    </span>
                  </div>

                  {bookingDetails.is_group && (
                    <>
                      <div className="text-sm text-gray-500">
                        {t("ticketConfirmation.groupId")}
                        {bookingDetails.group_id}
                      </div>

                      <div className="text-sm text-gray-500">
                        {t("ticketConfirmation.totalMembers")}{" "}
                        {
                          bookingDetails.tickets[0]
                            ?.total_members
                        }
                      </div>
                    </>
                  )}
                </div>

                <Button
                  asChild
                  className="bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold shadow"
                >
                  <a
                    href={`${api1}/orders/${tx_ref}/download-pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="w-4 h-4 mr-2" />

                    {t("ticketConfirmation.downloadTicket")}
                  </a>
                </Button>
              </div>

              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-3 text-amber-600 flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  {t("ticketConfirmation.tickets")}
                </h2>

                {bookingDetails.is_group ? (
                  <Card className="bg-gray-50 border border-amber-100/60 shadow-sm flex flex-row items-center gap-4 p-3">
                    <img
                      src={bookingDetails.tickets[0].qr_code}
                      alt="Group QR Code"
                      className="w-24 h-24 rounded bg-white border p-1"
                    />

                    <div className="flex-1 space-y-2">
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 border-blue-200 mb-1"
                      >
                        {lang === "am"
                          ? `የቡድን ትኬት (${bookingDetails.tickets[0].total_members} አባላት)`
                          : `Group Ticket (${bookingDetails.tickets[0].total_members} Members)`}
                      </Badge>

                      <div className="text-sm text-gray-700 font-medium">
                        {t("ticketConfirmation.covers")}
                      </div>

                      <ul className="list-disc list-inside text-xs text-gray-600">
                        {bookingDetails.tickets[0].ticketTypes.map(
                          (t, idx) => (
                            <li key={idx}>
                              {t.type} – {t.quantity} pcs
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {bookingDetails.tickets.map(
                      (ticket, index) => (
                        <Card
                          key={index}
                          className="bg-gray-50 border border-amber-100/60 shadow-sm flex flex-row items-center gap-4 p-3"
                        >
                          <img
                            src={ticket.qr_code}
                            alt="QR Code"
                            className="w-24 h-24 rounded bg-white border p-1"
                          />

                          <div className="flex-1 space-y-1">
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-700 border-blue-200 mb-1"
                            >
                              {ticket.type || ticket.type_id}
                            </Badge>

                            <div className="text-sm text-gray-700 font-medium">
                              {t(
                                "ticketConfirmation.status"
                              )}
                              :{" "}
                              <span className="capitalize">
                                {lang === "am"
                                  ? ticket.status?.toLowerCase() ===
                                    "valid"
                                    ? "ትክክለኛ ትኬት"
                                    : ticket.status?.toLowerCase() ===
                                      "invalid"
                                      ? "ልክ ያልሆነ ቲኬት"
                                      : ticket.status
                                  : ticket.status}
                              </span>
                            </div>

                            {ticket.email && (
                              <div className="text-xs text-gray-500">
                                {lang === "am"
                                  ? `የትኬት ባለቤት: ${ticket.email}`
                                  : `Holder: ${ticket.email}`}
                              </div>
                            )}
                          </div>
                        </Card>
                      )
                    )}
                  </div>
                )}
              </div>

              {bookingDetails.services?.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-3 text-amber-600 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Services
                  </h2>

                  <div className="grid gap-4 md:grid-cols-2">
                    {bookingDetails.services.map(
                      (service, idx) => (
                        <Card
                          key={idx}
                          className="bg-gray-50 border border-amber-100/60 shadow-sm flex flex-row items-center justify-between p-3"
                        >
                          <div>
                            <div className="font-medium text-gray-800">
                              {service.name}
                            </div>

                            <div className="text-xs text-gray-500">
                              Qty: {service.quantity}
                            </div>
                          </div>

                          <div className="text-right font-bold text-amber-700">
                            ETB{" "}
                            {Number(
                              service.subtotal || 0
                            ).toFixed(2)}
                          </div>
                        </Card>
                      )
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* <Footer /> */}
    </div>
  );
};

export default ConfirmationPage;
