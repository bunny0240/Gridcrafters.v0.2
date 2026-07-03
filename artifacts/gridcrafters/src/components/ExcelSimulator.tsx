import { useState, useEffect, useRef, useCallback } from 'react';
import { evaluateFormula, recalcGrid } from '@/lib/formulaEngine';

export interface CellState {
  value?: string;
  rawValue?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  textAlign?: string;
  color?: string;
  bgColor?: string;
  whiteSpace?: string;
  allBorders?: boolean;
  outerBorder?: boolean;
  copyMarquee?: boolean;
  merged?: boolean;
  inRange?: boolean;
  formula?: boolean;
  computed?: string;
}

interface ExcelSimulatorProps {
  challenge: any;
  onCorrect?: () => void;
  onWrong?: () => void;
  readOnly?: boolean;
  initialGrid?: Record<string, CellState>;
  onGridChange?: (grid: Record<string, CellState>) => void;
  onSequenceProgress?: (pressed: string[], nextKey: string | null) => void;
  onChordPressed?: (pressed: string[]) => void;
  cols?: string[];
  rows?: number[];
  /** Formatting Kings: fired when a shortcut from requiredShortcuts is matched */
  onShortcutApplied?: (shortcutId: string) => void;
  /** Formatting Kings: cells to auto-apply effect to when the next shortcut is pressed */
  stepCells?: string[];
}

const DEFAULT_COLS = ['A','B','C','D','E','F','G','H','I','J'];
const DEFAULT_ROWS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];

const DEFAULT_DATA: Record<string, CellState> = {
  'A1':{ value:'Region',  rawValue:'Region'  }, 'B1':{ value:'Q1($k)', rawValue:'Q1($k)' }, 'C1':{ value:'Q2($k)', rawValue:'Q2($k)' }, 'D1':{ value:'Q3($k)', rawValue:'Q3($k)' }, 'E1':{ value:'Total',  rawValue:'Total'  },
  'A2':{ value:'North',   rawValue:'North'   }, 'B2':{ value:'124',    rawValue:'124'    }, 'C2':{ value:'156',    rawValue:'156'    }, 'D2':{ value:'182',    rawValue:'182'    }, 'E2':{ value:'462',    rawValue:'462'    },
  'A3':{ value:'South',   rawValue:'South'   }, 'B3':{ value:'98',     rawValue:'98'     }, 'C3':{ value:'112',    rawValue:'112'    }, 'D3':{ value:'134',    rawValue:'134'    }, 'E3':{ value:'344',    rawValue:'344'    },
  'A4':{ value:'East',    rawValue:'East'    }, 'B4':{ value:'167',    rawValue:'167'    }, 'C4':{ value:'198',    rawValue:'198'    }, 'D4':{ value:'221',    rawValue:'221'    }, 'E4':{ value:'586',    rawValue:'586'    },
  'A5':{ value:'West',    rawValue:'West'    }, 'B5':{ value:'89',     rawValue:'89'     }, 'C5':{ value:'104',    rawValue:'104'    }, 'D5':{ value:'128',    rawValue:'128'    }, 'E5':{ value:'321',    rawValue:'321'    },
  'A6':{ value:'TOTAL',   rawValue:'TOTAL'   }, 'B6':{ value:'478',    rawValue:'478'    }, 'C6':{ value:'570',    rawValue:'570'    }, 'D6':{ value:'665',    rawValue:'665'    }, 'E6':{ value:'1713',   rawValue:'1713'   },
};

function colIdx(c: string, COLS: string[]) { return COLS.indexOf(c); }
function parseCell(id: string) {
  return { col: id.match(/[A-Z]+/)?.[0] ?? 'A', row: parseInt(id.match(/\d+/)?.[0] ?? '1') };
}
function expandRange(a: string, b: string, COLS: string[], ROWS: number[]): Set<string> {
  const { col: c1, row: r1 } = parseCell(a), { col: c2, row: r2 } = parseCell(b);
  const cMin = Math.min(colIdx(c1, COLS), colIdx(c2, COLS)), cMax = Math.max(colIdx(c1, COLS), colIdx(c2, COLS));
  const rMin = Math.min(r1, r2), rMax = Math.max(r1, r2);
  const s = new Set<string>();
  for (let c = cMin; c <= cMax; c++) for (let r = rMin; r <= rMax; r++) { if (COLS[c] && ROWS.includes(r)) s.add(COLS[c] + r); }
  return s;
}

