import { describe, it, expect } from "vitest";
import { parseReplies } from "./demo";

describe("parseReplies", () => {
  it("parses task/model/mode and the fenced reply body", () => {
    const md = [
      "# header",
      "",
      "## coupon / openai:gpt-4o / off",
      "",
      "~~~",
      "some reply text",
      "~~~",
      "",
      "## bug / openai:gpt-4o-mini / on",
      "",
      "~~~",
      "請提供重現步驟",
      "~~~",
      "",
    ].join("\n");

    const rows = parseReplies(md);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      taskId: "coupon", modelId: "openai:gpt-4o", mode: "off", reply: "some reply text",
    });
    expect(rows[1].mode).toBe("on");
    expect(rows[1].reply).toContain("請提供重現步驟");
  });

  it("skips malformed sections", () => {
    const md = "## not-a-valid-label\n\nno fence here\n";
    expect(parseReplies(md)).toEqual([]);
  });
});
