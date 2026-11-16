// Grounded tool-calling loop for the teacher assistant. The model step is injected (Gemini in
// production, a scripted fake in tests). Output is post-checked so it can only cite codes the
// tools actually returned and never uses diagnosis language.
import { codesIn, runTool, type ClassSnapshot } from './tools';

export interface Part { text?: string; functionCall?: { name: string; args?: Record<string, unknown> }; functionResponse?: { name: string; response: Record<string, unknown> } }
export interface Content { role: 'user' | 'model'; parts: Part[] }
export type ModelStep = (contents: Content[]) => Promise<{ content: Content; tokensIn?: number; tokensOut?: number }>;

export const NO_DATA = "I don't have data for that.";
const MAX_TOOL_CALLS = 4;
const BANNED = /\b(dyslexi\w*|dyscalculi\w*|disorder|disabilit\w*|adhd|autis\w*|lazy|slow learner|unintelligent|stupid)\b/i;

export interface AssistantAnswer { answer: string; citedCodes: string[]; toolCalls: string[]; asOf: string; blocked?: string; tokensIn: number; tokensOut: number }

export async function runAssistant(question: string, snap: ClassSnapshot, step: ModelStep): Promise<AssistantAnswer> {
  const contents: Content[] = [{ role: 'user', parts: [{ text: question }] }];
  const seenCodes = new Set<string>();
  const toolCalls: string[] = [];
  let tokensIn = 0, tokensOut = 0;

  for (let turn = 0; turn <= MAX_TOOL_CALLS; turn++) {
    const res = await step(contents);
    tokensIn += res.tokensIn ?? 0; tokensOut += res.tokensOut ?? 0;
    const calls = res.content.parts.filter((p) => p.functionCall).map((p) => p.functionCall!);
    if (calls.length === 0 || toolCalls.length >= MAX_TOOL_CALLS) {
      const text = res.content.parts.map((p) => p.text ?? '').join('').trim();
      return finalise(text, seenCodes, toolCalls, snap.asOf, tokensIn, tokensOut);
    }
    contents.push(res.content);
    const responses: Part[] = [];
    for (const call of calls.slice(0, MAX_TOOL_CALLS - toolCalls.length)) {
      toolCalls.push(call.name);
      const result = runTool(call.name, call.args ?? {}, snap);
      codesIn(result).forEach((c) => seenCodes.add(c));
      responses.push({ functionResponse: { name: call.name, response: { result } } });
    }
    contents.push({ role: 'user', parts: responses });
  }
  return finalise('', seenCodes, toolCalls, snap.asOf, tokensIn, tokensOut);
}

function finalise(text: string, seen: Set<string>, toolCalls: string[], asOf: string, tokensIn: number, tokensOut: number): AssistantAnswer {
  if (!text) return { answer: NO_DATA, citedCodes: [], toolCalls, asOf, tokensIn, tokensOut };
  const cited = [...codesIn(text)];
  const invented = cited.filter((c) => !seen.has(c));
  if (invented.length) return { answer: NO_DATA, citedCodes: [], toolCalls, asOf, blocked: `answer cited codes not returned by tools: ${invented.join(', ')}`, tokensIn, tokensOut };
  if (BANNED.test(text)) return { answer: 'I can only describe which skills have been demonstrated so far. I cannot comment on causes or conditions.', citedCodes: [], toolCalls, asOf, blocked: 'diagnosis language', tokensIn, tokensOut };
  if (toolCalls.length === 0 && !/^General guidance/i.test(text) && text !== NO_DATA) {
    // A data answer must come from a tool. Allow only general guidance or the explicit no-data reply.
    return { answer: NO_DATA, citedCodes: [], toolCalls, asOf, blocked: 'answered without calling a tool', tokensIn, tokensOut };
  }
  return { answer: text, citedCodes: cited, toolCalls, asOf, tokensIn, tokensOut };
}
