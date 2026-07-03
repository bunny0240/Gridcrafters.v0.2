import type { CellState } from '@/components/ExcelSimulator'

type Grid = Record<string, CellState>
type FVal = number | string | boolean | null

// ── Error constants ────────────────────────────────────────────────────────────
const ERR = {
  DIV0: '#DIV/0!', VALUE: '#VALUE!', REF: '#REF!',
  NAME: '#NAME?',  NA: '#N/A',       NUM: '#NUM!', NULL: '#NULL!',
}
function isErr(v: unknown): v is string {
  return typeof v === 'string' && v.startsWith('#') && v.endsWith('!')
}
function firstErr(...vals: FVal[]): string | null {
  for (const v of vals) if (isErr(v)) return v as string
  return null
}

// ── Reference helpers ──────────────────────────────────────────────────────────
function colToN(col: string): number {
  let n = 0
  for (const c of col.toUpperCase()) n = n * 26 + c.charCodeAt(0) - 64
  return n
}
function nToCol(n: number): string {
  let s = ''
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26) }
  return s
}
function parseRef(ref: string) {
  const m = ref.replace(/\$/g, '').toUpperCase().match(/^([A-Z]{1,3})(\d+)$/)
  return m ? { col: m[1], row: parseInt(m[2]) } : null
}
export function expandRange(a: string, b: string): string[] {
  const ra = parseRef(a), rb = parseRef(b)
  if (!ra || !rb) return []
  const [c1, c2] = [colToN(ra.col), colToN(rb.col)]
  const [r1, r2] = [Math.min(ra.row, rb.row), Math.max(ra.row, rb.row)]
  const [cMin, cMax] = [Math.min(c1, c2), Math.max(c1, c2)]
  const out: string[] = []
  for (let r = r1; r <= r2; r++) for (let c = cMin; c <= cMax; c++) out.push(nToCol(c) + r)
  return out
}
function cellVal(id: string, g: Grid): FVal {
  const c = g[id]; if (!c) return null
  const raw = c.computed ?? c.rawValue ?? c.value ?? null
  if (raw === null || raw === '') return null
  const n = Number(raw)
  return isNaN(n) ? raw : n
}

// ── Range wrapper ──────────────────────────────────────────────────────────────
interface RangeRef { _r: true; ids: string[] }
type Arg = FVal | RangeRef
function rng(ids: string[]): RangeRef { return { _r: true, ids } }
function isRng(v: unknown): v is RangeRef { return typeof v === 'object' && v !== null && (v as RangeRef)._r === true }
function flatVals(a: Arg, g: Grid): FVal[] { return isRng(a) ? a.ids.map(id => cellVal(id, g)) : [a] }

// ── Tokenizer ──────────────────────────────────────────────────────────────────
type TT = 'NUM' | 'STR' | 'REF' | 'BOOL' | 'ERR' | 'ID' | 'OP' | 'LP' | 'RP' | 'COMMA' | 'COLON'
interface Tok { t: TT; v: string }

function tokenize(src: string): Tok[] {
  const toks: Tok[] = []
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (/\s/.test(ch)) { i++; continue }

    if (ch === '"') {
      let s = ''; i++
      while (i < src.length) {
        if (src[i] === '"') { if (src[i+1] === '"') { s += '"'; i += 2 } else { i++; break } }
        else s += src[i++]
      }
      toks.push({ t: 'STR', v: s }); continue
    }

    if (/\d/.test(ch) || (ch === '.' && /\d/.test(src[i+1] ?? ''))) {
      let s = ''
      while (i < src.length) {
        const c2 = src[i]
        if (/[eE]/.test(c2) && /[+\-]/.test(src[i+1] ?? '')) { s += c2 + src[i+1]; i += 2; continue }
        if (!/[\d.]/.test(c2) && !/[eE]/.test(c2)) break
        s += c2; i++
      }
      toks.push({ t: 'NUM', v: s }); continue
    }

    if (ch === '#') {
      let s = '#'; i++
      while (i < src.length && /[A-Z0-9/!]/.test(src[i])) s += src[i++]
      toks.push({ t: 'ERR', v: s }); continue
    }

    if (/[A-Za-z_$]/.test(ch)) {
      let s = ''
      while (i < src.length && /[A-Za-z0-9_$]/.test(src[i])) s += src[i++]
      const up = s.replace(/\$/g, '').toUpperCase()
      if (up === 'TRUE' || up === 'FALSE') toks.push({ t: 'BOOL', v: up })
      else if (/^[A-Z]{1,3}\d+$/.test(up)) toks.push({ t: 'REF', v: s })
      else toks.push({ t: 'ID', v: up })
      continue
    }

    if (ch === '<') {
      if (src[i+1] === '=') { toks.push({ t: 'OP', v: '<=' }); i += 2 }
      else if (src[i+1] === '>') { toks.push({ t: 'OP', v: '<>' }); i += 2 }
      else { toks.push({ t: 'OP', v: '<' }); i++ }
      continue
    }
    if (ch === '>') {
      toks.push({ t: 'OP', v: src[i+1] === '=' ? '>=' : '>' })
      i += src[i+1] === '=' ? 2 : 1; continue
    }
    if (ch === '(') { toks.push({ t: 'LP', v: '(' }); i++; continue }
    if (ch === ')') { toks.push({ t: 'RP', v: ')' }); i++; continue }
    if (ch === ',' || ch === ';') { toks.push({ t: 'COMMA', v: ',' }); i++; continue }
    if (ch === ':') { toks.push({ t: 'COLON', v: ':' }); i++; continue }
    toks.push({ t: 'OP', v: ch }); i++
  }

  // REF followed by LP → ID (function name)
  for (let j = 0; j < toks.length - 1; j++) {
    if (toks[j].t === 'REF' && toks[j+1].t === 'LP') toks[j] = { t: 'ID', v: toks[j].v.replace(/\$/g, '').toUpperCase() }
  }
  return toks
}

// ── Parser (recursive descent) ────────────────────────────────────────────────
class Parser {
  private pos = 0
  constructor(private toks: Tok[], private g: Grid, private self?: string) {}
  private peek() { return this.toks[this.pos] ?? null }
  private eat() { return this.toks[this.pos++] ?? { t: 'OP', v: '' } }

