export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  mode?: 'catalog' | 'polza';
}
export interface ChatRepository {
  send(messages: ChatMessage[], signal?: AbortSignal): Promise<ChatMessage>;
  load?(signal?: AbortSignal): Promise<{ messages: ChatMessage[]; mode: 'catalog' | 'polza' }>;
  reset?(signal?: AbortSignal): Promise<void>;
}
