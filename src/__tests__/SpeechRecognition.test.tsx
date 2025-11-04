import { act, renderHook } from "@testing-library/react";
import { useSpeechRecognition } from "../SpeechRecognition";

// Mock the Web Speech API
const mockSpeechRecognition = {
  continuous: false,
  interimResults: false,
  lang: "",
  onresult: null,
  onerror: null,
  start: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
};

// Mock global window objects
Object.defineProperty(window, "SpeechRecognition", {
  writable: true,
  configurable: true,
  value: jest.fn().mockImplementation(() => mockSpeechRecognition),
});

Object.defineProperty(window, "webkitSpeechRecognition", {
  writable: true,
  configurable: true,
  value: jest.fn().mockImplementation(() => mockSpeechRecognition),
});

describe("useSpeechRecognition", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSpeechRecognition.start.mockClear();
    mockSpeechRecognition.stop.mockClear();

    // Reset window properties to default state for each test
    Object.defineProperty(window, "SpeechRecognition", {
      writable: true,
      configurable: true,
      value: jest.fn().mockImplementation(() => mockSpeechRecognition),
    });

    Object.defineProperty(window, "webkitSpeechRecognition", {
      writable: true,
      configurable: true,
      value: jest.fn().mockImplementation(() => mockSpeechRecognition),
    });
  });

  describe("Hook initialization", () => {
    it("returns initial state correctly", () => {
      const { result } = renderHook(() => useSpeechRecognition());

      expect(result.current.isRecording).toBe(false);
      expect(result.current.transcript).toBe("");
      expect(result.current.interimText).toBe("");
      expect(result.current.isSupported).toBe(true);
      expect(typeof result.current.toggleRecording).toBe("function");
      expect(typeof result.current.clearTranscript).toBe("function");
    });

    it("sets language correctly", () => {
      renderHook(() => useSpeechRecognition({ language: "es-ES" }));

      expect(mockSpeechRecognition.lang).toBe("es-ES");
    });

    it("sets default language when not provided", () => {
      renderHook(() => useSpeechRecognition());

      expect(mockSpeechRecognition.lang).toBe("en-US");
    });
  });

  describe("Speech recognition configuration", () => {
    it("configures speech recognition correctly", () => {
      renderHook(() => useSpeechRecognition());

      expect(mockSpeechRecognition.continuous).toBe(true);
      expect(mockSpeechRecognition.interimResults).toBe(true);
    });
  });

  describe("Browser compatibility", () => {
    it("detects unsupported browsers", () => {
      // Delete properties completely to simulate unsupported browser
      delete (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;

      const { result } = renderHook(() => useSpeechRecognition());

      expect(result.current.isSupported).toBe(false);
    });

    it("supports browsers with SpeechRecognition", () => {
      // Ensure SpeechRecognition is available
      Object.defineProperty(window, "SpeechRecognition", {
        writable: true,
        configurable: true,
        value: jest.fn().mockImplementation(() => mockSpeechRecognition),
      });
      delete (window as any).webkitSpeechRecognition;

      const { result } = renderHook(() => useSpeechRecognition());

      expect(result.current.isSupported).toBe(true);
    });

    it("supports browsers with webkitSpeechRecognition", () => {
      // Ensure webkitSpeechRecognition is available
      delete (window as any).SpeechRecognition;
      Object.defineProperty(window, "webkitSpeechRecognition", {
        writable: true,
        configurable: true,
        value: jest.fn().mockImplementation(() => mockSpeechRecognition),
      });

      const { result } = renderHook(() => useSpeechRecognition());

      expect(result.current.isSupported).toBe(true);
    });
  });

  describe("Recording functionality", () => {
    it("clears transcript correctly", () => {
      const { result } = renderHook(() => useSpeechRecognition());

      // Simulate having some transcript data
      expect(typeof result.current.clearTranscript).toBe("function");

      // Call clear function
      result.current.clearTranscript();

      expect(result.current.transcript).toBe("");
      expect(result.current.interimText).toBe("");
    });

    it("toggleRecording function exists and is callable", () => {
      const { result } = renderHook(() => useSpeechRecognition());

      expect(typeof result.current.toggleRecording).toBe("function");

      // Should not throw when called
      act(() => {
        result.current.toggleRecording();
      });

      // Verify recording state changed
      expect(result.current.isRecording).toBe(true);
    });
  });
});
