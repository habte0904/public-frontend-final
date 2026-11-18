import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Navigation from "../components/navigation";
import Footer from "../components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { CheckCircle, CalendarIcon, Users, CreditCard, Download } from "lucide-react";
import { format } from "date-fns";
import axios from "../services/axiosInstance.js";
import { useParams } from "react-router-dom";
import { translateField } from "@/utils/translate";
import { formatEthiopian, formatEthiopianTime } from "@/utils/ethiopianDate";
import { toast } from "react-toastify";

export default function ServiceConfirmationPage() {
  const { t, i18n } = useTranslation();
  const [requests, setRequests] = useState(null); // ➤ null means NOT LOADED
  const [loading, setLoading] = useState(true);   // ➤ New loading state
  const { tx_ref } = useParams();

  const confirmationCardRef = useRef();

  // DOWNLOAD PDF
  const downloadPDF = () => {
    const input = confirmationCardRef.current;
    const originalBoxShadow = input.style.boxShadow;

    input.style.boxShadow = "none";
    const actionButtons = input.querySelector(".action-buttons");
    if (actionButtons) actionButtons.style.display = "none";

    html2canvas(input, { scale: 2, useCORS: true, logging: false }).then(
      (canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 190;
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 10;

        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`confirmation-${requests?.tx_ref || tx_ref}.pdf`);

        input.style.boxShadow = originalBoxShadow;
        if (actionButtons) actionButtons.style.display = "flex";
      }
    );
  };

  // FETCH REQUEST DETAILS
  const fetchRequests = async () => {
    try {
      const result = await axios.get(`/user/service-request/reserve/${tx_ref}`);
      setRequests(result.data);
    } catch (err) {
      toast.error("Error when fetching request data");
    } finally {
      setLoading(false); // ➤ mark loading as finished
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [tx_ref]);

  useEffect(() => {
    if (requests) reserveVenue(requests);
  }, [requests]);

  // AUTO-RESERVE VENUE
  const reserveVenue = async (request) => {
    try {
      if (!request.venue_id || !request.date) return;

      const unavailable_dates = Object.entries(request.date).map(
        ([dateKey, dateObj]) => ({
          date: format(new Date(dateKey), "yyyy-MM-dd"),
          weekly_recurrence: 0,
          monthly_recurrence: 0,
          time_slots: Array.isArray(dateObj.timeSlots)
            ? dateObj.timeSlots.map((s) => ({
                start_time: s.startTime,
                end_time: s.endTime,
              }))
            : [],
        })
      );

      await axios.post(`/user/schedule/${parseInt(request.venue_id)}`, {
        unavailable_dates,
      });
    } catch (error) {
      console.error("Error adding unavailable dates:", error);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 flex flex-col">
      <Navigation />

      <div className="flex-1 flex items-center justify-center py-8 px-4 sm:py-12 mt-8">
        <div className="max-w-xl w-full mx-4">

          {/* LOADING STATE */}
          {loading && (
            <Card className="p-8 text-center text-gray-600">
              <p>{t("services.loading")}...</p>
            </Card>
          )}

          {/* NO DATA FOUND */}
          {!loading && !requests && (
            <Card className="p-8 text-center text-red-600">
              <p>{t("services.no_data_found")}</p>
            </Card>
          )}

          {/* ONLY SHOW WHEN DATA EXISTS */}
          {requests && (
            <Card
              ref={confirmationCardRef}
              className="w-full bg-white border border-amber-200 shadow-lg overflow-hidden"
            >
              <CardHeader className="pb-4 flex flex-col items-center pt-8 px-6">
                <CheckCircle className="w-16 h-16 text-amber-500 mb-3" />
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2 text-center">
                  {t("services.confirmation_title")}
                </CardTitle>
                <Badge className="bg-green-100 text-green-800 text-base px-4 py-1 rounded-full">
                  {(requests.status || "").toUpperCase()}
                </Badge>

                <div className="mt-3 text-gray-600 text-sm text-center">
                  {t("services.confirmation_reference")}:{" "}
                  <span className="font-mono text-amber-600">
                    {requests.tx_ref || tx_ref}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pb-6 px-6">

                {/* SERVICE DETAILS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      {t("services.confirmation_service_details")}
                    </h3>

                    <div className="space-y-3">
                      {/* DATE & TIME */}
                      <div className="flex items-start gap-2 text-gray-700">
                        <CalendarIcon className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>
                          {requests.date
                            ? Object.entries(requests.date)
                                .map(([dateKey, dateObj]) => {
                                  const dateDisplay =
                                    i18n.language === "am"
                                      ? formatEthiopian(new Date(dateKey), {
                                          amharic: true,
                                        })
                                      : format(
                                          new Date(dateKey),
                                          "yyyy-MM-dd"
                                        );

                                  let times = t(
                                    "services.confirmation_full_day"
                                  );

                                  if (
                                    !dateObj.fullDay &&
                                    dateObj.timeSlots?.length > 0
                                  ) {
                                    times = dateObj.timeSlots
                                      .map((slot) => {
                                        if (i18n.language === "am") {
                                          const start = formatEthiopianTime(
                                            slot.startTime,
                                            {
                                              clock: "ethiopian",
                                              amharic: true,
                                              periodStyle: "full",
                                            }
                                          );
                                          const end = formatEthiopianTime(
                                            slot.endTime,
                                            {
                                              clock: "ethiopian",
                                              amharic: true,
                                              periodStyle: "full",
                                            }
                                          );
                                          return `${start} - ${end}`;
                                        }
                                        return `${slot.startTime} - ${slot.endTime}`;
                                      })
                                      .join(", ");
                                  }

                                  return `${dateDisplay} (${times})`;
                                })
                                .join("; ")
                            : "-"}
                        </span>
                      </div>

                      {/* ATTENDEES */}
                      <div className="flex items-start gap-2 text-gray-700">
                        <Users className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>
                          {requests.expectedAttendees}{" "}
                          {t("services.confirmation_attendees")}
                        </span>
                      </div>

                      {/* CATEGORY */}
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-bold">
                          {t("services.confirmation_category")}:
                        </span>
                        <span>
                          {translateField(requests, i18n.language, "category")}
                        </span>
                      </div>

                      {/* VENUE */}
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-bold">
                          {t("services.confirmation_venue")}:
                        </span>
                        <span>
                          {translateField(requests, i18n.language, "venue")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CUSTOMER INFO */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      {t("services.confirmation_customer_info")}
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-bold">
                          {t("services.confirmation_organization")}:
                        </span>
                        <span>{requests.organizationName}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-bold">
                          {t("services.confirmation_contact_person")}:
                        </span>
                        <span>{requests.contactPerson}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-bold">
                          {t("services.confirmation_email")}:
                        </span>
                        <span>{requests.email}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-bold">
                          {t("services.confirmation_phone")}:
                        </span>
                        <span>{requests.phoneNo}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PAYMENT SUMMARY */}
                <div className="border-t border-amber-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {t("services.confirmation_payment_summary")}
                  </h3>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-lg text-gray-800">
                    <CreditCard className="w-6 h-6 text-amber-500" />
                    <span className="font-bold">
                      {Number(requests.amount).toFixed(2)} {requests.currency}
                    </span>

                    <span className="text-gray-500 text-sm">
                      {t("services.confirmation_paid_on")}{" "}
                      {requests.createdAt
                        ? i18n.language === "am"
                          ? formatEthiopian(new Date(requests.createdAt), {
                              amharic: true,
                            })
                          : format(
                              new Date(requests.createdAt),
                              "yyyy-MM-dd HH:mm"
                            )
                        : "-"}
                    </span>
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4 action-buttons">
                  <Button
                    onClick={downloadPDF}
                    variant="outline"
                    className="border-amber-600 text-amber-600 hover:bg-amber-50 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-base sm:text-lg w-full sm:w-auto"
                  >
                    <Download size={18} />
                    {t("services.confirmation_download_pdf")}
                  </Button>
                </div>

              </CardContent>
            </Card>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}

