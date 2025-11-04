import { renderHook } from "@testing-library/react";
import { useSummarizer } from "../hooks/useSummarizer";

// Mock the @xenova/transformers module
jest.mock("@xenova/transformers", () => ({
  pipeline: jest.fn(),
}));

describe("useSummarizer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.alert to avoid jsdom errors
    global.alert = jest.fn();
  });

  it("should initialize with default state", () => {
    const mockPipeline = require("@xenova/transformers").pipeline;
    mockPipeline.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useSummarizer());

    expect(result.current.summary).toBe("");
    expect(result.current.isGeneratingSummary).toBe(false);
    expect(typeof result.current.generateSummary).toBe("function");
    expect(typeof result.current.clearSummary).toBe("function");
  });
});
