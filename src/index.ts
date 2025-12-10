import { Hono } from 'hono'
import { html } from 'hono/html'
import { calculateDiff, CountPattern } from './lib/dateDiff'

const app = new Hono()

app.get('/', (c) => {
  const url = new URL(c.req.url)
  const from = url.searchParams.get('from') ?? ''
  const to = url.searchParams.get('to') ?? ''
  const pattern = (url.searchParams.get('pattern') as CountPattern | null) ?? 'both'

  let result = null
  let error: string | null = null

  if (from && to) {
    try {
      result = calculateDiff(from, to, pattern)
    } catch (err) {
      error = err instanceof Error ? err.message : 'UNKNOWN_ERROR'
    }
  }

  return c.html(
    html`
      <!doctype html>
      <html lang="ja">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>日数カウント</title>
          <link
            href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.10/base.min.css"
            rel="stylesheet"
          />
          <link
            href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.10/components.min.css"
            rel="stylesheet"
          />
          <link
            href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.10/utilities.min.css"
            rel="stylesheet"
          />
        </head>
        <body class="bg-slate-50 text-slate-900">
          <main class="max-w-3xl mx-auto px-4 py-8">
            <header class="mb-6">
              <p class="text-sm text-slate-500">日数カウント</p>
              <h1 class="text-3xl font-bold mt-1">開始日と終了日を入れるだけで、すぐに日数を計算</h1>
              <p class="mt-2 text-slate-600 text-sm">
                4種類の「数え方」から選ぶだけ。旅行の泊数・締切までの日数などを迷わず把握できます。
              </p>
            </header>

            <section class="bg-white rounded-xl shadow-sm border p-5 space-y-4">
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-slate-700">開始日</label>
                  <div class="mt-1 flex gap-2 items-center">
                    <input
                      id="from"
                      type="date"
                      name="from"
                      value="${from}"
                      class="w-full rounded border px-3 py-2 text-sm"
                    />
                    <button
                      data-fill="from"
                      class="px-2 py-2 text-xs rounded border bg-slate-100 hover:bg-slate-200"
                    >
                      今日
                    </button>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-slate-700">終了日</label>
                  <div class="mt-1 flex gap-2 items-center">
                    <input
                      id="to"
                      type="date"
                      name="to"
                      value="${to}"
                      class="w-full rounded border px-3 py-2 text-sm"
                    />
                    <button
                      data-fill="to"
                      class="px-2 py-2 text-xs rounded border bg-slate-100 hover:bg-slate-200"
                    >
                      今日
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <p class="text-sm font-semibold text-slate-700 mb-2">数え方を選ぶ</p>
                <div class="overflow-hidden rounded-lg border border-slate-200">
                  ${renderPatternRow('both', '期間全体の日数(開始日と終了日を含める)',
                  '単純な期間の長さ、イベント期間など', pattern)}
                  ${renderPatternRow('start', '旅行向け(チェックイン日を含める)',
                  'チェックアウト日は含まない → 泊数を出すときに便利', pattern)}
                  ${renderPatternRow('end', '締切までの残り日数(締切日を含める)',
                  '今日から締切まで何日か', pattern)}
                  ${renderPatternRow('none', '純粋な差分(日付のあいだの日数)',
                  '開始日と終了日を含まない', pattern)}
                </div>
              </div>

              <div class="flex flex-wrap gap-2 text-xs text-slate-600">
                <button id="swap" class="px-3 py-1 rounded border bg-slate-100 hover:bg-slate-200">開始日と終了日を入れ替え</button>
                <span class="inline-flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-slate-400"></span> クリックで日付を今日にセット
                </span>
              </div>
            </section>

            <section class="mt-6 bg-white rounded-xl shadow-sm border p-5" id="result-panel">
              ${renderResult(result, error)}
            </section>

            ${renderFeedbackSection()}
          </main>

          <script>
            const initialState = ${JSON.stringify({ from, to, pattern, result, error })}

            const fromInput = document.getElementById('from')
            const toInput = document.getElementById('to')
            const swapButton = document.getElementById('swap')
            const patternRows = Array.from(document.querySelectorAll('[data-pattern-row]'))
            const resultPanel = document.getElementById('result-panel')

            const todayTokyo = (() => {
              const now = new Date()
              const year = now.toLocaleString('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric' })
              const month = now.toLocaleString('en-CA', { timeZone: 'Asia/Tokyo', month: '2-digit' })
              const day = now.toLocaleString('en-CA', { timeZone: 'Asia/Tokyo', day: '2-digit' })
              return year + '-' + month + '-' + day
            })()

            document.querySelectorAll('[data-fill]').forEach((btn) => {
              btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-fill')
                if (!fromInput || !toInput) return
                if (target === 'from') fromInput.value = todayTokyo
                if (target === 'to') toInput.value = todayTokyo
                calculate()
              })
            })

            swapButton?.addEventListener('click', () => {
              if (!fromInput || !toInput) return
              const tmp = fromInput.value
              fromInput.value = toInput.value
              toInput.value = tmp
              calculate()
            })

            patternRows.forEach((row) => {
              row.addEventListener('click', () => {
                patternRows.forEach((r) => r.classList.remove('bg-indigo-50', 'border-indigo-200'))
                row.classList.add('bg-indigo-50', 'border-indigo-200')
                const radio = row.querySelector('input[type="radio"]')
                if (radio) radio.checked = true
                calculate()
              })
            })

            ;[fromInput, toInput].forEach((input) => {
              input?.addEventListener('change', () => calculate())
            })

            async function calculate() {
              if (!fromInput || !toInput || !resultPanel) return
              const selectedPattern = (document.querySelector('input[name="pattern"]:checked'))?.value ?? 'both'
              const params = new URLSearchParams()
              if (fromInput.value) params.set('from', fromInput.value)
              if (toInput.value) params.set('to', toInput.value)
              params.set('pattern', selectedPattern)

              const query = params.toString()
              const url = query ? '/api/diff?' + query : null

              if (query) {
                history.replaceState(null, '', '/?' + query)
              } else {
                history.replaceState(null, '', '/')
              }

              if (!url) {
                resultPanel.innerHTML = renderPlaceholder()
                return
              }

              resultPanel.innerHTML = '<p class="text-sm text-slate-500">計算中...</p>'
              try {
                const res = await fetch(url)
                const payload = await res.json()
                if (!res.ok) {
                  resultPanel.innerHTML = renderError(payload?.error ?? '計算できませんでした')
                  return
                }
                resultPanel.innerHTML = renderResultClient(payload)
              } catch (err) {
                resultPanel.innerHTML = renderError('通信に失敗しました。オフラインかもしれません。')
              }
            }

            function renderPlaceholder() {
              return \`
                <div>
                  <p class="text-slate-600 text-sm">開始日と終了日を入力すると、ここに結果が表示されます。</p>
                </div>
              \`
            }

            function renderError(message) {
              return \`
                <div class="text-red-600 text-sm">\${message}</div>
              \`
            }

            function renderResultClient(data) {
              const swapped = data.swapped
                ? '<p class="text-xs text-amber-600">※ 開始日と終了日を入れ替えて計算しました。</p>'
                : ''
              const detail = data.detail
                ? \`<p class="text-xs text-slate-500">カレンダー差分: \${detailCalendar(data.detail.calendarDiff)} / 平日 \${data.detail.weekdayDays}日 / 週末 \${data.detail.weekendDays}日</p>\`
                : ''
              return \`
                <div class="space-y-2">
                  <p class="text-sm text-slate-600">\${labelForPattern(data.pattern)}</p>
                  <p class="text-4xl font-bold">\${data.days} 日</p>
                  \${swapped}
                  \${detail}
                </div>
              \`
            }

            function labelForPattern(pattern) {
              if (pattern === 'start') return '開始日だけ含める(旅行の泊数)'
              if (pattern === 'end') return '終了日だけ含める(締切を含める)'
              if (pattern === 'none') return '両端を含まない(純粋な差分)'
              return '開始日と終了日を含める'
            }

            function detailCalendar(calendarDiff) {
              if (calendarDiff === 0) return '同じ日'
              return calendarDiff + ' 日(境界を含まない差)'
            }

            if (!initialState.result && !initialState.error) {
              resultPanel.innerHTML = renderPlaceholder()
            }

            // feedback interactions
            const feedbackButtons = Array.from(document.querySelectorAll('[data-reaction]'))
            const feedbackArea = document.getElementById('feedback-comment')
            const feedbackTextarea = feedbackArea?.querySelector('textarea')
            const feedbackEmail = feedbackArea?.querySelector('input[type="email"]')
            const feedbackSubmit = feedbackArea?.querySelector('button[type="submit"]')
            let selectedReaction = null

            feedbackButtons.forEach((btn) => {
              btn.addEventListener('click', async () => {
                selectedReaction = btn.dataset.reaction
                feedbackButtons.forEach((b) => b.classList.remove('bg-indigo-600', 'text-white'))
                btn.classList.add('bg-indigo-600', 'text-white')
                feedbackArea.classList.remove('hidden')
                await sendFeedback({ kind: 'reaction', reaction: selectedReaction })
              })
            })

            feedbackSubmit?.addEventListener('click', async () => {
              if (!feedbackTextarea.value.trim() && !feedbackEmail.value.trim()) return
              await sendFeedback({
                kind: 'comment',
                reaction: selectedReaction ?? undefined,
                comment: feedbackTextarea.value,
                email: feedbackEmail.value,
              })
              feedbackArea.innerHTML = '<p class="text-sm text-green-700">ありがとうございます!フィードバックを受け付けました。</p>'
            })

            async function sendFeedback(payload) {
              const body = JSON.stringify({
                ...payload,
                path: window.location.pathname,
              })
              try {
                await fetch('/api/feedback', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body,
                })
              } catch (err) {
                console.error('feedback failed', err)
              }
            }
          </script>
        </body>
      </html>
    `
  )
})

