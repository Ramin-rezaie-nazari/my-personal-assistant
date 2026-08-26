const SPACED_CONNECTOR = /\s+(and|also|plus|but|et|puis|y|luego|und|e|depois|и|и потом|sonra|ve|و بعدش|و همچنین|سپس|هم|یا|ولی|اما)\s+/iu;
const TEMPORAL_CONNECTOR = /\s+(then|and then|et puis|y luego|und dann|und danach|e poi|e depois|ve sonra)\s+/iu;
const FARSI_CONNECTOR = /\s+و\s+(?=بعد\s+)/iu;
const CJK_CONNECTOR = /\s*(?=(?:然后再|然后|之后|それから|その後|そして|次に|그리고|그다음)\s*)/u;
const SENTENCE_BOUNDARY = /[;；.。!?！？]+\s*/u;

/**
 * Deterministically splits natural multi-intent utterances into executable clauses.
 * Conjunctions used purely as coordination are consumed at the boundary.
 * Temporal "then" is preserved only when it starts a new sentence-level clause,
 * because that marker is semantically useful to downstream understanding.
 */
export function splitMultilingualClauses(input: string): string[] {
  const source = input.trim();
  if (!source) return [];

  return source
    .split(SENTENCE_BOUNDARY)
    .flatMap((sentence) => splitSentence(sentence))
    .map(normalizeClause)
    .filter(Boolean);
}

function splitSentence(sentence: string): string[] {
  let parts = [sentence.trim()].filter(Boolean);

  parts = parts.flatMap((part) => splitAndTemporalConnectors(part));
  parts = parts.flatMap((part) => splitCoordinatingConnectors(part));
  parts = parts.flatMap((part) => splitFarsiConnector(part));
  parts = parts.flatMap((part) => splitCjkConnector(part));

  return parts.filter(Boolean);
}

function splitAndTemporalConnectors(part: string): string[] {
  const match = part.match(TEMPORAL_CONNECTOR);
  if (!match || match.index === undefined) return [part];

  const left = part.slice(0, match.index).trim();
  const marker = match[1];
  const right = part.slice(match.index + match[0].length).trim();

  // In a sentence-level clause, "then" is preserved as part of the next clause.
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
