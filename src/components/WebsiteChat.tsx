"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, Bot, Globe, Mail, RotateCcw, ShoppingBag, ShoppingCart, Undo2, X } from "lucide-react";
import Link from "next/link";
import { productCatalog } from "@/lib/productCatalog";
import { saveChatCartAction } from "@/lib/chatCart";
import { appearanceStorageKey, defaultAppearance, parseAppearance, updateAppearance, validateAppearanceAction, type ChatAppearance } from "@/lib/chatAppearance";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import styles from "./WebsiteChat.module.css";

type Message = { role: "user" | "assistant"; content: string; cartUpdated?: boolean };
const chatProducts = Object.entries(productCatalog)
  .filter(([slug]) => slug !== "scoprio")
  .map(([slug, product]) => ({ slug, name: product.name }));
const tomatoHarvestIndex = chatProducts.findIndex((product) => product.slug === "tomato-harvest-box");

export default function WebsiteChat() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [appearance, setAppearance] = useLocalStorageState(appearanceStorageKey, defaultAppearance, parseAppearance);
  const [undoStack, setUndoStack] = useState<ChatAppearance[]>([]);
  const [appearanceNotice, setAppearanceNotice] = useState("");
  const [rotatingProductIndex, setRotatingProductIndex] = useState(Math.max(0, tomatoHarvestIndex));
  const hasCustomAppearance = JSON.stringify(appearance) !== JSON.stringify(defaultAppearance);
  const rotatingProduct = chatProducts[rotatingProductIndex % chatProducts.length];

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.chatTheme = appearance.theme;
    root.dataset.chatDensity = appearance.density;
    root.dataset.chatTextSize = appearance.textSize;
    root.dataset.chatHidden = appearance.hiddenSections.join(" ");
  }, [appearance]);

  function undoAppearance() {
    const previous = undoStack.at(-1);
    if (!previous || busy) return;
    try {
      setAppearance(previous);
      setUndoStack((stack) => stack.slice(0, -1));
      setAppearanceNotice("View change undone.");
    } catch { setAppearanceNotice("Could not restore your view. Check browser storage settings."); }
  }

  function restoreAppearance() {
    if (busy) return;
    try {
      setAppearance(defaultAppearance);
      setUndoStack((stack) => [...stack.slice(-9), appearance]);
      setAppearanceNotice("Original view restored.");
    } catch { setAppearanceNotice("Could not restore your view. Check browser storage settings."); }
  }

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (messages.length > 0) return;
    const timer = window.setInterval(() => {
      setRotatingProductIndex((index) => (index + 1) % chatProducts.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [messages.length]);
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
    const history = previous.slice(-12).map(({ role, content }) => ({ role, content }));
    while (JSON.stringify(history).length > 16000) history.splice(0, 2);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, appearance }),
        signal: AbortSignal.any([activeController.signal, AbortSignal.timeout(40000)]),
      });
      const data = await response.json();
      if (!response.ok || typeof data.reply !== "string") {
        throw new Error(data.error || "No reply received. Please try again.");
      }
      let reply = data.reply;
      if (data.cartAction && data.appearanceAction) throw new Error("Please request one action at a time. Nothing was changed.");
      if (data.appearanceAction) {
        const action = validateAppearanceAction(data.appearanceAction, data.appearanceAction.highlightedProductIds ?? []);
        const current = parseAppearance(window.localStorage.getItem(appearanceStorageKey) ?? JSON.stringify(defaultAppearance));
        setAppearance(updateAppearance(current, action));
        setUndoStack((stack) => [...stack.slice(-9), current]);
        const changes = [
          action.theme && `theme: ${action.theme}`,
          action.density && `layout: ${action.density}`,
          action.textSize && `text: ${action.textSize}`,
          action.highlightedProductIds !== null && `${action.highlightedProductIds.length} product highlights`,
          action.hiddenSections !== null && (action.hiddenSections.length ? `hidden sections: ${action.hiddenSections.join(", ")}` : "all optional sections restored"),
        ].filter(Boolean);
        reply = action.reset ? "Restored your original view." : `Updated your view: ${changes.join("; ")}.`;
        setAppearanceNotice("View updated.");
        dialog.current?.close();
      }
      const cartUpdated = Boolean(data.cartAction);
      if (cartUpdated) {
        try {
          reply = saveChatCartAction(window.localStorage, data.cartAction);
        } catch (failure) {
          throw new Error(failure instanceof Error && failure.name === "Error"
            ? failure.message : "Your cart could not be saved. Check browser storage settings and try again.");
        }
        window.dispatchEvent(new Event("storage"));
      }
      setMessages([...previous, { role: "user", content: message }, { role: "assistant", content: reply, cartUpdated }]);
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
        {(appearanceNotice || hasCustomAppearance || undoStack.length > 0) && <div className={styles.appearanceNotice}>
          <span role="status">{appearanceNotice || "Custom view"}</span>
          <button type="button" title="Undo last view change" aria-label="Undo last view change" disabled={busy || undoStack.length === 0} onClick={undoAppearance}><Undo2 size={18} /></button>
          <button type="button" title="Restore original view" aria-label="Restore original view" disabled={busy || !hasCustomAppearance} onClick={restoreAppearance}><RotateCcw size={18} /></button>
        </div>}
        <button className={styles.launcher} onClick={() => dialog.current?.showModal()} aria-haspopup="dialog" aria-label="Ask Chefy" title="Ask Chefy">
          <Bot className={styles.robotIcon} size={48} strokeWidth={1.8} aria-hidden="true" />
          <span className={styles.launcherLabel}>Ask Chefy</span>
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
          {messages.map((message, index) => <div key={index} className={message.role === "user" ? styles.userMessage : styles.assistantMessage}><span className={styles.srOnly}>{message.role === "user" ? "You" : "Assistant"}</span><p>{message.content}</p>{message.cartUpdated && <Link className={styles.cartLink} href="/cart" onClick={() => dialog.current?.close()}><ShoppingCart size={16} aria-hidden="true" /> View cart</Link>}</div>)}
          {busy && <p className={styles.pending} role="status">Thinking<span aria-hidden="true">...</span></p>}
          <div className={styles.quickActions} role="group" aria-label="Quick actions">
            <button className={styles.quickAction} type="button" disabled={busy} onClick={() => void send(`Add 1 ${rotatingProduct.name} to my cart.`, messages)}>
              <ShoppingBag size={16} aria-hidden="true" /> Add {rotatingProduct.name} to the bag
            </button>
            <a className={styles.quickActionLink} href="mailto:francisdennisblack@gmail.com?subject=Website%20project%20inquiry" onClick={() => dialog.current?.close()}>
              <Mail size={16} aria-hidden="true" /> Email Francis
            </a>
            <button className={styles.quickAction} type="button" disabled={busy} onClick={() => void send("Give me an example of a website project and its price.", messages)}>
              <Globe size={16} aria-hidden="true" /> Example website &amp; price
            </button>
          </div>
        </div>
        {error && <div className={styles.error} role="alert"><p>{error}</p><button type="button" onClick={retry}><RotateCcw size={15} /> Retry</button></div>}
        <form className={styles.composer} onSubmit={submit}>
          <label className={styles.srOnly} htmlFor="website-chat-message">Your message</label>
          <textarea ref={input} id="website-chat-message" autoFocus rows={2} maxLength={2000} placeholder="Message..." value={draft} onChange={(event) => { setDraft(event.target.value); setError(""); }} onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
          }} />
          <button type="submit" title="Send message" aria-label="Send message" disabled={busy || Boolean(error) || !draft.trim()}><ArrowUp size={20} /></button>
        </form>
      </dialog>
    </>
  );
}