// File: lib/ai.ts
// Provider AI bersama (OpenAI-compatible) untuk semua route server.
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { Agent, fetch as undiciFetch } from 'undici';

// Jika TLS verification dimatikan via env, sediakan custom fetch dengan
// undici Agent yang menonaktifkan verifikasi sertifikat (fetch SDK 'ai'
// tidak menghormati NODE_TLS_REJECT_UNAUTHORIZED secara konsisten).
const tlsRejectDisabled = process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0';

const insecureDispatcher = new Agent({ connect: { rejectUnauthorized: false } });

const insecureFetch = (async (
  input: Parameters<typeof undiciFetch>[0],
  init?: Parameters<typeof undiciFetch>[1],
) => {
  return undiciFetch(input, {
    ...(init || {}),
    dispatcher: insecureDispatcher,
  });
}) as unknown as typeof fetch;

export const aiProvider = createOpenAICompatible({
  name: 'opencode-ai',
  apiKey: process.env.OPENCODE_AI_API_KEY,
  baseURL: (process.env.OPENCODE_AI_ENDPOINT || '').replace(/\/chat\/completions$/, ''),
  fetch: tlsRejectDisabled ? insecureFetch : undefined,
});

export const aiModel = aiProvider(process.env.OPENCODE_AI_MODEL || 'deepseek-v4-flash');
