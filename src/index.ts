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
        <body class="bg-gradient-to-br from-slate-50 via-white to-indigo-50 text-slate-900">
          <main class="max-w-5xl mx-auto px-4 py-10">
            <header class="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div class="space-y-2 max-w-3xl">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Day Counter</p>
                <h1 class="text-3xl md:text-4xl font-bold leading-tight">
                  日付入力と同時に結果がわかる、モダンな日数カウンター
                </h1>
                <p class="text-slate-600 text-sm md:text-base">
                  4種類の「数え方」から選ぶだけ。旅行の泊数・締切までの日数・シンプルな経過日数などを迷わず把握できます。
                </p>
              </div>
              <div class="rounded-full bg-white/80 backdrop-blur border border-slate-200 px-4 py-2 shadow-sm text-sm text-slate-600">
                文字入力でもカレンダー操作でもOK。入力に合わせて常時アップデート。
              </div>
            </header>

            <section class="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-slate-200 p-6 space-y-5">
              <div class="grid md:grid-cols-2 gap-6">
                <div class="space-y-3">
                  <div class="flex items-center justify-between gap-2">
                    <label class="block text-sm font-semibold text-slate-800">開始日</label>
                    <button
                      data-fill="from"
                      class="px-3 py-1.5 text-xs rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition"
                    >
                      今日をセット
                    </button>
                  </div>
                  <input
                    id="from"
                    type="date"
                    name="from"
                    value="${from}"
                    class="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm shadow-inner focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition"
                  />
                  <div class="bg-slate-50 border border-slate-200 rounded-xl p-3" data-calendar="from"></div>
                </div>
                <div class="space-y-3">
                  <div class="flex items-center justify-between gap-2">
                    <label class="block text-sm font-semibold text-slate-800">終了日</label>
                    <button
                      data-fill="to"
                      class="px-3 py-1.5 text-xs rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition"
                    >
                      今日をセット
                    </button>
                  </div>
                  <input
                    id="to"
                    type="date"
                    name="to"
                    value="${to}"
                    class="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm shadow-inner focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition"
                  />
                  <div class="bg-slate-50 border border-slate-200 rounded-xl p-3" data-calendar="to"></div>
                </div>
              </div>

              <div class="flex flex-wrap gap-2 text-xs text-slate-600 items-center">
                <button
                  id="swap"
                  class="px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 transition"
                >
                  開始日と終了日を入れ替え
                </button>
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-slate-200">
                  <span class="w-2 h-2 rounded-full bg-indigo-400"></span> カレンダーは常に表示され、クリックと入力どちらも使えます
                </span>
              </div>

              <div class="bg-gradient-to-br from-indigo-50 via-white to-slate-50 border border-indigo-100 rounded-xl p-4">
                <p class="text-sm font-semibold text-slate-800 mb-2">数え方を選ぶ</p>
                <div class="overflow-hidden rounded-xl border border-slate-200 divide-y divide-slate-200">
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
            </section>

            <section class="mt-6 bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-slate-200 p-5" id="result-panel">
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

            const calendarContainers = {
              from: document.querySelector('[data-calendar="from"]'),
              to: document.querySelector('[data-calendar="to"]'),
            }

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
                if (target === 'from') {
                  fromInput.value = todayTokyo
                  syncCalendarSelection('from', todayTokyo)
                }
                if (target === 'to') {
                  toInput.value = todayTokyo
                  syncCalendarSelection('to', todayTokyo)
                }
                calculate()
              })
            })

            swapButton?.addEventListener('click', () => {
              if (!fromInput || !toInput) return
              const tmp = fromInput.value
              fromInput.value = toInput.value
              toInput.value = tmp
              syncCalendarSelection('from', fromInput.value)
              syncCalendarSelection('to', toInput.value)
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
              input?.addEventListener('change', (event) => {
                const target = event.target
                if (!(target instanceof HTMLInputElement)) return
                syncCalendarSelection(target.id as 'from' | 'to', target.value)
                calculate()
              })
              input?.addEventListener('input', (event) => {
                const target = event.target
                if (!(target instanceof HTMLInputElement)) return
                syncCalendarSelection(target.id as 'from' | 'to', target.value, false)
              })
            })

            const calendarState = {
              from: { currentMonth: deriveMonth(fromInput?.value) },
              to: { currentMonth: deriveMonth(toInput?.value) },
            }

            Object.entries(calendarContainers).forEach(([key, container]) => {
              if (!container) return
              renderCalendar(key as 'from' | 'to')
              container.addEventListener('click', (event) => {
                const target = event.target
                if (!(target instanceof HTMLElement)) return
                if (target.dataset.nav) {
                  shiftMonth(key as 'from' | 'to', Number(target.dataset.nav))
                  renderCalendar(key as 'from' | 'to')
                }
                if (target.dataset.date) {
                  const dateValue = target.dataset.date
                  if (key === 'from' && fromInput) {
                    fromInput.value = dateValue
                  }
                  if (key === 'to' && toInput) {
                    toInput.value = dateValue
                  }
                  syncCalendarSelection(key as 'from' | 'to', dateValue, false)
                  calculate()
                }
              })
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
              return \
                `
                <div>
                  <p class="text-slate-600 text-sm">開始日と終了日を入力すると、ここに結果が表示されます。</p>
                </div>
              `
            }

            function renderError(message) {
              return \
                `
                <div class="text-red-600 text-sm">${message}</div>
              `
            }

            function renderResultClient(data) {
              const swapped = data.swapped
                ? '<p class="text-xs text-amber-600">※ 開始日と終了日を入れ替えて計算しました。</p>'
                : ''
              const detail = data.detail
                ? `
                  <p class="text-xs text-slate-500">
                    カレンダー差分: ${detailCalendar(data.detail.calendarDiff)} / 平日 ${data.detail.weekdayDays}日 /
                    週末 ${data.detail.weekendDays}日
                  </p>
                `
                : ''
              return \
                `
                <div class="space-y-2">
                  <p class="text-sm text-slate-600">${labelForPattern(data.pattern)}</p>
                  <p class="text-4xl font-bold">${data.days} 日</p>
                  ${swapped}
                  ${detail}
                </div>
              `
            }

            if (!initialState.result && !initialState.error) {
              resultPanel.innerHTML = renderPlaceholder()
            }

            function deriveMonth(inputValue) {
              const parsed = parseDate(inputValue)
              const base = parsed ?? new Date()
              return new Date(base.getFullYear(), base.getMonth(), 1)
            }

            function parseDate(value) {
              if (!value) return null
              const [y, m, d] = value.split('-').map((v) => Number(v))
              if (!y || !m || !d) return null
              const dt = new Date(Date.UTC(y, m - 1, d))
              if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
              return dt
            }

            function formatISO(date) {
              const y = date.getUTCFullYear()
              const m = String(date.getUTCMonth() + 1).padStart(2, '0')
              const d = String(date.getUTCDate()).padStart(2, '0')
              return `${y}-${m}-${d}`
            }

            function shiftMonth(key, diff) {
              const current = calendarState[key].currentMonth
              const shifted = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + diff, 1))
              calendarState[key].currentMonth = shifted
            }

            function syncCalendarSelection(key, value, keepMonth = true) {
              const parsed = parseDate(value)
              if (!parsed) return renderCalendar(key)
              if (!keepMonth) {
                calendarState[key].currentMonth = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1))
              }
              calendarState[key].selected = parsed
              renderCalendar(key)
            }

            function renderCalendar(key) {
              const container = calendarContainers[key]
              if (!container) return
              const state = calendarState[key]
              const current = state.currentMonth
              const selected = state.selected

              const year = current.getUTCFullYear()
              const month = current.getUTCMonth()
              const startDay = new Date(Date.UTC(year, month, 1))
              const startWeekday = startDay.getUTCDay()
              const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

              const weekdays = ['日', '月', '火', '水', '木', '金', '土']
              const cells = []
              for (let i = 0; i < startWeekday; i++) {
                cells.push('<div class="h-9"></div>')
              }
              for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(Date.UTC(year, month, day))
                const value = formatISO(date)
                const isSelected = selected && formatISO(selected) === value
                const isToday = value === todayTokyo
                cells.push(
                  `<button data-date="${value}" class="h-9 text-sm rounded-lg border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : isToday
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50'
                  } transition">${day}</button>`
                )
              }

              container.innerHTML = `
                <div class="flex items-center justify-between mb-2 text-sm text-slate-700">
                  <button data-nav="-1" class="p-1 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50">←</button>
                  <div class="font-semibold">${year}年 ${month + 1}月</div>
                  <button data-nav="1" class="p-1 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50">→</button>
                </div>
                <div class="grid grid-cols-7 gap-1 text-[11px] text-slate-500 mb-1">
                  ${weekdays.map((w) => `<div class="text-center">${w}</div>`).join('')}
                </div>
                <div class="grid grid-cols-7 gap-1">${cells.join('')}</div>
              `
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
      class="flex items-start gap-3 p-3 cursor-pointer hover:bg-indigo-50/70 transition"
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
