import { getStoredAccessToken } from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const ASSISTANT_REQUEST_TIMEOUT_MS = 30_000;
const HISTORY_REQUEST_TIMEOUT_MS = 15_000;
const MAX_ASSISTANT_MESSAGE_LENGTH = 4_000;

export type AssistantHistoryTurn = {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
  intent?: string;
  action?: string;
  executionId?: string;
  resourceType?: string;
  resourceId?: string;
};

export type AssistantExecution = {
  executed: boolean;
  action: string;
  message: string;
  intent: string;
};

export type AssistantResponse = {
  message: string;
  intent?: string;
  confidence?: number;
  nextAction?: string | null;
  responsePlan?: unknown;
  metadata?: Record<string, unknown>;
  execution?: AssistantExecution;
};

class AssistantNetworkError extends Error {
  code: 'AUTH_REQUIRED' | 'TIMEOUT' | 'ABORTED' | 'HTTP' | 'INVALID_RESPONSE';

  constructor(
    code: AssistantNetworkError['code'],
    message: string,
  ) {
    super(message);
    this.name = 'AssistantNetworkError';
    this.code = code;
  }
}

function mergeAbortSignals(
  externalSignal: AbortSignal | undefined,
  timeoutMs: number,
) {
  const controller = new AbortController();
  let timedOut = false;

  const abortFromExternal = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', abortFromExternal, { once: true });
  }

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timeout);
      externalSignal?.removeEventListener('abort', abortFromExternal);
    },
  };
}

async function authorizedFetch(
  path: string,
  init: RequestInit = {},
  timeoutMs = ASSISTANT_REQUEST_TIMEOUT_MS,
) {
  const token = await getStoredAccessToken();
  if (!token) throw new AssistantNetworkError('AUTH_REQUIRED', 'AUTH_REQUIRED');

  const request = mergeAbortSignals(init.signal ?? undefined, timeoutMs);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: request.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.headers ?? {}),
      },
    });
    return response;
  } catch (error) {
    if (request.didTimeout()) {
      throw new AssistantNetworkError('TIMEOUT', 'ASSISTANT_REQUEST_TIMEOUT');
    }
    if (init.signal?.aborted) {
      throw new AssistantNetworkError('ABORTED', 'ASSISTANT_REQUEST_ABORTED');
    }
    throw error;
  } finally {
    request.cleanup();
  }
}

async function responseError(response: Response): Promise<AssistantNetworkError> {
  const body = await response.text();
  return new AssistantNetworkError('HTTP', body || `Request failed with ${response.status}`);
}

export async function getAssistantHistory(
  limit = 24,
  signal?: AbortSignal,
): Promise<AssistantHistoryTurn[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const response = await authorizedFetch(
    `/assistant/history?limit=${encodeURIComponent(String(safeLimit))}`,
    { signal },
    HISTORY_REQUEST_TIMEOUT_MS,
  );
  if (!response.ok) throw await responseError(response);

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new AssistantNetworkError('INVALID_RESPONSE', 'ASSISTANT_INVALID_HISTORY_RESPONSE');
  }
  return Array.isArray(data) ? data as AssistantHistoryTurn[] : [];
}

export async function sendAssistantMessage(
  message: string,
  signal?: AbortSignal,
): Promise<AssistantResponse> {
  const normalizedMessage = message.trim();
  if (!normalizedMessage) throw new AssistantNetworkError('INVALID_RESPONSE', 'MESSAGE_REQUIRED');
  if (normalizedMessage.length > MAX_ASSISTANT_MESSAGE_LENGTH) {
    throw new AssistantNetworkError('INVALID_RESPONSE', 'MESSAGE_TOO_LONG');
  }

  const response = await authorizedFetch('/assistant', {
    method: 'POST',
    signal,
    body: JSON.stringify({ message: normalizedMessage }),
  });

  if (!response.ok) throw await responseError(response);

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new AssistantNetworkError('INVALID_RESPONSE', 'ASSISTANT_INVALID_RESPONSE');
  }

  const parsed = data as Partial<AssistantResponse> | null;
  return {
    ...parsed,
    message: typeof parsed?.message === 'string' ? parsed.message : 'I could not understand the response.',
  };
}

export { AssistantNetworkError };
