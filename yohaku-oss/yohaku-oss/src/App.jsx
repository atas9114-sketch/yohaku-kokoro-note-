import { useState, useEffect, useRef, useCallback } from "react"
import { CATEGORIES, PLACEHOLDERS, PSW_MESSAGES, MAX_COMPLETED } from "./constants.js"
import { loadItems, saveItems, loadCompleted, saveCompleted } from "./storage.js"
import MemoItem       from "./components/MemoItem.jsx"
import AddModal       from "./components/AddModal.jsx"
import AIPanel        from "./components/AIPanel.jsx"
import Toast          from "./components/Toast.jsx"
import { WatercolorBg, Bubbles } from "./components/WatercolorBg.jsx"

// Google Fonts — M PLUS Rounded 1c
const _link = document.createElement("link")
_link.rel   = "stylesheet"
_link.href  = "https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@300;400;500;700&display=swap"
document.head.appendChild(_link)

export default function App() {
  const [items,          setItems]          = useState(loadItems)
  const [completed,      setCompleted]      = useState(loadCompleted)
  const [activeFilter,   setActiveFilter]   = useState("all")
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [toast,          setToast]          = useState(null)
  const [showAdd,        setShowAdd]        = useState(false)
  const [showAI,         setShowAI]         = useState(false)
  const nextId = useRef(Date.now())

  // ── 永続化 ──────────────────────────────────────────
  useEffect(() => { saveItems(items) },     [items])
  useEffect(() => { saveCompleted(completed) }, [completed])

  // ── プレースホルダーローテーション ──────────────────
  useEffect(() => {
    const t = setInterval(
      () => setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length),
      4000
    )
    return () => clearInterval(t)
  }, [])

  // ── ハンドラ ─────────────────────────────────────────
  const handleComplete = useCallback((id) => {
    const item = items.find(x => x.id === id)
    if (item) {
      setCompleted(prev => [
        ...prev.slice(-(MAX_COMPLETED - 1)),
        { ...item, completedAt: Date.now() },
      ])
    }
    setItems(prev => prev.filter(x => x.id !== id))
    const msg = PSW_MESSAGES[Math.floor(Math.random() * PSW_MESSAGES.length)]
    setToast({ id: Date.now(), message: msg, emoji: "✦" })
  }, [items])

  const handleDelete = useCallback((id) => {
    setItems(prev => prev.filter(x => x.id !== id))
  }, [])

  const handleAdd = useCallback((text, catId) => {
    setItems(prev => [
      ...prev,
      { id: nextId.current++, text, category: catId, createdAt: Date.now() },
    ])
    if (navigator.vibrate) navigator.vibrate(20)
  }, [])

  // ── フィルター済みリスト ─────────────────────────────
  const filtered  = activeFilter === "all"
    ? items
    : items.filter(i => i.category === activeFilter)
  const activeCat = CATEGORIES.find(c => c.id === activeFilter)

  // ── レンダリング ─────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #f0f7ff 0%, #fdf0f7 50%, #fffff0 100%)",
      fontFamily: "'M PLUS Rounded 1c', sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      <WatercolorBg />
      <Bubbles />

      <div style={{
        position: "relative", zIndex: 10,
        maxWidth: 420, margin: "0 auto",
        minHeight: "100vh", display: "flex",
        flexDirection: "column", paddingBottom: 90,
      }}>

        {/* ══ ヘッダー ══ */}
        <header style={{ padding: "48px 32px 20px", animation: "floatIn 0.8s ease both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <h1 style={{
                  fontSize: 30, fontWeight: 300, color: "#7aadcc",
                  letterSpacing: "0.12em", margin: 0, lineHeight: 1,
                }}>YOHAKU</h1>
                <span style={{ fontSize: 14, color: "rgba(140,185,215,0.65)", letterSpacing: "0.06em" }}>
                  余白
                </span>
              </div>
              <p style={{
                fontSize: 11, color: "rgba(140,185,215,0.55)",
                letterSpacing: "0.07em", marginTop: 5, fontWeight: 300,
              }}>
                心にあるものを、そっと置いてください。
              </p>
            </div>

            {/* AI 分析ボタン */}
            <button
              onClick={() => setShowAI(true)}
              aria-label="心の状態を分析する"
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 3, background: "rgba(255,255,255,0.55)",
                border: "1px solid rgba(180,215,245,0.35)",
                borderRadius: 16, padding: "10px 14px", cursor: "pointer",
                boxShadow: "0 2px 12px rgba(140,195,230,0.1)",
                backdropFilter: "blur(10px)", transition: "all 0.25s ease",
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(140,195,230,0.2)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(140,195,230,0.1)"}
            >
              <span style={{ fontSize: 22 }}>🌊</span>
              <span style={{ fontSize: 9, color: "rgba(130,175,210,0.6)", letterSpacing: "0.06em" }}>
                心の状態
              </span>
            </button>
          </div>

          {/* 統計チップ */}
          {(items.length > 0 || completed.length > 0) && (
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              <div style={{
                padding: "4px 12px", borderRadius: 12,
                background: "rgba(200,225,245,0.3)", border: "1px solid rgba(180,215,245,0.25)",
                fontSize: 11, color: "rgba(130,175,210,0.7)", letterSpacing: "0.05em",
              }}>
                📋 {items.length} 件
              </div>
              {completed.length > 0 && (
                <div style={{
                  padding: "4px 12px", borderRadius: 12,
                  background: "rgba(220,240,215,0.3)", border: "1px solid rgba(180,230,200,0.3)",
                  fontSize: 11, color: "rgba(120,175,140,0.75)", letterSpacing: "0.05em",
                }}>
                  ✦ {completed.length} 件完了
                </div>
              )}
            </div>
          )}
        </header>

        {/* ══ カテゴリフィルター ══ */}
        <nav
          aria-label="カテゴリフィルター"
          style={{
            padding: "0 24px 16px",
            animation: "floatIn 0.8s 0.1s ease both",
            opacity: 0, animationFillMode: "forwards",
          }}
        >
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                aria-pressed={activeFilter === cat.id}
                style={{
                  padding: "7px 14px", borderRadius: 20, flexShrink: 0,
                  border: `1.5px solid ${activeFilter === cat.id ? cat.color : "rgba(180,215,245,0.2)"}`,
                  background: activeFilter === cat.id ? cat.bg : "transparent",
                  color: activeFilter === cat.id ? cat.color : "rgba(160,200,230,0.55)",
                  fontFamily: "'M PLUS Rounded 1c', sans-serif",
                  fontSize: 12, cursor: "pointer", letterSpacing: "0.04em",
                  transition: "all 0.2s ease",
                }}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </nav>

        {/* ══ メモリスト ══ */}
        <main style={{
          flex: 1, padding: "0 32px",
          animation: "floatIn 0.8s 0.18s ease both",
          opacity: 0, animationFillMode: "forwards",
        }}>
          {filtered.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "52px 0",
              color: "rgba(160,200,230,0.45)", fontSize: 14,
              letterSpacing: "0.06em", lineHeight: 2.4,
            }}>
              <div style={{ fontSize: 30, marginBottom: 12, animation: "shimmer 3s infinite" }}>
                {activeCat?.emoji || "✦"}
              </div>
              {items.length === 0
                ? <>心が少し<br />軽くなりましたね。</>
                : <>{activeCat?.label}のメモは<br />まだありません。</>
              }
            </div>
          ) : (
            filtered.map(item => (
              <MemoItem
                key={item.id}
                item={item}
                onComplete={handleComplete}
                onDelete={handleDelete}
              />
            ))
          )}
          {/* 完了するほど余白が広がる */}
          <div style={{ minHeight: Math.max(0, (5 - filtered.length) * 36) }} />
        </main>

        {/* ══ FAB（追加ボタン） ══ */}
        <button
          onClick={() => setShowAdd(true)}
          aria-label="メモを追加する"
          style={{
            position: "fixed", bottom: 28, right: "calc(50% - 196px)",
            width: 56, height: 56, borderRadius: "50%",
            border: "none", cursor: "pointer", zIndex: 200,
            background: "linear-gradient(135deg, rgba(155,210,245,0.85), rgba(205,178,240,0.75))",
            boxShadow: "0 6px 28px rgba(140,190,230,0.32), inset 0 1px 2px rgba(255,255,255,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, color: "white",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            animation: "pulse 3s ease-in-out infinite",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.animationPlayState = "paused" }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)";   e.currentTarget.style.animationPlayState = "running" }}
        >+</button>
      </div>

      {/* ══ モーダル ══ */}
      {showAdd && (
        <AddModal
          onAdd={handleAdd}
          onClose={() => setShowAdd(false)}
          placeholderIdx={placeholderIdx}
        />
      )}
      {showAI && (
        <AIPanel
          items={items}
          completed={completed}
          onClose={() => setShowAI(false)}
        />
      )}

      {/* ══ トースト ══ */}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          emoji={toast.emoji}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  )
}
