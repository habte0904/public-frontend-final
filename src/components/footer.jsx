import { Link } from "react-router-dom"
import { MapPin, Phone, Mail, Clock, Facebook, Twitter, Instagram, Youtube } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getAllContent } from "../services/contentManagementService"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next";
import { translateField } from "@/utils/translate";

const defaultMuseumInfo = {
  logo: "",
  socialMedia: {
    facebook: "",
    twitter: "",
    instagram: "",
    youtube: ""
  },
  partners: [],
  contact: {
    opening_hours: "",
    opening_hours_am: "",
    phone: "",
    email: ""
  }
}

export default function Footer() {
  const { i18n } = useTranslation();
  const { t } = useTranslation();
  const [museumInfo, setMuseumInfo] = useState(defaultMuseumInfo);
  
  // Fetch all content on mount
  const fetchContent = async () => {
    try {
      const res = await getAllContent()
      const data = res.data;
      
      setMuseumInfo({
        logo: data.museumInfo?.find(x => x.setting_key === "company_logo")?.setting_value || "",
        socialMedia: {
          facebook: data.socialMediaLinks?.find(x => x.platform === "facebook")?.url || "",
          twitter: data.socialMediaLinks?.find(x => x.platform === "twitter")?.url || "",
          instagram: data.socialMediaLinks?.find(x => x.platform === "instagram")?.url || "",
          youtube: data.socialMediaLinks?.find(x => x.platform === "youtube")?.url || "",
        },
        partners: data.partners?.map((p) => ({ id: p.id, name: p.name,name_am:p.name_am, logo: p.logo_url, website: p.website_url })) || [],
        contact: {
          museum_name: data.museumInfo?.find((x) => x.setting_key === "museum_name")?.setting_value || "",
          opening_hours: data.museumInfo?.find(x => x.setting_key === "opening_hours")?.setting_value || "",
          phone: data.museumInfo?.find(x => x.setting_key === "phone")?.setting_value || "",
          email: data.museumInfo?.find(x => x.setting_key === "email")?.setting_value || "",
          museum_name_am: data.museumInfo?.find((x) => x.setting_key_am === "museum_name_am")?.setting_value_am || "",
          opening_hours_am: data.museumInfo?.find((x) => x.setting_key_am === "opening_hours_am")?.setting_value_am || "",
        }
      });
    } catch (err) {
      console.error("Failed to fetch content:", err);
    }
  };
  
  useEffect(() => {
    fetchContent();
  }, []);

  const handleSocialMediaClick = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-white py-12 border-t border-yellow-500/20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img
                  src={museumInfo.logo || "/images/adwa-logo.svg"}
                  alt="Adwa Museum Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                 {translateField(museumInfo.contact, i18n.language, "museum_name")}
              </span>
            </div>
            <p className="text-gray-400">{t('footer.preserving')}</p>
            <div className="flex space-x-3">
              {[
                { Icon: Facebook, url: museumInfo.socialMedia.facebook },
                { Icon: Twitter, url: museumInfo.socialMedia.twitter },
                { Icon: Instagram, url: museumInfo.socialMedia.instagram },
                { Icon: Youtube, url: museumInfo.socialMedia.youtube }
              ].map((item, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 bg-transparent w-10 h-10 p-0"
                  onClick={() => handleSocialMediaClick(item.url)}
                  disabled={!item.url}
                >
                  <item.Icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-yellow-400">{t('footer.quick_links')}</h3>
            <div className="space-y-2 text-gray-400">
              {[
                { href: "/", label: t('footer.home') },
                { href: "/about", label: t('footer.about') },
                { href: "/services", label: t('footer.services') },
                { href: "/events", label: t('footer.events') },
                { href: "/contact", label: t('footer.contact') },
                { href: "/news", label: t('nav.News') },
              ].map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="block hover:text-yellow-400 transition-colors duration-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4 text-yellow-400">{t('footer.info')}</h3>
            <div className="space-y-3 text-gray-400">
              {museumInfo.contact.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-yellow-400" />
                  <span>{museumInfo.contact.phone}</span>
                </div>
              )}
              {museumInfo.contact.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-yellow-400" />
                  <span>{museumInfo.contact.email}</span>
                </div>
              )}
              {museumInfo.contact.opening_hours && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span> {translateField(museumInfo.contact, i18n.language, "opening_hours")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4 text-yellow-400">{t('footer.stay_updated')}</h3>
            <p className="text-gray-400 text-sm mb-4">{t('footer.newsletter_desc')}</p>
            <div className="space-y-3">
              <Input
                placeholder={t('footer.newsletter_placeholder')}
                className="bg-gray-800/50 border-yellow-500/30 focus:border-yellow-400 text-white placeholder-gray-500"
              />
              <div className="mt-4">
                <a href='/signin'>
                  <Button
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold"
                    type="button"
                  >
                    {t('footer.subscribe')}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Partners Section */}
        {museumInfo.partners.length > 0 && (
          <div className="border-t border-yellow-500/20 mt-8 pt-8">
            <h3 className="font-semibold mb-4 text-yellow-400 text-center">{t('footer.partners')}</h3>
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400">
              {museumInfo.partners.map((partner) => (
                <a
                  key={partner.id}
                  href={partner.website || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-yellow-400 transition-colors duration-300"
                >
                   {translateField(partner, i18n.language, "name")}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Copyright */}
        <div className="border-t border-yellow-500/20 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025  {translateField(museumInfo.contact, i18n.language, "museum_name")}. {t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  )
}