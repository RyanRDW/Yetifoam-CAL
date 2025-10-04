import type { IncomingMessage, ServerResponse } from 'http';

import { getBomWindData, BomConfigurationError, type BomWindData } from '../bom/client';

type Request = IncomingMessage & {
  method?: string;
  body?: unknown;
};

type Response = ServerResponse & {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end: (chunk?: any) => void;
};

interface BomRequestBody {
  suburb: string;
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

function parseBody(payload: unknown): BomRequestBody {
  if (!payload || typeof payload !== 'object') {
    throw new SyntaxError('Request body must be a JSON object.');
  }

  const { suburb } = payload as Record<string, unknown>;

  if (typeof suburb !== 'string' || !suburb.trim()) {
    throw new SyntaxError('`suburb` must be a non-empty string.');
  }

  return { suburb: suburb.trim() };
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

  if (error instanceof BomConfigurationError) {
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

export default async function handler(req: Request, res: Response): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, {
      error: {
        type: 'method_not_allowed',
        message: 'Only POST is supported.',
      },
    });
    return;
  }

  try {
    const rawBody = await readBody(req);
    const { suburb } = parseBody(rawBody);
    const result = await getBomWindData(suburb);

    if (result === 'unavailable') {
      sendJson(res, 503, {
        error: {
          type: 'bom_unavailable',
          message: 'Wind data currently unavailable.',
        },
      });
      return;
    }

    const payload: BomWindData & { suburb: string } = {
      suburb,
      fastest_recorded: result.fastest_recorded,
      average_last_year: result.average_last_year,
    };

    sendJson(res, 200, payload);
  } catch (error) {
    const mapped = mapError(error);
    sendJson(res, mapped.status, mapped.body);
  }
}
