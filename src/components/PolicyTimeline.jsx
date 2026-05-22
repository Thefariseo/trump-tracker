import { useState, useMemo } from 'react';
import { POLICY_EVENTS, ALL_POSITIONS } from '../data/unified';
import { POLITICAL_CONTEXT_EVENTS, getMergedTimeline } from '../data/politicalEvents';

// ─── Type config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  EXECUTIVE:    { label: 'Ordine Esecutivo', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', icon: '📜' },
  TARIFF:       { label: 'Dazi / Tariffe',   color: '#f97316', bg: 'rgba(249,115,22,0.08)',  icon: '⚖️' },
  REGULATORY:   { label: 'Normativa',        color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  icon: '📋' },
  MARKET:       { label: 'Mercato',          color: '#888888', bg: 'rgba(136,136,136,0.08)', icon: '📊' },
  GEOPOLITICAL: { label: 'Geopolitica',      color: '#ec4899', bg: 'rgba(236,72,153,0.08)',  icon: '🌍' },
  FINANCIAL:    { label: 'Banca Centrale',   color: '#14b8a6', bg: 'rgba(20,184,166,0.08)',  icon: '🏦' },
  CONFLICT:     { label: 'Conflitto',        color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   icon: '⚠️' },
  ALIGNMENT:    { label: 'Allineamento',     color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   icon: '🔗' },
};

const IMPACT_STYLE = {
  BULLISH: { label: 'RIALZISTA', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)' },
  BEARISH: { label: 'RIBASSISTA', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  NEUTRAL: { label: 'NEUTRO',    color: '#888',    bg: 'rgba(136,136,136,0.10)', border: 'rgba(136,136,136,0.2)' },
};

// ─── Build trade map: date → list of trades ───────────────────────────────────
function buildTradeMap() {
  const map = {};
  for (const pos of ALL_POSITIONS) {
    for (const d of pos.keyBuyDates ?? []) {
      if (!map[d]) map[d] = [];
      map[d].push({ ...pos, action: 'BUY' });
    }
    for (const d of pos.keySellDates ?? []) {
      if (!map[d]) map[d] = [];
      map[d].push({ ...pos, action: 'SELL' });
    }
  }
  return map;
}

// ─── Find trades within ±N days of an event date ────────────────────────────
function findNearbyTrades(eventDate, tradeMap, windowDays = 7) {
  const evD   = new Date(eventDate + 'T12:00:00Z').getTime();
  const found = [];
  for (const [date, trades] of Object.entries(tradeMap)) {
    const tD    = new Date(date + 'T12:00:00Z').getTime();
    const diff  = Math.round((evD - tD) / 86400000);
    if (diff >= 0 && diff <= windowDays) {
      found.push({ date, trades, daysBefore: diff });
    }
  }
  return found.sort((a, b) => a.daysBefore - b.daysBefore);
}

// ─── Trade proximity badge ────────────────────────────────────────────────────
function ProximityBadge({ days }) {
  if (days === 0) return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
      🔴 stesso giorno
    </span>
  );
  if (days <= 3) return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#f97316' }}>
      ⚡ {days}g prima
    </span>
  );
  return (
    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'rgba(136,136,136,0.1)', color: '#888' }}>
      📋 {days}g prima
    </span>
  );
}