  parse(): Arg { return this.concat() }

  private concat(): Arg {
    let lhs = this.compare()
    while (this.peek()?.v === '&') {
      this.eat()
      const rhs = this.compare()
      const e = firstErr(lhs as FVal, rhs as FVal); if (e) { lhs = e; continue }
      lhs = toS(lhs) + toS(rhs)
    }
    return lhs
  }

  private compare(): Arg {
    let lhs = this.addSub()
    const CMP = new Set(['=', '<>', '<', '>', '<=', '>='])
    while (this.peek()?.t === 'OP' && CMP.has(this.peek()!.v)) {
      const op = this.eat().v
      const rhs = this.addSub()
      const e = firstErr(lhs as FVal, rhs as FVal); if (e) { lhs = e; continue }
      const [a, b] = [lhs, rhs]
      const cmp = (x: Arg, y: Arg) => {
        if (typeof x === 'string' && typeof y === 'string') return x.toLowerCase() < y.toLowerCase() ? -1 : x.toLowerCase() > y.toLowerCase() ? 1 : 0
        return Number(x ?? 0) < Number(y ?? 0) ? -1 : Number(x ?? 0) > Number(y ?? 0) ? 1 : 0
      }
      if (op === '=')  lhs = (typeof a === 'string' && typeof b === 'string') ? a.toLowerCase() === b.toLowerCase() : a === b
      else if (op === '<>') lhs = (typeof a === 'string' && typeof b === 'string') ? a.toLowerCase() !== b.toLowerCase() : a !== b
      else if (op === '<')  lhs = cmp(a, b) < 0
      else if (op === '>')  lhs = cmp(a, b) > 0
      else if (op === '<=') lhs = cmp(a, b) <= 0
      else if (op === '>=') lhs = cmp(a, b) >= 0
    }
    return lhs
  }

  private addSub(): Arg {
    let lhs = this.mulDiv()
    while (this.peek()?.t === 'OP' && (this.peek()!.v === '+' || this.peek()!.v === '-')) {
      const op = this.eat().v
      const rhs = this.mulDiv()
      const e = firstErr(lhs as FVal, rhs as FVal); if (e) { lhs = e; continue }
      const a = toN(lhs), b = toN(rhs)
      if (isErr(a)) { lhs = a; continue } if (isErr(b)) { lhs = b; continue }
      lhs = op === '+' ? a + b : a - b
    }
    return lhs
  }

  private mulDiv(): Arg {
    let lhs = this.unary()
    while (this.peek()?.t === 'OP' && (this.peek()!.v === '*' || this.peek()!.v === '/')) {
      const op = this.eat().v
      const rhs = this.unary()
      const e = firstErr(lhs as FVal, rhs as FVal); if (e) { lhs = e; continue }
      const a = toN(lhs), b = toN(rhs)
      if (isErr(a)) { lhs = a; continue } if (isErr(b)) { lhs = b; continue }
      if (op === '/' && b === 0) { lhs = ERR.DIV0; continue }
      lhs = op === '*' ? a * b : a / b
    }
    return lhs
  }

  private unary(): Arg {
    if (this.peek()?.v === '-') { this.eat(); const v = this.power(); const n = toN(v); return isErr(n) ? n : -n }
    if (this.peek()?.v === '+') { this.eat(); return this.power() }
    return this.power()
  }

  private power(): Arg {
    const base = this.postfix()
    if (this.peek()?.v === '^') {
      this.eat()
      const exp = this.unary()
      const a = toN(base), b = toN(exp)
      if (isErr(a)) return a; if (isErr(b)) return b
      return Math.pow(a, b)
    }
    return base
  }

  private postfix(): Arg {
    let v = this.primary()
    while (this.peek()?.v === '%') { this.eat(); const n = toN(v); if (isErr(n)) return n; v = n / 100 }
    return v
  }

  private primary(): Arg {
    const t = this.peek()
    if (!t) return 0

    if (t.t === 'NUM') { this.eat(); return parseFloat(t.v) }
    if (t.t === 'STR') { this.eat(); return t.v }
    if (t.t === 'BOOL') { this.eat(); return t.v === 'TRUE' }
    if (t.t === 'ERR') { this.eat(); return t.v }

    if (t.t === 'LP') {
      this.eat()
      const v = this.parse()
      if (this.peek()?.t === 'RP') this.eat()
      return v
    }

    if (t.t === 'REF') {
      this.eat()
      if (this.peek()?.t === 'COLON') {
        this.eat()
        const t2 = this.eat()
        return rng(expandRange(t.v, t2.v))
      }
      return cellVal(t.v, this.g)
    }

    if (t.t === 'ID') {
      this.eat()
      if (t.v === 'TRUE') return true
      if (t.v === 'FALSE') return false
      if (this.peek()?.t !== 'LP') return ERR.NAME
      this.eat() // LP

      const funcArgs: Arg[] = []
      while (this.peek()?.t !== 'RP' && this.peek() !== null) {
        // Check for range directly: REF COLON REF
        if (this.peek()?.t === 'REF') {
          const saved = this.pos
          const refTok = this.eat()
          if (this.peek()?.t === 'COLON') {
            this.eat()
            const refTok2 = this.eat()
            funcArgs.push(rng(expandRange(refTok.v, refTok2.v)))
          } else {
            this.pos = saved
            funcArgs.push(this.parse())
          }
        } else {
          funcArgs.push(this.parse())
        }
        if (this.peek()?.t === 'COMMA') this.eat(); else break
      }
      if (this.peek()?.t === 'RP') this.eat()

      return this.fn(t.v, funcArgs)
    }

    this.eat(); return null
  }

