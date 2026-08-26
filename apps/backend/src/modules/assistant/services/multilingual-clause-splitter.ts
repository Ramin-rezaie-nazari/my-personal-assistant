const SPACED_CONNECTORS = /\s+(?:and then|and|but|then|also|plus|et puis|et|puis|y luego|y|luego|und danach|und dann|und|e poi|e depois|e|depois|и потом|и|sonra|ve sonra|ve|و بعدش|و همچنین|سپس|هم|یا|ولی|اما|ثم|ثم بعد)\s+/iu;
const FARSI_LOOKAHEAD_CONNECTOR = /\s+و\s+(?=بعد\s+)/iu;
const CJK_CONNECTOR = /\s*(?=(?:然后再|然后|之后|それから|その後|そして|次に|그리고|그다음)\s*)/u;
const SENTENCE_BOUNDARY = /[;；.。!?！？]+\s*/u;

/**
 * Deterministically splits natural multi-intent utterances into executable clauses.
 * It intentionally avoids language-specific NLP models on this hot path.
 */
export function splitMultilingualClauses(input: string): string[] {
  const source = input.trim();
  if (!source) return [];

  const sentenceParts = source
    .split(SENTENCE_BOUNDARY)
    .flatMap((part) => splitConnectorFamily(part))
    .flatMap((part) => part.split(FARSI_LOOKAHEAD_CONNECTOR))
    .flatMap((part) => part.split(CJK_CONNECTOR));

  return sentenceParts
    .map((part) => normalizeClause(part))
    .filter(Boolean);
}

function splitConnectorFamily(part: string): string[] {
  const output: string[] = [];
  let remainder = part.trim();

  while (remainder) {
    const match = remainder.match(SPACED_CONNECTORS);
    if (!match || match.index === undefined) {
      output.push(remainder);
      break;
    }

    const left = remainder.slice(0, match.index).trim();
    const right = remainder.slice(match.index + match[0].length).trim();
    if (left) output.push(left);
    remainder = right;
  }

  return output;
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
