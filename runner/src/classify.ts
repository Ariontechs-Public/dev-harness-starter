const FENCE = /```(?:ts|typescript)?\s*\n([\s\S]*?)```/i;

// "askedFirst" means the model withheld action and requested input, rather than
// merely producing a checklist that happens to contain a question mark. We detect
// intent-to-request-input phrases (zh + en) — calibrated against real model
// replies (see docs/runs/*-replies.md). A bare "?" is too noisy: OFF-mode action
// plans often end with one while still barrelling ahead.
const ASK_PHRASES =
  /請提供|請回覆|請確認|需要確認|我(先)?需要(了解|知道|確認|更多)|在(進行|開始|動工)[^]{0,12}之前|提供以上|確認[^]{0,6}(資訊|資料|信息|細節)|先確認|確認再動工|need (more )?(info|details|clarification)|could you (please )?(provide|clarify)|before (i|we) (proceed|start|begin)/i;

export function classifyReply(text: string): { askedFirst: boolean; code: string | null } {
  const m = text.match(FENCE);
  const code = m ? m[1].trim() : null;
  const askedFirst = code === null && ASK_PHRASES.test(text);
  return { askedFirst, code };
}
