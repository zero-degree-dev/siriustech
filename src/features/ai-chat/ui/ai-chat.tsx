"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Input, StatusPanel } from "@/shared/ui";
import type { ChatMessage, ChatRepository } from "../model/types";
import s from "./ai-chat.module.css";
export function AiChat({ repository }: { repository: ChatRepository }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);
  useEffect(() => () => controller.current?.abort(), []);
  async function send(history: ChatMessage[]) {
    if (busy.current) return;
    busy.current = true;
    setStatus("loading");
    controller.current = new AbortController();
    const active = controller.current;
    try {
      const answer = await repository.send(history, active.signal);
      if (!active.signal.aborted) {
        setMessages([...history, answer]);
        setStatus("idle");
      }
    } catch {
      if (!active.signal.aborted) setStatus("error");
    } finally {
      busy.current = false;
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || busy.current || status === "error") return;
    const history: ChatMessage[] = [
      ...messages,
      { id: `user-${messages.length}`, role: "user", text: text.trim() },
    ];
    setMessages(history);
    setText("");
    void send(history);
  }
  return (
    <div className={s.chat}>
      <h3 className={s.chat__title}>Обсудите проект с ИИ-ассистентом</h3>
      <p className={s.chat__note}>
        Демонстрационный режим · ответы подготовлены заранее
      </p>
      {!!messages.length && (
        <div
          className={s.chat__messages}
          role="log"
          aria-label="История диалога"
          aria-live="polite"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${s.chat__message} ${message.role === "user" ? s["chat__message--user"] : ""}`}
            >
              <strong>{message.role === "user" ? "Вы" : "ИИ-помощник"}</strong>
              <p>{message.text}</p>
            </div>
          ))}
        </div>
      )}
      <form
        className={s.chat__composer}
        onSubmit={submit}
        aria-label="Сообщение ИИ"
      >
        <Input
          label="Ваш запрос"
          name="message"
          placeholder="Опишите задачу или задайте вопрос об услуге"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={status !== "idle"}
          maxLength={2000}
        />
        <Button
          type="submit"
          loading={status === "loading"}
          disabled={!text.trim() || status === "error"}
        >
          Отправить
        </Button>
      </form>
      {status === "loading" && (
        <StatusPanel kind="loading" title="ИИ-помощник · Обработка запроса">
          Уточняем информацию по вашему запросу…
        </StatusPanel>
      )}
      {status === "error" && (
        <StatusPanel
          kind="error"
          title="ИИ-помощник · Данные временно недоступны"
          actions={
            <>
              <Button onClick={() => void send(messages)}>
                Повторить запрос
              </Button>
              <a href="#request">Связаться с архитектором</a>
            </>
          }
        >
          Не удалось получить информацию об услугах. Попробуйте ещё раз или
          обсудите задачу с архитектором.
        </StatusPanel>
      )}
    </div>
  );
}