app.get('/api/diff', (c) => {
  const url = new URL(c.req.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const pattern = (url.searchParams.get('pattern') as CountPattern | null) ?? 'both'

  if (!from || !to) {
    return c.json({ error: 'INVALID_DATE' }, 400)
  }

  try {
    const result = calculateDiff(from, to, pattern)
    return c.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR'
    const status = message.startsWith('INVALID') ? 400 : 500
    return c.json({ error: message }, status)
  }
})

app.post('/api/feedback', async (c) => {
  const ua = c.req.header('user-agent')
  let payload: any = null
  try {
    payload = await c.req.json()
  } catch (err) {
    return c.json({ ok: false, error: 'INVALID_JSON' }, 400)
  }

  if (!payload || typeof payload !== 'object') {
    return c.json({ ok: false, error: 'INVALID_PAYLOAD' }, 400)
  }

  if (!payload.path || typeof payload.path !== 'string') {
    return c.json({ ok: false, error: 'PATH_REQUIRED' }, 400)
  }

  const allowedKind = ['reaction', 'comment', 'detail']
  if (!allowedKind.includes(payload.kind)) {
    return c.json({ ok: false, error: 'INVALID_KIND' }, 400)
  }

  const logPayload = { ...payload, ua }
  console.log('feedback', JSON.stringify(logPayload))

  return c.json({ ok: true })
})

function renderPatternRow(
  id: CountPattern,
  label: string,
  description: string,
  current: CountPattern
) {
  const checked = current === id ? 'checked' : ''
  return html`
    <label
      class="flex items-start gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-slate-50"
      data-pattern-row
    >
      <input type="radio" name="pattern" value="${id}" class="mt-1" ${checked} />
      <div>
        <div class="font-semibold">${label}</div>
        <p class="text-sm text-slate-600">${description}</p>
      </div>
    </label>
  `
}

function renderResult(result: ReturnType<typeof calculateDiff> | null, error: string | null) {
  if (error) {
    return html`<div class="text-red-600 text-sm">${errorMessage(error)}</div>`
  }

  if (!result) {
    return html`<p class="text-sm text-slate-600">開始日と終了日を入力すると、ここに結果が表示されます。</p>`
  }

  return html`
    <div class="space-y-2">
      <p class="text-sm text-slate-600">${labelForPattern(result.pattern)}</p>
      <p class="text-4xl font-bold">${result.days} 日</p>
      ${result.swapped
        ? html`<p class="text-xs text-amber-600">※ 開始日と終了日を入れ替えて計算しました。</p>`
        : ''}
      <p class="text-xs text-slate-500">
        カレンダー差分: ${detailCalendar(result.detail.calendarDiff)} / 平日 ${result.detail.weekdayDays}日 /
        週末 ${result.detail.weekendDays}日
      </p>
    </div>
  `
}

function labelForPattern(pattern: CountPattern) {
  if (pattern === 'start') return '開始日だけ含める(旅行の泊数)'
  if (pattern === 'end') return '終了日だけ含める(締切を含める)'
  if (pattern === 'none') return '両端を含まない(純粋な差分)'
  return '開始日と終了日を含める'
}

function detailCalendar(calendarDiff: number) {
  if (calendarDiff === 0) return '同じ日'
  return `${calendarDiff} 日(境界を含まない差)`
}

function errorMessage(code: string) {
  if (code === 'INVALID_DATE') return '日付の形式が正しくありません。YYYY-MM-DD で入力してください。'
  if (code === 'INVALID_PATTERN') return '数え方の指定が不正です。'
  return '計算に失敗しました。時間をおいて再度お試しください。'
}

function renderFeedbackSection() {
  return html`
    <section id="feedback" class="mt-10 border-t pt-6 text-sm">
      <h2 class="font-semibold mb-3">このページについて教えてください</h2>

      <div class="flex flex-wrap gap-2 mb-3">
        <button data-reaction="good" class="feedback-btn px-3 py-2 rounded border bg-white hover:bg-slate-100">👍 役に立った</button>
        <button data-reaction="neutral" class="feedback-btn px-3 py-2 rounded border bg-white hover:bg-slate-100">😐 ふつう</button>
        <button data-reaction="bad" class="feedback-btn px-3 py-2 rounded border bg-white hover:bg-slate-100">👎 いまいち</button>
      </div>

      <div id="feedback-comment" class="hidden">
        <p class="mb-1">よければ一言だけご意見をください(任意):</p>
        <textarea
          class="w-full border rounded p-2 text-sm"
          rows="3"
          placeholder="例)ここが分かりにくかった、こういう機能が欲しい など"
        ></textarea>
        <div class="mt-2 flex items-center gap-2">
          <input
            type="email"
            class="border rounded p-1 text-xs"
            placeholder="返信が必要な方はメールアドレス(任意)"
          />
          <button type="submit" class="px-3 py-1 text-xs rounded bg-slate-900 text-white">送信</button>
        </div>
        <p class="mt-1 text-xs text-slate-500">※ 個別に返信できない場合がありますが、必ず目を通します。</p>
      </div>

      <p class="mt-3 text-xs">
        もっと詳しいご意見は <a href="/feedback" class="underline">こちらの意見フォーム</a>からどうぞ。
      </p>
    </section>
  `
}

export default app