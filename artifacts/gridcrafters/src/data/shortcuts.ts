export const SHORTCUTS = {
  rookie: [
    { id:'ctrl-up',    keys:['Ctrl','↑'],         label:'Move to top end',        type:'chord', baseXP:15, tip:'Arrow = direction' },
    { id:'ctrl-down',  keys:['Ctrl','↓'],         label:'Move to bottom end',     type:'chord', baseXP:15, tip:'Arrow = direction' },
    { id:'ctrl-right', keys:['Ctrl','→'],         label:'Move to right end',      type:'chord', baseXP:15, tip:'Arrow = direction' },
    { id:'ctrl-left',  keys:['Ctrl','←'],         label:'Move to left end',       type:'chord', baseXP:15, tip:'Arrow = direction' },
    { id:'ctrl-c',     keys:['Ctrl','C'],          label:'Copy',                   type:'chord', baseXP:15, tip:'C = Copy' },
    { id:'ctrl-v',     keys:['Ctrl','V'],          label:'Paste',                  type:'chord', baseXP:15, tip:'V is right of C on keyboard' },
    { id:'ctrl-x',     keys:['Ctrl','X'],          label:'Cut',                    type:'chord', baseXP:15, tip:'X = cut like scissors' },
    { id:'ctrl-s',     keys:['Ctrl','S'],          label:'Save',                   type:'chord', baseXP:20, tip:'S = Save' },
    { id:'ctrl-p',     keys:['Ctrl','P'],          label:'Print',                  type:'chord', baseXP:15, tip:'P = Print' },
    { id:'ctrl-z',     keys:['Ctrl','Z'],          label:'Undo last action',       type:'chord', baseXP:15, tip:'Z = last letter = undo' },
    { id:'ctrl-y',     keys:['Ctrl','Y'],          label:'Redo last action',       type:'chord', baseXP:15, tip:'Y = redo after Z' },
    { id:'ctrl-a',     keys:['Ctrl','A'],          label:'Select all',             type:'chord', baseXP:15, tip:'A = All' },
    { id:'ctrl-space', keys:['Ctrl','Space'],      label:'Select entire column',   type:'chord', baseXP:20, tip:'Space = fills the column' },
    { id:'shift-space',keys:['Shift','Space'],     label:'Select entire row',      type:'chord', baseXP:20, tip:'Shift stretches out the row' },
    { id:'delete',     keys:['Delete'],            label:'Delete cell content',    type:'chord', baseXP:10, tip:'Delete key = delete contents' },
    { id:'f2',         keys:['F2'],                label:'Edit cell',              type:'chord', baseXP:15, tip:'F2 = edit mode' },
    { id:'esc',        keys:['Esc'],               label:'Close edit mode',        type:'chord', baseXP:10, tip:'Esc = escape' },
    // ── Study-only (no challenge scenario) ──
    { id:'ctrl-f4',    keys:['Ctrl','F4'],         label:'Save As',                type:'chord', baseXP:0,  tip:'Opens Save As dialog to save a copy with a new name or format', studyOnly: true },
    { id:'f1',         keys:['F1'],                label:'Open Help',              type:'chord', baseXP:0,  tip:'F1 opens the Excel Help pane in any context', studyOnly: true },
    { id:'right-click',keys:['Right Click'],       label:'Open context menu',      type:'chord', baseXP:0,  tip:'Right-click (or Shift+F10) opens the context menu for the selection', studyOnly: true },
  ],
  intermediate: [
    { id:'ctrl-b',           keys:['Ctrl','B'],              label:'Bold',                      type:'chord',    baseXP:20, tip:'B = Bold' },
    { id:'ctrl-i',           keys:['Ctrl','I'],              label:'Italic',                    type:'chord',    baseXP:20, tip:'I = Italic' },
    { id:'ctrl-u',           keys:['Ctrl','U'],              label:'Underline',                 type:'chord',    baseXP:20, tip:'U = Underline' },
    { id:'ctrl-exclaim',     keys:['Ctrl','!'],              label:'Open format menu',          type:'chord',    baseXP:25, tip:'! = special = format', studyOnly: true },
    { id:'ctrl-shift-at',    keys:['Ctrl','@'],              label:'Format as time value',      type:'chord',    baseXP:25, tip:'@ = clock = time' },
    { id:'ctrl-shift-hash',  keys:['Ctrl','#'],              label:'Format as date value',      type:'chord',    baseXP:25, tip:'# = calendar grid = date' },
    { id:'ctrl-shift-dollar',keys:['Ctrl','$'],              label:'Format as currency',        type:'chord',    baseXP:25, tip:'$ = dollar = currency', studyOnly: true },
    { id:'ctrl-shift-pct',   keys:['Ctrl','%'],              label:'Format as percentage',      type:'chord',    baseXP:25, tip:'% = percent' },
    { id:'alt-h-o-i',        keys:['Alt','H','O','I'],       label:'Adjust cell width (AutoFit)',type:'sequence', baseXP:35, tip:'H=Home, O=Format, I=AutoFit Column' },
    { id:'alt-h-b-a',        keys:['Alt','H','B','A'],       label:'Apply all borders',         type:'sequence', baseXP:30, tip:'H=Home, B=Borders, A=All Borders' },
    { id:'alt-h-f-c',        keys:['Alt','H','F','C'],       label:'Change font color',         type:'sequence', baseXP:30, tip:'H=Home, F=Font, C=Color' },
    { id:'alt-h-h',          keys:['Alt','H','H'],           label:'Change cell color (fill)',   type:'sequence', baseXP:30, tip:'H=Home, H=Highlight/fill' },
    { id:'alt-h-a-c',        keys:['Alt','H','A','C'],       label:'Align text to center',      type:'sequence', baseXP:30, tip:'H=Home, A=Align, C=Center' },
    { id:'alt-h-m-c',        keys:['Alt','H','M','C'],       label:'Merge & center cells',      type:'sequence', baseXP:35, tip:'H=Home, M=Merge, C=Center' },
    { id:'alt-h-w',          keys:['Alt','H','W'],           label:'Wrap text',                 type:'sequence', baseXP:25, tip:'H=Home, W=Wrap' },
    { id:'alt-h-l-n',        keys:['Alt','H','L','N'],       label:'Add conditional formatting',type:'sequence', baseXP:40, tip:'H=Home, L=cond. formatting, N=New Rule' },
    { id:'alt-h-t',          keys:['Alt','H','T'],           label:'Format as table',           type:'sequence', baseXP:35, tip:'H=Home, T=Table' },
    // ── Formatting — study-only ──
    { id:'alt-h-f-f',        keys:['Alt','H','F','F'],       label:'Change font style',         type:'sequence', baseXP:0,  tip:'H=Home, F=Font group, F=Font face dropdown', studyOnly: true },
    { id:'alt-h-f-s',        keys:['Alt','H','F','S'],       label:'Change font size',          type:'sequence', baseXP:0,  tip:'H=Home, F=Font group, S=font Size field', studyOnly: true },
    { id:'alt-h-j',          keys:['Alt','H','J'],           label:'Style cell',                type:'sequence', baseXP:0,  tip:'H=Home, J=cell styles gallery', studyOnly: true },
    // ── Insert & Layout — study-only ──
    { id:'alt-n-p',          keys:['Alt','N','P'],           label:'Insert picture',            type:'sequence', baseXP:0,  tip:'N=Insert, P=Pictures', studyOnly: true },
    { id:'alt-n-s-h',        keys:['Alt','N','S','H'],       label:'Insert shape',              type:'sequence', baseXP:0,  tip:'N=Insert, S=Illustrations, H=sHapes', studyOnly: true },
    { id:'alt-n-s-c',        keys:['Alt','N','S','C'],       label:'Insert chart',              type:'sequence', baseXP:0,  tip:'N=Insert, S=charts group, C=Charts dialog', studyOnly: true },
    { id:'alt-n-x',          keys:['Alt','N','X'],           label:'Insert text box',           type:'sequence', baseXP:0,  tip:'N=Insert, X=teXt box', studyOnly: true },
    { id:'alt-n-j',          keys:['Alt','N','J'],           label:'Insert object',             type:'sequence', baseXP:0,  tip:'N=Insert, J=object (obJect)', studyOnly: true },
    { id:'alt-n-u',          keys:['Alt','N','U'],           label:'Insert symbol',             type:'sequence', baseXP:0,  tip:'N=Insert, U=sUmbols', studyOnly: true },
    { id:'alt-n-h',          keys:['Alt','N','H'],           label:'Insert header & footer',    type:'sequence', baseXP:0,  tip:'N=Insert, H=Header & footer', studyOnly: true },
    { id:'alt-w-v-h',        keys:['Alt','W','V','H'],       label:'Hide/unhide headings',      type:'sequence', baseXP:0,  tip:'W=View, V=Show group, H=Headings checkbox', studyOnly: true },
    { id:'alt-w-v-g',        keys:['Alt','W','V','G'],       label:'Hide/unhide gridlines',     type:'sequence', baseXP:0,  tip:'W=View, V=Show group, G=Gridlines checkbox', studyOnly: true },
    { id:'alt-w-q-c',        keys:['Alt','W','Q','C'],       label:'Change zoom level',         type:'sequence', baseXP:0,  tip:'W=View, Q=Zoom group, C=Custom zoom dialog', studyOnly: true },
    { id:'alt-w-f-i',        keys:['Alt','W','F','I'],       label:'Page break view',           type:'sequence', baseXP:0,  tip:'W=View, F=Workbook views, I=Page break prevIew', studyOnly: true },
    { id:'alt-w-f-c',        keys:['Alt','W','F','C'],       label:'Custom view',               type:'sequence', baseXP:0,  tip:'W=View, F=Workbook views, C=Custom views', studyOnly: true },
    { id:'alt-w-f-p',        keys:['Alt','W','F','P'],       label:'Page layout view',          type:'sequence', baseXP:0,  tip:'W=View, F=Workbook views, P=Page Layout', studyOnly: true },
    { id:'alt-w-a',          keys:['Alt','W','A'],           label:'Arrange windows',           type:'sequence', baseXP:0,  tip:'W=View, A=Arrange All windows', studyOnly: true },
  ],
  advanced: [
    { id:'shift-f3',    keys:['Shift','F3'],         label:'Insert function dialog',   type:'chord',    baseXP:35, tip:'Opens function search — find any formula' },
    { id:'alt-equals',  keys:['Alt','='],             label:'AutoSum selected range',   type:'chord',    baseXP:35, tip:'Alt+= inserts =SUM() instantly' },
    { id:'alt-n-v',     keys:['Alt','N','V'],         label:'Insert pivot table',       type:'sequence', baseXP:40, tip:'N=Insert, V=PivotTable' },
    { id:'alt-n-t',     keys:['Alt','N','T'],         label:'Insert table',             type:'sequence', baseXP:35, tip:'N=Insert, T=Table' },
    { id:'alt-n-i',     keys:['Alt','N','I'],         label:'Insert hyperlink',         type:'sequence', baseXP:30, tip:'N=Insert, I=hIperlink' },
    { id:'alt-w-v-f',   keys:['Alt','W','V','F'],     label:'Hide/unhide formula bar',  type:'sequence', baseXP:35, tip:'W=View, V=Show, F=Formula Bar' },
    { id:'alt-w-f-f',   keys:['Alt','W','F','F'],     label:'Freeze panes',             type:'sequence', baseXP:40, tip:'W=View, F=Freeze, F=Freeze Panes' },
    { id:'alt-d-f-f',   keys:['Alt','D','F','F'],     label:'Toggle AutoFilter',        type:'sequence', baseXP:35, tip:'D=Data, F=Filter, F=AutoFilter' },
    { id:'alt-a-v-v',   keys:['Alt','A','V','V'],     label:'Insert data validation',   type:'sequence', baseXP:40, tip:'A=Data, V=Validation, V=Data Validation' },
    { id:'alt-a-m',     keys:['Alt','A','M'],         label:'Remove duplicates',        type:'sequence', baseXP:35, tip:'A=Data, M=reMove duplicates' },
    { id:'alt-a-r-a',   keys:['Alt','A','R','A'],     label:'Refresh all connections',  type:'sequence', baseXP:30, tip:'A=Data, R=Refresh, A=Refresh All' },
    { id:'alt-a-e',     keys:['Alt','A','E'],         label:'Text to columns',          type:'sequence', baseXP:35, tip:'A=Data, E=tExt to columns' },
    { id:'alt-a-g',     keys:['Alt','A','G'],         label:'Group rows & columns',     type:'sequence', baseXP:35, tip:'A=Data, G=Group' },
    { id:'alt-a-u',     keys:['Alt','A','U'],         label:'Ungroup rows & columns',   type:'sequence', baseXP:35, tip:'A=Data, U=Ungroup' },
    { id:'alt-a-s-s',   keys:['Alt','A','S','S'],     label:'Sort dialog',              type:'sequence', baseXP:30, tip:'A=Data, S=Sort, S=Sort again' },
    { id:'alt-m-n',     keys:['Alt','M','N'],         label:'Name manager',             type:'sequence', baseXP:40, tip:'M=Formulas, N=Name manager' },
    { id:'alt-m-r',     keys:['Alt','M','R'],         label:'Recently used functions',  type:'sequence', baseXP:35, tip:'M=Formulas, R=Recent' },
    { id:'alt-m-i',     keys:['Alt','M','I'],         label:'Financial functions',      type:'sequence', baseXP:40, tip:'M=Formulas, I=fInancial' },
  ],
  expert: [
    // Absolute reference — critical for VLOOKUP table_array locking
    { id:'f4-ref',           keys:['F4'],                   label:'Toggle $absolute reference',     type:'chord',    baseXP:55, tip:'F4 cycles A1 → $A$1 → A$1 → $A1. Essential for VLOOKUP.' },
    // Array formula — old-style INDEX/MATCH
    { id:'ctrl-shift-enter', keys:['Ctrl','Shift','Enter'], label:'Confirm as array formula {CSE}', type:'chord',    baseXP:60, tip:'Required for multi-cell INDEX/MATCH in Excel <365' },
    // Formula view — see all VLOOKUPs at once
    { id:'ctrl-backtick',    keys:['Ctrl','`'],             label:'Toggle show all formulas',        type:'chord',    baseXP:45, tip:'Backtick (`) reveals VLOOKUP, IF, IFERROR text' },
    // Recalculate
    { id:'f9-calc',          keys:['F9'],                   label:'Recalculate all formulas',        type:'chord',    baseXP:35, tip:'Forces all VLOOKUP / IF results to refresh' },
    { id:'shift-f9',         keys:['Shift','F9'],           label:'Recalculate active sheet only',   type:'chord',    baseXP:40, tip:'Faster than F9 — only current sheet' },
    // Evaluate
    { id:'alt-m-v-e',        keys:['Alt','M','V'],          label:'Open Lookup & Reference (VLOOKUP, XLOOKUP, INDEX, MATCH)', type:'sequence', baseXP:60, tip:'M=Formulas, V=lookup & reference functions' },
    { id:'alt-m-l',          keys:['Alt','M','L'],          label:'Open Logical functions (IF, AND, OR, TRUE, FALSE)', type:'sequence', baseXP:55, tip:'M=Formulas, L=Logical — access IF / IFERROR' },
    { id:'alt-m-g',          keys:['Alt','M','G'],          label:'Open Information functions (ISBLANK, ISNUMBER, ISERROR)', type:'sequence', baseXP:55, tip:'M=Formulas, G=information (iG?) — ISBLANK / ISERROR' },
    // Navigate formula dependencies
    { id:'ctrl-open-bracket',keys:['Ctrl','['],             label:'Jump to precedent cells',         type:'chord',    baseXP:50, tip:'Select cells that feed into the current formula' },
    { id:'ctrl-close-bracket',keys:['Ctrl',']'],            label:'Jump to dependent cells',         type:'chord',    baseXP:50, tip:'Select cells that use this cell in their formula' },
    // Go To — navigate to named ranges used in VLOOKUP
    { id:'ctrl-g',           keys:['Ctrl','G'],             label:'Go To dialog (named ranges)',      type:'chord',    baseXP:40, tip:'Ctrl+G to jump to lookup table by name' },
    // Name ranges (used in XLOOKUP table arrays)
    { id:'ctrl-f3',          keys:['Ctrl','F3'],            label:'Open Name Manager',               type:'chord',    baseXP:50, tip:'Manage named ranges used in XLOOKUP / VLOOKUP' },
    { id:'ctrl-shift-f3',    keys:['Ctrl','Shift','F3'],    label:'Create names from selection',     type:'chord',    baseXP:50, tip:'Instantly name a lookup table from its header row' },
    // Number formatting
    { id:'ctrl-1',           keys:['Ctrl','1'],             label:'Open Format Cells dialog',        type:'chord',    baseXP:45, tip:'Ctrl+1 = fastest route to custom number formats' },
    { id:'ctrl-shift-tilde', keys:['Ctrl','~'],             label:'Apply General number format',     type:'chord',    baseXP:40, tip:'~ removes all number formatting, shows raw value' },
    { id:'ctrl-shift-caret', keys:['Ctrl','^'],             label:'Apply Scientific notation',       type:'chord',    baseXP:45, tip:'^ = exponent symbol → scientific notation' },
    // ── Data & Formulas — study-only ──
    { id:'alt-m-t',          keys:['Alt','M','T'],          label:'Text functions',                  type:'sequence', baseXP:0,  tip:'M=Formulas, T=Text functions (LEFT, RIGHT, MID, LEN)', studyOnly: true },
    { id:'alt-m-e',          keys:['Alt','M','E'],          label:'Date & time functions',           type:'sequence', baseXP:0,  tip:'M=Formulas, E=datE & timE (TODAY, NOW, EDATE)', studyOnly: true },
    { id:'alt-m-o',          keys:['Alt','M','O'],          label:'More lookup functions',           type:'sequence', baseXP:0,  tip:'M=Formulas, O=lOOkup & reference submenu', studyOnly: true },
    { id:'alt-m-q',          keys:['Alt','M','Q'],          label:'More functions library',          type:'sequence', baseXP:0,  tip:'M=Formulas, Q=more functions (statistical, engineering)', studyOnly: true },
    { id:'alt-a-b',          keys:['Alt','A','B'],          label:'Add subtotal',                    type:'sequence', baseXP:0,  tip:'A=Data, B=suBtotal — groups rows with subtotal formulas', studyOnly: true },
  ],
};

