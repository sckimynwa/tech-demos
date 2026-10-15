import { expect, test } from "bun:test";
import { SAMPLE_UTTERANCES } from "../../lib/constants";
import { parseTaskKind } from "./parseIntent";

test("sample chips map to the intended task kinds", () => {
  expect(parseTaskKind(SAMPLE_UTTERANCES[0].text)).toBe("research");
  expect(parseTaskKind(SAMPLE_UTTERANCES[1].text)).toBe("summary");
  expect(parseTaskKind(SAMPLE_UTTERANCES[2].text)).toBe("file_write");
});

test("summary wins over note-like words", () => {
  expect(
    parseTaskKind("Summarize last week's standup notes while I keep talking."),
  ).toBe("summary");
});
