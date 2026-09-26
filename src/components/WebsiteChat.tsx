"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, MessageCircle, RotateCcw, X } from "lucide-react";
import styles from "./WebsiteChat.module.css";

type Message = { role: "user" | "assistant"; content: string };

export default function WebsiteChat() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    transcript.current?.scrollTo({ top: transcript.current.scrollHeight });
  }, [messages, busy, error]);

  async function send(message: string, previous: Message[]) {
    if (controller.current || !message.trim()) return;
    const activeController = new AbortController();
    controller.current = activeController;
    setBusy(true);
    setError("");
    setMessages([...previous, { role: "user", content: message }]);
    const history = previous.slice(-12);
    while (JSON.stringify(history).length > 16000) history.splice(0, 2);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
        signal: AbortSignal.any([activeController.signal, AbortSignal.timeout(40000)]),
      });
      const data = await response.json();
      if (!response.ok || typeof data.reply !== "string") {
        throw new Error(data.error || "No reply received. Please try again.");
      }
      setMessages([...previous, { role: "user", content: message }, { role: "assistant", content: data.reply }]);
    } catch (failure) {
      if (!activeController.signal.aborted) {
        setError(failure instanceof Error && failure.name !== "TimeoutError"
          ? failure.message : "The response took too long. Please try again.");
      }
    } finally {
      controller.current = null;
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || error || !draft.trim()) return;
    void send(draft.trim(), messages);
    setDraft("");
  }

  function retry() {
    const last = messages.at(-1);
    if (last?.role === "user") void send(last.content, messages.slice(0, -1));
  }

  return (
    <>
      <div className={styles.launcherDock}>
        <button className={styles.launcher} onClick={() => dialog.current?.showModal()} aria-haspopup="dialog" aria-label="Open chat" title="Open chat">
          <MessageCircle size={28} aria-hidden="true" />
          <span>Talk to my<br />chat bot</span>
        </button>
      </div>
      <dialog ref={dialog} className={styles.dialog} aria-label="Chat" onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close();
        }
      }}>
        <header className={styles.header}>
          <div className={styles.actions}>
            <button type="button" title="Close chat" aria-label="Close chat" onClick={() => dialog.current?.close()}><X size={20} /></button>
          </div>
        </header>
        <div ref={transcript} className={styles.transcript} role="log" aria-label="Chat messages" aria-live="polite" aria-relevant="additions text">
          {messages.map((message, index) => <div key={index} className={message.role === "user" ? styles.userMessage : styles.assistantMessage}><span className={styles.srOnly}>{message.role === "user" ? "You" : "Assistant"}</span><p>{message.content}</p></div>)}
          {busy && <p className={styles.pending} role="status">Thinking<span aria-hidden="true">...</span></p>}
        </div>
        {error && <div className={styles.error} role="alert"><p>{error}</p><button type="button" onClick={retry}><RotateCcw size={15} /> Retry</button></div>}
        <form className={styles.composer} onSubmit={submit}>
          <label className={styles.srOnly} htmlFor="website-chat-message">Your message</label>
          <textarea ref={input} id="website-chat-message" autoFocus rows={2} maxLength={2000} placeholder="Message..." value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
          }} />
          <button type="submit" title="Send message" aria-label="Send message" disabled={busy || Boolean(error) || !draft.trim()}><ArrowUp size={20} /></button>
        </form>
      </dialog>
    </>
  );
}