export const CHALLENGE_SCENARIOS: Record<string, any> = {
  // ── ROOKIE ──────────────────────────────────────────────────────────────
  'ctrl-c':     { scenario:'Your manager needs row 4 (East region) duplicated in the summary sheet.', instruction:'Copy the selected cells using only the keyboard', preSelectedCells:['A4','B4','C4','D4','E4'], expectedEffect:'copy-marquee' },
  'ctrl-v':     { scenario:'You copied the East row and now need to paste it into cell A8.', instruction:'Paste the clipboard content into the selected cell', preSelectedCells:['A6'], expectedEffect:'general-format' },
  'ctrl-x':     { scenario:'The West row was placed in the wrong position — move it up by cutting first.', instruction:'Cut the selected row using only the keyboard', preSelectedCells:['A5','B5','C5','D5','E5'], expectedEffect:'copy-marquee' },
  'ctrl-z':     { scenario:'You just deleted the TOTAL row by mistake. Bring it back immediately.', instruction:'Undo the last action', preSelectedCells:['A6'], expectedEffect:'undo-revert' },
  'ctrl-y':     { scenario:'You undid a currency format but now the director wants it back.', instruction:'Redo the last undone action', preSelectedCells:['B2'], expectedEffect:'currency-format' },
  'ctrl-s':     { scenario:"It's been 10 minutes since you last saved. A power cut could lose your work.", instruction:'Save the workbook using only the keyboard', preSelectedCells:['A1'], expectedEffect:'copy-marquee' },
  'ctrl-a':     { scenario:'You need to copy the entire spreadsheet to a new workbook.', instruction:'Select all cells using only the keyboard', preSelectedCells:['A1'], expectedEffect:'select-column' },
  'ctrl-space': { scenario:'You need to select the entire Q1 column to apply currency format to all values.', instruction:'Select the entire column of the active cell', preSelectedCells:['B3'], expectedEffect:'select-column' },
  'shift-space':{ scenario:'You need to bold the entire North data row to highlight it for the board.', instruction:'Select the entire row of the active cell', preSelectedCells:['C2'], expectedEffect:'select-row' },
  'ctrl-up':    { scenario:'The spreadsheet has 500 rows. Jump to the first data row without scrolling.', instruction:'Jump to the topmost non-empty cell in the column', preSelectedCells:['B5'], expectedEffect:'general-format' },
  'ctrl-down':  { scenario:'Jump to the last row of your dataset in one keystroke.', instruction:'Jump to the bottommost non-empty cell in the column', preSelectedCells:['B1'], expectedEffect:'general-format' },
  'ctrl-right': { scenario:'Jump to the last column of data in the current row.', instruction:'Jump to the rightmost non-empty cell in the row', preSelectedCells:['A3'], expectedEffect:'general-format' },
  'ctrl-left':  { scenario:'You are at column F and need to get back to the label column instantly.', instruction:'Jump to the leftmost non-empty cell in the row', preSelectedCells:['E3'], expectedEffect:'general-format' },
  'ctrl-p':     { scenario:"The CFO needs a printed copy of this report for the board meeting in 5 minutes.", instruction:'Open the Print dialog using only the keyboard', preSelectedCells:['A1'], expectedEffect:'general-format' },
  'ctrl-f4':    { scenario:'You need to save this as a new file with a different name for version control.', instruction:'Open the Save As dialog', preSelectedCells:['A1'], expectedEffect:'general-format' },
  'delete':     { scenario:'Cell B3 has a test value that needs to be cleared before the real data is entered.', instruction:'Delete the content of the selected cell', preSelectedCells:['B3'], expectedEffect:'general-format' },
  'f2':         { scenario:'You need to correct a typo inside cell A4 without retyping the whole value.', instruction:'Enter edit mode on the active cell', preSelectedCells:['A4'], expectedEffect:'general-format' },
  'esc':        { scenario:"You accidentally started editing a formula. Exit without saving the changes.", instruction:'Exit edit mode without changing the cell', preSelectedCells:['A1'], expectedEffect:'general-format' },

  // ── INTERMEDIATE ─────────────────────────────────────────────────────────
  'ctrl-b':           { scenario:'The header row needs to stand out from the data rows.', instruction:'Bold the selected header cells', preSelectedCells:['A1','B1','C1','D1','E1'], expectedEffect:'bold' },
  'ctrl-i':           { scenario:'The TOTAL row label should be italicised to show it is a calculated value.', instruction:'Italicise the selected cells', preSelectedCells:['A6','B6','C6','D6','E6'], expectedEffect:'italic' },
  'ctrl-u':           { scenario:'Underline the column headers so they look like a proper table.', instruction:'Apply underline formatting to the selected cells', preSelectedCells:['A1','B1','C1','D1','E1'], expectedEffect:'underline' },
  'ctrl-exclaim':     { scenario:'The numbers in Q1 need commas and decimal places. Open the format dialog.', instruction:'Open the Format Cells number dialog', preSelectedCells:['B2','B3','B4','B5'], expectedEffect:'currency-format' },
  'ctrl-shift-at':    { scenario:'Column D should display time values, not plain numbers.', instruction:'Apply time format to the selected cells', preSelectedCells:['D2','D3','D4','D5'], expectedEffect:'date-format' },
  'ctrl-shift-hash':  { scenario:'The audit team needs these values displayed as calendar dates.', instruction:'Apply date format to the selected cells', preSelectedCells:['C2','C3','C4','C5'], expectedEffect:'date-format' },
  'ctrl-shift-dollar':{ scenario:'Q1 revenue figures look like plain numbers. Format them as currency.', instruction:'Apply currency format to the selected cells', preSelectedCells:['B2','B3','B4','B5'], expectedEffect:'currency-format' },
  'ctrl-shift-pct':   { scenario:'These decimal growth rates need to display as percentages for the slide deck.', instruction:'Apply percentage format to the selected cells', preSelectedCells:['C2','C3','C4','C5'], expectedEffect:'percent-format' },
  'alt-h-o-i':        { scenario:'Column A is too narrow — the region names are being cut off.', instruction:'Auto-fit the column width', preSelectedCells:['A1','A2','A3','A4','A5','A6'], expectedEffect:'general-format' },
  'alt-h-b-a':        { scenario:'The board report needs a proper bordered table layout.', instruction:'Apply all borders', preSelectedCells:['A1','B1','C1','D1','E1','A2','B2','C2','D2','E2'], expectedEffect:'all-borders' },
  'alt-h-f-c':        { scenario:'Negative numbers in the variance column should be shown in red.', instruction:'Open the font colour picker', preSelectedCells:['B5','C5','D5'], expectedEffect:'bold' },
  'alt-h-h':          { scenario:'Highlight the top-performing region row so it pops on screen.', instruction:'Open the cell fill colour picker', preSelectedCells:['A4','B4','C4','D4','E4'], expectedEffect:'conditional-format' },
  'alt-h-a-c':        { scenario:'The report title in A1 should be centred across the data range.', instruction:'Centre-align the text', preSelectedCells:['A1','B1','C1','D1','E1'], expectedEffect:'center-align' },
  'alt-h-m-c':        { scenario:'The report title should span all five columns as a single merged cell.', instruction:'Merge and centre the cells', preSelectedCells:['A1','B1','C1','D1','E1'], expectedEffect:'merge-center' },
  'alt-h-w':          { scenario:'The long description in column A is overflowing. Wrap it so nothing is hidden.', instruction:'Wrap the text in the selected cells', preSelectedCells:['A2','A3','A4','A5'], expectedEffect:'wrap-text' },
  'alt-h-l-n':        { scenario:'Flag any Q1 value over 150 in green, and under 100 in red.', instruction:'Add a new conditional formatting rule', preSelectedCells:['B2','B3','B4','B5'], expectedEffect:'conditional-format' },
  'alt-h-t':          { scenario:'Convert the data range into a formatted Excel Table for easier filtering.', instruction:'Format the selected range as a table', preSelectedCells:['A1','B1','C1','D1','E1'], expectedEffect:'all-borders' },

  // ── ADVANCED ──────────────────────────────────────────────────────────────
  'shift-f3':   { scenario:'You need to insert a formula but cannot remember the exact function name.', instruction:'Open the Insert Function dialog', preSelectedCells:['E6'], expectedEffect:'autosum' },
  'alt-equals': { scenario:'The TOTAL row in B6 needs a SUM formula. Do it in one keystroke.', instruction:'Insert AutoSum formula for the selected cell', preSelectedCells:['B6'], expectedEffect:'autosum' },
  'alt-n-v':    { scenario:'Your manager wants a pivot table summarising region performance.', instruction:'Open the Insert PivotTable dialog', preSelectedCells:['A1'], expectedEffect:'general-format' },
  'alt-n-t':    { scenario:'Convert the data range into an Excel Table with filtering and auto-expand.', instruction:'Insert a Table', preSelectedCells:['A1'], expectedEffect:'all-borders' },
  'alt-n-i':    { scenario:'The source data in cell A4 should link to the original report URL.', instruction:'Insert a hyperlink', preSelectedCells:['A4'], expectedEffect:'underline' },
  'alt-w-v-f':  { scenario:'You want to hide the formula bar to give more screen space to the data.', instruction:'Toggle the formula bar', preSelectedCells:['A1'], expectedEffect:'general-format' },
  'alt-w-f-f':  { scenario:'Freeze row 1 so the headers stay visible when scrolling down 500 rows.', instruction:'Freeze panes', preSelectedCells:['A2'], expectedEffect:'general-format' },
  'alt-d-f-f':  { scenario:'The sales director wants to filter the data to show only the North region.', instruction:'Toggle AutoFilter', preSelectedCells:['A1'], expectedEffect:'general-format' },
  'alt-a-v-v':  { scenario:'Column B should only accept product codes starting with "P". Add validation.', instruction:'Open Data Validation', preSelectedCells:['B2','B3','B4','B5'], expectedEffect:'general-format' },
  'alt-a-m':    { scenario:'The imported dataset has duplicate region rows. Clean it up.', instruction:'Remove duplicates', preSelectedCells:['A1'], expectedEffect:'general-format' },
  'alt-a-r-a':  { scenario:"The data is connected to an external source. Refresh all to get today's figures.", instruction:'Refresh all connections', preSelectedCells:['A1'], expectedEffect:'general-format' },
  'alt-a-e':    { scenario:'The imported CSV has all values crammed into column A separated by commas.', instruction:'Open Text to Columns', preSelectedCells:['A2','A3','A4','A5'], expectedEffect:'general-format' },
  'alt-a-g':    { scenario:'Collapse Q2 and Q3 columns to focus on Q1 and Total for the exec summary.', instruction:'Group the selected columns', preSelectedCells:['C1','D1'], expectedEffect:'general-format' },
  'alt-a-u':    { scenario:'Expand the previously grouped columns to show all quarterly data again.', instruction:'Ungroup the selected columns', preSelectedCells:['C1','D1'], expectedEffect:'general-format' },
  'alt-a-s-s':  { scenario:'Sort the regions by Q1 revenue descending to rank best performers first.', instruction:'Open the Sort dialog', preSelectedCells:['B2','B3','B4','B5'], expectedEffect:'general-format' },
  'alt-m-n':    { scenario:'You have several named ranges for lookup tables. Review and clean them up.', instruction:'Open Name Manager', preSelectedCells:['A1'], expectedEffect:'general-format' },
  'alt-m-r':    { scenario:'You recently used VLOOKUP. Reinsert the same function type quickly.', instruction:'Open Recently Used Functions', preSelectedCells:['E2'], expectedEffect:'autosum' },
  'alt-m-i':    { scenario:'Calculate NPV and IRR for the investment proposal using financial functions.', instruction:'Open Financial Functions', preSelectedCells:['E6'], expectedEffect:'autosum' },

  // ── EXPERT ────────────────────────────────────────────────────────────────
  'f4-ref': {
    scenario: 'Your VLOOKUP formula in C2 references the lookup table D:E but when you copy down the reference shifts. Lock it.',
    instruction: 'Toggle the cell reference type to absolute',
    preSelectedCells: ['B2'],
    expectedEffect: 'absolute-ref'
  },
  'ctrl-shift-enter': {
    scenario: 'You wrote =INDEX(A2:A5,MATCH(D2,B2:B5,0)) but need it confirmed as an array formula for older Excel compatibility.',
    instruction: 'Confirm the formula as a CSE array formula',
    preSelectedCells: ['E2'],
    expectedEffect: 'array-formula'
  },
  'ctrl-backtick': {
    scenario: 'Three cells are returning wrong values. Toggle formula view to see all your VLOOKUP and IF formulas at once.',
    instruction: 'Toggle show-formulas mode',
    preSelectedCells: ['A1','B1','C1','D1','E1'],
    expectedEffect: 'show-formulas'
  },
  'f9-calc': {
    scenario: 'Your VLOOKUP results are showing stale values after you updated the lookup table. Force a recalculation.',
    instruction: 'Recalculate all formulas now',
    preSelectedCells: ['B2','B3','B4','B5'],
    expectedEffect: 'bold'
  },
  'shift-f9': {
    scenario: 'Only this sheet has changed. Recalculate just the active sheet to save time on this 20-tab workbook.',
    instruction: 'Recalculate only the active sheet',
    preSelectedCells: ['C2','C3'],
    expectedEffect: 'bold'
  },
  'alt-m-v-e': {
    scenario: 'You need to insert a VLOOKUP, XLOOKUP, INDEX, or MATCH function. Open the Lookup & Reference library.',
    instruction: 'Open Lookup & Reference functions',
    preSelectedCells: ['E2'],
    expectedEffect: 'lookup-function'
  },
  'alt-m-l': {
    scenario: 'You need to nest an IF function to flag TRUE/FALSE based on whether Q1 > 150. Open the Logical function library.',
    instruction: 'Open Logical functions',
    preSelectedCells: ['E2'],
    expectedEffect: 'logical-function'
  },
  'alt-m-g': {
    scenario: 'Some lookup results are returning #N/A or empty strings. Use an IS function (ISBLANK, ISERROR, ISNUMBER) to check them.',
    instruction: 'Open Information functions',
    preSelectedCells: ['E2','E3','E4'],
    expectedEffect: 'conditional-format'
  },
  'ctrl-open-bracket': {
    scenario: 'Cell E2 contains =VLOOKUP(A2,D:E,2,0). You want to inspect which cells it is pulling from.',
    instruction: 'Select the precedent cells that feed into this formula',
    preSelectedCells: ['E2'],
    expectedEffect: 'select-column'
  },
  'ctrl-close-bracket': {
    scenario: 'You changed the value in B4 and want to see which formulas on this sheet depend on it.',
    instruction: 'Select the cells that depend on this cell',
    preSelectedCells: ['B4'],
    expectedEffect: 'select-row'
  },
  'ctrl-g': {
    scenario: 'Your XLOOKUP references a named range called "PriceTable" but you are not sure where it is.',
    instruction: 'Open the Go To dialog to navigate to a named range',
    preSelectedCells: ['A1'],
    expectedEffect: 'general-format'
  },
  'ctrl-f3': {
    scenario: 'You have multiple named ranges (LookupTable, PriceList, CodeMap). Review and edit them before sharing.',
    instruction: 'Open Name Manager',
    preSelectedCells: ['A1'],
    expectedEffect: 'general-format'
  },
  'ctrl-shift-f3': {
    scenario: 'You selected the lookup table with its header row. Create a named range from the headers automatically.',
    instruction: 'Create names from the selection',
    preSelectedCells: ['D1','E1'],
    expectedEffect: 'bold'
  },
  'ctrl-1': {
    scenario: 'The numbers in column B need a custom format: show thousands separator, 1 decimal place, and the suffix "k".',
    instruction: 'Open the Format Cells dialog for custom number formats',
    preSelectedCells: ['B2','B3','B4','B5','B6'],
    expectedEffect: 'currency-format'
  },
  'ctrl-shift-tilde': {
    scenario: 'Cells B2:B5 are formatted as currency. Strip all formatting to reveal the raw numeric values.',
    instruction: 'Apply General format to remove all number formatting',
    preSelectedCells: ['B2','B3','B4','B5'],
    expectedEffect: 'general-format'
  },
  'ctrl-shift-caret': {
    scenario: 'The Total column (E6) holds the value 1713000. Display it in scientific notation for the engineering report.',
    instruction: 'Apply scientific notation format',
    preSelectedCells: ['E6'],
    expectedEffect: 'scientific-format'
  },
};
