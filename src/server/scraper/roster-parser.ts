export interface ParsedAthlete {
  name: string
  position?: string
  jerseyNumber?: string
  year?: string
  hometown?: string
  headshotUrl?: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

function clean(text: string): string {
  return decodeEntities(stripTags(text)).trim()
}

/** Extract the first src= from an <img> tag within a block of HTML */
function extractImgSrc(html: string, baseUrl: string): string | undefined {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (!m) return undefined
  const src = m[1]
  if (!src || src.includes('silhouette') || src.includes('placeholder') || src.includes('default')) {
    return undefined
  }
  if (src.startsWith('http')) return src
  if (src.startsWith('//')) return `https:${src}`
  if (src.startsWith('/')) {
    try {
      const u = new URL(baseUrl)
      return `${u.protocol}//${u.host}${src}`
    } catch {
      return undefined
    }
  }
  return undefined
}

const YEAR_VALUES = new Set(['fr', 'fr.', 'so', 'so.', 'jr', 'jr.', 'sr', 'sr.', 'freshman', 'sophomore', 'junior', 'senior', 'gr', 'gr.', 'graduate', 'rs', 'rs.'])

function looksLikeYear(text: string): boolean {
  return YEAR_VALUES.has(text.toLowerCase().replace(/[^a-z.]/g, ''))
}

function looksLikeNumber(text: string): boolean {
  return /^\d{1,3}$/.test(text.trim())
}

/** Normalise a year string to a consistent format */
function normaliseYear(text: string): string {
  const t = text.trim().toLowerCase()
  if (t.startsWith('fr')) return 'Freshman'
  if (t.startsWith('so')) return 'Sophomore'
  if (t.startsWith('jr')) return 'Junior'
  if (t.startsWith('sr')) return 'Senior'
  if (t.startsWith('gr') || t.startsWith('graduate')) return 'Graduate'
  return text.trim()
}

// ─── Strategy 1: Sidearm div/list layout ────────────────────────────────────

/**
 * Sidearm Sports uses either a <ul>/<li> or <div> layout for rosters.
 * Player containers have class patterns like:
 *   - sidearm-roster-player
 *   - s-person-card
 * Child elements use class patterns like:
 *   - sidearm-roster-player-name / s-person-details-name
 *   - sidearm-roster-player-number
 *   - sidearm-roster-player-position
 *   - sidearm-roster-player-academic-year
 *   - sidearm-roster-player-hometown
 */
function parseSidearmDivLayout(html: string, baseUrl: string): ParsedAthlete[] {
  const athletes: ParsedAthlete[] = []

  // Match each player container block
  const containerRe = /class="[^"]*(?:sidearm-roster-player|s-person-card)[^"]*"[^>]*>([\s\S]*?)(?=<(?:li|div)[^>]*class="[^"]*(?:sidearm-roster-player|s-person-card)[^"]*"|<\/(?:ul|ol|section|div class="sidearm-roster))/gi
  let match: RegExpExecArray | null

  while ((match = containerRe.exec(html)) !== null) {
    const block = match[1]
    const athlete = parseSidearmPlayerBlock(block, baseUrl)
    if (athlete) athletes.push(athlete)
  }

  return athletes
}

function parseSidearmPlayerBlock(block: string, baseUrl: string): ParsedAthlete | null {
  // Name: look for name-related class
  const nameRe = /class="[^"]*(?:sidearm-roster-player-name|s-person-details-name|player-name|roster-name)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|td|span|h3|h4|p)/i
  const nameMatch = block.match(nameRe)
  if (!nameMatch) {
    // Fallback: first <a> with an href
    const linkMatch = block.match(/<a[^>]+href="[^"]*\/sports\/[^"]*"[^>]*>([\s\S]*?)<\/a>/i)
      || block.match(/<a[^>]+>([\s\S]*?)<\/a>/i)
    if (!linkMatch) return null
    const name = clean(linkMatch[1])
    if (!name || name.length < 2) return null
    return buildFromBlock({ name, block, baseUrl })
  }

  const name = clean(nameMatch[1])
  if (!name || name.length < 2) return null
  return buildFromBlock({ name, block, baseUrl })
}

function buildFromBlock({ name, block, baseUrl }: { name: string; block: string; baseUrl: string }): ParsedAthlete {
  const get = (classPattern: string): string | undefined => {
    const re = new RegExp(`class="[^"]*${classPattern}[^"]*"[^>]*>([\\s\\S]*?)<\\/(?:div|td|span|p|li)`, 'i')
    const m = block.match(re)
    return m ? clean(m[1]) || undefined : undefined
  }

  const number = get('(?:number|jersey|player-number|uniform)')
  const position = get('(?:position|player-pos)')
  const year = get('(?:academic-year|eligibility|class|player-year)')
  const hometown = get('(?:hometown|city|player-hometown)')
  const headshotUrl = extractImgSrc(block, baseUrl)

  return {
    name,
    jerseyNumber: number && looksLikeNumber(number) ? number : undefined,
    position: position && !looksLikeNumber(position) && !looksLikeYear(position) ? position : undefined,
    year: year && looksLikeYear(year) ? normaliseYear(year) : undefined,
    hometown: hometown && !looksLikeYear(hometown) && !looksLikeNumber(hometown) ? hometown : undefined,
    headshotUrl,
  }
}

// ─── Strategy 2: HTML table layout ──────────────────────────────────────────

/**
 * Many schools render rosters as an HTML table.
 * We detect the header row to figure out which column is which,
 * then extract values from data rows.
 */
function parseTableLayout(html: string, baseUrl: string): ParsedAthlete[] {
  const athletes: ParsedAthlete[] = []

  // Find all <table> blocks
  const tableRe = /<table[\s\S]*?<\/table>/gi
  let tableMatch: RegExpExecArray | null

  while ((tableMatch = tableRe.exec(html)) !== null) {
    const tableHtml = tableMatch[0]
    const result = parseTable(tableHtml, baseUrl)
    if (result.length > 0) return result  // return first table with results
  }

  return athletes
}

function parseTable(tableHtml: string, baseUrl: string): ParsedAthlete[] {
  // Extract rows
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  const rows: string[] = []
  let rowMatch: RegExpExecArray | null
  while ((rowMatch = rowRe.exec(tableHtml)) !== null) {
    rows.push(rowMatch[1])
  }

  if (rows.length < 2) return []

  // Parse header row to map column indices
  const headerCells = extractCells(rows[0], true)
  const colMap = detectColumns(headerCells)

  if (colMap.name === -1) return []

  const athletes: ParsedAthlete[] = []

  for (let i = 1; i < rows.length; i++) {
    const cells = extractCells(rows[i], false)
    if (cells.length === 0) continue

    const nameRaw = cells[colMap.name]
    if (!nameRaw) continue

    // Try to pull name from a link inside the cell
    const linkMatch = nameRaw.match(/<a[^>]*>([\s\S]*?)<\/a>/i)
    const name = clean(linkMatch ? linkMatch[1] : nameRaw)
    if (!name || name.length < 2) continue

    const get = (idx: number): string | undefined => {
      if (idx === -1) return undefined
      const val = cells[idx]
      return val ? clean(val) || undefined : undefined
    }

    const headshotUrl = colMap.headshot !== -1
      ? extractImgSrc(cells[colMap.headshot] ?? '', baseUrl)
      : extractImgSrc(nameRaw, baseUrl)

    const rawYear = get(colMap.year)
    const rawPos = get(colMap.position)
    const rawNum = get(colMap.number)
    const rawHome = get(colMap.hometown)

    athletes.push({
      name,
      jerseyNumber: rawNum && looksLikeNumber(rawNum) ? rawNum : undefined,
      position: rawPos && !looksLikeNumber(rawPos) && !looksLikeYear(rawPos) ? rawPos : undefined,
      year: rawYear && looksLikeYear(rawYear) ? normaliseYear(rawYear) : undefined,
      hometown: rawHome && !looksLikeYear(rawHome) && !looksLikeNumber(rawHome) ? rawHome : undefined,
      headshotUrl,
    })
  }

  return athletes
}

function extractCells(rowHtml: string, isHeader: boolean): string[] {
  const tag = isHeader ? 'th' : 'td'
  // Accept both th and td in data rows
  const re = new RegExp(`<(?:td|th)[^>]*>([\\s\\S]*?)<\\/(?:td|th)>`, 'gi')
  const cells: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(rowHtml)) !== null) {
    cells.push(m[1])
  }
  return cells
}