  // ── Function dispatcher ──────────────────────────────────────────────────────
  private fn(name: string, args: Arg[]): Arg {
    const noPropagate = new Set(['IFERROR','IFNA','ISERROR','ISERR','ISNA','ISBLANK','ISNUMBER','ISTEXT','ISLOGICAL','ISEVEN','ISODD','IF','IFS','AND','OR','NOT','SWITCH','TYPE','ERROR.TYPE'])
    if (!noPropagate.has(name)) {
      const e = firstErr(...args.filter(a => !isRng(a)) as FVal[])
      if (e) return e
    }

    // flatten all range args to numbers for aggregate functions
    const allVals = (): FVal[] => args.flatMap(a => isRng(a) ? a.ids.map(id => cellVal(id, this.g)) : [a as FVal])
    const nums = (): number[] => {
      const out: number[] = []
      for (const v of allVals()) {
        if (v === null || v === '') continue
        if (typeof v === 'boolean') { out.push(v ? 1 : 0); continue }
        const n = Number(v); if (!isNaN(n)) out.push(n)
      }
      return out
    }
    const scalarArg = (i: number): FVal => isRng(args[i]) ? (cellVal((args[i] as RangeRef).ids[0], this.g)) : (args[i] as FVal)

    switch (name) {
      // ── Aggregates ────────────────────────────────────────────────────────────
      case 'SUM': return nums().reduce((s, n) => s + n, 0)
      case 'PRODUCT': { const ns = nums(); return ns.length ? ns.reduce((s, n) => s * n, 1) : 0 }
      case 'MIN': { const ns = nums(); return ns.length ? Math.min(...ns) : 0 }
      case 'MAX': { const ns = nums(); return ns.length ? Math.max(...ns) : 0 }
      case 'AVERAGE': { const ns = nums(); return ns.length ? ns.reduce((s, n) => s + n, 0) / ns.length : ERR.DIV0 }
      case 'COUNT': return allVals().filter(v => v !== null && v !== '' && !isNaN(Number(v))).length
      case 'COUNTA': return allVals().filter(v => v !== null && v !== '').length
      case 'COUNTBLANK': return allVals().filter(v => v === null || v === '').length
      case 'MEDIAN': { const ns = nums().sort((a, b) => a - b); const m = Math.floor(ns.length / 2); return ns.length % 2 ? ns[m] : (ns[m-1] + ns[m]) / 2 }
      case 'LARGE': { const k = toN_(scalarArg(1)); const ns = nums().sort((a, b) => b - a); return ns[k-1] ?? ERR.NUM }
      case 'SMALL': { const k = toN_(scalarArg(1)); const ns = nums().sort((a, b) => a - b); return ns[k-1] ?? ERR.NUM }
      case 'STDEV': case 'STDEV.S': {
        const ns = nums(); if (ns.length < 2) return ERR.DIV0
        const mean = ns.reduce((s, n) => s + n, 0) / ns.length
        return Math.sqrt(ns.reduce((s, n) => s + (n - mean) ** 2, 0) / (ns.length - 1))
      }
      case 'STDEVP': case 'STDEV.P': {
        const ns = nums(); if (!ns.length) return ERR.DIV0
        const mean = ns.reduce((s, n) => s + n, 0) / ns.length
        return Math.sqrt(ns.reduce((s, n) => s + (n - mean) ** 2, 0) / ns.length)
      }
      case 'VAR': case 'VAR.S': {
        const ns = nums(); if (ns.length < 2) return ERR.DIV0
        const mean = ns.reduce((s, n) => s + n, 0) / ns.length
        return ns.reduce((s, n) => s + (n - mean) ** 2, 0) / (ns.length - 1)
      }
      case 'VARP': case 'VAR.P': {
        const ns = nums(); if (!ns.length) return ERR.DIV0
        const mean = ns.reduce((s, n) => s + n, 0) / ns.length
        return ns.reduce((s, n) => s + (n - mean) ** 2, 0) / ns.length
      }

      // ── Conditional aggregates ────────────────────────────────────────────────
      case 'SUMIF': {
        const rngCells = isRng(args[0]) ? (args[0] as RangeRef).ids : []
        const crit = scalarArg(1)
        const sumCells = isRng(args[2]) ? (args[2] as RangeRef).ids : rngCells
        let total = 0
        rngCells.forEach((id, i) => { if (matchCrit(cellVal(id, this.g), crit)) total += toN_(cellVal(sumCells[i] ?? id, this.g)) })
        return total
      }
      case 'SUMIFS': {
        const sumCells = isRng(args[0]) ? (args[0] as RangeRef).ids : []
        let total = 0
        sumCells.forEach((sid, i) => {
          for (let j = 1; j < args.length - 1; j += 2) {
            const rngArr = isRng(args[j]) ? (args[j] as RangeRef).ids : []
            const crit = scalarArg(j + 1)
            if (!matchCrit(cellVal(rngArr[i] ?? '', this.g), crit)) return
          }
          total += toN_(cellVal(sid, this.g))
        })
        return total
      }
      case 'COUNTIF': {
        const rngCells = isRng(args[0]) ? (args[0] as RangeRef).ids : []
        const crit = scalarArg(1)
        return rngCells.filter(id => matchCrit(cellVal(id, this.g), crit)).length
      }
      case 'COUNTIFS': {
        const rngCells = isRng(args[0]) ? (args[0] as RangeRef).ids : []
        return rngCells.filter((_, i) => {
          for (let j = 0; j < args.length - 1; j += 2) {
            const rArr = isRng(args[j]) ? (args[j] as RangeRef).ids : []
            const crit = scalarArg(j + 1)
            if (!matchCrit(cellVal(rArr[i] ?? '', this.g), crit)) return false
          }
          return true
        }).length
      }
      case 'AVERAGEIF': {
        const rngCells = isRng(args[0]) ? (args[0] as RangeRef).ids : []
        const crit = scalarArg(1)
        const avgCells = isRng(args[2]) ? (args[2] as RangeRef).ids : rngCells
        const vals: number[] = []
        rngCells.forEach((id, i) => { if (matchCrit(cellVal(id, this.g), crit)) { const n = toN_(cellVal(avgCells[i] ?? id, this.g)); if (!isNaN(n)) vals.push(n) } })
        return vals.length ? vals.reduce((s, n) => s + n, 0) / vals.length : ERR.DIV0
      }

      // ── Math ──────────────────────────────────────────────────────────────────
      case 'ABS': return Math.abs(toN_(scalarArg(0)))
      case 'SQRT': { const n = toN_(scalarArg(0)); return n < 0 ? ERR.NUM : Math.sqrt(n) }
      case 'POWER': return Math.pow(toN_(scalarArg(0)), toN_(scalarArg(1)))
      case 'MOD': { const b = toN_(scalarArg(1)); if (b === 0) return ERR.DIV0; const a = toN_(scalarArg(0)); return a - b * Math.floor(a / b) }
      case 'INT': return Math.floor(toN_(scalarArg(0)))
      case 'TRUNC': { const n = toN_(scalarArg(0)), d = args[1] !== undefined ? toN_(scalarArg(1)) : 0; const m = 10 ** d; return Math.trunc(n * m) / m }
      case 'ROUND': return roundTo(toN_(scalarArg(0)), toN_(scalarArg(1)))
      case 'ROUNDUP': { const n = toN_(scalarArg(0)), d = toN_(scalarArg(1)), m = 10 ** d; return n >= 0 ? Math.ceil(n * m) / m : Math.floor(n * m) / m }
      case 'ROUNDDOWN': { const n = toN_(scalarArg(0)), d = toN_(scalarArg(1)), m = 10 ** d; return n >= 0 ? Math.floor(n * m) / m : Math.ceil(n * m) / m }
      case 'CEILING': case 'CEILING.MATH': { const n = toN_(scalarArg(0)), s = args[1] !== undefined ? toN_(scalarArg(1)) : 1; return s === 0 ? 0 : Math.ceil(n / s) * s }
      case 'FLOOR': case 'FLOOR.MATH': { const n = toN_(scalarArg(0)), s = args[1] !== undefined ? toN_(scalarArg(1)) : 1; return s === 0 ? 0 : Math.floor(n / s) * s }
      case 'MROUND': { const n = toN_(scalarArg(0)), m = toN_(scalarArg(1)); return m === 0 ? 0 : Math.round(n / m) * m }
      case 'SIGN': { const n = toN_(scalarArg(0)); return n > 0 ? 1 : n < 0 ? -1 : 0 }
      case 'EVEN': { const n = toN_(scalarArg(0)); return n >= 0 ? Math.ceil(n / 2) * 2 : Math.floor(n / 2) * 2 }
      case 'ODD': { const n = toN_(scalarArg(0)); if (n === 0) return 1; const a = Math.abs(n); const r = Math.ceil(a); return (r % 2 === 0 ? r + 1 : r) * (n < 0 ? -1 : 1) }
      case 'LN': { const n = toN_(scalarArg(0)); return n <= 0 ? ERR.NUM : Math.log(n) }
      case 'LOG': { const n = toN_(scalarArg(0)), b = args[1] !== undefined ? toN_(scalarArg(1)) : 10; return (n <= 0 || b <= 0 || b === 1) ? ERR.NUM : Math.log(n) / Math.log(b) }
      case 'LOG10': { const n = toN_(scalarArg(0)); return n <= 0 ? ERR.NUM : Math.log10(n) }
      case 'EXP': return Math.exp(toN_(scalarArg(0)))
      case 'FACT': { const n = Math.floor(toN_(scalarArg(0))); if (n < 0) return ERR.NUM; let f = 1; for (let i = 2; i <= n; i++) f *= i; return f }
      case 'COMBIN': { const n = Math.floor(toN_(scalarArg(0))), k = Math.floor(toN_(scalarArg(1))); if (k > n || k < 0) return ERR.NUM; return fact(n) / (fact(k) * fact(n - k)) }
      case 'PERMUT': { const n = Math.floor(toN_(scalarArg(0))), k = Math.floor(toN_(scalarArg(1))); if (k > n || k < 0) return ERR.NUM; return fact(n) / fact(n - k) }
      case 'GCD': { const ns = nums().map(n => Math.abs(Math.floor(n))); return ns.reduce((a, b) => gcd(a, b)) }
      case 'LCM': { const ns = nums().map(n => Math.abs(Math.floor(n))); return ns.reduce((a, b) => a * b / gcd(a, b)) }
      case 'RAND': return Math.random()
      case 'RANDBETWEEN': { const lo = Math.ceil(toN_(scalarArg(0))), hi = Math.floor(toN_(scalarArg(1))); return Math.floor(Math.random() * (hi - lo + 1)) + lo }
      case 'PI': return Math.PI
      case 'SIN': return Math.sin(toN_(scalarArg(0)))
      case 'COS': return Math.cos(toN_(scalarArg(0)))
      case 'TAN': return Math.tan(toN_(scalarArg(0)))
      case 'ASIN': return Math.asin(toN_(scalarArg(0)))
      case 'ACOS': return Math.acos(toN_(scalarArg(0)))
      case 'ATAN': return Math.atan(toN_(scalarArg(0)))
      case 'ATAN2': return Math.atan2(toN_(scalarArg(0)), toN_(scalarArg(1)))
      case 'DEGREES': return toN_(scalarArg(0)) * (180 / Math.PI)
      case 'RADIANS': return toN_(scalarArg(0)) * (Math.PI / 180)
      case 'SUMPRODUCT': {
        const arrays = args.map(a => isRng(a) ? a.ids.map(id => cellVal(id, this.g)) : [a as FVal])
        const len = arrays[0]?.length ?? 0
        let total = 0
        for (let i = 0; i < len; i++) {
          let prod = 1
          for (const arr of arrays) prod *= toN_(arr[i] ?? 0)
          total += prod
        }
        return total
      }
      case 'QUOTIENT': { const b = toN_(scalarArg(1)); if (b === 0) return ERR.DIV0; return Math.trunc(toN_(scalarArg(0)) / b) }

      // ── Logical ───────────────────────────────────────────────────────────────
      case 'IF': { const c = scalarArg(0); const t = isTruthy(c); return t ? (args[1] !== undefined ? (isRng(args[1]) ? cellVal((args[1] as RangeRef).ids[0], this.g) : args[1] as FVal) : true) : (args[2] !== undefined ? (isRng(args[2]) ? cellVal((args[2] as RangeRef).ids[0], this.g) : args[2] as FVal) : false) }
      case 'IFS': {
        for (let i = 0; i < args.length - 1; i += 2) if (isTruthy(scalarArg(i))) return scalarArg(i + 1)
        return ERR.NA
      }
      case 'SWITCH': {
        const expr = scalarArg(0)
        for (let i = 1; i < args.length - 1; i += 2) { const v = scalarArg(i); if (v === expr || String(v).toLowerCase() === String(expr).toLowerCase()) return scalarArg(i + 1) }
        if (args.length % 2 === 0) return scalarArg(args.length - 1)
        return ERR.NA
      }
      case 'AND': return args.every(a => isTruthy(isRng(a) ? cellVal((a as RangeRef).ids[0], this.g) : a as FVal))
      case 'OR': return args.some(a => isTruthy(isRng(a) ? cellVal((a as RangeRef).ids[0], this.g) : a as FVal))
      case 'NOT': return !isTruthy(scalarArg(0))
      case 'IFERROR': { const v = scalarArg(0); return isErr(v) ? scalarArg(1) : v }
      case 'IFNA': { const v = scalarArg(0); return v === ERR.NA ? scalarArg(1) : v }
      case 'ISERROR': return isErr(scalarArg(0))
      case 'ISERR': { const v = scalarArg(0); return isErr(v) && v !== ERR.NA }
      case 'ISNA': return scalarArg(0) === ERR.NA
      case 'ISBLANK': { const v = scalarArg(0); return v === null || v === '' }
      case 'ISNUMBER': { const v = scalarArg(0); return typeof v === 'number' || (!isNaN(Number(v)) && v !== null && v !== '' && typeof v !== 'boolean') }
      case 'ISTEXT': { const v = scalarArg(0); return typeof v === 'string' && !isErr(v) }
      case 'ISLOGICAL': return typeof scalarArg(0) === 'boolean'
      case 'ISEVEN': return Math.floor(toN_(scalarArg(0))) % 2 === 0
      case 'ISODD': return Math.abs(Math.floor(toN_(scalarArg(0))) % 2) === 1
      case 'TRUE': return true
      case 'FALSE': return false
      case 'NA': return ERR.NA

      // ── Lookup ────────────────────────────────────────────────────────────────
      case 'VLOOKUP': {
        const lookup = scalarArg(0)
        const table = isRng(args[1]) ? (args[1] as RangeRef).ids : []
        const colIdx = toN_(scalarArg(2))
        const exact = scalarArg(3) === false || scalarArg(3) === 0

        // Build rows from table cell IDs
        const rowMap: Map<number, { col: number; id: string }[]> = new Map()
        for (const id of table) {
          const r = parseRef(id); if (!r) continue
          if (!rowMap.has(r.row)) rowMap.set(r.row, [])
          rowMap.get(r.row)!.push({ col: colToN(r.col), id })
        }
        const sortedRows = [...rowMap.entries()].sort(([a], [b]) => a - b)
        if (!sortedRows.length) return ERR.NA

        const minCol = Math.min(...sortedRows[0][1].map(c => c.col))

        for (const [, cells] of sortedRows) {
          const sortedCells = cells.sort((a, b) => a.col - b.col)
          const firstCell = sortedCells.find(c => c.col === minCol)
          if (!firstCell) continue
          const fv = cellVal(firstCell.id, this.g)
          const hit = exact
            ? (typeof fv === 'string' && typeof lookup === 'string' ? fv.toLowerCase() === String(lookup).toLowerCase() : fv == lookup)
            : (typeof fv === 'number' ? fv <= Number(lookup) : String(fv ?? '').toLowerCase() <= String(lookup ?? '').toLowerCase())
          if (hit) {
            const targetColN = minCol + colIdx - 1
            const targetCell = sortedCells.find(c => c.col === targetColN)
            if (targetCell) return cellVal(targetCell.id, this.g) ?? ERR.NA
          }
        }
        return ERR.NA
      }
      case 'HLOOKUP': {
        const lookup = scalarArg(0)
        const table = isRng(args[1]) ? (args[1] as RangeRef).ids : []
        const rowIdx = toN_(scalarArg(2))
        const colMap: Map<number, { row: number; id: string }[]> = new Map()
        for (const id of table) {
          const r = parseRef(id); if (!r) continue
          const cn = colToN(r.col)
          if (!colMap.has(cn)) colMap.set(cn, [])
          colMap.get(cn)!.push({ row: r.row, id })
        }
        const sortedCols = [...colMap.entries()].sort(([a], [b]) => a - b)
        if (!sortedCols.length) return ERR.NA
        const minRow = Math.min(...sortedCols[0][1].map(c => c.row))
        for (const [, cells] of sortedCols) {
          const firstCell = cells.find(c => c.row === minRow)
          if (!firstCell) continue
          const fv = cellVal(firstCell.id, this.g)
          if (typeof fv === 'string' && typeof lookup === 'string' ? fv.toLowerCase() === String(lookup).toLowerCase() : fv == lookup) {
            const targetRowN = minRow + rowIdx - 1
            const tc = cells.find(c => c.row === targetRowN)
            if (tc) return cellVal(tc.id, this.g) ?? ERR.NA
          }
        }
        return ERR.NA
      }
      case 'MATCH': {
        const lookup = scalarArg(0)
        const arr = isRng(args[1]) ? (args[1] as RangeRef).ids : []
        const mt = args[2] !== undefined ? toN_(scalarArg(2)) : 1
        for (let i = 0; i < arr.length; i++) {
          const v = cellVal(arr[i], this.g)
          if (mt === 0) {
            if (typeof v === 'string' && typeof lookup === 'string' ? v.toLowerCase() === String(lookup).toLowerCase() : v == lookup) return i + 1
            if (typeof lookup === 'string' && typeof v === 'string' && /[*?]/.test(String(lookup))) {
              const pat = new RegExp('^' + String(lookup).replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i')
              if (pat.test(v)) return i + 1
            }
          } else if (mt === 1 && typeof v === 'number' && v > Number(lookup)) return i
          else if (mt === -1 && typeof v === 'number' && v < Number(lookup)) return i
        }
        return mt !== 0 ? arr.length : ERR.NA
      }
      case 'INDEX': {
        const tableArr = isRng(args[0]) ? (args[0] as RangeRef).ids : []
        const rowN = args[1] !== undefined ? toN_(scalarArg(1)) : 0
        const colN = args[2] !== undefined ? toN_(scalarArg(2)) : 1
        if (!tableArr.length) return ERR.REF
        const refs = tableArr.map(id => parseRef(id)).filter(Boolean) as ReturnType<typeof parseRef>[]
        const minRow = Math.min(...refs.map(r => r!.row))
        const minCol = Math.min(...refs.map(r => colToN(r!.col)))
        const targetId = nToCol(minCol + colN - 1) + (minRow + rowN - 1)
        return cellVal(targetId, this.g) ?? null
      }
      case 'XLOOKUP': {
        const lookup = scalarArg(0)
        const la = isRng(args[1]) ? (args[1] as RangeRef).ids : []
        const ra = isRng(args[2]) ? (args[2] as RangeRef).ids : []
        const ifNotFound = args[3] !== undefined ? scalarArg(3) : ERR.NA
        for (let i = 0; i < la.length; i++) {
          const v = cellVal(la[i], this.g)
          const hit = typeof v === 'string' && typeof lookup === 'string' ? v.toLowerCase() === String(lookup).toLowerCase() : v == lookup
          if (hit) return cellVal(ra[i] ?? '', this.g) ?? null
        }
        return ifNotFound
      }
      case 'LOOKUP': {
        const lookup = scalarArg(0)
        const la = isRng(args[1]) ? (args[1] as RangeRef).ids : []
        const ra = isRng(args[2]) ? (args[2] as RangeRef).ids : la
        let last = -1
        for (let i = 0; i < la.length; i++) {
          const v = cellVal(la[i], this.g)
          if (Number(v) <= Number(lookup)) last = i; else break
        }
        return last >= 0 ? cellVal(ra[last], this.g) ?? ERR.NA : ERR.NA
      }
      case 'CHOOSE': { const idx = toN_(scalarArg(0)) - 1; return idx >= 0 && idx < args.length - 1 ? scalarArg(idx + 1) : ERR.VALUE }
      case 'OFFSET': {
        const ref = isRng(args[0]) ? (args[0] as RangeRef).ids[0] : String(args[0] ?? '')
        const r = parseRef(ref); if (!r) return ERR.REF
        const nr = r.row + toN_(scalarArg(1)), nc = colToN(r.col) + toN_(scalarArg(2))
        return nr < 1 || nc < 1 ? ERR.REF : cellVal(nToCol(nc) + nr, this.g) ?? null
      }
      case 'INDIRECT': return cellVal(String(scalarArg(0) ?? '').toUpperCase().replace(/\$/g, ''), this.g) ?? null
      case 'ADDRESS': {
        const row = toN_(scalarArg(0)), col = toN_(scalarArg(1)), t = args[2] !== undefined ? toN_(scalarArg(2)) : 1
        const c = nToCol(col)
        if (t === 1) return `$${c}$${row}`; if (t === 2) return `${c}$${row}`; if (t === 3) return `$${c}${row}`; return `${c}${row}`
      }
      case 'ROW': {
        if (!args.length) return this.self ? (parseRef(this.self)?.row ?? 1) : 1
        const ref = isRng(args[0]) ? (args[0] as RangeRef).ids[0] : String(args[0] ?? '')
        return parseRef(ref)?.row ?? ERR.VALUE
      }
      case 'COLUMN': {
        if (!args.length) return this.self ? colToN(parseRef(this.self)?.col ?? 'A') : 1
        const ref = isRng(args[0]) ? (args[0] as RangeRef).ids[0] : String(args[0] ?? '')
        const r = parseRef(ref); return r ? colToN(r.col) : ERR.VALUE
      }
      case 'ROWS': { const a = isRng(args[0]) ? (args[0] as RangeRef).ids : []; const refs = a.map(parseRef).filter(Boolean) as any[]; if (!refs.length) return 0; return Math.max(...refs.map((r: any) => r.row)) - Math.min(...refs.map((r: any) => r.row)) + 1 }
      case 'COLUMNS': { const a = isRng(args[0]) ? (args[0] as RangeRef).ids : []; const refs = a.map(parseRef).filter(Boolean) as any[]; if (!refs.length) return 0; return Math.max(...refs.map((r: any) => colToN(r.col))) - Math.min(...refs.map((r: any) => colToN(r.col))) + 1 }

      // ── Text ──────────────────────────────────────────────────────────────────
      case 'LEN': return String(scalarArg(0) ?? '').length
      case 'UPPER': return String(scalarArg(0) ?? '').toUpperCase()
      case 'LOWER': return String(scalarArg(0) ?? '').toLowerCase()
      case 'PROPER': { const s = String(scalarArg(0) ?? ''); return s.replace(/(\w)(\w*)/g, (_, h, t) => h.toUpperCase() + t.toLowerCase()) }
      case 'TRIM': return String(scalarArg(0) ?? '').trim().replace(/\s+/g, ' ')
      case 'LEFT': { const s = String(scalarArg(0) ?? ''); return s.slice(0, args[1] !== undefined ? toN_(scalarArg(1)) : 1) }
      case 'RIGHT': { const s = String(scalarArg(0) ?? ''); const n = args[1] !== undefined ? toN_(scalarArg(1)) : 1; return s.slice(Math.max(0, s.length - n)) }
      case 'MID': { const s = String(scalarArg(0) ?? ''), st = toN_(scalarArg(1)) - 1, n = toN_(scalarArg(2)); return s.slice(st, st + n) }
      case 'FIND': { const f = String(scalarArg(0) ?? ''), w = String(scalarArg(1) ?? ''), st = args[2] !== undefined ? toN_(scalarArg(2)) - 1 : 0; const idx = w.indexOf(f, st); return idx === -1 ? ERR.VALUE : idx + 1 }
      case 'SEARCH': { const f = String(scalarArg(0) ?? '').toLowerCase(), w = String(scalarArg(1) ?? '').toLowerCase(), st = args[2] !== undefined ? toN_(scalarArg(2)) - 1 : 0; const idx = w.indexOf(f, st); return idx === -1 ? ERR.VALUE : idx + 1 }
      case 'SUBSTITUTE': {
        const s = String(scalarArg(0) ?? ''), old = String(scalarArg(1) ?? ''), nw = String(scalarArg(2) ?? '')
        if (args[3] !== undefined) {
          const inst = toN_(scalarArg(3)); let count = 0, res = s, pos = 0
          while ((pos = res.indexOf(old, pos)) !== -1) { count++; if (count === inst) { res = res.slice(0, pos) + nw + res.slice(pos + old.length); break } pos += old.length }
          return res
        }
        return s.split(old).join(nw)
      }
      case 'REPLACE': { const s = String(scalarArg(0) ?? ''), st = toN_(scalarArg(1)) - 1, n = toN_(scalarArg(2)), nw = String(scalarArg(3) ?? ''); return s.slice(0, st) + nw + s.slice(st + n) }
      case 'REPT': return String(scalarArg(0) ?? '').repeat(Math.max(0, toN_(scalarArg(1))))
      case 'CONCATENATE': case 'CONCAT': return args.map(a => isRng(a) ? a.ids.map(id => cellVal(id, this.g) ?? '').join('') : String(a as FVal ?? '')).join('')
      case 'TEXTJOIN': {
        const delim = String(scalarArg(0) ?? ''), ignore = isTruthy(scalarArg(1))
        const vals = args.slice(2).flatMap(a => isRng(a) ? a.ids.map(id => String(cellVal(id, this.g) ?? '')) : [String(a as FVal ?? '')])
        return ignore ? vals.filter(Boolean).join(delim) : vals.join(delim)
      }
      case 'TEXT': return fmtText(scalarArg(0), String(scalarArg(1) ?? ''))
      case 'VALUE': case 'NUMBERVALUE': { const s = String(scalarArg(0) ?? '').replace(/[$,]/g, ''); const n = parseFloat(s); return isNaN(n) ? ERR.VALUE : n }
      case 'FIXED': { const n = toN_(scalarArg(0)), d = args[1] !== undefined ? toN_(scalarArg(1)) : 2, nc = args[2] === true; const s = n.toFixed(d); return nc ? s : Number(s).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) }
      case 'DOLLAR': { const n = toN_(scalarArg(0)), d = args[1] !== undefined ? toN_(scalarArg(1)) : 2; return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(n) }
      case 'CHAR': return String.fromCharCode(toN_(scalarArg(0)))
      case 'CODE': { const s = String(scalarArg(0) ?? ''); return s.length ? s.charCodeAt(0) : ERR.VALUE }
      case 'EXACT': return String(scalarArg(0) ?? '') === String(scalarArg(1) ?? '')
      case 'CLEAN': return String(scalarArg(0) ?? '').replace(/[\x00-\x1F\x7F]/g, '')
      case 'T': { const v = scalarArg(0); return typeof v === 'string' ? v : '' }
      case 'N': { const v = scalarArg(0); return typeof v === 'number' ? v : typeof v === 'boolean' ? (v ? 1 : 0) : 0 }

      // ── Date ──────────────────────────────────────────────────────────────────
      case 'TODAY': return fmtDate(new Date())
      case 'NOW': { const d = new Date(); return `${fmtDate(d)} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}` }
      case 'DATE': { const d = new Date(toN_(scalarArg(0)), toN_(scalarArg(1)) - 1, toN_(scalarArg(2))); return fmtDate(d) }
      case 'YEAR': { const d = pDate(scalarArg(0)); return d ? d.getFullYear() : ERR.VALUE }
      case 'MONTH': { const d = pDate(scalarArg(0)); return d ? d.getMonth() + 1 : ERR.VALUE }
      case 'DAY': { const d = pDate(scalarArg(0)); return d ? d.getDate() : ERR.VALUE }
      case 'HOUR': { const d = pDate(scalarArg(0)); return d ? d.getHours() : ERR.VALUE }
      case 'MINUTE': { const d = pDate(scalarArg(0)); return d ? d.getMinutes() : ERR.VALUE }
      case 'SECOND': { const d = pDate(scalarArg(0)); return d ? d.getSeconds() : ERR.VALUE }
      case 'DAYS': { const d1 = pDate(scalarArg(0)), d2 = pDate(scalarArg(1)); if (!d1 || !d2) return ERR.VALUE; return Math.floor((d1.getTime() - d2.getTime()) / 86400000) }
      case 'WEEKDAY': { const d = pDate(scalarArg(0)); if (!d) return ERR.VALUE; const day = d.getDay(); const t = args[1] !== undefined ? toN_(scalarArg(1)) : 1; return t === 2 ? (day === 0 ? 7 : day) : day + 1 }
      case 'EDATE': { const d = pDate(scalarArg(0)); if (!d) return ERR.VALUE; const nd = new Date(d); nd.setMonth(nd.getMonth() + toN_(scalarArg(1))); return fmtDate(nd) }
      case 'EOMONTH': { const d = pDate(scalarArg(0)); if (!d) return ERR.VALUE; return fmtDate(new Date(d.getFullYear(), d.getMonth() + toN_(scalarArg(1)) + 1, 0)) }
      case 'DATEDIF': {
        const d1 = pDate(scalarArg(0)), d2 = pDate(scalarArg(1)); if (!d1 || !d2) return ERR.VALUE
        const u = String(scalarArg(2)).toUpperCase()
        if (u === 'Y') return d2.getFullYear() - d1.getFullYear() - ((d2.getMonth() < d1.getMonth() || (d2.getMonth() === d1.getMonth() && d2.getDate() < d1.getDate())) ? 1 : 0)
        if (u === 'M') return (d2.getFullYear() - d1.getFullYear()) * 12 + d2.getMonth() - d1.getMonth()
        if (u === 'D') return Math.floor((d2.getTime() - d1.getTime()) / 86400000)
        return ERR.VALUE
      }
      case 'NETWORKDAYS': {
        const d1 = pDate(scalarArg(0)), d2 = pDate(scalarArg(1)); if (!d1 || !d2) return ERR.VALUE
        let count = 0, cur = new Date(d1)
        while (cur <= d2) { const dy = cur.getDay(); if (dy !== 0 && dy !== 6) count++; cur.setDate(cur.getDate() + 1) }
        return count
      }

      // ── Info ──────────────────────────────────────────────────────────────────
      case 'TYPE': { const v = scalarArg(0); if (typeof v === 'number') return 1; if (typeof v === 'string') return 2; if (typeof v === 'boolean') return 4; if (isErr(v)) return 16; return 1 }
      case 'ERROR.TYPE': { const em: Record<string,number> = {'#NULL!':1,'#DIV/0!':2,'#VALUE!':3,'#REF!':4,'#NAME?':5,'#NUM!':6,'#N/A':7}; return isErr(scalarArg(0)) ? em[String(scalarArg(0))] ?? 8 : ERR.NA }

      // ── Statistical ───────────────────────────────────────────────────────────
      case 'PERCENTILE': case 'PERCENTILE.INC': {
        const arr = nums().sort((a, b) => a - b), k = toN_(scalarArg(1))
        if (k < 0 || k > 1) return ERR.NUM
        const idx = k * (arr.length - 1), lo = Math.floor(idx), hi = Math.ceil(idx)
        return arr[lo] + (arr[hi] - arr[lo]) * (idx - lo)
      }
      case 'QUARTILE': case 'QUARTILE.INC': {
        const arr = nums().sort((a, b) => a - b), q = toN_(scalarArg(1)) / 4
        const idx = q * (arr.length - 1), lo = Math.floor(idx), hi = Math.ceil(idx)
        return arr[lo] + (arr[hi] - arr[lo]) * (idx - lo)
      }
      case 'RANK': case 'RANK.EQ': {
        const n = toN_(scalarArg(0)), arr = isRng(args[1]) ? (args[1] as RangeRef).ids.map(id => toN_(cellVal(id, this.g))) : []
        const order = args[2] !== undefined ? toN_(scalarArg(2)) : 0
        const sorted = [...arr].sort((a, b) => order ? a - b : b - a)
        return sorted.indexOf(n) + 1
      }

      default: return ERR.NAME
    }
  }
}

