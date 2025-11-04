import { render, screen } from "@testing-library/react";
import {
  TranscriptionStatistics,
  calculateTranscriptStatistics,
} from "../components/TranscriptionStatistics";

describe("TranscriptionStatistics", () => {
  describe("TranscriptionStatistics Component", () => {
    const defaultProps = {
      characterCount: 100,
      wordCount: 20,
      sentenceCount: 5,
      isRecording: false,
      lastUpdated: Date.now(),
    };

    it("renders all statistics correctly", () => {
      render(<TranscriptionStatistics {...defaultProps} />);

      expect(screen.getByText("Characters: 100")).toBeInTheDocument();
      expect(screen.getByText("Words: 20")).toBeInTheDocument();
      expect(screen.getByText("Sentences: 5")).toBeInTheDocument();
      expect(screen.getByText("Recording time: Inactive")).toBeInTheDocument();
    });

    it('shows "Active" when recording', () => {
      render(<TranscriptionStatistics {...defaultProps} isRecording={true} />);

      expect(screen.getByText("Recording time: Active")).toBeInTheDocument();
    });

    it('shows "Inactive" when not recording', () => {
      render(<TranscriptionStatistics {...defaultProps} isRecording={false} />);

      expect(screen.getByText("Recording time: Inactive")).toBeInTheDocument();
    });

    it("formats last updated time correctly", () => {
      const fixedTime = new Date("2024-11-04T10:30:00").getTime();
      render(<TranscriptionStatistics {...defaultProps} lastUpdated={fixedTime} />);

      const timeString = new Date(fixedTime).toLocaleTimeString();
      expect(screen.getByText(`Last updated: ${timeString}`)).toBeInTheDocument();
    });

    it("has correct CSS class", () => {
      const { container } = render(<TranscriptionStatistics {...defaultProps} />);

      expect(container.firstChild).toHaveClass("stats-panel");
    });
  });

  describe("calculateTranscriptStatistics", () => {
    it("calculates statistics for empty string", () => {
      const stats = calculateTranscriptStatistics("");

      expect(stats).toEqual({
        characterCount: 0,
        wordCount: 0,
        sentenceCount: 0,
      });
    });

    it("calculates statistics for simple text", () => {
      const stats = calculateTranscriptStatistics("Hello world. How are you?");

      expect(stats).toEqual({
        characterCount: 25,
        wordCount: 5,
        sentenceCount: 2,
      });
    });

    it("handles text with multiple spaces correctly", () => {
      const stats = calculateTranscriptStatistics("Hello    world.   How   are   you?");

      expect(stats).toEqual({
        characterCount: 34,
        wordCount: 5,
        sentenceCount: 2,
      });
    });

    it("handles text with different sentence endings", () => {
      const stats = calculateTranscriptStatistics("Hello! How are you? Great.");

      expect(stats).toEqual({
        characterCount: 26,
        wordCount: 5,
        sentenceCount: 3,
      });
    });

    it("handles text with no sentence endings", () => {
      const stats = calculateTranscriptStatistics("Hello world");

      expect(stats).toEqual({
        characterCount: 11,
        wordCount: 2,
        sentenceCount: 1,
      });
    });

    it("handles single word", () => {
      const stats = calculateTranscriptStatistics("Hello");

      expect(stats).toEqual({
        characterCount: 5,
        wordCount: 1,
        sentenceCount: 1,
      });
    });

    it("handles only whitespace", () => {
      const stats = calculateTranscriptStatistics("   ");

      expect(stats).toEqual({
        characterCount: 3,
        wordCount: 0,
        sentenceCount: 1,
      });
    });
  });
});
