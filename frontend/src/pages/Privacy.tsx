import React, { useEffect, useState } from "react";
import { ArrowLeft, Shield, Mail, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import {
  DEFAULT_PRIVACY_SETTINGS,
  type PrivacySettings,
} from "../lib/siteSettings";

// Public legal content is bundled with the app, not fetched from a private API.
// This makes the policy immediately available even before authentication.
export default function Privacy() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const [privacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const isLao = lang === "lo";
  const dark = theme === "dark";

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = isLao
      ? "ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ | Pasopkan"
      : "Privacy Policy | Pasopkan";
  }, [isLao]);

  return (
    <main
      className={`min-h-screen px-4 py-8 sm:py-12 ${dark ? "bg-zinc-950 text-zinc-100" : "bg-gray-50 text-gray-900"}`}
    >
      <article
        className={`mx-auto max-w-4xl rounded-3xl border p-6 shadow-sm sm:p-10 ${dark ? "border-zinc-800 bg-zinc-900" : "border-gray-200 bg-white"}`}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {isLao ? "ກັບຄືນ" : "Back to Home"}
        </button>

        <header className="mb-8 border-b border-gray-200 pb-6 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-orange-100 p-3 text-orange-600 dark:bg-orange-950/50">
              <Shield className="h-6 w-6" aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-bold sm:text-3xl">
              {isLao ? "ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ" : "Privacy Policy"}
            </h1>
          </div>
          <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-zinc-300">
            {isLao
              ? "ສຳລັບຜູ້ໃຊ້ Pasopkan, ຜູ້ຈອງປີ້ ແລະຜູ້ຈັດກິດຈະກຳ."
              : "For Pasopkan visitors, ticket buyers, and event organizers."}
          </p>
          <a
            href="https://pasopkan.la"
            className="mt-2 inline-flex items-center gap-1 text-sm text-orange-600 hover:underline"
          >
            pasopkan.la{" "}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </header>

        <div className="space-y-8">
          {privacySettings.sections.map((section, index) => (
            <section key={index} aria-labelledby={`privacy-heading-${index}`}>
              <h2
                id={`privacy-heading-${index}`}
                className="mb-3 text-lg font-bold leading-relaxed sm:text-xl"
              >
                {isLao ? section.title_lo : section.title_en}
              </h2>
              <p className="whitespace-pre-line text-sm leading-8 text-gray-700 dark:text-zinc-300 sm:text-base">
                {isLao ? section.content_lo : section.content_en}
              </p>
            </section>
          ))}
        </div>

        <footer className="mt-10 border-t border-gray-200 pt-6 dark:border-zinc-700">
          <a
            href="mailto:ladomportal@gmail.com?subject=Pasopkan%20Privacy%20Request"
            className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:underline"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />{" "}
            ladomportal@gmail.com
          </a>
        </footer>
      </article>
    </main>
  );
}
