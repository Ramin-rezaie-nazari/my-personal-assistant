const SPACED_CONNECTOR = /\s+(and|also|plus|but|et|puis|y|luego|und|e|depois|и|и потом|sonra|ve|و بعدش|و همچنین|سپس|هم|یا|ولی|اما)\s+/iu;
const TEMPORAL_CONNECTOR = /\s+(then|and then|et puis|y luego|und dann|und danach|e poi|e depois|ve sonra)\s+/iu;
const FARSI_CONNECTOR = /\s+و\s+(?=بعد\s+)/iu;
const CJK_CONNECTOR = /\s*(?=(?:然后再|然后|之后|それから|その後|そして|次に|그리고|그다음)\s*)/u;
const SENTENCE_BOUNDARY = /[;；.。!?！？]+\s*/u;

/**
 * Deterministically splits natural multi-intent utterances into executable clauses.
 * Coordination markers are consumed; sentence-level temporal "then" is preserved.
 */
export function splitMultilingualClauses(input: string): string[] {
  return splitDetailedInternal(input).map(({ clause }) => clause);
}

/**
 * Backward-compatible detail API used by semantic understanding.
 * Markers are intentionally reported as `and` for clause boundaries so the
 * existing consumer does not re-add coordinating/temporal markers.
 */
export function splitMultilingualClausesDetailed(input: string): Array<{ clause: string; marker?: string }> {
  return splitMultilingualClauses(input).map((clause, index) => ({
    clause,
    marker: index === 0 ? undefined : 'and',
  }));
}

function splitDetailedInternal(input: string): Array<{ clause: string }> {
  const source = input.trim();
  if (!source) return [];

  return source
    .split(SENTENCE_BOUNDARY)
    .flatMap((sentence) => splitSentence(sentence))
    .map(normalizeClause)
    .filter(Boolean)
    .map((clause) => ({ clause }));
}

function splitSentence(sentence: string): string[] {
  let parts = [sentence.trim()].filter(Boolean);

  parts = parts.flatMap(splitTemporalConnector);
  parts = parts.flatMap(splitCoordinatingConnectors);
  parts = parts.flatMap(splitFarsiConnector);
  parts = parts.flatMap(splitCjkConnector);

  return parts.filter(Boolean);
}

function splitTemporalConnector(part: string): string[] {
  const match = part.match(TEMPORAL_CONNECTOR);
  if (!match || match.index === undefined) return [part];

  const left = part.slice(0, match.index).trim();
  const right = part.slice(match.index + match[0].length).trim();
  // Temporal marker is intentionally preserved inside a sentence-level clause.
  const marker = match[1]?.trim();
  return [left, `${marker} ${right}`.trim()].filter(Boolean);
}

function splitCoordinatingConnectors(part: string): string[] {
  const pieces = part.split(SPACED_CONNECTOR);
  if (pieces.length === 1) return [part];

  const output: string[] = [pieces[0]?.trim() ?? ''];
  for (let index = 1; index < pieces.length; index += 2) {
    const right = pieces[index + 1]?.trim() ?? '';
    if (right) output.push(right);
  }
  return output.filter(Boolean);
}

function splitFarsiConnector(part: string): string[] {
  const pieces = part.split(FARSI_CONNECTOR);
  if (pieces.length === 1) return [part];

  return pieces
    .map((piece) => piece.trim())
    .filter(Boolean)
    .map((piece) => piece.replace(/^بعد\s+/u, '').trim())
    .filter(Boolean);
}

function splitCjkConnector(part: string): string[] {
  return part
    .split(CJK_CONNECTOR)
    .map((piece) => piece.trim())
    .filter(Boolean);
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