// ── Utility helpers ────────────────────────────────────────────────────────────
function toN(v: Arg): number | string {
  if (isRng(v)) { const first = v.ids[0]; return 0 } // shouldn't happen in arithmetic
  if (v === null || v === '') return 0
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v === 'number') return v
  if (isErr(v)) return v
  const n = Number(v); return isNaN(n) ? ERR.VALUE : n
}
function toN_(v: Arg): number {
  const r = toN(v as FVal)
  if (isErr(r)) throw r
  if (typeof r === 'string') return NaN
  return r
}
function toS(v: Arg): string {
  if (isRng(v)) return ''
  if (v === null) return ''
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  return String(v)
}
function isTruthy(v: FVal): boolean {
  if (v === null || v === '' || v === 0 || v === false) return false
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') return v !== '' && v.toLowerCase() !== 'false' && v !== '0'
  return true
}
function roundTo(n: number, d: number): number { const m = 10 ** d; return Math.round(n * m) / m }
function fact(n: number): number { if (n <= 1) return 1; let f = 1; for (let i = 2; i <= n; i++) f *= i; return f }
function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b) }
function fmtDate(d: Date): string { const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return `${d.getDate()}-${mo[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}` }
function pDate(v: FVal): Date | null {
  if (!v) return null
  const d = new Date(String(v))
  if (!isNaN(d.getTime())) return d
  const n = Number(v); if (!isNaN(n)) return new Date(1900, 0, n - 1)
  return null
}
function fmtText(v: FVal, fmt: string): string {
  const n = Number(v)
  if (!isNaN(n)) {
    if (fmt.includes('$') || fmt.match(/^"?\$"?/)) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
    if (fmt.includes('%')) return (n * 100).toFixed(0) + '%'
    if (fmt.match(/#,##0/)) return new Intl.NumberFormat('en-US', { minimumFractionDigits: fmt.split('.')[1]?.length ?? 0 }).format(n)
    if (fmt.match(/0+\.?0*/)) return n.toFixed(fmt.split('.')[1]?.length ?? 0)
    if (fmt.toLowerCase().includes('mmm')) return fmtDate(pDate(v) ?? new Date())
  }
  return String(v ?? '')
}
function matchCrit(value: FVal, crit: FVal): boolean {
  if (crit === null) return value === null || value === ''
  const s = String(crit)
  const m = s.match(/^([<>]=?|<>)(.*)$/)
  if (m) {
    const [, op, rest] = m, ref = isNaN(Number(rest)) ? rest : Number(rest)
    const val = typeof value === 'number' ? value : isNaN(Number(value)) ? String(value ?? '') : Number(value)
    if (op === '>')  return Number(val) > Number(ref)
    if (op === '>=') return Number(val) >= Number(ref)
    if (op === '<')  return Number(val) < Number(ref)
    if (op === '<=') return Number(val) <= Number(ref)
    if (op === '<>') return String(val).toLowerCase() !== String(ref).toLowerCase()
  }
  if (/[*?]/.test(s)) return new RegExp('^' + s.replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i').test(String(value ?? ''))
  if (typeof value === 'number' && !isNaN(Number(s))) return value === Number(s)
  return String(value ?? '').toLowerCase() === s.toLowerCase()
}
function fmtResult(v: Arg): string {
  if (isRng(v)) return String((v as RangeRef).ids[0] ?? '')
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (typeof v === 'number') {
    if (isNaN(v) || !isFinite(v)) return ERR.NUM
    return String(parseFloat(v.toPrecision(15)))
  }
  return String(v)
}

// ── Public API ─────────────────────────────────────────────────────────────────
export function evaluateFormula(formula: string, grid: Grid, cellId?: string): string {
  if (!formula.startsWith('=')) return formula
  try {
    const toks = tokenize(formula.slice(1).trim())
    const parser = new Parser(toks, grid, cellId)
    return fmtResult(parser.parse())
  } catch (e) {
    if (typeof e === 'string' && e.startsWith('#')) return e
    return ERR.VALUE
  }
}

export function recalcGrid(grid: Grid): Grid {
  let cur: Grid = { ...grid }
  for (let pass = 0; pass < 20; pass++) {
    let changed = false
    for (const [id, cell] of Object.entries(cur)) {
      const raw = cell.rawValue ?? cell.value ?? ''
      if (!raw.startsWith('=')) continue
      const computed = evaluateFormula(raw, cur, id)
      if (computed !== cell.computed) {
        cur = { ...cur, [id]: { ...cell, formula: true, computed, value: raw } }
        changed = true
      }
    }
    if (!changed) break
  }
  return cur
}
