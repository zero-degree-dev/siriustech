"use client";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button, Input, StatusPanel } from "@/shared/ui";
import type { ChatMessage, ChatRepository } from "../model/types";
import s from "./ai-chat.module.css";
import { marked } from "marked";
export function AiChat({ repository, live = false }: { repository: ChatRepository; live?: boolean }) {
  const inputId = useId();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const log = useRef<HTMLDivElement>(null);
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
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages, status]);
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
      <div className={s.chat__header}>
        <div>
          <h3 className={s.chat__title}>Консультант по услугам</h3>
          <p className={s.chat__note}>
            {live ? (mode === 'polza' ? 'ИИ-ассистент · Polza AI' : 'Справочник по каталогу') : 'Демонстрационный диалог'}
          </p>
        </div>
      {repository.reset && !!messages.length && <button className={s.chat__reset} type="button" aria-label="Удалить историю и начать заново" disabled={status === 'loading'} onClick={async () => {
        if (busy.current) return;
        busy.current = true;
        try {
          await repository.reset?.();
          setMessages([]); setText(''); setStatus('idle'); setLoadError(false); setReady(false); setLoadAttempt(value => value + 1);
        } catch { setLoadError(true); }
        finally { busy.current = false; }
      }}>Новый диалог</button>}
      </div>
      {!ready && !loadError && <StatusPanel kind="loading" title="Подключаем консультанта">Загружаем историю…</StatusPanel>}
      {loadError && <StatusPanel kind="error" title="Не удалось открыть диалог" actions={<Button onClick={() => { setLoadError(false); setLoadAttempt(value => value + 1); }}>Повторить подключение</Button>}>Проверьте подключение и попробуйте ещё раз.</StatusPanel>}
      {ready && !loadError && !messages.length && <div className={s.chat__welcome}>
        <p className={s.chat__greeting}>Давайте разберём вашу задачу</p>
        <p>Что вы хотите создать или изменить? Можно начать с одного из вопросов.</p>
        <div className={s.chat__suggestions}>
          {['Какая услуга мне подойдёт?', 'Сколько стоит разработка сайта?', 'Что входит в поддержку?'].map(question =>
            <button type="button" key={question} onClick={() => {
              setText(question);
              document.getElementById(inputId)?.focus();
            }}>{question}</button>)}
        </div>
      </div>}
      {!!messages.length && (
        <div
          className={s.chat__messages}
          ref={log}
          role="log"
          aria-label="История диалога"
          aria-live="polite"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${s.chat__message} ${message.role === "user" ? s["chat__message--user"] : ""}`}
            >
              <strong>{message.role === "user" ? "Вы" : "Консультант"}</strong>
              <div dangerouslySetInnerHTML={{__html: marked.parse(message.text) }} />
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
          id={inputId}
          label="Ваш запрос"
          name="message"
          placeholder="Например, нужен сайт для компании"
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
        <StatusPanel kind="loading" title="Готовим ответ">
          Сверяемся с каталогом услуг…
        </StatusPanel>
      )}
      {status === "error" && (
        <StatusPanel
          kind="error"
          title="Не удалось получить ответ"
          actions={
            <>
              <Button onClick={() => void send(messages)}>
                Повторить запрос
              </Button>
              <a href="#request">Оставить заявку</a>
            </>
          }
        >
          Сообщение осталось в диалоге. Попробуйте отправить его ещё раз.
        </StatusPanel>
      )}
      {live && <p className={s.chat__privacy}>История диалога сохраняется. {mode === 'polza' && 'Сообщения обрабатываются Polza AI. '}Стоимость и сроки в ответах ориентировочные.</p>}
    </div>
  );
}
