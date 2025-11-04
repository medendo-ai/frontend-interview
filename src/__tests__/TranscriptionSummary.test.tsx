import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ModelStatus, TranscriptionSummary } from "../components/TranscriptionSummary";

// Mock the @xenova/transformers module
jest.mock("@xenova/transformers", () => ({
  pipeline: jest.fn(),
}));

describe("TranscriptionSummary", () => {
  const mockPipeline = require("@xenova/transformers").pipeline;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders summary button", async () => {
      await act(async () => {
        render(<TranscriptionSummary transcript="" />);
      });

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("shows loading state initially", async () => {
      // Mock pipeline to never resolve to keep it in loading state
      mockPipeline.mockImplementation(() => new Promise(() => {}));

      await act(async () => {
        render(<TranscriptionSummary transcript="" />);
      });

      expect(screen.getByText("Loading Model...")).toBeInTheDocument();
    });

    it("disables button when transcript is empty", async () => {
      await act(async () => {
        render(<TranscriptionSummary transcript="" />);
      });

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("has correct CSS classes", async () => {
      const { container } = await act(async () => {
        return render(<TranscriptionSummary transcript="test" />);
      });

      expect(container.firstChild).toHaveClass("summary-section");
      expect(screen.getByRole("button")).toHaveClass("summary-button");
    });
  });

  describe("Model Loading", () => {
    it("shows ready state when model loads successfully", async () => {
      const mockSummarizer = jest.fn();
      mockPipeline.mockResolvedValueOnce(mockSummarizer);

      await act(async () => {
        render(<TranscriptionSummary transcript="test transcript" />);
      });

      await waitFor(() => {
        expect(screen.getByText("Generate Transcription Report")).toBeInTheDocument();
      });
    });

    it("shows error state when model fails to load", async () => {
      mockPipeline.mockRejectedValueOnce(new Error("Model loading failed"));

      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      await act(async () => {
        render(<TranscriptionSummary transcript="test transcript" />);
      });

      await waitFor(() => {
        expect(screen.getByText("Model Failed to Load")).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });
  });

  describe("Summary Generation", () => {
    it("button is disabled for empty transcript even when model is ready", async () => {
      const mockSummarizer = jest.fn();
      mockPipeline.mockResolvedValue(mockSummarizer);

      // Start with valid transcript to get model loaded
      const { rerender } = await act(async () => {
        return render(<TranscriptionSummary transcript="valid text" />);
      });

      // Wait for model to load
      await waitFor(() => {
        expect(screen.getByText("Generate Transcription Report")).toBeInTheDocument();
      });

      // Verify button is enabled with valid text
      let button = screen.getByText("Generate Transcription Report");
      expect(button).not.toBeDisabled();

      // Now change to empty transcript
      await act(async () => {
        rerender(<TranscriptionSummary transcript="" />);
      });

      // Button should now be disabled
      button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent("Generate Transcription Report");
    });

    it("button is disabled when model is not ready", async () => {
      // Mock pipeline to never resolve, keeping model in loading state
      mockPipeline.mockImplementation(() => new Promise(() => {})); // Never resolves

      await act(async () => {
        render(<TranscriptionSummary transcript="test transcript" />);
      });

      // Button should be in loading state and disabled
      const button = screen.getByText("Loading Model...");
      expect(button).toBeDisabled();
    });

    it("generates summary with valid transcript and ready model", async () => {
      const mockSummarizer = jest.fn().mockResolvedValue([
        {
          summary_text: "This is a test summary",
        },
      ]);
      mockPipeline.mockResolvedValue(mockSummarizer);

      await act(async () => {
        render(
          <TranscriptionSummary transcript="This is a long test transcript that needs to be summarized" />,
        );
      });

      // Wait for model to load
      await waitFor(() => {
        expect(screen.getByText("Generate Transcription Report")).toBeInTheDocument();
      });

      const button = screen.getByText("Generate Transcription Report");
      expect(button).not.toBeDisabled();

      await act(async () => {
        fireEvent.click(button);
      });

      // Wait for summary generation
      await waitFor(() => {
        expect(screen.getByText("Bug Report Summary")).toBeInTheDocument();
        expect(screen.getByText("This is a test summary")).toBeInTheDocument();
      });

      expect(mockSummarizer).toHaveBeenCalledWith(
        "This is a long test transcript that needs to be summarized",
        expect.objectContaining({
          max_length: 100,
          min_length: 30,
          do_sample: false,
        }),
      );
    });

    it("shows generating state during summary creation", async () => {
      const mockSummarizer = jest
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) => setTimeout(() => resolve([{ summary_text: "Summary" }]), 100)),
        );
      mockPipeline.mockResolvedValue(mockSummarizer);

      await act(async () => {
        render(<TranscriptionSummary transcript="test transcript" />);
      });

      // Wait for model to load
      await waitFor(() => {
        expect(screen.getByText("Generate Transcription Report")).toBeInTheDocument();
      });

      const button = screen.getByText("Generate Transcription Report");

      await act(async () => {
        fireEvent.click(button);
      });

      // Should show generating state
      expect(screen.getByText("Generating...")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText("Generate Transcription Report")).toBeInTheDocument();
      });
    });
  });

  describe("ModelStatus enum", () => {
    it("has correct values", () => {
      expect(ModelStatus.Loading).toBe("loading");
      expect(ModelStatus.Ready).toBe("ready");
      expect(ModelStatus.Error).toBe("error");
    });
  });

  describe("Button States", () => {
    it("shows loading state when model is loading", async () => {
      // Mock pipeline to keep it in loading state
      mockPipeline.mockImplementation(() => new Promise(() => {})); // Never resolves

      await act(async () => {
        render(<TranscriptionSummary transcript="test" />);
      });

      expect(screen.getByText("Loading Model...")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("shows error state when model fails to load", async () => {
      mockPipeline.mockRejectedValueOnce(new Error("Failed"));
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      await act(async () => {
        render(<TranscriptionSummary transcript="test" />);
      });

      await waitFor(() => {
        expect(screen.getByText("Model Failed to Load")).toBeInTheDocument();
      });

      expect(screen.getByRole("button")).toBeDisabled();
      consoleError.mockRestore();
    });

    it("button is disabled when transcript is empty or model not ready", async () => {
      await act(async () => {
        render(<TranscriptionSummary transcript="" />);
      });

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });
});
