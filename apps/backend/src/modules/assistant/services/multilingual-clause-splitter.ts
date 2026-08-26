const SPACED_CONNECTORS = /\s+(and then|and|but|then|also|plus|et puis|et|puis|y luego|y|luego|und danach|und dann|und|e poi|e depois|e|depois|и потом|и|sonra|ve sonra|ve|و بعدش|و همچنین|سپس|هم|یا|ولی|اما|ثم|ثم بعد)\s+/iu;
const FARSI_LOOKAHEAD_CONNECTOR = /\s+و\s+(?=بعد\s+)/iu;
const CJK_CONNECTOR = /\s*(?=(?:然后再|然后|之后|それから|その後|そして|次に|그리고|그다음)\s*)/u;
const SENTENCE_BOUNDARY = /[;；.。!?！？]+\s*/u;

/**
 * Deterministically splits natural multi-intent utterances into executable clauses.
 * It intentionally avoids language-specific NLP models on this hot path.
 */
export function splitMultilingualClauses(input: string): string[] {
  return splitMultilingualClausesDetailed(input).map(({ clause }) => clause);
}

/**
 * Same splitter with the sequencing marker that introduced each clause.
 * The marker is metadata only; plain splitting always strips it.
 */
export function splitMultilingualClausesDetailed(input: string): Array<{ clause: string; marker?: string }> {
  const source = input.trim();
  if (!source) return [];

  const sentenceParts = source
    .split(SENTENCE_BOUNDARY)
    .flatMap(splitConnectorFamilyDetailed)
    .flatMap(splitFarsiDetailed)
    .flatMap(splitCjkDetailed);

  return sentenceParts
    .map(({ text, marker }) => ({ clause: normalizeClause(text), marker }))
    .map(({ clause, marker }) => ({ clause: stripLeadingClauseConnector(clause), marker: marker ?? detectLeadingClauseMarker(clause) }))
    .filter(({ clause }) => Boolean(clause));
}

function splitConnectorFamilyDetailed(part: string): Array<{ text: string; marker?: string }> {
  const output: Array<{ text: string; marker?: string }> = [];
  const pieces = part.split(SPACED_CONNECTORS);
  if (pieces.length === 1) return [{ text: part }];

  output.push({ text: pieces[0] });
  for (let index = 1; index < pieces.length; index += 2) {
    const marker = pieces[index]?.trim();
    const text = pieces[index + 1] ?? '';
    output.push({ text: `${marker} ${text}`.trim(), marker });
  }

  return output;
}

function splitFarsiDetailed(part: { text: string; marker?: string }): Array<{ text: string; marker?: string }> {
  const pieces = part.text.split(FARSI_LOOKAHEAD_CONNECTOR);
  if (pieces.length === 1) return [part];
  return [
    { text: pieces[0], marker: part.marker },
    ...pieces.slice(1).map((text) => ({ text: `بعد ${text}`.trim(), marker: 'بعد' })),
  ];
}

function splitCjkDetailed(part: { text: string; marker?: string }): Array<{ text: string; marker?: string }> {
  const pieces = part.text.split(CJK_CONNECTOR);
  if (pieces.length === 1) return [part];
  return pieces.map((text) => ({ text, marker: part.marker }));
}

function normalizeClause(part: string): string {
  return part
    .trim()
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[؟?!،؛,.。；，！？]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function detectLeadingClauseMarker(part: string): string | undefined {
  return part.match(/^(then|and then|puis|et puis|y luego|luego|und dann|und danach|e poi|e depois|sonra|ve sonra|بعد(?:ها)?|سپس|ثم|ثم بعد|然后再|然后|之后|それから|その後|そして|次に|그리고|그다음)\s+/iu)?.[1];
}

function stripLeadingClauseConnector(part: string): string {
  return part
    .replace(/^(?:then|and then|puis|et puis|y luego|luego|und dann|und danach|e poi|e depois|sonra|ve sonra)\s+/iu, '')
    .replace(/^(?:بعد(?:ها)?|سپس|ثم|ثم بعد)\s+/u, '')
    .replace(/^(?:然后再|然后|之后|それから|その後|そして|次に|그리고|그다음)/u, '')
    .trim();
}
