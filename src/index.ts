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
          <title>Day Counter - 日数計算ツール</title>
          <script src="https://cdn.tailwindcss.com"></script>
          
          <!-- Flatpickr CSS -->
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/airbnb.css">
          
          <style>
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
            .animate-pulse {
              animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            
            /* Flatpickr カスタムスタイル */
            .flatpickr-calendar {
              border-radius: 16px !important;
              box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) !important;
              border: 2px solid rgb(226 232 240) !important;
            }
            
            .flatpickr-months {
              border-radius: 14px 14px 0 0 !important;
              background: linear-gradient(135deg, rgb(99 102 241) 0%, rgb(168 85 247) 100%) !important;
            }
            
            .flatpickr-current-month {
              color: white !important;
              font-weight: 700 !important;
            }
            
            .flatpickr-weekday {
              color: rgb(100 116 139) !important;
              font-weight: 600 !important;
            }
            
            .flatpickr-day {
              border-radius: 8px !important;
              font-weight: 500 !important;
            }
            
            .flatpickr-day.today {
              background: rgb(224 231 255) !important;
              color: rgb(79 70 229) !important;
              border-color: rgb(165 180 252) !important;
            }
            
            .flatpickr-day.selected {
              background: rgb(99 102 241) !important;
              border-color: rgb(99 102 241) !important;
              color: white !important;
              font-weight: 700 !important;
            }
            
            .flatpickr-day:hover:not(.selected):not(.today) {
              background: rgb(238 242 255) !important;
              border-color: rgb(199 210 254) !important;
            }
            
            .flatpickr-months .flatpickr-prev-month,
            .flatpickr-months .flatpickr-next-month {
              fill: white !important;
            }
            
            .flatpickr-months .flatpickr-prev-month:hover svg,
            .flatpickr-months .flatpickr-next-month:hover svg {
              fill: rgb(224 231 255) !important;
            }
          </style>
        </head>
        <body class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <!-- ヘッダー -->
          <header class="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-10 shadow-sm">
            <div class="max-w-6xl mx-auto px-6 py-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <h1 class="text-2xl font-black text-slate-800">Day Counter</h1>
                </div>
                <div class="text-sm text-slate-600 hidden md:block">
                  日数計算ツール
                </div>
              </div>
            </div>
          </header>

          <!-- メインコンテンツ -->
          <main class="max-w-6xl mx-auto px-6 py-12">
            <!-- イントロ -->
            <div class="text-center mb-12">
              <h2 class="text-3xl md:text-4xl font-black text-slate-800 mb-4">
                日付を選んで、<br class="md:hidden" />
                <span class="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                  瞬時に日数計算
                </span>
              </h2>
              <p class="text-slate-600 text-base md:text-lg max-w-2xl mx-auto">
                旅行の泊数、締切までの残り日数、イベント期間など、<br class="hidden md:block" />
                4種類の数え方から選んで正確に計算できます。
              </p>
            </div>

            <!-- 日付入力 -->
            <div class="mb-8">
              <div class="grid md:grid-cols-2 gap-6">
                <!-- 開始日 -->
                <div class="bg-white rounded-2xl border-2 border-slate-200 p-6 hover:border-indigo-300 transition-all duration-300 shadow-sm hover:shadow-md">
                  <div class="flex items-center justify-between mb-3">
                    <label class="text-sm font-bold text-slate-700 uppercase tracking-wider">開始日</label>
                    <button
                      data-set-today="from"
                      class="px-3 py-1.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
                    >
                      今日
                    </button>
                  </div>
                  <input
                    id="from"
                    type="text"
                    value="${from}"
                    placeholder="開始日を選択"
                    class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-lg font-medium transition-all cursor-pointer"
                    readonly
                  />
                </div>

                <!-- 終了日 -->
                <div class="bg-white rounded-2xl border-2 border-slate-200 p-6 hover:border-indigo-300 transition-all duration-300 shadow-sm hover:shadow-md">
                  <div class="flex items-center justify-between mb-3">
                    <label class="text-sm font-bold text-slate-700 uppercase tracking-wider">終了日</label>
                    <button
                      data-set-today="to"
                      class="px-3 py-1.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
                    >
                      今日
                    </button>
                  </div>
                  <input
                    id="to"
                    type="text"
                    value="${to}"
                    placeholder="終了日を選択"
                    class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-lg font-medium transition-all cursor-pointer"
                    readonly
                  />
                </div>
              </div>
            </div>

            <!-- パターン選択 -->
            <div class="mb-8">
              <h3 class="text-2xl font-bold text-slate-800 mb-6 text-center">
                数え方を選択
              </h3>
              <div class="grid md:grid-cols-2 gap-4">
                ${renderPatternCard('both', '期間全体の日数', '開始日と終了日を含める。イベント期間など。', 'calendar', pattern)}
                ${renderPatternCard('start', '旅行向け（泊数）', 'チェックイン日を含め、チェックアウト日は含まない。', 'clock', pattern)}
                ${renderPatternCard('end', '締切までの残り日数', '今日から締切まで何日か。締切日を含める。', 'trending', pattern)}
                ${renderPatternCard('none', '純粋な差分', '日付のあいだの日数。両端を含まない。', 'arrow', pattern)}
              </div>
            </div>

            <!-- 結果表示 -->
            <div id="result-container">
              ${renderResult(result, error)}
            </div>

            <!-- フッター -->
            <div class="mt-16 text-center">
              <div class="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm border border-slate-200">
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span class="text-sm text-slate-600">リアルタイムで計算中</span>
              </div>
            </div>
          </main>

          <!-- Flatpickr JS -->
          <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
          <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/ja.js"></script>
          
          <script>
            const resultContainer = document.getElementById('result-container');
            const patternButtons = document.querySelectorAll('[data-pattern]');

            const getTodayString = () => {
              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const day = String(now.getDate()).padStart(2, '0');
              return year + '-' + month + '-' + day;
            };

            // Flatpickr 初期化
            const fromPicker = flatpickr("#from", {
              locale: "ja",
              dateFormat: "Y-m-d",
              defaultDate: "${from}" || null,
              onChange: function(selectedDates, dateStr) {
                updateResult();
              }
            });

            const toPicker = flatpickr("#to", {
              locale: "ja",
              dateFormat: "Y-m-d",
              defaultDate: "${to}" || null,
              onChange: function(selectedDates, dateStr) {
                updateResult();
              }
            });

            // 今日ボタン
            document.querySelectorAll('[data-set-today]').forEach(btn => {
              btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-set-today');
                const today = getTodayString();
                if (target === 'from') {
                  fromPicker.setDate(today);
                } else {
                  toPicker.setDate(today);
                }
                updateResult();
              });
            });

            // パターン選択
            patternButtons.forEach(btn => {
              btn.addEventListener('click', () => {
                patternButtons.forEach(b => {
                  b.classList.remove('border-indigo-500', 'bg-indigo-50', 'shadow-lg', 'scale-105');
                  b.classList.add('border-slate-200', 'bg-white');
                  const icon = b.querySelector('[data-icon]');
                  icon.classList.remove('bg-indigo-500', 'text-white');
                  icon.classList.add('bg-slate-100', 'text-slate-600');
                  const check = b.querySelector('[data-check]');
                  if (check) check.remove();
                });

                btn.classList.remove('border-slate-200', 'bg-white');
                btn.classList.add('border-indigo-500', 'bg-indigo-50', 'shadow-lg', 'scale-105');
                const icon = btn.querySelector('[data-icon]');
                icon.classList.remove('bg-slate-100', 'text-slate-600');
                icon.classList.add('bg-indigo-500', 'text-white');

                const check = document.createElement('div');
                check.setAttribute('data-check', '');
                check.className = 'absolute top-3 right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center';
                check.innerHTML = '<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>';
                btn.appendChild(check);

                updateResult();
              });
            });

            async function updateResult() {
              const from = fromPicker.selectedDates[0];
              const to = toPicker.selectedDates[0];
              
              if (!from || !to) {
                resultContainer.innerHTML = renderEmptyResult();
                return;
              }

              const fromStr = flatpickr.formatDate(from, 'Y-m-d');
              const toStr = flatpickr.formatDate(to, 'Y-m-d');
              
              const selectedBtn = document.querySelector('[data-pattern].border-indigo-500');
              const pattern = selectedBtn ? selectedBtn.getAttribute('data-pattern') : 'both';

              const params = new URLSearchParams({ from: fromStr, to: toStr, pattern });
              history.replaceState(null, '', '/?' + params.toString());

              try {
                const res = await fetch('/api/diff?' + params.toString());
                const data = await res.json();
                
                if (res.ok) {
                  resultContainer.innerHTML = renderResultClient(data);
                } else {
                  resultContainer.innerHTML = renderErrorResult(data.error);
                }
              } catch (err) {
                resultContainer.innerHTML = renderErrorResult('通信エラー');
              }
            }

            function renderEmptyResult() {
              return \`
                <div class="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl border-2 border-slate-200 p-12 text-center">
                  <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-200 mb-4">
                    <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <p class="text-slate-500 text-lg">日付を入力すると結果が表示されます</p>
                </div>
              \`;
            }

            function renderErrorResult(error) {
              return \`
                <div class="bg-red-50 rounded-3xl border-2 border-red-200 p-8 text-center">
                  <p class="text-red-600 font-semibold">\${error}</p>
                </div>
              \`;
            }

            function renderResultClient(data) {
              const patternLabels = {
                both: '開始日と終了日を含める',
                start: '開始日だけ含める（旅行の泊数）',
                end: '終了日だけ含める（締切を含める）',
                none: '両端を含まない（純粋な差分）'
              };

              const swappedHtml = data.swapped ? \`
                <div class="mb-6 px-4 py-3 bg-amber-500 rounded-xl">
                  <p class="text-white text-sm font-semibold text-center">
                    ⚠️ 開始日と終了日を入れ替えて計算しました
                  </p>
                </div>
              \` : '';

              return \`
                <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl border-2 border-indigo-400 p-8 shadow-2xl">
                  <div class="text-center mb-6">
                    <p class="text-indigo-100 text-sm font-semibold mb-2 uppercase tracking-wider">
                      \${patternLabels[data.pattern] || '計算結果'}
                    </p>
                    <div class="flex items-center justify-center gap-3">
                      <span class="text-6xl md:text-7xl font-black text-white">\${data.days}</span>
                      <span class="text-2xl md:text-3xl font-bold text-indigo-100">日</span>
                    </div>
                  </div>
                  
                  \${swappedHtml}
                  
                  <div class="grid grid-cols-3 gap-3">
                    <div class="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                      <p class="text-indigo-100 text-xs font-semibold mb-1">カレンダー差分</p>
                      <p class="text-white text-xl md:text-2xl font-bold">\${data.detail.calendarDiff}</p>
                    </div>
                    <div class="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                      <p class="text-indigo-100 text-xs font-semibold mb-1">平日</p>
                      <p class="text-white text-xl md:text-2xl font-bold">\${data.detail.weekdayDays}</p>
                    </div>
                    <div class="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                      <p class="text-indigo-100 text-xs font-semibold mb-1">週末</p>
                      <p class="text-white text-xl md:text-2xl font-bold">\${data.detail.weekendDays}</p>
                    </div>
                  </div>
                </div>
              \`;
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

function renderPatternCard(
  id: CountPattern,
  title: string,
  description: string,
  iconType: 'calendar' | 'clock' | 'trending' | 'arrow',
  current: CountPattern
) {
  const selected = current === id;
  const icons = {
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
    clock: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
    trending: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>',
    arrow: '<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>'
  };

  const checkmark = selected ? `
    <div data-check class="absolute top-3 right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
      <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  ` : '';

  return html`
    <button
      data-pattern="${id}"
      class="relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group ${
        selected
          ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-105'
          : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md'
      }"
    >
      <div class="flex items-start gap-4">
        <div data-icon class="p-3 rounded-xl transition-colors ${
          selected ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100'
        }">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            ${icons[iconType]}
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-lg mb-1 transition-colors ${
            selected ? 'text-indigo-900' : 'text-slate-800'
          }">
            ${title}
          </h3>
          <p class="text-sm text-slate-600">${description}</p>
        </div>
      </div>
      
    </button>
  `;
}

function renderResult(result: ReturnType<typeof calculateDiff> | null, error: string | null) {
  if (error) {
    return html`
      <div class="bg-red-50 rounded-3xl border-2 border-red-200 p-8 text-center">
        <p class="text-red-600 font-semibold">${error}</p>
      </div>
    `;
  }

  if (!result) {
    return html`
      <div class="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl border-2 border-slate-200 p-12 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-200 mb-4">
          <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <p class="text-slate-500 text-lg">日付を入力すると結果が表示されます</p>
      </div>
    `;
  }

  const patternLabels = {
    both: '開始日と終了日を含める',
    start: '開始日だけ含める（旅行の泊数）',
    end: '終了日だけ含める（締切を含める）',
    none: '両端を含まない（純粋な差分）'
  };

  return html`
    <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl border-2 border-indigo-400 p-8 shadow-2xl">
      <div class="text-center mb-6">
        <p class="text-indigo-100 text-sm font-semibold mb-2 uppercase tracking-wider">
          ${patternLabels[result.pattern] || '計算結果'}
        </p>
        <div class="flex items-center justify-center gap-3">
          <span class="text-6xl md:text-7xl font-black text-white">${result.days}</span>
          <span class="text-2xl md:text-3xl font-bold text-indigo-100">日</span>
        </div>
      </div>
      
      ${result.swapped ? html`
        <div class="mb-6 px-4 py-3 bg-amber-500 rounded-xl">
          <p class="text-white text-sm font-semibold text-center">
            ⚠️ 開始日と終了日を入れ替えて計算しました
          </p>
        </div>
      ` : ''}
      
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
          <p class="text-indigo-100 text-xs font-semibold mb-1">カレンダー差分</p>
          <p class="text-white text-xl md:text-2xl font-bold">${result.detail.calendarDiff}</p>
        </div>
        <div class="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
          <p class="text-indigo-100 text-xs font-semibold mb-1">平日</p>
          <p class="text-white text-xl md:text-2xl font-bold">${result.detail.weekdayDays}</p>
        </div>
        <div class="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
          <p class="text-indigo-100 text-xs font-semibold mb-1">週末</p>
          <p class="text-white text-xl md:text-2xl font-bold">${result.detail.weekendDays}</p>
        </div>
      </div>
    </div>
  `;
}

export default app