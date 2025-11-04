import { render, screen } from "@testing-library/react";
import App from "../App";

// Mock @xenova/transformers at the top level
jest.mock("@xenova/transformers", () => ({
  env: {
    backends: {
      onnx: {
        wasm: {
          numThreads: 1,
        },
      },
    },
  },
}));

// Mock the speech recognition hook
jest.mock("../hooks/useSpeechRecognition", () => ({
  useSpeechRecognition: () => ({
    isRecording: false,
    transcript: "",
    interimText: "",
    toggleRecording: jest.fn(),
    clearTranscript: jest.fn(),
  }),
}));

// Mock the TranscriptionSummary component to avoid transformer loading
jest.mock("../components/TranscriptionSummary", () => ({
  TranscriptionSummary: ({ transcript }: { transcript: string }) => (
    <div data-testid="transcription-summary">Mock Summary Component - Transcript: {transcript}</div>
  ),
}));

describe("App", () => {
  beforeEach(() => {
    // Mock window.alert to avoid jsdom errors
    global.alert = jest.fn();
  });

  it("renders the main title", () => {
    render(<App />);

    expect(screen.getByText("Buggy Speech-to-Text")).toBeInTheDocument();
  });

  it("renders the record button", () => {
    render(<App />);

    expect(screen.getByText("Start Recording")).toBeInTheDocument();
  });

  it("renders the language selector", () => {
    render(<App />);

    expect(screen.getByLabelText("Language:")).toBeInTheDocument();
  });

  it("renders the transcription panel", () => {
    render(<App />);

    expect(screen.getByText("Bug Transcription")).toBeInTheDocument();
    expect(screen.getByText("Your buggy transcription will appear here...")).toBeInTheDocument();
  });

  it("renders transcription statistics", () => {
    render(<App />);

    expect(screen.getByText(/Characters:/)).toBeInTheDocument();
    expect(screen.getByText(/Words:/)).toBeInTheDocument();
    expect(screen.getByText(/Sentences:/)).toBeInTheDocument();
    expect(screen.getByText(/Recording time:/)).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it("renders transcription summary component", () => {
    render(<App />);

    expect(screen.getByTestId("transcription-summary")).toBeInTheDocument();
  });

  it("has all decorative elements", () => {
    const { container } = render(<App />);

    expect(container.querySelector(".spider.top-left")).toBeInTheDocument();
    expect(container.querySelector(".spider.top-right")).toBeInTheDocument();
    expect(container.querySelector(".caterpillar")).toBeInTheDocument();
    expect(container.querySelector(".ladybug")).toBeInTheDocument();
    expect(container.querySelector(".beetle.bottom-right")).toBeInTheDocument();
  });

  it("has correct CSS classes", () => {
    const { container } = render(<App />);

    expect(container.firstChild).toHaveClass("App", "bug-theme");
  });
});
