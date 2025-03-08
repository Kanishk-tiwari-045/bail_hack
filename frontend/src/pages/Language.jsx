import React from "react";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language;

  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      {/* English using USA flag emoji */}
      <span
        onClick={() => changeLanguage("en")}
        style={{
          fontSize: "30px",
          cursor: "pointer",
          color: currentLanguage === "en" ? "#34d399" : "#aaa",
        }}
      >
        🇺🇸
      </span>
      {/* Hindi using Indian flag emoji */}
      <span
        onClick={() => changeLanguage("hi")}
        style={{
          fontSize: "30px",
          cursor: "pointer",
          color: currentLanguage === "hi" ? "#34d399" : "#aaa",
        }}
      >
        🇮🇳
      </span>
    </div>
  );
}
