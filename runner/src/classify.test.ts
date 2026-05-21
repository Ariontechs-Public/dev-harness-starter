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

  // --- Calibrated against real replies in docs/runs/*-replies.md ---

  it("flags a real ON-mode clarification request (was misclassified as apply-error)", () => {
    // coupon / gpt-4o-mini / on
    const r = classifyReply(
      "在開始這個任務之前，我需要確認一些細節：\n1. 折扣碼的使用條件…\n請提供以上信息，以便確認準備狀態。",
    );
    expect(r.askedFirst).toBe(true);
    expect(r.code).toBeNull();
  });

  it("does NOT flag an OFF-mode action checklist as askedFirst", () => {
    // bug / gpt-4o-mini / off — a plan that mentions 重現/確認 but never requests input
    const r = classifyReply(
      "可以按照以下步驟進行排查：\n1. 確認問題重現\n2. 檢查商品價格\n3. 檢查計算邏輯\n這些步驟可以幫助你找出和修復問題。",
    );
    expect(r.askedFirst).toBe(false);
  });
});
