export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}
export interface ChatRepository {
  send(messages: ChatMessage[], signal?: AbortSignal): Promise<ChatMessage>;
}
