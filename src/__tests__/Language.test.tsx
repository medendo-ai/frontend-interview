import { fireEvent, render, screen } from "@testing-library/react";
import {
  AVAILABLE_LANGUAGES,
  findLanguageByCode,
  getDefaultLanguage,
  LanguageSelector,
} from "../components/Language";

describe("Language", () => {
  describe("LanguageSelector", () => {
    const mockOnLanguageChange = jest.fn();

    beforeEach(() => {
      mockOnLanguageChange.mockClear();
    });

    it("renders with correct initial language", () => {
      render(<LanguageSelector currentLanguage="en-US" onLanguageChange={mockOnLanguageChange} />);

      const select = screen.getByLabelText("Language:");
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue("en-US");
    });

    it("renders all available languages as options", () => {
      render(<LanguageSelector currentLanguage="en-US" onLanguageChange={mockOnLanguageChange} />);

      AVAILABLE_LANGUAGES.forEach((language) => {
        expect(screen.getByText(language.label)).toBeInTheDocument();
      });
    });

    it("calls onLanguageChange when selection changes", () => {
      render(<LanguageSelector currentLanguage="en-US" onLanguageChange={mockOnLanguageChange} />);

      const select = screen.getByLabelText("Language:");
      fireEvent.change(select, { target: { value: "es-ES" } });

      expect(mockOnLanguageChange).toHaveBeenCalledTimes(1);
    });

    it("has correct accessibility attributes", () => {
      render(<LanguageSelector currentLanguage="en-US" onLanguageChange={mockOnLanguageChange} />);

      const select = screen.getByLabelText("Language:");
      expect(select).toHaveAttribute("id", "language-dropdown");
      expect(select).toHaveClass("language-dropdown");
    });
  });

  describe("Helper functions", () => {
    describe("findLanguageByCode", () => {
      it("returns the correct language for valid code", () => {
        const language = findLanguageByCode("en-US");
        expect(language).toEqual({ code: "en-US", label: "English" });
      });

      it("returns undefined for invalid code", () => {
        const language = findLanguageByCode("invalid-code");
        expect(language).toBeUndefined();
      });
    });

    describe("getDefaultLanguage", () => {
      it("returns English as default language", () => {
        const defaultLang = getDefaultLanguage();
        expect(defaultLang).toEqual({ code: "en-US", label: "English" });
      });
    });
  });

  describe("AVAILABLE_LANGUAGES", () => {
    it("contains expected languages", () => {
      expect(AVAILABLE_LANGUAGES).toHaveLength(6);
      expect(AVAILABLE_LANGUAGES[0]).toEqual({ code: "en-US", label: "English" });
      expect(AVAILABLE_LANGUAGES[1]).toEqual({ code: "es-ES", label: "Spanish" });
    });

    it("all languages have code and label properties", () => {
      AVAILABLE_LANGUAGES.forEach((language) => {
        expect(language).toHaveProperty("code");
        expect(language).toHaveProperty("label");
        expect(typeof language.code).toBe("string");
        expect(typeof language.label).toBe("string");
      });
    });
  });
});
