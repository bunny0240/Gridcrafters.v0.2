import type { CellState } from '@/components/ExcelSimulator';

export interface FormattingStep {
  id: string;
  cells: string[];
  shortcut: string;
  effect: string;
  label: string;
  points: number;
}

export interface FormattingChallenge {
  id: string;
  level: 1 | 2 | 3;
  title: string;
  scenario: string;
  xp: number;
  difficulty: string;
  steps: FormattingStep[];
  requiredShortcuts: string[];
  initialGrid?: Record<string, CellState>;
}

const BASE: Record<string, CellState> = {
  A1:{ value:'Region',  rawValue:'Region'  }, B1:{ value:'Q1',     rawValue:'Q1'     }, C1:{ value:'Q2',     rawValue:'Q2'     }, D1:{ value:'Q3',     rawValue:'Q3'     }, E1:{ value:'Total',  rawValue:'Total'  },
  A2:{ value:'North',   rawValue:'North'   }, B2:{ value:'124000', rawValue:'124000' }, C2:{ value:'156000', rawValue:'156000' }, D2:{ value:'182000', rawValue:'182000' }, E2:{ value:'462000', rawValue:'462000' },
  A3:{ value:'South',   rawValue:'South'   }, B3:{ value:'98000',  rawValue:'98000'  }, C3:{ value:'112000', rawValue:'112000' }, D3:{ value:'134000', rawValue:'134000' }, E3:{ value:'344000', rawValue:'344000' },
  A4:{ value:'East',    rawValue:'East'    }, B4:{ value:'167000', rawValue:'167000' }, C4:{ value:'198000', rawValue:'198000' }, D4:{ value:'221000', rawValue:'221000' }, E4:{ value:'586000', rawValue:'586000' },
  A5:{ value:'West',    rawValue:'West'    }, B5:{ value:'89000',  rawValue:'89000'  }, C5:{ value:'104000', rawValue:'104000' }, D5:{ value:'128000', rawValue:'128000' }, E5:{ value:'321000', rawValue:'321000' },
  A6:{ value:'TOTAL',   rawValue:'TOTAL'   }, B6:{ value:'478000', rawValue:'478000' }, C6:{ value:'570000', rawValue:'570000' }, D6:{ value:'665000', rawValue:'665000' }, E6:{ value:'1713000',rawValue:'1713000'},
};

function base() { return JSON.parse(JSON.stringify(BASE)) as Record<string, CellState>; }

