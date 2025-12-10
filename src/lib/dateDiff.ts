const MS_PER_DAY = 24 * 60 * 60 * 1000

export type CountPattern = 'both' | 'start' | 'end' | 'none'

export type DateDiffResult = {
  from: string
  to: string
  pattern: CountPattern
  includeStart: boolean
  includeEnd: boolean
  swapped: boolean
  days: number
  detail: {
    calendarDiff: number
    weekendDays: number
    weekdayDays: number
  }
}

export function parseDate(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null
  }
  return date
}

export function calculateDiff(
  fromStr: string,
  toStr: string,
  pattern: CountPattern = 'both'
): DateDiffResult {
  const fromDate = parseDate(fromStr)
  const toDate = parseDate(toStr)

  if (!fromDate || !toDate) {
    throw new Error('INVALID_DATE')
  }

  if (!['both', 'start', 'end', 'none'].includes(pattern)) {
    throw new Error('INVALID_PATTERN')
  }

  let start = fromDate
  let end = toDate
  let swapped = false

  if (start.getTime() > end.getTime()) {
    swapped = true
    start = toDate
    end = fromDate
  }

  const calendarDiff = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY)

  const includeStart = pattern === 'both' || pattern === 'start'
  const includeEnd = pattern === 'both' || pattern === 'end'

  const offset = pattern === 'both' ? 1 : pattern === 'none' ? -1 : 0
  let days = calendarDiff + offset
  if (days < 0) days = 0

  const iterStart = shiftDate(start, includeStart ? 0 : 1)
  const iterEnd = shiftDate(end, includeEnd ? 0 : -1)

  let weekendDays = 0
  let weekdayDays = 0

  if (iterStart.getTime() <= iterEnd.getTime()) {
    for (let cursor = new Date(iterStart); cursor.getTime() <= iterEnd.getTime(); cursor = shiftDate(cursor, 1)) {
      const weekday = cursor.getUTCDay()
      if (weekday === 0 || weekday === 6) {
        weekendDays += 1
      } else {
        weekdayDays += 1
      }
    }
  }

  return {
    from: fromStr,
    to: toStr,
    pattern,
    includeStart,
    includeEnd,
    swapped,
    days,
    detail: {
      calendarDiff,
      weekendDays,
      weekdayDays,
    },
  }
}

function shiftDate(date: Date, days: number): Date {
  const shifted = new Date(date)
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return shifted
}

export function formatDateJST(date: Date): string {
  const year = date.toLocaleString('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric' })
  const month = date.toLocaleString('en-CA', { timeZone: 'Asia/Tokyo', month: '2-digit' })
  const day = date.toLocaleString('en-CA', { timeZone: 'Asia/Tokyo', day: '2-digit' })
  return `${year}-${month}-${day}`
}
