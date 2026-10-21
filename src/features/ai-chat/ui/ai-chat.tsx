"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Input, StatusPanel } from "@/shared/ui";
import type { ChatMessage, ChatRepository } from "../model/types";
import s from "./ai-chat.module.css";
export function AiChat({ repository, live = false }: { repository: ChatRepository; live?: boolean }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const [ready, setReady] = useState(!repository.load);
  const [loadError, setLoadError] = useState(false);
  const [mode, setMode] = useState<'polza' | 'catalog'>('polza');
  const [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => {
    if (!repository.load) return;
    const active = new AbortController();
    repository.load(active.signal).then(data => {
      if (!active.signal.aborted) { setMessages(data.messages); setMode(data.mode); setReady(true); }
    }).catch(() => { if (!active.signal.aborted) setLoadError(true); });
    return () => active.abort();
  }, [repository, loadAttempt]);
  useEffect(() => () => controller.current?.abort(), []);
  async function send(history: ChatMessage[]) {
    if (busy.current || !ready) return;
    busy.current = true;
    setStatus("loading");
    controller.current = new AbortController();
    const active = controller.current;
    try {
      const answer = await repository.send(history, active.signal);
      if (!active.signal.aborted) {
        setMessages([...history, answer]);
        if (answer.mode) setMode(answer.mode);
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
    if (!text.trim() || busy.current || status === "error" || !ready) return;
    const history: ChatMessage[] = [
      ...messages,
      { id: crypto.randomUUID(), role: "user", text: text.trim() },
    ];
    setMessages(history);
    setText("");
    void send(history);
  }
  return (
    <div className={s.chat}>
      <h3 className={s.chat__title}>Обсудите проект с ИИ-ассистентом</h3>
      <p className={s.chat__note}>
        {live ? (mode === 'polza' ? 'ИИ-консультант · Polza AI · ответы по каталогу услуг' : 'Консультант по каталогу · без генеративной модели') : 'Демонстрационный режим · ответы подготовлены заранее'}
      </p>
      {live && <p className={s.chat__note}>История сохраняется. При использовании ИИ сообщения передаются Polza AI. Цены и сроки в каталоге демонстрационные. <a href="#request">Перейти к заявке</a></p>}
      {!ready && !loadError && <StatusPanel kind="loading" title="Подключаем консультанта">Загружаем историю…</StatusPanel>}
      {loadError && <StatusPanel kind="error" title="Не удалось открыть диалог" actions={<Button onClick={() => { setLoadError(false); setLoadAttempt(value => value + 1); }}>Повторить подключение</Button>}>Проверьте подключение и попробуйте ещё раз.</StatusPanel>}
      {repository.reset && <Button disabled={status === 'loading'} variant="secondary" onClick={async () => {
        if (busy.current) return;
        busy.current = true;
        try {
          await repository.reset?.();
          setMessages([]); setText(''); setStatus('idle'); setLoadError(false); setReady(false); setLoadAttempt(value => value + 1);
        } catch { setLoadError(true); }
        finally { busy.current = false; }
      }}>Удалить историю и начать заново</Button>}
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
          disabled={status !== "idle" || !ready}
          maxLength={2000}
        />
        <Button
          type="submit"
          loading={status === "loading"}
          disabled={!text.trim() || status === "error" || !ready}
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
