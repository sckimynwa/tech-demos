import { describe, expect, test } from "bun:test"
import { buildMockTranscript, detectLanguage } from "./mock"

describe("detectLanguage", () => {
  test("honors an explicit language", () => {
    expect(detectLanguage("sample-meeting.wav", "fr")).toBe("fr")
  })

  test("reads korean from the file name", () => {
    expect(detectLanguage("interview-ko.wav", "")).toBe("ko")
  })
})

describe("buildMockTranscript", () => {
  const base = {
    fileName: "sample-meeting.wav",
    duration: 8,
    language: "",
    keyterms: [] as string[],
  }

  test("includes speaker labels when diarize is on", () => {
    const result = buildMockTranscript({
      ...base,
      diarize: true,
      format: false,
      fillerWords: false,
    })
    expect(result.mode).toBe("demo")
    expect(result.language).toBe("en")
    expect(result.words.some((word) => word.speaker === 1)).toBe(true)
    expect(result.text).toContain("Grok")
  })

  test("collapses spoken numbers when format is on", () => {
    const spoken = buildMockTranscript({
      ...base,
      diarize: false,
      format: false,
      fillerWords: false,
    })
    const formatted = buildMockTranscript({
      ...base,
      diarize: false,
      format: true,
      fillerWords: false,
    })
    expect(spoken.text).toContain("two point oh")
    expect(formatted.text).toContain("2.0")
    expect(formatted.text).toContain("$167,000.")
    expect(formatted.words.every((word) => word.speaker === undefined)).toBe(true)
  })

  test("keeps fillers only when requested", () => {
    const clean = buildMockTranscript({
      ...base,
      diarize: true,
      format: false,
      fillerWords: false,
    })
    const messy = buildMockTranscript({
      ...base,
      diarize: true,
      format: false,
      fillerWords: true,
    })
    expect(clean.text.includes(" um ")).toBe(false)
    expect(messy.text).toContain("um")
  })
})
