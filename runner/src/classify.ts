const FENCE = /```(?:ts|typescript)?\s*\n([\s\S]*?)```/i;

export function classifyReply(text: string): { askedFirst: boolean; code: string | null } {
  const m = text.match(FENCE);
  const code = m ? m[1].trim() : null;
  const looksLikeQuestion = /[??]/.test(text) ||
    /(規格|重現|複現|clarif|spec|reproduc)/i.test(text);
  const askedFirst = code === null && looksLikeQuestion;
  return { askedFirst, code };
}
