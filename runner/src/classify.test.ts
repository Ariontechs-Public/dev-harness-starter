import { describe, it, expect } from "vitest";
import { classifyReply } from "./classify";

describe("classifyReply", () => {
  it("flags a clarifying question with no code as askedFirst", () => {
    const r = classifyReply("總額可以變負嗎?四捨五入到幾位?先確認再動工。");
    expect(r.askedFirst).toBe(true);
    expect(r.code).toBeNull();
  });

  it("extracts a fenced ts block and is not askedFirst", () => {
    const text = "Sure:\n```ts\nexport function applyDiscount(){ return 0; }\n```";
    const r = classifyReply(text);
    expect(r.askedFirst).toBe(false);
    expect(r.code).toContain("applyDiscount");
  });

  it("plain prose with no question and no code is not askedFirst", () => {
    const r = classifyReply("I updated the function.");
    expect(r.askedFirst).toBe(false);
    expect(r.code).toBeNull();
  });
});
