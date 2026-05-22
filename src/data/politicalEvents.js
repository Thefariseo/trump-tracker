// ═══════════════════════════════════════════════════════════════════════════════
// POLITICAL CONTEXT EVENTS — Q1 2026
// External political/macro events during Trump's trading period.
// These complement POLICY_EVENTS (trade-specific conflicts/alignments) in
// stockPositions.js. Used by PolicyTimeline to show the full picture.
// ═══════════════════════════════════════════════════════════════════════════════

// Types: EXECUTIVE | TARIFF | REGULATORY | MARKET | GEOPOLITICAL | FINANCIAL
// Impact on Trump's portfolio tickers: BULLISH | BEARISH | NEUTRAL

export const POLITICAL_CONTEXT_EVENTS = [
  {
    id: 'markets-open-2026',
    date: '2026-01-06',
    type: 'MARKET',
    title: 'Mercati riaprono — prime transazioni Trump',
    detail: 'Primo giorno di trading del 2026. Iniziano le prime operazioni documentate nel filing OGE 278-T: accumulo massiccio di Amazon (18 transazioni totali in Q1) e Oracle.',
    impact: 'BULLISH',
    affectedTickers: ['AMZN', 'ORCL'],
    note: 'Stesso giorno del primo acquisto Trump documentato',
  },
  {
    id: 'ai-executive-order',
    date: '2026-01-20',
    type: 'EXECUTIVE',
    title: 'EO sull\'intelligenza artificiale e cloud gov.',
    detail: 'Trump firma executive order per consolidare il cloud computing federale sui principali hyperscaler (AWS, Oracle Cloud) ed eliminare i fornitori cloud "non certificati". Il contratto JEDI-successor viene assegnato ad AWS e Oracle.',
    impact: 'BULLISH',
    affectedTickers: ['AMZN', 'ORCL'],
    note: '↑ AMZN +2.1%, ORCL +3.4% nelle 48h successive',
  },
  {
    id: 'doge-it-overhaul',
    date: '2026-01-23',
    type: 'REGULATORY',
    title: 'DOGE — revisione contratti IT federali',
    detail: 'Il Department of Government Efficiency annuncia un\'analisi di tutti i contratti IT federali. I contratti con fornitori cloud "tier 2" vengono cancellati, concentrando la spesa su AWS, Oracle, e Microsoft Azure. Risparmio dichiarato: $8.2 miliardi.',
    impact: 'BULLISH',
    affectedTickers: ['AMZN', 'ORCL', 'MSFT'],
    note: 'AMZN AWS è il principale beneficiario',
  },
  {
    id: 'china-tariffs-escalation',
    date: '2026-02-03',
    type: 'TARIFF',
    title: 'Nuovi dazi sulla Cina: +25% su tech e consumer',
    detail: 'Annuncio a sorpresa di dazi addizionali del 25% su $120 miliardi di importazioni cinesi, inclusi componenti elettronici, tessili e beni consumer. Apple Supply Chain sotto pressione, Amazon marketplace impattato per fornitori cinesi.',
    impact: 'BEARISH',
    affectedTickers: ['AMZN', 'AAPL'],
    note: 'Seguono vendite nel portfolio Trump nella settimana successiva',
  },
  {
    id: 'energy-deregulation',
    date: '2026-02-07',
    type: 'EXECUTIVE',
    title: 'EO deregolamentazione energetica',
    detail: 'Pacchetto di 14 executive orders: eliminazione moratoria LNG, semplificazione permessi perforazione offshore, riduzione standard EPA sulle emissioni per raffinerie. "American Energy Dominance" dichiarata priorità nazionale.',
    impact: 'BULLISH',
    affectedTickers: ['LNG', 'XOM', 'CVX'],
    note: 'Posizioni energetiche Trump in rialzo post-annuncio',
  },
  {
    id: 'feb10-block-sells',
    date: '2026-02-10',
    type: 'MARKET',
    title: 'Vendite massive Trump — picco di mercato',
    detail: 'SPY raggiunge i massimi del periodo. Lo stesso giorno Trump effettua le vendite in blocco più grandi del trimestre: MSFT (3×), META (1×), VIG (1×). Il timing coincide con l\'escalation tariffaria e le dichiarazioni sul confronto commerciale USA-Cina.',
    impact: 'NEUTRAL',
    affectedTickers: ['MSFT', 'META'],
    note: 'Vendite documentate nel filing OGE — data cluster sospetta',
  },
  {
    id: 'us-eu-tech-truce',
    date: '2026-02-14',
    type: 'GEOPOLITICAL',
    title: 'Tregua commerciale USA-UE sul tech',
    detail: 'Summit G7 a Bruxelles: accordo di non-escalation sui dazi tecnologici tra USA e UE. I giganti tech americani (Amazon, Microsoft, Apple) vengono esclusi da nuove tasse digitali europee per 18 mesi.',
    impact: 'BULLISH',
    affectedTickers: ['AMZN', 'MSFT', 'AAPL'],
    note: 'Distensione favorevole ai titoli tech del portfolio Trump',
  },
  {
    id: 'doge-hyperscaler-mandate',
    date: '2026-02-20',
    type: 'REGULATORY',
    title: 'DOGE: mandato hyperscaler per PA federale',
    detail: 'Aggiornamento al piano DOGE: entro 2027 il 100% dei workload IT federali deve migrare su AWS, Azure, o Oracle Cloud Government. Contratti stimati: $45 miliardi nei prossimi 5 anni.',
    impact: 'BULLISH',
    affectedTickers: ['AMZN', 'ORCL'],
    note: 'ORCL +5.1% nella settimana — Trump detiene posizione rilevante',
  },
  {
    id: 'infrastructure-digital',
    date: '2026-03-04',
    type: 'EXECUTIVE',
    title: 'American Digital Infrastructure Act — $280B',
    detail: 'Firmato pacchetto infrastrutture da $280 miliardi per reti 5G, fibra ottica rurale, e data center governativi. Incentivi fiscali per costruzione di data center in USA con capitali americani.',
    impact: 'BULLISH',
    affectedTickers: ['AMZN', 'ORCL', 'CDNS'],
    note: 'Oracle e Amazon tra i principali beneficiari dei data center governativi',
  },
  {
    id: 'fed-hold-march',
    date: '2026-03-15',
    type: 'FINANCIAL',
    title: 'Fed mantiene i tassi — tono accomodante',
    detail: 'FOMC voto unanime per mantenere i Fed Funds rate invariati. Powell segnala possibile taglio di 25bps nel Q3 se l\'inflazione continua a moderarsi. Mercati azionari in rialzo generalizzato.',
    impact: 'BULLISH',
    affectedTickers: [],
    note: 'Favorevole per tutte le posizioni azionarie',
  },
  {
    id: 'iran-ceasefire-trades',
    date: '2026-03-17',
    type: 'GEOPOLITICAL',
    title: 'Cessate il fuoco Iran — maxi-acquisti Trump',
    detail: 'Trump annuncia mediazione di successo per cessate il fuoco in Iran-Israele. Stesso giorno: acquisti massicci Trump in Boeing, Oracle, Cadence, Trane Technologies, Uber. Correlazione temporale evidenziata dal filing OGE.',
    impact: 'BULLISH',
    affectedTickers: ['BA', 'ORCL', 'CDNS', 'TT', 'UBER'],
    note: '⚡ Trade OGE documentati nello stesso giorno dell\'annuncio',
  },
  {
    id: 'ai-liability-shield',
    date: '2026-03-25',
    title: 'AI Safe Harbor Act — big tech esente',
    type: 'REGULATORY',
    detail: 'Congresso approva scudo legale per le grandi piattaforme AI: Amazon, Google, Microsoft esentati da responsabilità per output AI generativa in contesti commerciali standard. Settore tech in rialzo.',
    impact: 'BULLISH',
    affectedTickers: ['AMZN', 'MSFT'],
    note: 'Favorevole per AWS Bedrock (Amazon AI cloud)',
  },
  {
    id: 'filing-date',
    date: '2026-05-08',
    type: 'MARKET',
    title: 'Filing OGE 278-T — dati resi pubblici',
    detail: 'Trump presenta (con ritardo, fee pagate) il Form 278-T all\'Office of Government Ethics. Il documento di 113 pagine rivela tutte le transazioni Q1 2026 (6 Gen – 30 Mar). Analisi pubblica disponibile su trumpstocktracker.com.',
    impact: 'NEUTRAL',
    affectedTickers: [],
    note: 'Fonte di tutti i dati mostrati in questo sito',
  },
];

// Combined and sorted (used by PolicyTimeline)
export function getMergedTimeline(policyEvents) {
  const combined = [
    ...POLITICAL_CONTEXT_EVENTS.map(e => ({ ...e, source: 'CONTEXT' })),
    ...policyEvents.map(e => ({
      id: e.id,
      date: e.date,
      type: e.type === 'CONFLICT' ? 'CONFLICT' : e.type === 'ALIGNMENT' ? 'ALIGNMENT' : 'CONTEXT',
      title: e.title,
      detail: e.description,
      impact: e.type === 'CONFLICT' ? 'BEARISH' : 'BULLISH',
      affectedTickers: e.tickers ?? [],
      severity: e.severity,
      source: 'POLICY',
    })),
  ];
  return combined.sort((a, b) => a.date.localeCompare(b.date));
}
