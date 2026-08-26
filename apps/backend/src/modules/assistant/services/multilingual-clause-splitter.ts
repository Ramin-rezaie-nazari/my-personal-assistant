const SPACED_CONNECTOR = /\s+(and|also|plus|but|et puis|et|puis|y luego|y|luego|und danach|und dann|und|e poi|e depois|e|depois|и потом|и|sonra|ve sonra|ve|و بعدش|و همچنین|سپس|هم|یا|ولی|اما)\s+/iu;
const TEMPORAL_CONNECTOR = /\s+(and then|then)\s+/iu;
const FARSI_CONNECTOR = /\s+و\s+(?=بعد\s+)/iu;
const CJK_CONNECTOR = /\s*(?=(?:然后再|然后|之后|それから|その後|そして|次に|그리고|그다음)\s*)/u;
const SENTENCE_BOUNDARY = /[;；.。!?！？]+\s*/u;

/**
 * Deterministically splits natural multi-intent utterances into executable clauses.
 * Coordinating and temporal markers are consumed so each returned clause is
 * directly executable. Semantic consumers can opt into marker metadata.
 */
export function splitMultilingualClauses(input: string): string[] {
  return splitDetailedInternal(input).map(({ clause }) => clause);
}

/**
 * Marker-aware variant used by semantic understanding. The marker is the
 * connector that introduced the clause, before normalization strips it.
 */
export function splitMultilingualClausesDetailed(input: string): Array<{ clause: string; marker?: string }> {
  return splitDetailedInternal(input);
}

function splitDetailedInternal(input: string): Array<{ clause: string; marker?: string }> {
  const source = input.trim();
  if (!source) return [];

  return source
    .split(SENTENCE_BOUNDARY)
    .flatMap((sentence) => splitSentence(sentence))
    .map(({ text, marker }) => ({ clause: normalizeClause(text), marker }))
    .map(({ clause, marker }) => ({ clause: stripLeadingClauseConnector(clause), marker: marker ?? detectLeadingClauseMarker(clause) }))
    .filter(({ clause }) => Boolean(clause));
}

function splitSentence(sentence: string): Array<{ text: string; marker?: string }> {
  let parts: Array<{ text: string; marker?: string }> = [{ text: sentence.trim() }].filter(({ text }) => Boolean(text));

  parts = parts.flatMap(splitTemporalConnector);
  parts = parts.flatMap(splitCoordinatingConnectors);
  parts = parts.flatMap(splitFarsiConnector);
  parts = parts.flatMap(splitCjkConnector);

  return parts.filter(({ text }) => Boolean(text.trim()));
}

function splitTemporalConnector(part: { text: string; marker?: string }): Array<{ text: string; marker?: string }> {
  const match = part.text.match(TEMPORAL_CONNECTOR);
  if (!match || match.index === undefined) return [part];

  const left = part.text.slice(0, match.index).trim();
  const right = part.text.slice(match.index + match[0].length).trim();
  const marker = match[1]?.trim();
  return [
    { text: left, marker: part.marker },
    { text: right, marker },
  ].filter(({ text }) => Boolean(text));
}

function splitCoordinatingConnectors(part: { text: string; marker?: string }): Array<{ text: string; marker?: string }> {
  const pieces = part.text.split(SPACED_CONNECTOR);
  if (pieces.length === 1) return [part];

  const output: Array<{ text: string; marker?: string }> = [{ text: pieces[0]?.trim() ?? '', marker: part.marker }];
  for (let index = 1; index < pieces.length; index += 2) {
    const marker = pieces[index]?.trim();
    const right = pieces[index + 1]?.trim() ?? '';
    if (right) output.push({ text: right, marker });
  }
  return output.filter(({ text }) => Boolean(text));
}

function splitFarsiConnector(part: { text: string; marker?: string }): Array<{ text: string; marker?: string }> {
  const pieces = part.text.split(FARSI_CONNECTOR);
  if (pieces.length === 1) return [part];

  return [
    { text: pieces[0] ?? '', marker: part.marker },
    ...pieces.slice(1).map((text) => ({ text: text.replace(/^بعد\s+/u, '').trim(), marker: 'بعد' })),
  ].filter(({ text }) => Boolean(text));
}

function splitCjkConnector(part: { text: string; marker?: string }): Array<{ text: string; marker?: string }> {
  const pieces = part.text.split(CJK_CONNECTOR).map((piece) => piece.trim()).filter(Boolean);
  if (pieces.length === 1) return [part];

  return pieces.map((text, index) => ({
    text: text.replace(/^(?:然后再|然后|之后|それから|その後|そして|次に|그리고|그다음)/u, '').trim(),
    marker: index === 0 ? part.marker : undefined,
  }));
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
  return part.match(/^(and then|then|et puis|puis|y luego|luego|und dann|und danach|e poi|e depois|sonra|ve sonra|بعد(?:ها)?|سپس|ثم|ثم بعد|然后再|然后|之后|それから|その後|そして|次に|그리고|그다음)\s+/iu)?.[1];
}

function stripLeadingClauseConnector(part: string): string {
  return part
    .replace(/^(?:and then|then|et puis|puis|y luego|luego|und dann|und danach|e poi|e depois|sonra|ve sonra)\s+/iu, '')
    .replace(/^(?:بعد(?:ها)?|سپس|ثم|ثم بعد)\s+/u, '')
    .replace(/^(?:然后再|然后|之后|それから|その後|そして|次に|그리고|그다음)/u, '')
    .trim();
}
