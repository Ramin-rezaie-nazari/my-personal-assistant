import { apiRequest } from './api';

export type AssistantHistoryTurn = {
  id: string; userId: string; role: 'user' | 'assistant'; text: string; createdAt: number; intent?: string;
  action?: string; executionId?: string; resourceType?: string; resourceId?: string;
};
export type AssistantExecution = { executed: boolean; action: string; message: string; intent: string };
export type AssistantResponse = { message: string; intent?: string; confidence?: number; nextAction?: string | null; responsePlan?: unknown; metadata?: Record<string, unknown>; execution?: AssistantExecution };

export function getAssistantHistory(limit = 24): Promise<AssistantHistoryTurn[]> {
  return apiRequest<AssistantHistoryTurn[]>(`/assistant/history?limit=${encodeURIComponent(String(limit))}`).then((data) => Array.isArray(data) ? data : []);
}

export function sendAssistantMessage(message: string): Promise<AssistantResponse> {
  return apiRequest<AssistantResponse>('/assistant', { method: 'POST', body: JSON.stringify({ message }) }).then((data) => ({
    ...data,
    message: typeof data.message === 'string' ? data.message : 'I could not understand the response.',
  }));
}