export const FORMATTING_CHALLENGES: FormattingChallenge[] = [

  // ─── LEVEL 1 — ROOKIE ────────────────────────────────────────────────────────

  {
    id: 'f1', level: 1, title: 'Make the Header Row Stand Out', xp: 40, difficulty: 'Rookie',
    scenario: "Your manager says the report header looks the same as data rows. \"I can't tell where the data starts.\" Bold the entire header row so it stands out.",
    requiredShortcuts: ['ctrl-b'],
    steps: [
      { id:'s1', cells:['A1','B1','C1','D1','E1'], shortcut:'ctrl-b', effect:'bold', label:'Select A1:E1 → Bold (Ctrl+B)', points:100 },
    ],
  },

  {
    id: 'f2', level: 1, title: 'Emphasize the Totals Column', xp: 50, difficulty: 'Rookie',
    scenario: "Your CFO wants the Total column to be bold AND italic. \"It needs to pop — it's the most important column.\"",
    requiredShortcuts: ['ctrl-b','ctrl-i'],
    steps: [
      { id:'s1', cells:['E1','E2','E3','E4','E5'], shortcut:'ctrl-b', effect:'bold',   label:'Select E1:E5 → Bold (Ctrl+B)',   points:50 },
      { id:'s2', cells:['E1','E2','E3','E4','E5'], shortcut:'ctrl-i', effect:'italic', label:'Select E1:E5 → Italic (Ctrl+I)', points:50 },
    ],
  },

  {
    id: 'f3', level: 1, title: 'Mark the Disclaimer Row', xp: 50, difficulty: 'Rookie',
    scenario: 'Legal wants the footnote in row 6 underlined and italic so it looks like a proper disclaimer.',
    requiredShortcuts: ['ctrl-i','ctrl-u'],
    steps: [
      { id:'s1', cells:['A6'], shortcut:'ctrl-i', effect:'italic',    label:'Select A6 → Italic (Ctrl+I)',    points:50 },
      { id:'s2', cells:['A6'], shortcut:'ctrl-u', effect:'underline', label:'Select A6 → Underline (Ctrl+U)', points:50 },
    ],
    initialGrid: {
      ...base(),
      A6:{ value:'* Figures in thousands USD', rawValue:'* Figures in thousands USD' },
      B6:undefined!, C6:undefined!, D6:undefined!, E6:undefined!,
    },
  },

  {
    id: 'f4', level: 1, title: 'Format Revenue as Currency', xp: 55, difficulty: 'Rookie',
    scenario: "The finance team sent raw numbers. \"These should show $124,000 not 124000.\" Format the entire data range as currency.",
    requiredShortcuts: ['ctrl-shift-dollar'],
    steps: [
      { id:'s1', cells:['B2','C2','D2','E2','B3','C3','D3','E3','B4','C4','D4','E4','B5','C5','D5','E5'], shortcut:'ctrl-shift-dollar', effect:'currency-format', label:'Select B2:E5 → Currency (Ctrl+Shift+$)', points:100 },
    ],
  },

  {
    id: 'f5', level: 1, title: 'Format Growth Column as Percentage', xp: 55, difficulty: 'Rookie',
    scenario: 'Column F contains growth rates as decimals (0.24, 0.14 …). Your manager wants them displayed as percentages.',
    requiredShortcuts: ['ctrl-shift-pct'],
    steps: [
      { id:'s1', cells:['F2','F3','F4','F5'], shortcut:'ctrl-shift-pct', effect:'percent-format', label:'Select F2:F5 → Percentage (Ctrl+Shift+%)', points:100 },
    ],
    initialGrid: {
      ...base(),
      F1:{ value:'Growth', rawValue:'Growth' },
      F2:{ value:'0.24', rawValue:'0.24' }, F3:{ value:'0.14', rawValue:'0.14' },
      F4:{ value:'0.32', rawValue:'0.32' }, F5:{ value:'0.44', rawValue:'0.44' },
    },
  },

  {
    id: 'f6', level: 1, title: 'Format the Date Column', xp: 55, difficulty: 'Rookie',
    scenario: 'Column F has order dates stored as serial numbers (45678…). The client wants readable dates like 25-May-26.',
    requiredShortcuts: ['ctrl-shift-hash'],
    steps: [
      { id:'s1', cells:['F2','F3','F4','F5'], shortcut:'ctrl-shift-hash', effect:'date-format', label:'Select F2:F5 → Date format (Ctrl+Shift+#)', points:100 },
    ],
    initialGrid: {
      ...base(),
      F1:{ value:'Order Date', rawValue:'Order Date' },
      F2:{ value:'45678', rawValue:'45678' }, F3:{ value:'45690', rawValue:'45690' },
      F4:{ value:'45701', rawValue:'45701' }, F5:{ value:'45712', rawValue:'45712' },
    },
  },

  {
    id: 'f7', level: 1, title: 'Remove Wrong Formatting', xp: 60, difficulty: 'Rookie',
    scenario: "Someone accidentally formatted the Region column as currency. Column A shows \"$North\" — fix it back to General format using Ctrl+1.",
    requiredShortcuts: ['ctrl-1'],
    steps: [
      { id:'s1', cells:['A2','A3','A4','A5'], shortcut:'ctrl-1', effect:'general-format', label:'Select A2:A5 → General format (Ctrl+1)', points:100 },
    ],
    initialGrid: {
      ...base(),
      A2:{ value:'$North', rawValue:'North' }, A3:{ value:'$South', rawValue:'South' },
      A4:{ value:'$East',  rawValue:'East'  }, A5:{ value:'$West',  rawValue:'West'  },
    },
  },

  {
    id: 'f8', level: 1, title: 'Full Rookie Report Format', xp: 80, difficulty: 'Rookie Boss Task',
    scenario: 'Your first real report submission. Apply all basic formatting before sharing with the team: bold headers, currency data, percentage growth, date column, italic totals.',
    requiredShortcuts: ['ctrl-b','ctrl-shift-dollar','ctrl-shift-pct','ctrl-shift-hash','ctrl-i'],
    steps: [
      { id:'s1', cells:['A1','B1','C1','D1','E1'],                                                       shortcut:'ctrl-b',           effect:'bold',           label:'A1:E1 → Bold (Ctrl+B)',           points:20 },
      { id:'s2', cells:['B2','C2','D2','E2','B3','C3','D3','E3','B4','C4','D4','E4','B5','C5','D5','E5'], shortcut:'ctrl-shift-dollar', effect:'currency-format', label:'B2:E5 → Currency (Ctrl+Shift+$)',  points:20 },
      { id:'s3', cells:['F2','F3','F4','F5'],                                                             shortcut:'ctrl-shift-pct',   effect:'percent-format', label:'F2:F5 → Percentage (Ctrl+Shift+%)',points:20 },
      { id:'s4', cells:['F2','F3','F4','F5'],                                                             shortcut:'ctrl-shift-hash',  effect:'date-format',    label:'F2:F5 → Date (Ctrl+Shift+#)',      points:20 },
      { id:'s5', cells:['E1','E2','E3','E4','E5'],                                                        shortcut:'ctrl-i',           effect:'italic',         label:'E1:E5 → Italic (Ctrl+I)',          points:20 },
    ],
    initialGrid: {
      ...base(),
      F1:{ value:'Growth', rawValue:'Growth' },
      F2:{ value:'0.24', rawValue:'0.24' }, F3:{ value:'0.14', rawValue:'0.14' },
      F4:{ value:'0.32', rawValue:'0.32' }, F5:{ value:'0.44', rawValue:'0.44' },
    },
  },

  // ─── LEVEL 2 — INTERMEDIATE ──────────────────────────────────────────────────

  {
    id: 'f9', level: 2, title: 'Center the Header Row', xp: 65, difficulty: 'Intermediate',
    scenario: 'The header labels are left-aligned. Your design standard says all headers must be centered.',
    requiredShortcuts: ['alt-h-a-c'],
    steps: [
      { id:'s1', cells:['A1','B1','C1','D1','E1'], shortcut:'alt-h-a-c', effect:'center-align', label:'Select A1:E1 → Center align (Alt→H→A→C)', points:100 },
    ],
  },

  {
    id: 'f10', level: 2, title: 'Apply Table Borders', xp: 65, difficulty: 'Intermediate',
    scenario: '"This report has no borders — it\'s impossible to read in print." Apply borders to every cell in the data range.',
    requiredShortcuts: ['alt-h-b-a'],
    steps: [
      { id:'s1', cells:['A1','B1','C1','D1','E1','A2','B2','C2','D2','E2','A3','B3','C3','D3','E3','A4','B4','C4','D4','E4','A5','B5','C5','D5','E5','A6','B6','C6','D6','E6'],
        shortcut:'alt-h-b-a', effect:'all-borders', label:'Select A1:E6 → All borders (Alt→H→B→A)', points:100 },
    ],
  },

  {
    id: 'f11', level: 2, title: 'Highlight the Header Row', xp: 70, difficulty: 'Intermediate',
    scenario: "The client's brand color is navy. Use the fill color shortcut to apply a background color to the header row.",
    requiredShortcuts: ['alt-h-h'],
    steps: [
      { id:'s1', cells:['A1','B1','C1','D1','E1'], shortcut:'alt-h-h', effect:'conditional-format', label:'Select A1:E1 → Fill color (Alt→H→H)', points:100 },
    ],
  },

  {
    id: 'f12', level: 2, title: 'Change Font Color for Totals Row', xp: 70, difficulty: 'Intermediate',
    scenario: 'Row 6 (TOTAL) must have a different font color so it stands out against the data rows.',
    requiredShortcuts: ['alt-h-f-c'],
    steps: [
      { id:'s1', cells:['A6','B6','C6','D6','E6'], shortcut:'alt-h-f-c', effect:'conditional-format', label:'Select A6:E6 → Font color (Alt→H→F→C)', points:100 },
    ],
  },

  {
    id: 'f13', level: 2, title: 'Merge the Report Title', xp: 75, difficulty: 'Intermediate',
    scenario: 'Row 1 has a title "Q3 Sales Report" only in cell A1. It should span across all 5 columns and be centered.',
    requiredShortcuts: ['alt-h-m-c'],
    steps: [
      { id:'s1', cells:['A1','B1','C1','D1','E1'], shortcut:'alt-h-m-c', effect:'merge-center', label:'Select A1:E1 → Merge and center (Alt→H→M→C)', points:100 },
    ],
    initialGrid: {
      A1:{ value:'Q3 Sales Report', rawValue:'Q3 Sales Report' },
      A2:{ value:'Region',  rawValue:'Region'  }, B2:{ value:'Q1',     rawValue:'Q1'     }, C2:{ value:'Q2',     rawValue:'Q2'     }, D2:{ value:'Q3',     rawValue:'Q3'     }, E2:{ value:'Total',  rawValue:'Total'  },
      A3:{ value:'North',   rawValue:'North'   }, B3:{ value:'124000', rawValue:'124000' }, C3:{ value:'156000', rawValue:'156000' }, D3:{ value:'182000', rawValue:'182000' }, E3:{ value:'462000', rawValue:'462000' },
      A4:{ value:'South',   rawValue:'South'   }, B4:{ value:'98000',  rawValue:'98000'  }, C4:{ value:'112000', rawValue:'112000' }, D4:{ value:'134000', rawValue:'134000' }, E4:{ value:'344000', rawValue:'344000' },
      A5:{ value:'East',    rawValue:'East'    }, B5:{ value:'167000', rawValue:'167000' }, C5:{ value:'198000', rawValue:'198000' }, D5:{ value:'221000', rawValue:'221000' }, E5:{ value:'586000', rawValue:'586000' },
      A6:{ value:'West',    rawValue:'West'    }, B6:{ value:'89000',  rawValue:'89000'  }, C6:{ value:'104000', rawValue:'104000' }, D6:{ value:'128000', rawValue:'128000' }, E6:{ value:'321000', rawValue:'321000' },
    },
  },

  {
    id: 'f14', level: 2, title: 'Wrap Text in the Notes Column', xp: 65, difficulty: 'Intermediate',
    scenario: 'Column F contains long notes that overflow into adjacent cells. Wrap the text so it stays inside each cell.',
    requiredShortcuts: ['alt-h-w'],
    steps: [
      { id:'s1', cells:['F2','F3','F4','F5'], shortcut:'alt-h-w', effect:'wrap-text', label:'Select F2:F5 → Wrap text (Alt→H→W)', points:100 },
    ],
    initialGrid: {
      ...base(),
      F1:{ value:'Notes', rawValue:'Notes' },
      F2:{ value:'Strong performance driven by new enterprise contracts in Q3', rawValue:'Strong performance driven by new enterprise contracts in Q3' },
      F3:{ value:'Declined due to regional disruption and supply chain issues', rawValue:'Declined due to regional disruption and supply chain issues' },
      F4:{ value:'Highest performing region for third consecutive quarter', rawValue:'Highest performing region for third consecutive quarter' },
      F5:{ value:'New market entry — growth expected to accelerate in Q4', rawValue:'New market entry — growth expected to accelerate in Q4' },
    },
  },

  {
    id: 'f15', level: 2, title: 'Full Table Formatting', xp: 100, difficulty: 'Intermediate Boss Task',
    scenario: 'Build a complete formatted table from scratch matching the target. Bold headers, merged title, all borders, currency data, and center alignment — sign-off required before Monday.',
    requiredShortcuts: ['alt-h-m-c','ctrl-b','alt-h-h','alt-h-a-c','ctrl-shift-dollar','alt-h-b-a'],
    steps: [
      { id:'s1', cells:['A1','B1','C1','D1','E1'],                                                       shortcut:'alt-h-m-c',         effect:'merge-center',    label:'A1:E1 → Merge and center (Alt→H→M→C)',  points:15 },
      { id:'s2', cells:['A1'],                                                                            shortcut:'ctrl-b',            effect:'bold',            label:'A1 → Bold title (Ctrl+B)',               points:10 },
      { id:'s3', cells:['A1','B1','C1','D1','E1'],                                                        shortcut:'alt-h-h',           effect:'conditional-format',label:'A1:E1 → Fill color (Alt→H→H)',         points:15 },
      { id:'s4', cells:['A2','B2','C2','D2','E2'],                                                        shortcut:'alt-h-a-c',         effect:'center-align',    label:'A2:E2 → Center headers (Alt→H→A→C)',     points:10 },
      { id:'s5', cells:['B3','C3','D3','E3','B4','C4','D4','E4','B5','C5','D5','E5','B6','C6','D6','E6'], shortcut:'ctrl-shift-dollar',  effect:'currency-format', label:'B3:E6 → Currency (Ctrl+Shift+$)',        points:15 },
      { id:'s6', cells:['A2','B2','C2','D2','E2','A3','B3','C3','D3','E3','A4','B4','C4','D4','E4','A5','B5','C5','D5','E5','A6','B6','C6','D6','E6'],
        shortcut:'alt-h-b-a', effect:'all-borders', label:'A2:E6 → All borders (Alt→H→B→A)', points:15 },
    ],
    initialGrid: {
      A1:{ value:'Q3 Sales Report', rawValue:'Q3 Sales Report' },
      A2:{ value:'Region',  rawValue:'Region'  }, B2:{ value:'Q1',     rawValue:'Q1'     }, C2:{ value:'Q2',     rawValue:'Q2'     }, D2:{ value:'Q3',     rawValue:'Q3'     }, E2:{ value:'Total',  rawValue:'Total'  },
      A3:{ value:'North',   rawValue:'North'   }, B3:{ value:'124000', rawValue:'124000' }, C3:{ value:'156000', rawValue:'156000' }, D3:{ value:'182000', rawValue:'182000' }, E3:{ value:'462000', rawValue:'462000' },
      A4:{ value:'South',   rawValue:'South'   }, B4:{ value:'98000',  rawValue:'98000'  }, C4:{ value:'112000', rawValue:'112000' }, D4:{ value:'134000', rawValue:'134000' }, E4:{ value:'344000', rawValue:'344000' },
      A5:{ value:'East',    rawValue:'East'    }, B5:{ value:'167000', rawValue:'167000' }, C5:{ value:'198000', rawValue:'198000' }, D5:{ value:'221000', rawValue:'221000' }, E5:{ value:'586000', rawValue:'586000' },
      A6:{ value:'West',    rawValue:'West'    }, B6:{ value:'89000',  rawValue:'89000'  }, C6:{ value:'104000', rawValue:'104000' }, D6:{ value:'128000', rawValue:'128000' }, E6:{ value:'321000', rawValue:'321000' },
    },
  },

  {
    id: 'f16', level: 2, title: 'Mark Discontinued Products', xp: 65, difficulty: 'Intermediate',
    scenario: 'Three products have been discontinued. Apply strikethrough to mark them so reviewers know not to include them in the new catalogue.',
    requiredShortcuts: ['ctrl-5'],
    steps: [
      { id:'s1', cells:['A3'], shortcut:'ctrl-5', effect:'strikethrough', label:'Select A3 → Strikethrough (Ctrl+5)', points:33 },
      { id:'s2', cells:['A5'], shortcut:'ctrl-5', effect:'strikethrough', label:'Select A5 → Strikethrough (Ctrl+5)', points:33 },
      { id:'s3', cells:['A6'], shortcut:'ctrl-5', effect:'strikethrough', label:'Select A6 → Strikethrough (Ctrl+5)', points:34 },
    ],
    initialGrid: {
      A1:{ value:'Product',      rawValue:'Product'      }, B1:{ value:'Status',       rawValue:'Status'       }, C1:{ value:'Revenue',      rawValue:'Revenue'      },
      A2:{ value:'Excel Pro',    rawValue:'Excel Pro'    }, B2:{ value:'Active',        rawValue:'Active'       }, C2:{ value:'48000',        rawValue:'48000'        },
      A3:{ value:'Sheets Lite',  rawValue:'Sheets Lite'  }, B3:{ value:'Discontinued',  rawValue:'Discontinued' }, C3:{ value:'12000',        rawValue:'12000'        },
      A4:{ value:'Calc Plus',    rawValue:'Calc Plus'    }, B4:{ value:'Active',        rawValue:'Active'       }, C4:{ value:'62000',        rawValue:'62000'        },
      A5:{ value:'Data View',    rawValue:'Data View'    }, B5:{ value:'Discontinued',  rawValue:'Discontinued' }, C5:{ value:'8000',         rawValue:'8000'         },
      A6:{ value:'Formula Hub',  rawValue:'Formula Hub'  }, B6:{ value:'Discontinued',  rawValue:'Discontinued' }, C6:{ value:'5500',         rawValue:'5500'         },
    },
  },

  // ─── LEVEL 3 — ADVANCED ──────────────────────────────────────────────────────

  {
    id: 'f17', level: 3, title: 'Highlight Cells Above Target', xp: 85, difficulty: 'Advanced',
    scenario: 'Your KPI target is $150,000. Any Q3 value above target should auto-highlight. Use conditional formatting on the Q3 column.',
    requiredShortcuts: ['alt-h-l-n'],
    steps: [
      { id:'s1', cells:['D2','D3','D4','D5'], shortcut:'alt-h-l-n', effect:'conditional-format', label:'Select D2:D5 → Conditional formatting (Alt→H→L→N)', points:100 },
    ],
  },

  {
    id: 'f18', level: 3, title: 'Apply a Table Style', xp: 85, difficulty: 'Advanced',
    scenario: 'Raw data tables look amateur. Format the dataset as an official Excel Table with banded rows and filter arrows using the Format as Table shortcut.',
    requiredShortcuts: ['alt-h-t'],
    steps: [
      { id:'s1', cells:['A1','B1','C1','D1','E1','A2','B2','C2','D2','E2'], shortcut:'alt-h-t', effect:'conditional-format', label:'Select A1:E6 → Format as Table (Alt→H→T)', points:100 },
    ],
  },

  {
    id: 'f19', level: 3, title: 'AutoFit All Columns', xp: 75, difficulty: 'Advanced',
    scenario: 'After pasting new data, several columns show "######". AutoFit every column so all content is visible.',
    requiredShortcuts: ['ctrl-a','alt-h-o-i'],
    steps: [
      { id:'s1', cells:['A1','B1','C1','D1','E1'], shortcut:'alt-h-o-i', effect:'general-format', label:'Select all → AutoFit columns (Ctrl+A then Alt→H→O→I)', points:100 },
    ],
    initialGrid: {
      ...base(),
      B2:{ value:'######', rawValue:'124000' }, C2:{ value:'######', rawValue:'156000' }, D2:{ value:'######', rawValue:'182000' },
      B3:{ value:'######', rawValue:'98000'  }, C3:{ value:'######', rawValue:'112000' }, D3:{ value:'######', rawValue:'134000' },
      B4:{ value:'######', rawValue:'167000' }, C4:{ value:'######', rawValue:'198000' }, D4:{ value:'######', rawValue:'221000' },
      B5:{ value:'######', rawValue:'89000'  }, C5:{ value:'######', rawValue:'104000' }, D5:{ value:'######', rawValue:'128000' },
    },
  },

  {
    id: 'f20', level: 3, title: 'Freeze the Header Row', xp: 75, difficulty: 'Advanced',
    scenario: 'The report has 50+ rows. When scrolling, the column headers disappear. Freeze Row 1 so it stays visible at all times.',
    requiredShortcuts: ['alt-w-f-f'],
    steps: [
      { id:'s1', cells:['A1','B1','C1','D1','E1'], shortcut:'alt-w-f-f', effect:'bold', label:'Click A2 then freeze panes (Alt→W→F→F)', points:100 },
    ],
  },

  {
    id: 'f21', level: 3, title: 'Custom Number Format — Thousands', xp: 90, difficulty: 'Advanced',
    scenario: 'Finance wants B2:E5 to show values in thousands — e.g. 124000 should display as 124. Use Ctrl+1 to open Format Cells and apply a custom number format.',
    requiredShortcuts: ['ctrl-1'],
    steps: [
      { id:'s1', cells:['B2','C2','D2','E2','B3','C3','D3','E3','B4','C4','D4','E4','B5','C5','D5','E5'], shortcut:'ctrl-1', effect:'general-format', label:'Select B2:E5 → Format Cells (Ctrl+1) → Custom → 0"k"', points:100 },
    ],
  },

  {
    id: 'f22', level: 3, title: 'Format as Time Value', xp: 85, difficulty: 'Advanced',
    scenario: 'Column F contains call durations stored as decimals (0.0347 = 50 minutes). Format them to display as HH:MM time values.',
    requiredShortcuts: ['ctrl-shift-at'],
    steps: [
      { id:'s1', cells:['F2','F3','F4','F5'], shortcut:'ctrl-shift-at', effect:'date-format', label:'Select F2:F5 → Time format (Ctrl+Shift+@)', points:100 },
    ],
    initialGrid: {
      ...base(),
      F1:{ value:'Call Duration', rawValue:'Call Duration' },
      F2:{ value:'0.0347', rawValue:'0.0347' }, F3:{ value:'0.0625', rawValue:'0.0625' },
      F4:{ value:'0.0208', rawValue:'0.0208' }, F5:{ value:'0.0486', rawValue:'0.0486' },
    },
  },

  {
    id: 'f23', level: 3, title: 'Conditional Color Scale', xp: 90, difficulty: 'Advanced',
    scenario: 'Show the entire B2:D5 range as a color scale — lowest values red, highest values green, mid values yellow. Use conditional formatting.',
    requiredShortcuts: ['alt-h-l-n'],
    steps: [
      { id:'s1', cells:['B2','C2','D2','B3','C3','D3','B4','C4','D4','B5','C5','D5'], shortcut:'alt-h-l-n', effect:'conditional-format', label:'Select B2:D5 → Conditional color scale (Alt→H→L→N)', points:100 },
    ],
  },

  {
    id: 'f24', level: 3, title: 'Advanced Full Report Build', xp: 150, difficulty: 'Advanced Boss Task',
    scenario: 'The Advanced Boss Task. Apply professional-grade formatting to a raw management report using only keyboard shortcuts: merge title, bold headers, table style, conditional formatting, borders, and wrap notes.',
    requiredShortcuts: ['alt-h-m-c','ctrl-b','alt-h-h','alt-h-t','alt-h-l-n','alt-h-b-a','alt-h-w'],
    steps: [
      { id:'s1', cells:['A1','B1','C1','D1','E1'],                                                       shortcut:'alt-h-m-c', effect:'merge-center',    label:'A1:E1 → Merge & center title (Alt→H→M→C)', points:15 },
      { id:'s2', cells:['A2','B2','C2','D2','E2'],                                                       shortcut:'ctrl-b',    effect:'bold',            label:'A2:E2 → Bold headers (Ctrl+B)',             points:10 },
      { id:'s3', cells:['A1'],                                                                            shortcut:'alt-h-h',   effect:'conditional-format',label:'A1 → Title fill color (Alt→H→H)',          points:15 },
      { id:'s4', cells:['A2','B2','C2','D2','E2'],                                                       shortcut:'alt-h-t',   effect:'conditional-format',label:'A2:E2 → Table style (Alt→H→T)',            points:10 },
      { id:'s5', cells:['D3','D4','D5','D6'],                                                            shortcut:'alt-h-l-n', effect:'conditional-format',label:'D3:D6 → Conditional formatting (Alt→H→L→N)',points:20 },
      { id:'s6', cells:['A2','B2','C2','D2','E2','A3','B3','C3','D3','E3','A4','B4','C4','D4','E4','A5','B5','C5','D5','E5','A6','B6','C6','D6','E6'],
        shortcut:'alt-h-b-a', effect:'all-borders', label:'A2:E6 → All borders (Alt→H→B→A)', points:15 },
      { id:'s7', cells:['F2','F3','F4','F5','F6'],                                                       shortcut:'alt-h-w',   effect:'wrap-text',       label:'F2:F6 → Wrap notes column (Alt→H→W)',       points:15 },
    ],
    initialGrid: {
      A1:{ value:'Q3 Management Report', rawValue:'Q3 Management Report' },
      A2:{ value:'Region',  rawValue:'Region'  }, B2:{ value:'Q1',     rawValue:'Q1'     }, C2:{ value:'Q2',     rawValue:'Q2'     }, D2:{ value:'Q3',     rawValue:'Q3'     }, E2:{ value:'Total',  rawValue:'Total'  }, F2:{ value:'Regional performance has been consistent with projections', rawValue:'Regional performance has been consistent with projections' },
      A3:{ value:'North',   rawValue:'North'   }, B3:{ value:'124000', rawValue:'124000' }, C3:{ value:'156000', rawValue:'156000' }, D3:{ value:'182000', rawValue:'182000' }, E3:{ value:'462000', rawValue:'462000' }, F3:{ value:'Exceeded Q3 target by 21% due to enterprise contract wins', rawValue:'Exceeded Q3 target by 21% due to enterprise contract wins' },
      A4:{ value:'South',   rawValue:'South'   }, B4:{ value:'98000',  rawValue:'98000'  }, C4:{ value:'112000', rawValue:'112000' }, D4:{ value:'134000', rawValue:'134000' }, E4:{ value:'344000', rawValue:'344000' }, F4:{ value:'Below target — regional disruption impacted Q3 delivery', rawValue:'Below target — regional disruption impacted Q3 delivery' },
      A5:{ value:'East',    rawValue:'East'    }, B5:{ value:'167000', rawValue:'167000' }, C5:{ value:'198000', rawValue:'198000' }, D5:{ value:'221000', rawValue:'221000' }, E5:{ value:'586000', rawValue:'586000' }, F5:{ value:'Top performer for third consecutive quarter', rawValue:'Top performer for third consecutive quarter' },
      A6:{ value:'West',    rawValue:'West'    }, B6:{ value:'89000',  rawValue:'89000'  }, C6:{ value:'104000', rawValue:'104000' }, D6:{ value:'128000', rawValue:'128000' }, E6:{ value:'321000', rawValue:'321000' }, F6:{ value:'New market — accelerated growth expected in Q4', rawValue:'New market — accelerated growth expected in Q4' },
    },
  },
];