// ─── Single timeline event card ───────────────────────────────────────────────
function TimelineEvent({ event, tradeMap, isLast }) {
  const [open, setOpen] = useState(false);
  const cfg    = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.MARKET;
  const impact = IMPACT_STYLE[event.impact] ?? IMPACT_STYLE.NEUTRAL;

  // Find correlated trades (bought within 7 days BEFORE this event)
  const nearbyTrades = useMemo(
    () => findNearbyTrades(event.date, tradeMap, 7),
    [event.date, tradeMap]
  );

  // Tickers from event + nearby trades
  const eventTickers = event.affectedTickers ?? [];
  const tradeTickers = [...new Set(nearbyTrades.flatMap(n => n.trades.map(t => t.ticker)))];
  const overlapTickers = eventTickers.filter(t => tradeTickers.includes(t));
  const hasConflict    = overlapTickers.length > 0 && nearbyTrades.some(n => n.daysBefore <= 3);

  const dateFormatted = new Date(event.date + 'T12:00:00Z').toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="flex gap-4 group">
      {/* ── Date column ──────────────────────────────────────────────── */}
      <div className="flex flex-col items-center flex-shrink-0 w-24 hidden sm:flex">
        <span className="text-[10px] font-bold text-[#555] text-right leading-tight">{dateFormatted}</span>
        {!isLast && <div className="w-px flex-1 bg-[#1e1e1e] mt-2 min-h-[32px]" />}
      </div>

      {/* ── Dot ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center flex-shrink-0 hidden sm:flex mt-0.5">
        <div
          className="w-3 h-3 rounded-full border-2 flex-shrink-0 transition-all"
          style={{
            borderColor: hasConflict ? '#ef4444' : cfg.color,
            background:  hasConflict ? 'rgba(239,68,68,0.25)' : `${cfg.color}20`,
          }}
        />
        {!isLast && <div className="w-px flex-1 bg-[#1e1e1e] mt-1 min-h-[32px]" />}
      </div>

      {/* ── Card ─────────────────────────────────────────────────────── */}
      <div className="flex-1 mb-4 sm:mb-5">
        {/* Mobile date */}
        <div className="text-[9px] font-bold text-[#444] mb-1 sm:hidden">{dateFormatted}</div>

        <button
          className="w-full text-left rounded-xl border transition-all hover:brightness-110 cursor-pointer"
          style={{
            background:  hasConflict ? 'rgba(239,68,68,0.06)' : cfg.bg,
            borderColor: hasConflict ? 'rgba(239,68,68,0.25)' : `${cfg.color}20`,
          }}
          onClick={() => setOpen(o => !o)}
        >
          <div className="p-4">
            {/* Top row */}
            <div className="flex items-start gap-3 mb-2">
              <span className="text-[18px] flex-shrink-0 mt-0.5">{cfg.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: impact.bg,
                      border:     `1px solid ${impact.border}`,
                      color:      impact.color,
                    }}
                  >
                    {impact.label}
                  </span>
                  {hasConflict && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                      ⚠ CORRELAZIONE SOSPETTA
                    </span>
                  )}
                </div>
                <div className="text-[13px] font-bold text-[#ddd] leading-snug">{event.title}</div>
              </div>
              <span className="text-[#444] text-xs flex-shrink-0">{open ? '▲' : '▼'}</span>
            </div>

            {/* Nearby trades preview (always visible) */}
            {nearbyTrades.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 pl-8">
                {nearbyTrades.slice(0, 4).map(({ date, trades, daysBefore }) =>
                  trades.slice(0, 2).map(trade => (
                    <div
                      key={`${date}-${trade.ticker}`}
                      className="flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-md"
                      style={{
                        background: trade.action === 'BUY' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color:      trade.action === 'BUY' ? '#22c55e' : '#ef4444',
                        border:     `1px solid ${trade.action === 'BUY' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      }}
                    >
                      {trade.action === 'BUY' ? '▲' : '▼'} {trade.ticker}
                      <ProximityBadge days={daysBefore} />
                    </div>
                  ))
                )}
                {nearbyTrades.reduce((s, n) => s + n.trades.length, 0) > 4 && (
                  <span className="text-[9px] text-[#444]">+altri…</span>
                )}
              </div>
            )}
          </div>

          {/* Expanded detail */}
          {open && (
            <div
              className="border-t px-4 py-4 text-left"
              style={{ borderColor: `${cfg.color}15` }}
              onClick={e => e.stopPropagation()}
            >
              <p className="text-[12px] text-[#888] leading-relaxed mb-4">{event.detail}</p>

              {/* Affected tickers */}
              {eventTickers.length > 0 && (
                <div className="mb-3">
                  <div className="text-[9px] font-bold text-[#555] uppercase tracking-wider mb-1.5">
                    Titoli del portfolio Trump potenzialmente impattati
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {eventTickers.map(t => {
                      const pos = ALL_POSITIONS.find(p => p.ticker === t);
                      return (
                        <span
                          key={t}
                          className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg"
                          style={{
                            background: `${pos?.color ?? '#888'}14`,
                            color:      pos?.color ?? '#888',
                            border:     `1px solid ${pos?.color ?? '#888'}28`,
                          }}
                        >
                          {t}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Correlated trades detail */}
              {nearbyTrades.length > 0 && (
                <div>
                  <div className="text-[9px] font-bold text-[#555] uppercase tracking-wider mb-1.5">
                    Trade Trump entro 7 giorni dall'evento
                  </div>
                  {nearbyTrades.map(({ date, trades, daysBefore }) => (
                    <div key={date} className="mb-2">
                      <span className="text-[9px] text-[#555] font-mono">{date}</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {trades.map(trade => (
                          <div
                            key={trade.ticker}
                            className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg"
                            style={{
                              background: trade.action === 'BUY' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                              color:      trade.action === 'BUY' ? '#22c55e' : '#ef4444',
                              border:     `1px solid ${trade.action === 'BUY' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                            }}
                          >
                            {trade.action === 'BUY' ? '▲' : '▼'}
                            <span className="font-bold font-mono">{trade.ticker}</span>
                            {trade.maxBuyBand && trade.action === 'BUY' && (
                              <span className="opacity-60">{trade.maxBuyBand}</span>
                            )}
                            <ProximityBadge days={daysBefore} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {event.note && (
                <div className="mt-3 text-[10px] font-medium italic" style={{ color: cfg.color, opacity: 0.7 }}>
                  {event.note}
                </div>
              )}

              {event.source && (
                <div className="mt-2 text-[10px] text-[#444]">Fonte: {event.source}</div>
              )}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

const TYPE_FILTERS = ['TUTTI', 'EXECUTIVE', 'TARIFF', 'REGULATORY', 'GEOPOLITICAL', 'FINANCIAL', 'CONFLICT'];

export default function PolicyTimeline() {
  const [filter,   setFilter]   = useState('TUTTI');
  const [showAll,  setShowAll]  = useState(false);

  const merged   = useMemo(() => getMergedTimeline(POLICY_EVENTS), []);
  const tradeMap = useMemo(() => buildTradeMap(), []);

  const filtered = useMemo(() => {
    if (filter === 'TUTTI') return merged;
    return merged.filter(e => e.type === filter);
  }, [merged, filter]);

  const visible = showAll ? filtered : filtered.slice(0, 8);

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-[13px] font-bold text-[#ccc] tracking-tight">
          🗞️ Timeline Politica ↔ Trading
        </h2>
        <p className="text-[11px] text-[#555] mt-1 leading-relaxed">
          Cronologia degli eventi politici di Q1 2026 con i trade Trump nelle 48–168h precedenti.
          Badge arancioni/rossi = acquisti effettuati <strong className="text-[#666]">prima</strong> dell'annuncio.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-[10px] text-[#555]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#ef4444] inline-block" />
          Correlazione sospetta (acquisto ≤3g prima)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[#f97316]">⚡</span> ≤3 giorni prima
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[#888]">📋</span> 4–7 giorni prima
        </span>
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {TYPE_FILTERS.map(f => {
          const cfg = TYPE_CONFIG[f];
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all tracking-wide"
              style={{
                background:  active ? (cfg?.bg ?? 'rgba(212,175,55,0.12)') : 'transparent',
                borderColor: active ? (cfg?.color ?? '#D4AF37') + '60' : '#222',
                color:       active ? (cfg?.color ?? '#D4AF37') : '#555',
              }}
            >
              {cfg?.icon ?? '🔍'} {f}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div>
        {visible.map((event, i) => (
          <TimelineEvent
            key={event.id}
            event={event}
            tradeMap={tradeMap}
            isLast={i === visible.length - 1}
          />
        ))}
      </div>

      {filtered.length > 8 && (
        <button
          onClick={() => setShowAll(a => !a)}
          className="w-full py-3 border-t border-[#1a1a1a] text-[11px] font-medium text-[#555] hover:text-[#888] transition-colors"
        >
          {showAll ? '▲ Mostra meno' : `▼ Mostra tutti ${filtered.length} eventi`}
        </button>
      )}

      <div className="mt-4 pt-3 border-t border-[#1a1a1a] text-[10px] text-[#444] leading-relaxed">
        ⚖️ La correlazione temporale <em>non</em> implica insider trading illegale — ma è esattamente il tipo di
        pattern che i watchdog etici e i giornalisti investigativi analizzano per valutare conflitti d'interesse.
        Fonte: OGE 278-T · dati di analisi propria.
      </div>
    </div>
  );
}
