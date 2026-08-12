import { getStoredAccessToken } from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

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

export async function sendAssistantMessage(message: string): Promise<AssistantResponse> {
  const token = await getStoredAccessToken();
  if (!token) throw new Error('AUTH_REQUIRED');

  const response = await fetch(`${API_URL}/assistant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with ${response.status}`);
  }

  const data = await response.json() as AssistantResponse;
  return {
    ...data,
    message: typeof data.message === 'string' ? data.message : 'I could not understand the response.',
  };
}
