import { useState, useEffect } from "react"

const MODEL = "claude-sonnet-4-20250514"

/**
 * AI 心の状態分析パネル（ボトムシート）。
 * 未完了メモ＋完了履歴を Anthropic API に送り、PSW 視点の分析を返します。
 *
 * 環境変数 VITE_ANTHROPIC_API_KEY が未設定の場合は
 * フォールバックメッセージを表示します。
 */
export default function AIPanel({ items, completed, onClose }) {
  const [phase,  setPhase]  = useState("idle")   // idle | loading | done | error | no_key
  const [result, setResult] = useState(null)

  useEffect(() => {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey || apiKey === "sk-ant-your-key-here") {
      setPhase("no_key")
      return
    }
    analyze(apiKey)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const analyze = async (apiKey) => {
    setPhase("loading")

    const allTexts  = items.map(i => `・${i.text}`).join("\n") || "（なし）"
    const doneTexts = completed.slice(-10).map(i => `・${i.text}`).join("\n") || "（なし）"

    const prompt = `あなたは精神保健福祉士（PSW）の視点を持つ、共感的なメンタルヘルスサポーターです。
以下のユーザーのメモから、今の心の状態をやさしく読み解き、JSON形式のみで回答してください。

【今日のメモ（未完了）】
${allTexts}

【最近完了したこと】
${doneTexts}

以下のJSON形式のみで返答してください（前後に何も付けないこと）：
{
  "mood": "穏やか|疲れ気味|頑張っている|焦り気味|ほっとしている|揺れている",
  "moodEmoji": "1文字の絵文字",
  "moodColor": "CSSカラー文字列（パステル系のrgba）",
  "summary": "今の心の状態を2〜3文で、やさしく共感的に説明",
  "strength": "今日のあなたの強みや良かったことを1文で",
  "advice": "一つだけ、小さくて具体的なセルフケアの提案を1文で",
  "affirmation": "短い肯定的なメッセージ（20文字以内）"
}`

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      })

      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const data = await res.json()
      const text = (data.content || []).map(b => b.text || "").join("").trim()
      const clean = text.replace(/```json|```/g, "").trim()
      setResult(JSON.parse(clean))
      setPhase("done")
    } catch (e) {
      console.error("[YOHAKU] AI analysis failed:", e)
      setPhase("error")
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="心の状態分析"
      style={{
        position: "fixed", inset: 0, zIndex: 3000,
        background: "rgba(220,235,250,0.55)",
        backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420,
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderRadius: "32px 32px 0 0", padding: "32px 28px 44px",
          boxShadow: "0 -8px 48px rgba(130,180,220,0.18)",
          border: "1px solid rgba(200,225,245,0.5)",
          fontFamily: "'M PLUS Rounded 1c', sans-serif",
          animation: "slideUp 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
          maxHeight: "85vh", overflowY: "auto",
        }}
      >
        {/* ハンドル */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: "rgba(160,200,230,0.3)", margin: "0 auto 24px",
        }} />

        {/* ── ローディング ── */}
        {phase === "loading" && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 40, animation: "shimmer 1.8s ease-in-out infinite", marginBottom: 16 }}>🌊</div>
            <div style={{ color: "#7aadcc", fontSize: 15, letterSpacing: "0.06em", lineHeight: 2 }}>
              今の心の状態を<br />読み解いています…
            </div>
          </div>
        )}

        {/* ── APIキー未設定 ── */}
        {phase === "no_key" && (
          <div style={{ textAlign: "center", padding: "24px 0", lineHeight: 2 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔑</div>
            <p style={{ color: "#7aadcc", fontSize: 14, marginBottom: 12 }}>
              AI分析を使うには<br />APIキーの設定が必要です。
            </p>
            <p style={{ color: "rgba(140,185,215,0.6)", fontSize: 12, letterSpacing: "0.04em" }}>
              .env.example を参考に<br />.env ファイルを作成してください。
            </p>
          </div>
        )}

        {/* ── エラー ── */}
        {phase === "error" && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "rgba(180,140,160,0.7)", lineHeight: 2 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🫧</div>
            うまく接続できませんでした。<br />少し待ってから試してみてください。
          </div>
        )}

        {/* ── 結果 ── */}
        {phase === "done" && result && (
          <div>
            {/* 気持ちカード */}
            <div style={{
              background: `linear-gradient(135deg, ${result.moodColor || "rgba(180,215,245,0.4)"}, rgba(255,235,245,0.3))`,
              borderRadius: 20, padding: "20px 22px", marginBottom: 16,
              border: "1px solid rgba(200,225,245,0.4)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 36 }}>{result.moodEmoji}</span>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(130,175,210,0.65)", letterSpacing: "0.08em" }}>今の気持ち</div>
                  <div style={{ fontSize: 20, color: "#5a8aaa", fontWeight: 500 }}>{result.mood}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: "#6a98b8", lineHeight: 1.9, margin: 0, letterSpacing: "0.03em" }}>
                {result.summary}
              </p>
            </div>

            {/* 今日の強み */}
            <div style={{
              padding: "14px 18px", borderRadius: 16, marginBottom: 10,
              background: "rgba(220,240,255,0.3)", border: "1px solid rgba(180,215,245,0.3)",
            }}>
              <div style={{ fontSize: 11, color: "rgba(130,175,210,0.6)", letterSpacing: "0.08em", marginBottom: 6 }}>✦ 今日の強み</div>
              <p style={{ fontSize: 14, color: "#6a98b8", lineHeight: 1.8, margin: 0 }}>{result.strength}</p>
            </div>

            {/* セルフケア提案 */}
            <div style={{
              padding: "14px 18px", borderRadius: 16, marginBottom: 16,
              background: "rgba(240,225,255,0.25)", border: "1px solid rgba(210,190,240,0.3)",
            }}>
              <div style={{ fontSize: 11, color: "rgba(170,150,210,0.6)", letterSpacing: "0.08em", marginBottom: 6 }}>🌿 今日のセルフケア</div>
              <p style={{ fontSize: 14, color: "#8a78b8", lineHeight: 1.8, margin: 0 }}>{result.advice}</p>
            </div>

            {/* アファメーション */}
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ fontSize: 20, color: "rgba(160,200,230,0.7)", letterSpacing: "0.15em", fontWeight: 300 }}>
                {result.affirmation}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            display: "block", width: "100%", marginTop: 20,
            padding: "14px", borderRadius: 20, border: "none",
            background: "rgba(200,225,245,0.3)", cursor: "pointer",
            fontFamily: "'M PLUS Rounded 1c', sans-serif",
            fontSize: 14, color: "rgba(130,175,210,0.7)", letterSpacing: "0.06em",
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
