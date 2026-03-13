import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { chatApi } from "../api/client"

const WELCOME = "Bonjour ! Je suis l'assistant PORT2REGION. Comment puis-je vous aider ?"

const QUICK_QUESTIONS = [
  "Comment postuler à un besoin ?",
  "Comment fonctionne le score IA ?",
  "C'est quoi le mode Premium ?",
]

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{ role: "assistant", text: WELCOME }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const role = localStorage.getItem("port2region_role") || "user"

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  async function send(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput("")
    setMessages(prev => [...prev, { role: "user", text: msg }])
    setLoading(true)
    try {
      const res = await chatApi.send(msg, role)
      const reply = res.data.data?.reply || "Désolé, une erreur est survenue."
      setMessages(prev => [...prev, { role: "assistant", text: reply }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Service temporairement indisponible." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          open ? "bg-slate-700 rotate-0" : "bg-brand hover:bg-brand/90"
        }`}
        aria-label="Assistant IA"
      >
        {open ? <X size={22} className="text-white" /> : <MessageCircle size={24} className="text-white" />}
        {!open && messages.length > 1 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: "480px" }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-brand text-white">
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">Assistant PORT2REGION</p>
              <p className="text-[10px] text-white/70">Propulsé par Claude IA</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 bg-brand/10 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <Bot size={12} className="text-brand" />
                  </div>
                )}
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-brand text-white rounded-br-sm"
                    : "bg-white text-slate-700 border border-gray-200 rounded-bl-sm shadow-sm"
                }`}>
                  {m.role === "assistant" ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        h1: ({ children }) => <p className="font-bold text-sm mb-1">{children}</p>,
                        h2: ({ children }) => <p className="font-bold mb-1 mt-2">{children}</p>,
                        h3: ({ children }) => <p className="font-semibold mb-1 mt-1.5">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        table: ({ children }) => <div className="overflow-x-auto my-2"><table className="text-[10px] border-collapse w-full">{children}</table></div>,
                        th: ({ children }) => <th className="border border-gray-200 bg-gray-50 px-2 py-1 text-left font-semibold">{children}</th>,
                        td: ({ children }) => <td className="border border-gray-200 px-2 py-1">{children}</td>,
                        code: ({ children }) => <code className="bg-gray-100 rounded px-1 font-mono">{children}</code>,
                        hr: () => <hr className="my-2 border-gray-200" />,
                      }}
                    >
                      {m.text}
                    </ReactMarkdown>
                  ) : m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 bg-brand/10 rounded-full flex items-center justify-center flex-shrink-0 mr-2">
                  <Bot size={12} className="text-brand" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                  <Loader2 size={14} className="animate-spin text-brand" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions (only if no conversation yet) */}
          {messages.length === 1 && !loading && (
            <div className="px-3 pb-2 bg-gray-50 flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-[10px] bg-white border border-brand/30 text-brand rounded-full px-2.5 py-1 hover:bg-brand/5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-white flex gap-2">
            <input
              className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-brand transition-colors"
              placeholder="Posez votre question…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-8 h-8 bg-brand text-white rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-brand/90 transition-colors"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