export function ExcelSimulator({
  challenge,
  onCorrect,
  onWrong,
  readOnly = false,
  initialGrid,
  onGridChange,
  onSequenceProgress,
  onChordPressed,
  cols: propCols,
  rows: propRows,
  onShortcutApplied,
  stepCells,
}: ExcelSimulatorProps) {
  const COLS = propCols ?? DEFAULT_COLS;
  const ROWS = propRows ?? DEFAULT_ROWS;

  const [grid, setGrid] = useState<Record<string, CellState>>(() => {
    const base = JSON.parse(JSON.stringify(initialGrid || DEFAULT_DATA));
    return recalcGrid(base);
  });
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set(['A1']));
  const [activeCell, setActiveCell]         = useState('A1');
  const [selCursor, setSelCursor]           = useState('A1');
  const [dragStart, setDragStart]           = useState<string | null>(null);
  const [activeRibbon, setActiveRibbon]     = useState<string | null>(null);
  const [flashedCells, setFlashedCells]     = useState<Set<string>>(new Set());
  const [wrongFlash, setWrongFlash]         = useState(false);

  // Editing state
  const [editingCell, setEditingCell]       = useState<string | null>(null);
  const [editValue, setEditValue]           = useState('');
  const formulaBarRef                       = useRef<HTMLInputElement>(null);
  const cellInputRef                        = useRef<HTMLInputElement>(null);

  const gridRef      = useRef(grid);          gridRef.current      = grid;
  const selectedRef  = useRef(selectedCells); selectedRef.current  = selectedCells;
  const editingRef   = useRef(editingCell);   editingRef.current   = editingCell;
  const activeCellRef = useRef(activeCell);   activeCellRef.current = activeCell;

  // ── Init / challenge change ──────────────────────────────────────────────────
  useEffect(() => {
    if (challenge?.preSelectedCells) {
      setSelectedCells(new Set(challenge.preSelectedCells));
      setActiveCell(challenge.preSelectedCells[0] || 'A1');
    } else {
      setSelectedCells(new Set(['A1']));
      setActiveCell('A1');
    }
    const base = JSON.parse(JSON.stringify(initialGrid || DEFAULT_DATA));
    const computed = recalcGrid(base);
    setGrid(computed);
    setFlashedCells(new Set());
    setActiveRibbon(null);
    setEditingCell(null);
    setEditValue('');
    seqBuf.current = [];
  }, [challenge?.id]);

  useEffect(() => { if (onGridChange) onGridChange(grid); }, [grid]);

  // ── Cell raw display value (for formula bar & cell edit) ────────────────────
  function cellRaw(id: string): string {
    const c = grid[id];
    if (!c) return '';
    if (c.formula) return c.value ?? c.rawValue ?? '';
    return c.rawValue ?? c.value ?? '';
  }

  // ── Commit edit ──────────────────────────────────────────────────────────────
  const commitEdit = useCallback((cellId: string, raw: string) => {
    setGrid(prev => {
      const next = { ...prev };
      if (raw === '') {
        next[cellId] = { ...(next[cellId] ?? {}), value: '', rawValue: '', formula: false, computed: undefined };
      } else if (raw.startsWith('=')) {
        const computed = evaluateFormula(raw, next, cellId);
        next[cellId] = { ...(next[cellId] ?? {}), value: raw, rawValue: raw, formula: true, computed };
      } else {
        next[cellId] = { ...(next[cellId] ?? {}), value: raw, rawValue: raw, formula: false, computed: undefined };
      }
      return recalcGrid(next);
    });
    setEditingCell(null);
    setEditValue('');
  }, []);

  // ── Start editing a cell ─────────────────────────────────────────────────────
  const startEdit = useCallback((cellId: string, initialChar?: string) => {
    if (readOnly) return;
    const raw = initialChar !== undefined ? initialChar : cellRaw(cellId);
    setEditingCell(cellId);
    setEditValue(raw);
    setTimeout(() => {
      const inp = formulaBarRef.current || cellInputRef.current;
      if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    }, 10);
  }, [readOnly, grid]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // ── Navigate cells ───────────────────────────────────────────────────────────
  const moveActive = useCallback((dCol: number, dRow: number, commit?: { id: string; val: string }) => {
    if (commit) commitEdit(commit.id, commit.val);
    setActiveCell(prev => {
      const { col, row } = parseCell(prev);
      const ci = Math.max(0, Math.min(COLS.length - 1, colIdx(col, COLS) + dCol));
      const ri = Math.max(0, Math.min(ROWS.length - 1, ROWS.indexOf(row) + dRow));
      const next = COLS[ci] + ROWS[ri];
      setSelectedCells(new Set([next]));
      setSelCursor(next);
      return next;
    });
  }, [COLS, ROWS, commitEdit]);

  // ── Mouse interaction ────────────────────────────────────────────────────────
  const handleMouseDown = (id: string, shiftKey = false) => {
    if (readOnly) return;
    if (editingCell && editingCell !== id) { commitEdit(editingCell, editValue); }
    if (shiftKey) {
      // Shift+click: extend selection from activeCell anchor to clicked cell
      setSelCursor(id);
      setSelectedCells(expandRange(activeCell, id, COLS, ROWS));
    } else {
      setDragStart(id);
      setActiveCell(id);
      setSelCursor(id);
      setSelectedCells(new Set([id]));
    }
  };
  const handleMouseEnter = (id: string) => {
    if (readOnly || !dragStart) return;
    setSelCursor(id);
    setSelectedCells(expandRange(dragStart, id, COLS, ROWS));
  };
  const handleDblClick = (id: string) => {
    if (readOnly) return;
    startEdit(id);
  };
  useEffect(() => {
    const stop = () => setDragStart(null);
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  // ── Flash helpers ────────────────────────────────────────────────────────────
  function flashAffected(cells: Set<string>) { setFlashedCells(new Set(cells)); setTimeout(() => setFlashedCells(new Set()), 900); }
  function glowRibbon(effect: string) { setActiveRibbon(effect); setTimeout(() => setActiveRibbon(null), 700); }

  // ── Apply formatting effect ──────────────────────────────────────────────────
  const applyEffect = useCallback((effect: string, cells?: Set<string>) => {
    if (readOnly) return;

    // ── Navigation effects (modify position/selection, NOT cell state) ─────────
    switch (effect) {
      case 'jump-right-edge':
      case 'ctrl-right': {
        const { row } = parseCell(activeCellRef.current);
        const last = [...COLS].reverse().find(c => gridRef.current[c + row]?.value) ?? COLS[COLS.length - 1];
        const tgt = last + row;
        setActiveCell(tgt); setSelCursor(tgt); setSelectedCells(new Set([tgt]));
        return;
      }
      case 'jump-left-edge':
      case 'ctrl-left': {
        const { row } = parseCell(activeCellRef.current);
        const tgt = 'A' + row;
        setActiveCell(tgt); setSelCursor(tgt); setSelectedCells(new Set([tgt]));
        return;
      }
      case 'jump-up-edge':
      case 'ctrl-up': {
        const { col } = parseCell(activeCellRef.current);
        const tgt = col + ROWS[0];
        setActiveCell(tgt); setSelCursor(tgt); setSelectedCells(new Set([tgt]));
        return;
      }
      case 'jump-down-edge':
      case 'ctrl-down': {
        const { col } = parseCell(activeCellRef.current);
        const tgt = col + ROWS[ROWS.length - 1];
        setActiveCell(tgt); setSelCursor(tgt); setSelectedCells(new Set([tgt]));
        return;
      }
      case 'jump-to-a1':
      case 'ctrl-home': {
        setActiveCell('A1'); setSelCursor('A1'); setSelectedCells(new Set(['A1']));
        return;
      }
      case 'jump-to-end':
      case 'ctrl-end': {
        const last = COLS[COLS.length - 1] + ROWS[ROWS.length - 1];
        setActiveCell(last); setSelCursor(last); setSelectedCells(new Set([last]));
        return;
      }
      case 'select-all':
      case 'ctrl-a': {
        const all = new Set<string>();
        COLS.forEach(c => ROWS.forEach(r => all.add(c + r)));
        setSelectedCells(all);
        return;
      }
      case 'fill-down':
      case 'ctrl-d': {
        const sorted = [...selectedRef.current].sort();
        if (sorted.length < 2) return;
        const src = gridRef.current[sorted[0]];
        if (!src) return;
        setGrid(prev => {
          const next = { ...prev };
          sorted.slice(1).forEach(id => { next[id] = { ...src }; });
          return recalcGrid(next);
        });
        flashAffected(new Set(sorted.slice(1)));
        return;
      }
      case 'fill-right':
      case 'ctrl-r': {
        const sorted = [...selectedRef.current].sort();
        if (sorted.length < 2) return;
        const src = gridRef.current[sorted[0]];
        if (!src) return;
        setGrid(prev => {
          const next = { ...prev };
          sorted.slice(1).forEach(id => { next[id] = { ...src }; });
          return recalcGrid(next);
        });
        flashAffected(new Set(sorted.slice(1)));
        return;
      }
    }

    const target = cells ?? selectedRef.current;
    setGrid(prev => {
      const next = { ...prev };
      target.forEach(id => {
        if (!next[id]) next[id] = {};
        const c = next[id];
        switch (effect) {
          case 'bold':            next[id] = { ...c, fontWeight: c.fontWeight === 'bold' ? 'normal' : 'bold' }; break;
          case 'italic':          next[id] = { ...c, fontStyle: c.fontStyle === 'italic' ? 'normal' : 'italic' }; break;
          case 'underline':       next[id] = { ...c, textDecoration: c.textDecoration === 'underline' ? 'none' : 'underline' }; break;
          case 'strikethrough':   next[id] = { ...c, textDecoration: c.textDecoration === 'line-through' ? 'none' : 'line-through' }; break;
          case 'currency-format': { const n = parseFloat(c.rawValue ?? c.value ?? '0'); next[id] = { ...c, value: isNaN(n) ? c.value : new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0}).format(n) }; break; }
          case 'percent-format':  { const n = parseFloat(c.rawValue ?? c.value ?? '0'); next[id] = { ...c, value: isNaN(n) ? c.value : (n*100).toFixed(1)+'%' }; break; }
          case 'date-format':     next[id] = { ...c, value: '25-May-26' }; break;
          case 'center-align':    next[id] = { ...c, textAlign: 'center' }; break;
          case 'left-align':      next[id] = { ...c, textAlign: 'left' }; break;
          case 'right-align':     next[id] = { ...c, textAlign: 'right' }; break;
          case 'copy-marquee':    next[id] = { ...c, copyMarquee: true }; break;
          case 'merge-center':    next[id] = { ...c, merged: true, textAlign: 'center' }; break;
          case 'all-borders':     next[id] = { ...c, allBorders: true }; break;
          case 'outer-border':    next[id] = { ...c, outerBorder: true }; break;
          case 'wrap-text':       next[id] = { ...c, whiteSpace: 'normal' }; break;
          case 'conditional-format': next[id] = { ...c, bgColor: parseFloat(c.rawValue ?? '0') > 150 ? '#c8f7c5' : '#ffc8c8' }; break;
          case 'general-format':  next[id] = { ...c, value: c.rawValue ?? c.value, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none' }; break;
          case 'undo-revert':     next[id] = { ...c, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', bgColor: 'white' }; break;
          case 'autosum': {
            const { row } = parseCell(id);
            const above = ROWS.filter(r => r < row).map(r => id.replace(/\d+/, String(r)));
            const formula = `=SUM(${id.match(/[A-Z]+/)?.[0]}1:${id.match(/[A-Z]+/)?.[0]}${row-1})`;
            const computed = evaluateFormula(formula, next, id);
            next[id] = { ...c, value: formula, rawValue: formula, formula: true, computed };
            break;
          }
          case 'select-column': { const { col } = parseCell(id); ROWS.forEach(r => { const k = col+r; if (next[k]) next[k] = {...next[k], inRange:true}; }); break; }
          case 'select-row':    { const { row } = parseCell(id); COLS.forEach(col => { const k = col+row; if (next[k]) next[k] = {...next[k], inRange:true}; }); break; }
          case 'absolute-ref': next[id] = { ...c, value: `$${id.match(/[A-Z]+/)?.[0]}$${id.match(/\d+/)?.[0]}`, color: '#1F6FEB', fontWeight: 'bold' }; break;
          case 'show-formulas': {
            const formulaMap: Record<string,string> = {
              'E2':'=VLOOKUP(A2,$D$2:$E$5,2,0)', 'E3':'=VLOOKUP(A3,$D$2:$E$5,2,0)',
              'B6':'=SUM(B2:B5)', 'C6':'=SUM(C2:C5)', 'D6':'=SUM(D2:D5)', 'E6':'=SUM(E2:E5)',
            };
            next[id] = { ...c, value: formulaMap[id] ?? c.value, color: '#1F3D6E', bgColor: '#F0F4FF' };
            break;
          }
          case 'scientific-format': { const n = parseFloat(c.rawValue ?? c.value ?? '0'); next[id] = { ...c, value: isNaN(n) ? c.value : n.toExponential(2).toUpperCase() }; break; }
          case 'lookup-function': next[id] = { ...c, value: '=VLOOKUP(A2,$D$2:$E$5,2,0)', formula: true, computed: c.value, color: '#7B1FA2', bgColor: '#F3E5F5' }; break;
          case 'logical-function': next[id] = { ...c, value: parseFloat(c.rawValue ?? '0') > 150 ? 'TRUE' : 'FALSE', color: parseFloat(c.rawValue ?? '0') > 150 ? '#2E7D32' : '#C62828', fontWeight: 'bold' }; break;
        }
      });
      return recalcGrid(next);
    });
    flashAffected(target);
    glowRibbon(effect);
  }, [readOnly, COLS, ROWS]);

  function validateEffect(effect: string, cells?: Set<string>): boolean {
    const target = cells ?? selectedRef.current;
    const g = gridRef.current;
    return [...target].every(id => {
      const c = g[id]; if (!c) return false;
      switch (effect) {
        case 'bold':           return c.fontWeight === 'bold';
        case 'italic':         return c.fontStyle === 'italic';
        case 'underline':      return c.textDecoration === 'underline';
        case 'currency-format':return c.value?.includes('$') ?? false;
        case 'percent-format': return c.value?.includes('%') ?? false;
        case 'center-align':   return c.textAlign === 'center';
        case 'copy-marquee':   return c.copyMarquee === true;
        case 'merge-center':   return c.merged === true;
        case 'all-borders':    return c.allBorders === true;
        case 'select-column':  return c.inRange === true;
        case 'select-row':     return c.inRange === true;
        default: return true;
      }
    });
  }

  function cellStyle(c: CellState | undefined): React.CSSProperties {
    if (!c) return { backgroundColor: 'white' };
    return {
      fontWeight: c.fontWeight ?? 'normal',
      fontStyle: c.fontStyle ?? 'normal',
      textDecoration: c.textDecoration ?? 'none',
      textAlign: (c.textAlign as any) ?? 'left',
      color: c.color ?? '#000',
      backgroundColor: c.bgColor ?? 'white',
      whiteSpace: c.whiteSpace === 'normal' ? 'normal' : 'nowrap',
      border: c.allBorders ? '1px solid #000' : c.outerBorder ? '2px solid #000' : undefined,
    };
  }

  // ── Sequence/shortcut machinery ──────────────────────────────────────────────
  const seqBuf = useRef<string[]>([]);
  const seqTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function isSequential(keys: string[]) {
    return keys.includes('Alt') && keys.filter(k => !['Ctrl','Shift','Alt'].includes(k)).length > 1;
  }
  function pressedToId(pressed: string[]): string {
    const sp: Record<string,string> = { '!':'exclaim','@':'at','#':'hash','$':'dollar','%':'pct','^':'caret','&':'amp','~':'tilde','`':'backtick','*':'asterisk' };
    return pressed.map(k => sp[k] ?? k.toLowerCase()).join('-');
  }
  function normalizeKey(e: KeyboardEvent): string {
    const m: Record<string,string> = {
      'Control':'Ctrl','Shift':'Shift','Alt':'Alt',' ':'Space','=':'=','+':'+','-':'-',
      '$':'$','%':'%','#':'#','!':'!','@':'@','^':'^','&':'&','*':'*','~':'~','`':'`',
      'ArrowRight':'→','ArrowLeft':'←','ArrowUp':'↑','ArrowDown':'↓',
      'Escape':'Esc','Delete':'Delete','Backspace':'Backspace','Enter':'Enter','Tab':'Tab',
    };
    if (m[e.key]) return m[e.key];
    // When Shift is held and a digit key is pressed, some browsers fire e.key='4'
    // instead of e.key='$'. Normalise to the shifted symbol so chord IDs stay consistent.
    if (e.shiftKey && /^[0-9]$/.test(e.key)) {
      const digitToSym: Record<string,string> = {
        '1':'!','2':'@','3':'#','4':'$','5':'%','6':'^','7':'&','8':'*','9':'(','0':')',
      };
      if (digitToSym[e.key]) return digitToSym[e.key];
    }
    if (e.key.length === 1) return e.key.toUpperCase();
    if (/^F\d+$/.test(e.key)) return e.key;
    return e.key;
  }
  function buildChord(e: KeyboardEvent): string[] {
    const key = normalizeKey(e);
    // Symbols produced by Shift+digit already encode the shift in the character.
    // Adding 'Shift' separately would produce ['Ctrl','Shift','$'] when shortcut
    // data (and the challenge answer) says ['Ctrl','$'].
    const isShiftSymbol = /^[!@#$%^&*()_+~`<>?:"{}|]$/.test(key);
    const k: string[] = [];
    if (e.ctrlKey) k.push('Ctrl');
    if (e.shiftKey && !isShiftSymbol) k.push('Shift');
    if (e.altKey) k.push('Alt');
    if (!['Ctrl', 'Shift', 'Alt'].includes(key)) k.push(key);
    return k;
  }
  function arraysMatch(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((v,i) => v.toLowerCase() === b[i].toLowerCase());
  }

  function triggerCorrect() {
    setTimeout(() => { if (onCorrect) onCorrect(); }, 900);
  }
  function triggerWrong() {
    setWrongFlash(true);
    setTimeout(() => setWrongFlash(false), 400);
    if (onWrong) onWrong();
  }

  // ── Keyboard: formula bar / cell editing ────────────────────────────────────
  useEffect(() => {
    const handleFormulaBarKey = (e: KeyboardEvent) => {
      if (!editingRef.current) return;
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); e.stopPropagation();
        const id = editingRef.current;
        commitEdit(id, editValue);
        moveActive(0, 1);
      } else if (e.key === 'Tab') {
        e.preventDefault(); e.stopPropagation();
        const id = editingRef.current;
        commitEdit(id, editValue);
        moveActive(e.shiftKey ? -1 : 1, 0);
      } else if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        cancelEdit();
      }
    };
    document.addEventListener('keydown', handleFormulaBarKey, { capture: true });
    return () => document.removeEventListener('keydown', handleFormulaBarKey, { capture: true });
  }, [editValue, commitEdit, cancelEdit, moveActive]);

  // ── Keyboard: shortcut challenges ───────────────────────────────────────────
  function processInput(e: KeyboardEvent) {
    if (editingRef.current) return; // skip shortcuts while editing

    // Block browser tab-switching and destructive combos.
    // preventDefault stops the browser action but we still fall through to shortcut detection.
    if ((e.ctrlKey && e.shiftKey && ['Tab','PageDown','PageUp'].includes(e.key)) ||
        (e.ctrlKey && e.key === 'Tab')) {
      e.preventDefault(); e.stopImmediatePropagation();
    }
    if (e.altKey && e.key === 'F4') {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); return;
    }
    if (e.ctrlKey && ['w','W','t','T','n','N'].includes(e.key)) {
      e.preventDefault(); e.stopPropagation(); return;
    }

    const key = normalizeKey(e);
    if (['Ctrl','Shift','Alt'].includes(key)) return;

    // Universal Ctrl+Home / Ctrl+End — always active (not challenge shortcuts)
    if (e.ctrlKey && !e.shiftKey && !e.altKey && key === 'Home') { e.preventDefault(); applyEffect('jump-to-a1'); return; }
    if (e.ctrlKey && !e.shiftKey && !e.altKey && key === 'End')  { e.preventDefault(); applyEffect('jump-to-end'); return; }

    // Arrow key navigation
    if (!challenge?.keys && !challenge?.requiredShortcuts) {
      // Ctrl+Arrow: jump to edge
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        if (key === '→') { e.preventDefault(); applyEffect('jump-right-edge'); return; }
        if (key === '←') { e.preventDefault(); applyEffect('jump-left-edge'); return; }
        if (key === '↑') { e.preventDefault(); applyEffect('jump-up-edge'); return; }
        if (key === '↓') { e.preventDefault(); applyEffect('jump-down-edge'); return; }
      }
      // Shift+Arrow: extend selection (cursor moves, anchor stays at activeCell)
      if (e.shiftKey && !e.ctrlKey && !e.altKey && (key === '→' || key === '←' || key === '↑' || key === '↓')) {
        e.preventDefault();
        const dMap: Record<string,[number,number]> = { '→':[1,0], '←':[-1,0], '↑':[0,-1], '↓':[0,1] };
        const [dC, dR] = dMap[key];
        setSelCursor(prev => {
          const { col, row } = parseCell(prev);
          const ci = Math.max(0, Math.min(COLS.length - 1, colIdx(col, COLS) + dC));
          const ri = Math.max(0, Math.min(ROWS.length - 1, ROWS.indexOf(row) + dR));
          const next = COLS[ci] + ROWS[ri];
          setSelectedCells(expandRange(activeCell, next, COLS, ROWS));
          return next;
        });
        return;
      }
      if (key === '→') { moveActive(1, 0); return; }
      if (key === '←') { moveActive(-1, 0); return; }
      if (key === '↑') { moveActive(0, -1); return; }
      if (key === '↓') { moveActive(0, 1); return; }
      if (key === 'Enter') { moveActive(0, 1); return; }
      if (key === 'Tab') { moveActive(e.shiftKey ? -1 : 1, 0); return; }
      if (key === 'F2') { startEdit(activeCell); return; }
      if (key === 'Delete' || key === 'Backspace') {
        if (selectedRef.current.size > 0) {
          setGrid(prev => {
            const next = { ...prev };
            selectedRef.current.forEach(id => { next[id] = { ...(next[id] ?? {}), value: '', rawValue: '', formula: false, computed: undefined }; });
            return recalcGrid(next);
          });
        }
        return;
      }
      // Start typing to edit active cell
      if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) {
        e.preventDefault();
        startEdit(activeCell, e.key);
        return;
      }
    }

    if (challenge?.requiredShortcuts) {
      const effectMap: Record<string,string> = {
        'ctrl-b':'bold','ctrl-i':'italic','ctrl-u':'underline','ctrl-5':'strikethrough',
        'ctrl-1':'general-format',
        // Ctrl+symbol: buildChord now omits 'Shift' when the key is a shift-symbol char
        'ctrl-dollar':'currency-format','ctrl-pct':'percent-format',
        'ctrl-at':'date-format','ctrl-hash':'date-format',
        'ctrl-exclaim':'currency-format',
        'alt-h-a-c':'center-align','alt-h-b-a':'all-borders','alt-h-m-c':'merge-center',
        'alt-h-h':'conditional-format','alt-h-f-c':'conditional-format','alt-h-w':'wrap-text',
        'alt-h-l-n':'conditional-format','alt-h-t':'conditional-format',
        'alt-h-o-i':'general-format','alt-w-f-f':'bold','ctrl-a':'select-column',
      };
      if (e.altKey || seqBuf.current.length > 0) {
        clearTimeout(seqTimer.current);
        seqTimer.current = setTimeout(() => { seqBuf.current = []; if (onSequenceProgress) onSequenceProgress([], null); }, 2000);
        seqBuf.current.push(key);
        const seqStr = 'alt-' + seqBuf.current.join('-').toLowerCase();
        const matched = challenge.requiredShortcuts.find((s: string) => s === seqStr);
        if (matched) {
          const targetCells = stepCells?.length ? new Set(stepCells) : undefined;
          applyEffect(effectMap[matched] || matched, targetCells);
          if (onShortcutApplied) onShortcutApplied(matched);
          seqBuf.current = [];
          if (onSequenceProgress) onSequenceProgress([], null);
        } else if (seqBuf.current.length >= 5) {
          seqBuf.current = []; if (onSequenceProgress) onSequenceProgress([], null);
        } else if (onSequenceProgress) {
          const nextIdx = seqBuf.current.length;
          const possible = challenge.requiredShortcuts.flatMap((s: string) => {
            const parts = s.split('-');
            if (parts[0] === 'alt' && parts.slice(1, nextIdx+1).join('-').toLowerCase() === seqBuf.current.join('-').toLowerCase()) return [parts[nextIdx+1]?.toUpperCase() ?? null];
            return [];
          }).filter(Boolean);
          onSequenceProgress(seqBuf.current.map(k => k.toUpperCase()), possible[0] ?? null);
        }
        return;
      }
      const pressed = buildChord(e);
      if (onChordPressed) onChordPressed(pressed);
      const pressedId = pressedToId(pressed);
      const matched = challenge.requiredShortcuts.find((s: string) => s === pressedId);
      if (matched) {
        const targetCells = stepCells?.length ? new Set(stepCells) : undefined;
        applyEffect(effectMap[matched] || matched, targetCells);
        if (onShortcutApplied) onShortcutApplied(matched);
        setTimeout(() => { if (onChordPressed) onChordPressed([]); }, 600);
      }
      return;
    }

    if (!challenge?.keys) return;
    const { keys } = challenge;

    if (isSequential(keys)) {
      clearTimeout(seqTimer.current);
      seqTimer.current = setTimeout(() => { seqBuf.current = []; if (onSequenceProgress) onSequenceProgress([], null); }, 2000);
      if (e.altKey && seqBuf.current.length === 0 && keys[0]?.toLowerCase() === 'alt') seqBuf.current.push('Alt');
      seqBuf.current.push(key);
      if (onSequenceProgress) {
        const nextKey = seqBuf.current.length < keys.length ? keys[seqBuf.current.length] : null;
        onSequenceProgress([...seqBuf.current], nextKey);
      }
      const partial = keys.slice(0, seqBuf.current.length).every((k: string, i: number) => k.toLowerCase() === seqBuf.current[i]?.toLowerCase());
      if (!partial) { triggerWrong(); seqBuf.current = []; if (onSequenceProgress) onSequenceProgress([], null); return; }
      if (seqBuf.current.length === keys.length) {
        applyEffect(challenge.expectedEffect || challenge.id);
        seqBuf.current = []; if (onSequenceProgress) onSequenceProgress([], null);
        triggerCorrect();
      }
    } else {
      const pressed = buildChord(e);
      if (onChordPressed) onChordPressed(pressed);
      if (arraysMatch(pressed, keys)) {
        applyEffect(challenge.expectedEffect || challenge.id);
        setTimeout(() => { if (onChordPressed) onChordPressed([]); }, 600);
        triggerCorrect();
      } else if (pressed.length >= keys.length) {
        triggerWrong();
        setTimeout(() => { if (onChordPressed) onChordPressed([]); }, 400);
      }
    }
  }

  useEffect(() => {
    if (readOnly) return;
    const handler = (e: KeyboardEvent) => {
      if (editingRef.current) return; // formula bar handler takes over
      // Hard-block Alt+F4 and tab-close shortcuts before anything else
      if (e.altKey && e.key === 'F4') { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); return; }
      if (e.ctrlKey && ['w','W','t','T','n','N'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); return; }
      if (e.altKey) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }
      const ctrlBlock = ['b','i','u','s','a','h','d','r','g','k','f','p','n','w','t'];
      if (e.ctrlKey && ctrlBlock.includes(e.key.toLowerCase())) e.preventDefault();
      if (/^F\d+$/.test(e.key)) e.preventDefault();
      processInput(e);
    };
    document.addEventListener('keydown', handler, { capture: true });
    return () => document.removeEventListener('keydown', handler, { capture: true });
  }, [challenge, readOnly, activeCell]);

  // ── Status bar calculations ───────────────────────────────────────────────────
  const sumSelected = [...selectedCells].reduce((acc, id) => {
    const v = grid[id]?.computed ?? grid[id]?.rawValue ?? '';
    const n = parseFloat(v);
    return isNaN(n) ? acc : acc + n;
  }, 0);
  const countSelected   = [...selectedCells].filter(id => grid[id]?.value || grid[id]?.computed).length;
  const numericSelected = [...selectedCells].filter(id => { const v = grid[id]?.computed ?? grid[id]?.rawValue ?? ''; return !isNaN(parseFloat(v)); }).length;
  const avgSelected     = numericSelected > 0 ? (sumSelected / numericSelected).toFixed(2) : 0;

  const activeColHeaders = new Set([...selectedCells].map(id => id.match(/[A-Z]+/)?.[0] ?? ''));
  const activeRowHeaders = new Set([...selectedCells].map(id => id.match(/\d+/)?.[0] ?? ''));

  // ── Formula bar value ─────────────────────────────────────────────────────────
  const fbarValue = editingCell === activeCell ? editValue : cellRaw(activeCell);

  // ── Display value for a cell ─────────────────────────────────────────────────
  function displayVal(cell: CellState | undefined): string {
    if (!cell) return '';
    if (cell.formula) return cell.computed ?? '';
    return cell.value ?? '';
  }

  const ribbonBtns = [
    { label: <b>B</b>, effect: 'bold' },
    { label: <i>I</i>, effect: 'italic' },
    { label: <u>U</u>, effect: 'underline' },
  ];

  return (
    <div
      className={`rounded-lg border shadow-xl overflow-hidden font-sans transition-all duration-150 flex flex-col ${wrongFlash ? 'ring-2 ring-[#F44336]' : 'border-[#2A2A2A]'}`}
      style={{ background: '#111111', maxHeight: '100%' }}
    >
      {/* Title bar */}
      <div className="shrink-0 flex items-center justify-between px-3 py-1.5 text-xs text-[#ECECEC] bg-[#0A0A0A] border-b border-[#2A2A2A]">
        <div className="flex items-center gap-2">
          <span className="text-green-500 font-bold text-sm">✕</span>
          <span className="text-[#ECECEC]/70">GridCrafters Simulator</span>
          <span className="text-[#6B7280] mx-1">—</span>
          <span className="text-[#ECECEC]">Sales_Report.xlsx</span>
          {!readOnly && <span className="text-[#F44336] font-bold ml-1">*</span>}
        </div>
        <div className="flex gap-3 text-[#6B7280] text-xs">
          <span>─</span><span>□</span><span>✕</span>
        </div>
      </div>

      {/* Ribbon tabs */}
      <div className="shrink-0 flex text-xs px-2 pt-1 gap-0 bg-[#1A1A1A] border-b border-[#333]">
        {['File','Home','Insert','Formulas','Data','View'].map(tab => (
          <span key={tab} className={`px-3 py-1.5 cursor-pointer select-none transition-colors ${tab === 'Home' ? 'text-white border-b-2 border-[#00B4D8] font-medium' : 'text-[#ECECEC]/60 hover:text-[#ECECEC]'}`}>{tab}</span>
        ))}
      </div>

      {/* Ribbon buttons */}
      <div className="shrink-0 flex items-center gap-3 px-3 py-1.5 bg-[#222222] border-b border-[#333] text-sm text-[#ECECEC] flex-wrap">
        {ribbonBtns.map(({ label, effect }) => (
          <button key={effect} className={`w-7 h-7 rounded flex items-center justify-center transition-all duration-200 ${activeRibbon === effect ? 'bg-[#00B4D8]/30 text-[#00B4D8] ring-1 ring-[#00B4D8] scale-110' : 'hover:bg-[#333]'}`}
            onMouseDown={e => { e.preventDefault(); applyEffect(effect); }}>{label}</button>
        ))}
        <div className="w-px h-5 bg-[#444]" />
        {[{ label: '$', effect: 'currency-format' }, { label: '%', effect: 'percent-format' }].map(({ label, effect }) => (
          <button key={effect} className={`w-7 h-7 rounded flex items-center justify-center transition-all duration-200 ${activeRibbon === effect ? 'bg-[#00B4D8]/30 text-[#00B4D8] ring-1 ring-[#00B4D8] scale-110' : 'hover:bg-[#333]'}`}
            onMouseDown={e => { e.preventDefault(); applyEffect(effect); }}>{label}</button>
        ))}
        <div className="w-px h-5 bg-[#444]" />
        {[
          { label: '≡ Align', effect: 'center-align' },
          { label: 'Merge ▼', effect: 'merge-center' },
          { label: 'Border ▼', effect: 'all-borders' },
          { label: 'Wrap', effect: 'wrap-text' },
          { label: 'Cond.Fmt ▼', effect: 'conditional-format' },
        ].map(({ label, effect }) => (
          <button key={effect} className={`px-2 h-7 rounded text-xs transition-all duration-200 ${activeRibbon === effect ? 'bg-[#00B4D8]/30 text-[#00B4D8] ring-1 ring-[#00B4D8] scale-105' : 'hover:bg-[#333]'}`}
            onMouseDown={e => { e.preventDefault(); applyEffect(effect); }}>{label}</button>
        ))}
      </div>

      {/* Formula bar */}
      <div className="shrink-0 flex items-center gap-2 px-2 py-0.5 bg-[#1A1A1A] border-b border-[#2A2A2A] text-xs">
        <div className="bg-white text-black px-2 py-0.5 border border-[#ccc] w-14 text-center font-mono shrink-0">{activeCell}</div>
        <div className="text-[#6B7280] font-bold italic text-sm shrink-0">fx</div>
        {readOnly ? (
          <div className="bg-white text-black px-2 py-0.5 border border-[#ccc] flex-1 min-h-[20px] font-mono truncate">
            {fbarValue}
          </div>
        ) : (
          <input
            ref={formulaBarRef}
            className="bg-white text-black px-2 py-0.5 border border-[#ccc] flex-1 font-mono text-xs outline-none focus:border-[#1F6FEB]"
            style={{ minHeight: 20 }}
            value={editingCell === activeCell ? editValue : fbarValue}
            onFocus={() => { if (!editingCell || editingCell !== activeCell) startEdit(activeCell); }}
            onChange={e => {
              setEditValue(e.target.value);
              if (editingCell !== activeCell) setEditingCell(activeCell);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); commitEdit(activeCell, editValue); moveActive(0, 1); }
              else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
              else if (e.key === 'Tab') { e.preventDefault(); commitEdit(activeCell, editValue); moveActive(e.shiftKey ? -1 : 1, 0); }
            }}
            spellCheck={false}
            autoComplete="off"
          />
        )}
      </div>

      {/* Grid (scrollable) */}
      <div className="flex-1 overflow-auto bg-white select-none text-black" style={{ minHeight: 0 }}>
        {/* Column headers */}
        <div className="flex sticky top-0 z-10">
          <div className="w-8 min-w-[32px] bg-[#F2F2F2] border-r border-b border-[#D0D7DE] shrink-0" />
          {COLS.map(c => (
            <div key={c} className={`col-header w-[68px] min-w-[68px] py-0.5 ${activeColHeaders.has(c) ? 'hl' : ''}`}>{c}</div>
          ))}
        </div>

        {ROWS.map(r => (
          <div key={r} className="flex" style={{ height: 22 }}>
            <div className={`row-num w-8 min-w-[32px] flex items-center justify-center shrink-0 ${activeRowHeaders.has(String(r)) ? 'hl' : ''}`}>{r}</div>
            {COLS.map(c => {
              const id = `${c}${r}`;
              const cell = grid[id];
              const isActive   = activeCell === id;
              const isSelected = selectedCells.has(id);
              const isFlashed  = flashedCells.has(id);
              const isEditing  = editingCell === id;

              return (
                <div
                  key={id}
                  className="excel-cell relative"
                  style={{
                    ...cellStyle(cell),
                    ...(isFlashed ? { outline: '2px solid #4CAF50', outlineOffset: '-2px', zIndex: 2 } : {}),
                    ...(isSelected && !isActive ? { backgroundColor: isFlashed ? undefined : 'rgba(31,111,235,0.12)' } : {}),
                  }}
                  onMouseDown={(e) => handleMouseDown(id, e.shiftKey)}
                  onMouseEnter={() => handleMouseEnter(id)}
                  onDoubleClick={() => handleDblClick(id)}
                >
                  {isEditing ? (
                    <input
                      ref={cellInputRef}
                      className="absolute inset-0 w-full h-full border-0 outline-none bg-white text-black px-1 font-mono text-xs z-10"
                      style={{ boxSizing: 'border-box', minWidth: 80 }}
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); commitEdit(id, editValue); moveActive(0, 1); }
                        else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
                        else if (e.key === 'Tab') { e.preventDefault(); commitEdit(id, editValue); moveActive(e.shiftKey ? -1 : 1, 0); }
                      }}
                      onBlur={() => { if (editingCell === id) commitEdit(id, editValue); }}
                      autoFocus
                      spellCheck={false}
                    />
                  ) : (
                    <span style={{ position: 'relative', zIndex: 1, padding: '0 2px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
                      {displayVal(cell)}
                    </span>
                  )}
                  {isActive && !isEditing && (
                    <div className="absolute inset-0 pointer-events-none" style={{ outline: '2px solid #1F6FEB', outlineOffset: -2, zIndex: 3 }} />
                  )}
                  {cell?.copyMarquee && (
                    <div className="absolute inset-0 cell-marquee pointer-events-none" style={{ zIndex: 4 }} />
                  )}
                  {isFlashed && (
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(76,175,80,0.18)', zIndex: 2 }} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sheet tabs */}
      <div className="shrink-0 bg-[#F2F2F2] flex items-center text-xs text-[#444] border-t border-[#D0D7DE]">
        <div className="px-3 py-1 bg-white border-r border-[#D0D7DE] border-t-2 border-t-[#1F6FEB] font-medium text-[#1F6FEB]">Sheet1</div>
        <div className="px-3 py-1 hover:bg-[#E6E6E6] border-r border-[#D0D7DE]">Summary</div>
        <div className="px-3 py-1 hover:bg-[#E6E6E6] border-r border-[#D0D7DE]">Raw Data</div>
        <div className="px-3 py-1 hover:bg-[#E6E6E6]">+</div>
      </div>

      {/* Status bar */}
      <div className="shrink-0 bg-[#1E1E1E] px-3 py-0.5 text-xs text-[#ECECEC]/70 flex justify-between border-t border-[#333]">
        <div>{editingCell ? 'Enter' : 'Ready'}</div>
        <div className="flex gap-4">
          {numericSelected > 0 && <span>Sum: {sumSelected.toLocaleString()}</span>}
          <span>Count: {countSelected}</span>
          {numericSelected > 1 && <span>Average: {avgSelected}</span>}
        </div>
      </div>
    </div>
  );
}
