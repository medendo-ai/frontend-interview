import React from "react";

export const AVAILABLE_LANGUAGES: Language[] = [
  { code: "en-US", label: "English" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "it-IT", label: "Italian" },
  { code: "nl-NL", label: "Dutch" },
];

export interface Language {
  code: string;
  label: string;
}

export interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
}) => {
  return (
    <div className="language-selector">
      <label htmlFor="language-dropdown">Language: </label>
      <select
        id="language-dropdown"
        value={currentLanguage}
        onChange={onLanguageChange}
        className="language-dropdown"
      >
        {AVAILABLE_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// Helper function to find language by code
export const findLanguageByCode = (code: string): Language | undefined => {
  return AVAILABLE_LANGUAGES.find((lang) => lang.code === code);
};

// Helper function to get default language
export const getDefaultLanguage = (): Language => {
  return AVAILABLE_LANGUAGES[0]; // English
};
