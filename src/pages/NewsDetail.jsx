"use client"

import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import axios from "../services/axiosInstance"
import Navigation from "../components/navigation"
import Footer from "../components/footer"
import { useTranslation } from "react-i18next";
import { translateField } from "@/utils/translate";
import { Turnstile } from "@marsidev/react-turnstile"; // ✅ import Turnstile
import { MdCheckCircle } from "react-icons/md";
import { motion } from "framer-motion";

const NewsDetail = () => {
  const { i18n } = useTranslation();
  const { t } = useTranslation();
  const lang = i18n.language;
  const { id } = useParams()
  const [news, setNews] = useState(null)
  const [tab, setTab] = useState("en")
  const [comments, setComments] = useState([])
  const [form, setForm] = useState({ name: "", email: "", comment: "", captchaToken: "" }) // added captchaToken
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [showSuccess, setShowSuccess] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      const newsRes = await axios.get(`/news/${id}`)
      setNews(newsRes.data)
      const commentsRes = await axios.get(`/news/${id}/comments`)
      setComments(commentsRes.data)
    }
    fetchData()
  }, [id])

  const handleComment = async (e) => {
    e.preventDefault()

    // Validate email
    if (!validateEmail(form.email)) {
      setEmailError(lang === "am" ? "እባክዎት የሚሰራ ኢሜይል አድራሻ ያስገቡ።" : "Please enter a valid email address")
      return
    }

    // Check captcha
    if (!captchaVerified) {
      alert(lang === "am" ? "እባክዎት ሮቦት እንዳልሆኑ ያረጋግጡ።" : "Please verify that you are not a robot")
      return
    }

    setEmailError("")
    await axios.post(`/news/${id}/comments`, form)
    setForm({ name: "", email: "", comment: "", captchaToken: "" }) // reset captcha token
    setCaptchaVerified(false)
    const commentsRes = await axios.get(`/news/${id}/comments`)
    setComments(commentsRes.data)
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  }

  if (!news)
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white text-black flex flex-col">
        <Navigation />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
              <div className="text-lg text-neutral-600 font-medium">{t("newsDetails.loading")}</div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white text-black flex flex-col">
      <Navigation />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
        <article className="bg-white rounded-2xl shadow-xl overflow-hidden border border-amber-100 ">
          {news.image_url && (
            <div className="relative overflow-hidden bg-white mt-16 sm:mt-8 md:mt-10 lg:mt-12">
              <img
                src={news.image_url || "/placeholder.svg"}
                alt={news.title}
                className="object-cover w-full h-48 sm:h-64 md:h-80 lg:h-96 rounded-2xl shadow-md mx-auto"
                style={{ maxHeight: '28rem' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            </div>
          )}

          <div className="p-4 sm:p-6 lg:p-10">
            <header className="mb-8">
              <h1 className="text-xl sm:text-3xl lg:text-2xl xl:text-2xl font-bold mb-4 text-black leading-tight">
                {translateField(news, i18n.language, "title")}

              </h1>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-sm sm:text-base text-neutral-600 font-medium">
                    {new Date(news.published_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  {news.source && news.source !== 'local' && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                      {news.source}
                    </span>
                  )}
                </div>
                {news.external_link && (
                  <a
                    href={news.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    <span>View on {news.source || 'Social Media'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </header>

            <div className="prose prose-lg max-w-none mb-12">
              <div className="text-base sm:text-lg leading-relaxed text-gray-800 whitespace-pre-line">
                {translateField(news, i18n.language, "content")}
              </div>
            </div>

            <hr className="my-8 border-amber-200" />

            <section>
              <h3 className="text-xl sm:text-2xl font-bold mb-6 text-black flex items-center gap-3">
                <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
                {t("newsDetails.commentTitle")} ({comments.length})
              </h3>

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">{t("newsDetails.noComment")}</p>
                    <p className="text-gray-400 text-sm">{t("newsDetails.beFirst")}</p>
                  </div>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white border border-amber-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                            <span className="text-black font-bold text-sm">{c.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-black">{c.name}</h4>
                            <span className="text-xs text-neutral-500">
                              {new Date(c.created_at).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-800 leading-relaxed whitespace-pre-line">{c.comment}</p>
                    </div>
                  ))
                )}
              </div>
              <h3 className=" text-xl sm:text-2xl font-bold mt-6 mb-6 ">{t("newsDetails.leaveComment")}</h3>
              {showSuccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-8 p-6 bg-green-50 rounded-xl border border-green-200 flex flex-col items-center justify-center min-h-[180px] sm:min-h-[120px]"
                >
                  <MdCheckCircle className="text-5xl sm:text-6xl text-green-500 mb-4" />
                  <h4 className="text-lg sm:text-xl font-bold text-green-700 mb-2 text-center">{t("newsDetails.success") || "Your comment was posted!"}</h4>
                  <p className="text-base text-green-600 text-center">{t("newsDetails.successDesc") || "Thank you for your feedback."}</p>
                </motion.div>
              ) : (
                <form onSubmit={handleComment} className="mb-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t("newsDetails.name")}</label>
                      <input
                        type="text"
                        placeholder={t("newsDetails.fname")}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        className="w-full px-4 py-3 border-2 border-amber-200 rounded-lg bg-white text-black placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t("newsDetails.email")}</label>
                      <input
                        type="email"
                        placeholder={t("newsDetails.emailp")}
                        value={form.email}
                        onChange={(e) => {
                          setForm({ ...form, email: e.target.value })
                          if (emailError) setEmailError("")
                        }}
                        required
                        className={`w-full px-4 py-3 border-2 rounded-lg bg-white text-black placeholder-neutral-400 focus:outline-none focus:ring-2 transition-all duration-200 ${emailError
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-amber-200 focus:ring-amber-500 focus:border-amber-500"
                          }`}
                      />
                      {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t("newsDetails.comment")}</label>
                    <textarea
                      placeholder={t("newsDetails.text")}
                      value={form.comment}
                      onChange={(e) => setForm({ ...form, comment: e.target.value })}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-amber-200 rounded-lg bg-white text-black placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 resize-vertical"
                    />
                  </div>
                  {/* ---------------- Turnstile captcha ---------------- */}
                  <div className="mb-4 flex  w-full">
                    <Turnstile
                      siteKey="0x4AAAAAAB3lN_HX44S1Mqf2"
                      onSuccess={(token) => {
                        setCaptchaVerified(true)
                        setForm({ ...form, captchaToken: token })
                      }}
                      onExpire={() => setCaptchaVerified(false)}
                    />
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <button
                      type="submit"
                      disabled={!captchaVerified}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${captchaVerified
                          ? "bg-amber-500 hover:bg-amber-600 text-black shadow-md hover:shadow-lg transform hover:scale-105"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                      {t("newsDetails.postComment")}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}

export default NewsDetail