interface ColMap {
  name: number
  number: number
  position: number
  year: number
  hometown: number
  headshot: number
}

function detectColumns(headers: string[]): ColMap {
  const colMap: ColMap = { name: -1, number: -1, position: -1, year: -1, hometown: -1, headshot: -1 }

  headers.forEach((h, i) => {
    const text = clean(h).toLowerCase()
    if (colMap.headshot === -1 && /photo|image|headshot|pic/.test(text)) colMap.headshot = i
    else if (colMap.number === -1 && /^#|no\.|num|jersey/.test(text)) colMap.number = i
    else if (colMap.name === -1 && /name|player|athlete/.test(text)) colMap.name = i
    else if (colMap.position === -1 && /pos/.test(text)) colMap.position = i
    else if (colMap.year === -1 && /yr|year|class|elig/.test(text)) colMap.year = i
    else if (colMap.hometown === -1 && /home|city|town|origin/.test(text)) colMap.hometown = i
  })

  // If no name column found by label, use first non-photo text column
  if (colMap.name === -1) {
    for (let i = 0; i < headers.length; i++) {
      if (i !== colMap.headshot && i !== colMap.number) { colMap.name = i; break }
    }
  }

  return colMap
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Parse a roster page HTML into a list of athletes.
 * Tries Sidearm div layout first, falls back to table layout.
 * Returns an empty array if nothing useful is found.
 */
export function parseRosterHtml(html: string, baseUrl: string): ParsedAthlete[] {
  // Strategy 1: Sidearm div/list layout
  const divResults = parseSidearmDivLayout(html, baseUrl)
  if (divResults.length > 0) return dedupeByName(divResults)

  // Strategy 2: HTML table
  const tableResults = parseTableLayout(html, baseUrl)
  if (tableResults.length > 0) return dedupeByName(tableResults)

  return []
}

function dedupeByName(athletes: ParsedAthlete[]): ParsedAthlete[] {
  const seen = new Set<string>()
  return athletes.filter(a => {
    const key = a.name.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
