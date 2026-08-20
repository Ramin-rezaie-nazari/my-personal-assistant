const EQUIPMENT_PATTERNS = [
  /\b(?:thermometer|instant[- ]read thermometer|deep[- ]fat thermometer|candy thermometer)\b/i,
  /\b(?:spice mill|mortar and pestle|mortar|pestle)\b/i,
  /\b(?:springform pan|cake pan|loaf pan|baking sheet|sheet pan|skillet|saucepan|sauté pan|saute pan|stockpot|dutch oven|roasting pan|ice cream maker|slow cooker)\b/i,
  /\b(?:baking dish|pie dish|microwave[- ]safe mug|deep bowl|microwave[- ]safe plastic bowl|measuring cup|fat separator|offset spatula|pastry bag|stand mixer|pressure cooker|instant pot|kitchen torch|ramekins?|bamboo skewers?|kitchen (?:string|twine)|metal or wooden skewers?)\b/i,
  /\b(?:cheesecloth|parchment paper|wax paper|plastic wrap|aluminum foil|foil)\b/i,
  /\b(?:adjustable[- ]blade slicer|mandoline|food processor|blender|strainer|sieve|colander|pastry brush)\b/i,
  /\b(?:equipment|pan for|pan to|maker)\b/i,
  /\b(?:mug|bowl|dish|skewer|ramekin)\b.*\b(?:microwave|baking|for baking|for roasting|for serving)\b/i,
];

const SERVING_PATTERNS = [
  /^(?:accompaniment|garnish|optional garnish)\s*:/i,
  /\bfor serving\b/i,
  /\bfor garnish\b/i,
  /\bto serve\b/i,
];

const MODIFIER_ONLY_PATTERNS = [
  /^(?:optional|diced|drained|crosswise|toasted|quartered|sliced|chopped|minced|halved|peeled|seeded|trimmed|rinsed|washed|husked|hulled|shelled|divided|softened|melted|cooked|raw|fresh|additional|plus extra|plus more|as needed|to taste)$/i,
];

const CULINARY_NOTE_PATTERNS = [
  /^a deep[- ]fat thermometer$/i,
  /^a spice mill$/i,
  /^an ice cream maker$/i,
  /^a candy thermometer$/i,
];

export function classifyNonFoodPart(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  if (CULINARY_NOTE_PATTERNS.some((pattern) => pattern.test(text))) {
    return { kind: 'equipment', confidence: 0.99, reason: 'equipment_reference' };
  }
  if (EQUIPMENT_PATTERNS.some((pattern) => pattern.test(text))) {
    return { kind: 'equipment', confidence: 0.97, reason: 'equipment_reference' };
  }
  if (SERVING_PATTERNS.some((pattern) => pattern.test(text))) {
    return { kind: 'serving_note', confidence: 0.96, reason: 'serving_reference' };
  }
  if (MODIFIER_ONLY_PATTERNS.some((pattern) => pattern.test(text))) {
    return { kind: 'culinary_modifier', confidence: 0.99, reason: 'modifier_only' };
  }
  return null;
}
