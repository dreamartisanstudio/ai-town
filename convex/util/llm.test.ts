import { chatCompletion, fetchEmbeddingBatch } from './llm';

const originalFetch = globalThis.fetch;

function mockFetchJson(body: unknown, status = 200) {
  globalThis.fetch = (async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  })) as any;
}

describe('chatCompletion provider error handling', () => {
  beforeAll(() => {
    process.env.LLM_API_URL = 'https://api.minimaxi.com';
    process.env.LLM_MODEL = 'MiniMax-M2.5';
    process.env.LLM_EMBEDDING_MODEL = 'embo-01';
    process.env.LLM_API_KEY = 'test-key';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('throws on HTTP 200 responses with a non-zero base_resp', async () => {
    mockFetchJson({
      choices: null,
      base_resp: { status_code: 2056, status_msg: 'Token Plan 用量上限' },
    });

    await expect(
      chatCompletion({ messages: [{ role: 'user', content: 'hi' }] } as any),
    ).rejects.toThrow(/2056/);
  });

  test('throws a descriptive error when choices are missing', async () => {
    mockFetchJson({ choices: null, base_resp: { status_code: 0, status_msg: '' } });

    await expect(
      chatCompletion({ messages: [{ role: 'user', content: 'hi' }] } as any),
    ).rejects.toThrow(/Unexpected result from LLM/);
  });

  test('returns content with reasoning blocks stripped', async () => {
    mockFetchJson({
      choices: [{ message: { role: 'assistant', content: '<think>hmm</think>\n收到' } }],
      base_resp: { status_code: 0, status_msg: '' },
    });

    const { content } = await chatCompletion({
      messages: [{ role: 'user', content: 'hi' }],
    } as any);

    expect(content).toBe('收到');
  });

  test('throws on embedding responses with a non-zero base_resp', async () => {
    mockFetchJson({
      vectors: null,
      base_resp: { status_code: 1008, status_msg: 'insufficient balance' },
    });

    await expect(fetchEmbeddingBatch(['hello'])).rejects.toThrow(/1008/);
  });
});
