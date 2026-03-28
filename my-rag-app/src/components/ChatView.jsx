import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { apiFetch, fetchWithRefresh, friendlyError, ApiError, toast } from "../lib/api";
import { CONTENT_API, CONVO_API } from "../lib/constants";
import { renderBold } from "../utils/renderBold";
import { c } from "../lib/styles";
import { SendIcon } from "./icons/Icons";

function DotLoader() {
  return (
    <div style={{
      display: "flex",
      gap: 5,
      padding: "12px 16px",
      alignItems: "center",
      background: c.elevated,
      border: `0.5px solid ${c.border}`,
      borderRadius: "16px 16px 16px 4px",
      alignSelf: "flex-start",
      animation: "fadeUp 0.2s ease",
    }}>
      {[0, 160, 320].map((delay, i) => (
        <span key={i} style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: c.accent,
          display: "inline-block",
          animation: "dotPulse 1.2s ease-in-out infinite",
          animationDelay: `${delay}ms`,
        }} />
      ))}
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user" || msg.role === "USER";
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: isUser ? "flex-end" : "flex-start",
      gap: 6,
      maxWidth: "80%",
      alignSelf: isUser ? "flex-end" : "flex-start",
      animation: "fadeUp 0.2s ease",
    }}>
      <div style={{
        padding: "10px 14px",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        fontSize: 13,
        lineHeight: 1.6,
        background: isUser ? c.accent : c.elevated,
        color: isUser ? "#000000" : c.text,
        border: "none",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        textAlign: "left",
      }}>
        {renderBold(msg.text || msg.content || "")}
        {msg.streaming && (
          <span style={{
            display: "inline-block",
            width: 2,
            height: 13,
            background: isUser ? "#0f0f0f" : c.accent,
            marginLeft: 3,
            verticalAlign: "middle",
            animation: "blink 1s infinite",
          }} />
        )}
      </div>
      {msg.sources && msg.sources.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {msg.sources.map((src) => (
            <span key={src.id} style={{
              fontSize: 11,
              color: c.accent,
              background: c.accentDim,
              borderRadius: 20,
              padding: "2px 9px",
              border: "none",
            }}>
              {src.file_name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const INITIAL_CURSOR = () => ({ created_at: new Date().toISOString(), id: null });

function handleSseEvent(event, { botMsgId, fullAnswerRef, conversationId, convoCreatedRef, onConvoCreated, setMessages, setStreaming, setSending, scrollToBottom, inputRef, disableAutoFocus }) {
  if (event.type === "chunk") {
    fullAnswerRef.current += event.token;
    setMessages((prev) => prev.map((m) => m.id === botMsgId ? { ...m, text: fullAnswerRef.current, streaming: true } : m));
    scrollToBottom();
  }

  if (event.type === "done") {
    if (event.conversationId && !conversationId && !convoCreatedRef.current) {
      convoCreatedRef.current = true;
      onConvoCreated(event.conversationId);
    }
    setMessages((prev) => prev.map((m) => m.id === botMsgId ? {
      ...m,
      text: fullAnswerRef.current || event.token || m.text,
      streaming: false,
      sources: event.sources || [],
      isCached: event.isCached || false,
    } : m));
    setStreaming(false);
    setSending(false);
    scrollToBottom();
    if (!disableAutoFocus) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  if (event.type === "error") {
    setMessages((prev) => prev.map((m) => m.id === botMsgId ? {
      ...m,
      text: event.message || "An error occurred while streaming the response.",
      streaming: false,
    } : m));
    setStreaming(false);
    setSending(false);
    throw new ApiError(event.message || "Stream error", 500);
  }
}

export default function ChatView({ conversationId, onConvoCreated }) {
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [msgPage, setMsgPage] = useState(1);
  const [hasMoreMsgs, setHasMoreMsgs] = useState(false);
  const [loadingMoreMsgs, setLoadingMoreMsgs] = useState(false);
  const [pdfCount, setPdfCount] = useState(null);
  const [sending, setSending] = useState(false);

  const loadedForRef = useRef(undefined);
  const cursorRef = useRef(INITIAL_CURSOR());
  const convoCreatedRef = useRef(false);
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);
  const shouldScrollToBottomRef = useRef(false);
  const prependScrollRef = useRef(null);
  const isTouchDevice = typeof window !== "undefined" && (
    "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0
  );

  const MSG_LIMIT = 24;

  const scrollToBottom = useCallback((smooth = true) => {
    shouldScrollToBottomRef.current = true;
    setTimeout(() => {
      if (shouldScrollToBottomRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
        shouldScrollToBottomRef.current = false;
      }
    }, 30);
  }, []);

  useLayoutEffect(() => {
    if (prependScrollRef.current && scrollContainerRef.current) {
      const { scrollHeightBefore } = prependScrollRef.current;
      const newScrollHeight = scrollContainerRef.current.scrollHeight;
      scrollContainerRef.current.scrollTop = newScrollHeight - scrollHeightBefore;
      prependScrollRef.current = null;
    }
  }, [messages]);

  useEffect(() => {
    if (!conversationId) {
      setPdfCount(null);
      apiFetch(`${CONTENT_API}/list?page=1&limit=1`)
        .then((res) => setPdfCount(res.data?.content?.length || 0))
        .catch(() => setPdfCount(0));
    }
  }, [conversationId]);

  const loadMessages = useCallback(async (convoId, pg = 1, prepend = false) => {
    if (!convoId) return;
    if (pg === 1) setMessagesLoading(true);
    else setLoadingMoreMsgs(true);

    const container = scrollContainerRef.current;
    const scrollHeightBefore = prepend && container ? container.scrollHeight : 0;

    try {
      const { created_at, last_msg_seq } = cursorRef.current;
      const params = new URLSearchParams({ limit: MSG_LIMIT, last_msg_time: created_at });
      if (last_msg_seq) params.set("last_msg_seq", last_msg_seq);

      const res = await apiFetch(`${CONVO_API}/${convoId}/messages?${params.toString()}`);
      const msgs = res.data.messages || [];
      const serverCursor = res.data.cursor;
      if (serverCursor) cursorRef.current = serverCursor;

      const normalized = [...msgs].reverse().map((m) => ({
        ...m,
        text: m.content || m.text || "No relevant information found across your documents.",
      }));

      setHasMoreMsgs(msgs.length === MSG_LIMIT);
      setMsgPage(pg);

      if (prepend) {
        prependScrollRef.current = { scrollHeightBefore };
        setMessages((prev) => [...normalized, ...prev]);
      } else {
        setMessages(normalized);
        scrollToBottom(false);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      if (pg === 1) setMessagesLoading(false);
      else setLoadingMoreMsgs(false);
    }
  }, [scrollToBottom]);

  useEffect(() => {
    if (!conversationId) {
      if (loadedForRef.current !== undefined) {
        setMessages([]);
        setMsgPage(1);
        setHasMoreMsgs(false);
        cursorRef.current = INITIAL_CURSOR();
        convoCreatedRef.current = false;
        loadedForRef.current = undefined;
      }
      return;
    }

    if (loadedForRef.current === undefined && messagesRef.current.length > 0) {
      loadedForRef.current = conversationId;
      convoCreatedRef.current = false;
      return;
    }

    if (loadedForRef.current !== conversationId) {
      loadedForRef.current = conversationId;
      setMessages([]);
      setMsgPage(1);
      setHasMoreMsgs(false);
      cursorRef.current = INITIAL_CURSOR();
      convoCreatedRef.current = false;
      loadMessages(conversationId, 1);
    }
  }, [conversationId, loadMessages]);

  useEffect(() => {
    if (isTouchDevice) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [conversationId, isTouchDevice]);

  const send = async () => {
    const val = input.trim();
    if (!val || streaming || sending) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "USER", text: val }] );
    setSending(true);
    setStreaming(true);
    scrollToBottom();

    const botMsgId = Date.now();
    setMessages((prev) => [...prev, { id: botMsgId, role: "ASSISTANT", text: "", streaming: true }]);
    const fullAnswerRef = { current: "" };

    try {
      const res = await fetchWithRefresh(`${CONTENT_API}/get-answers-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: val, conversationId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new ApiError(friendlyError(data.message, res.status), res.status);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const sseHandlerArgs = {
        botMsgId,
        fullAnswerRef,
        conversationId,
        convoCreatedRef,
        onConvoCreated,
        setMessages,
        setStreaming,
        setSending,
        scrollToBottom,
        inputRef,
        disableAutoFocus: isTouchDevice,
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            handleSseEvent(event, sseHandlerArgs);
          } catch (_) {}
        }
      }

      if (buffer.startsWith("data: ")) {
        try {
          const event = JSON.parse(buffer.slice(6));
          handleSseEvent(event, sseHandlerArgs);
        } catch (_) {}
      }
    } catch (e) {
      setMessages((prev) => prev.map((m) => m.id === botMsgId ? { ...m, text: e.message || "Something went wrong.", streaming: false } : m));
      if (e.status === 429) toast.warn(e.message);
      else if (e.status === 409) toast.info(e.message);
      else if (e.status >= 500) toast.error(e.message);
      setStreaming(false);
      setSending(false);
      if (!isTouchDevice) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%", overflow: "hidden" }}>
      <div
        ref={scrollContainerRef}
        style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}
      >
        {hasMoreMsgs && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={() => loadMessages(conversationId, msgPage + 1, true)}
              disabled={loadingMoreMsgs}
              style={{
                padding: "6px 16px",
                borderRadius: 20,
                border: `0.5px solid ${c.border}`,
                background: "transparent",
                color: loadingMoreMsgs ? c.hint : c.muted,
                fontSize: 12,
                cursor: loadingMoreMsgs ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {loadingMoreMsgs ? "Loading..." : "Load older messages"}
            </button>
          </div>
        )}

        {messagesLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
            <DotLoader />
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            color: c.hint,
            fontSize: 13,
            marginTop: "auto",
            marginBottom: "auto",
            textAlign: "center",
            padding: "0 16px",
          }}>
            <div style={{ fontSize: 36 }}>📄</div>
            <div style={{ fontWeight: 500, color: c.muted }}>Ask anything about your PDFs</div>
            <div style={{ fontSize: 12 }}>
              {pdfCount === null
                ? "..."
                : pdfCount === 0
                ? "Upload a PDF using the button in the sidebar to get started"
                : `${pdfCount} PDF${pdfCount !== 1 ? "s" : ""} indexed — ask away`}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            if ((msg.role === "ASSISTANT" || msg.role === "bot") && msg.streaming && msg.text === "") {
              return <DotLoader key={msg.id || i} />;
            }
            return <Message key={msg.id || i} msg={msg} />;
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        padding: "12px 20px",
        borderTop: `0.5px solid ${c.borderFaint}`,
        background: c.surface,
        display: "flex",
        gap: 8,
        alignItems: "flex-end",
        flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask something about your PDFs..."
          disabled={streaming || sending}
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            border: `0.5px solid ${c.border}`,
            borderRadius: 8,
            padding: "9px 12px",
            fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
            background: c.elevated,
            color: c.text,
            height: 38,
            maxHeight: 120,
            lineHeight: 1.5,
            overflowY: "hidden",
            outline: "none",
            transition: "border-color 0.15s",
            opacity: streaming || sending ? 0.6 : 1,
          }}
          onFocus={(e) => (e.target.style.borderColor = c.muted)}
          onBlur={(e) => (e.target.style.borderColor = c.border)}
          onInput={(e) => {
            e.target.style.height = "38px";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
        />
        <button
          onClick={send}
          disabled={streaming || sending || !input.trim()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            border: "none",
            background: streaming || sending || !input.trim() ? c.elevated : c.accent,
            color: streaming || sending || !input.trim() ? c.hint : "#0f0f0f",
            cursor: streaming || sending || !input.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.15s, color 0.15s",
          }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
