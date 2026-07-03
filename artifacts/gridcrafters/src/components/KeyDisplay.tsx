const SHIFT_KEY_HINTS: Record<string, string> = {
  '!': 'Shift+1', '@': 'Shift+2', '#': 'Shift+3', '$': 'Shift+4',
  '%': 'Shift+5', '^': 'Shift+6', '&': 'Shift+7', '~': '`~ key',
};

interface KeyDisplayProps {
  keys: string[];
  pressedKeys?: string[];
  nextExpectedKey?: string;
  type: 'chord' | 'sequence';
}

export function KeyDisplay({ keys, pressedKeys = [], nextExpectedKey, type }: KeyDisplayProps) {
  const shiftHintKey = keys.find(k => SHIFT_KEY_HINTS[k]);
  const shiftHint    = shiftHintKey ? `Tip: ${shiftHintKey} = ${SHIFT_KEY_HINTS[shiftHintKey]} on your keyboard` : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div className="flex items-center gap-2 flex-wrap justify-center py-2">
        {keys.map((k, index) => {
          const normalised = k.toLowerCase();
          const isPressed = pressedKeys.some(p => p.toLowerCase() === normalised);
          const isNext = type === 'sequence' && k === nextExpectedKey;
          const isPast = type === 'sequence' && index < pressedKeys.length;

          let cls = 'key-cap';
          if (isPast) cls += ' correct';
          else if (isPressed && type === 'chord') cls += ' pressed';
          else if (isNext) cls += ' active';
          else if (type === 'sequence' && !isPressed && !isNext && index > pressedKeys.length) cls += ' waiting';

          return (
            <span key={`${k}-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span className={cls}>{k}</span>
              {index < keys.length - 1 && (
                <span style={{ color: '#6B7280', fontWeight: 700, fontSize: 18, lineHeight: 1 }}>
                  {type === 'chord' ? '+' : '→'}
                </span>
              )}
            </span>
          );
        })}
      </div>
      {shiftHint && (
        <div style={{
          fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#5a5650',
          letterSpacing: '0.3px',
        }}>
          {shiftHint}
        </div>
      )}
    </div>
  );
}
