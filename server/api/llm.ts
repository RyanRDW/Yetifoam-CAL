import type { IncomingMessage, ServerResponse } from 'http';
import OpenAI from 'openai';

import { chat, chatStream, type ChatMessage } from '../llm/openai';
import { rateLimit, RateLimitError } from '../middleware/rateLimit';

type Request = IncomingMessage & {
  method?: string;
  headers: IncomingMessage['headers'] & { 'x-user-id'?: string };
  body?: unknown;
};

type Response = ServerResponse & {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end: (chunk?: any) => void;
  write: (chunk: any) => boolean;
};

interface LlmRequestBody {
  system?: string;
  messages?: ChatMessage[];
  maxTokens?: number;
}

interface ErrorPayload {
  error: {
    type: string;
    message: string;
  };
}

function readBody(req: Request): Promise<unknown> {
  if (req.body !== undefined) {
    return Promise.resolve(req.body);
  }

  return new Promise((resolve, reject) => {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => {
      if (!data) {
        resolve(undefined);
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(new SyntaxError('Invalid JSON in request body.'));
      }
    });

    req.on('error', reject);
  });
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  const role = record.role;
  const content = record.content;

  const validRole = role === 'system' || role === 'user' || role === 'assistant';
  const validContent = typeof content === 'string' && content.length > 0;

  return validRole && validContent;
}

function parseBody(payload: unknown): LlmRequestBody {
  if (!payload || typeof payload !== 'object') {
    throw new SyntaxError('Request body must be a JSON object.');
  }

  const { system, messages, maxTokens } = payload as Record<string, unknown>;

  if (system !== undefined && typeof system !== 'string') {
    throw new SyntaxError('`system` must be a string when provided.');
  }

  if (maxTokens !== undefined && typeof maxTokens !== 'number') {
    throw new SyntaxError('`maxTokens` must be a number when provided.');
  }

  if (messages === undefined) {
    throw new SyntaxError('`messages` is required.');
  }

  if (!Array.isArray(messages) || !messages.every(isChatMessage)) {
    throw new SyntaxError('`messages` must be an array of chat messages.');
  }

  return {
    system: system as string | undefined,
    messages: messages as ChatMessage[],
    maxTokens: maxTokens as number | undefined,
  };
}

function sendJson(res: Response, status: number, body: unknown): void {
  if (res.headersSent) {
    return;
  }

  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function mapError(error: unknown): { status: number; body: ErrorPayload } {
  if (error instanceof RateLimitError) {
    return {
      status: error.status,
      body: {
        error: {
          type: 'rate_limit',
          message: error.message,
        },
      },
    };
  }

  if (error instanceof SyntaxError) {
    return {
      status: 400,
      body: {
        error: {
          type: 'bad_request',
          message: error.message,
        },
      },
    };
  }

  if (error instanceof OpenAI.APIError) {
    const status = error.status ?? 500;
    let type = 'openai_error';
    let message = error.error?.message ?? 'OpenAI request failed.';

    if (status === 401 || status === 403) {
      type = 'unauthorized';
      message = 'OpenAI authentication failed. Check your API key.';
    } else if (status === 429) {
      type = 'rate_limit';
      message = 'OpenAI rate limit reached. Try again in a moment.';
    } else if (status >= 500) {
      type = 'openai_unavailable';
      message = 'OpenAI service is currently unavailable. Please retry later.';
    }

    return {
      status,
      body: {
        error: {
          type,
          message,
        },
      },
    };
  }

  if (error instanceof Error && error.message.includes('Missing OpenAI API key')) {
    return {
      status: 500,
      body: {
        error: {
          type: 'configuration',
          message: error.message,
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        type: 'internal_error',
        message: 'Unexpected server error.',
      },
    },
  };
}

function getUserId(req: Request): string {
  const header = req.headers['x-user-id'];

  if (!header) {
    return 'local';
  }

  if (Array.isArray(header)) {
    return header[0] || 'local';
  }

  return header || 'local';
}

function setupStreamHeaders(res: Response): void {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.write(': connected\n\n');
}

function writeSse(res: Response, data: unknown): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export default async function handler(req: Request, res: Response): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: { type: 'method_not_allowed', message: 'Only POST is supported.' } });
    return;
  }

  const wantsStream = typeof req.headers.accept === 'string' && req.headers.accept.includes('text/event-stream');

  try {
    const rawBody = await readBody(req);
    const body = parseBody(rawBody);
    const userId = getUserId(req);

    rateLimit(userId);

    if (wantsStream) {
      setupStreamHeaders(res);

      const controller = new AbortController();
      const abort = () => controller.abort();
      req.on('close', abort);

      try {
        await chatStream({
          system: body.system,
          messages: body.messages,
          maxTokens: body.maxTokens,
          signal: controller.signal,
          onChunk: async (chunk) => {
            writeSse(res, { content: chunk });
          },
        });
        writeSse(res, { done: true });
        res.end();
      } catch (error) {
        const mapped = mapError(error);
        writeSse(res, { error: mapped.body.error });
        res.end();
      } finally {
        if (typeof req.off === 'function') {
          req.off('close', abort);
        } else {
          req.removeListener('close', abort);
        }
      }

      return;
    }

    const content = await chat({
      system: body.system,
      messages: body.messages,
      maxTokens: body.maxTokens,
    });

    sendJson(res, 200, { content });
  } catch (error) {
    const mapped = mapError(error);
    sendJson(res, mapped.status, mapped.body);
  }
}
