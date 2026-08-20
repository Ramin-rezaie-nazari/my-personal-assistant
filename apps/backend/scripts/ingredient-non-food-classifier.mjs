const EQUIPMENT_PATTERNS = [
  /\b(?:thermometer|instant[- ]read thermometer|deep[- ]fat thermometer|candy thermometer)\b/i,
  /\b(?:spice mill|mortar and pestle|mortar|pestle)\b/i,
  /\b(?:springform pan|cake pan|loaf pan|baking sheet|sheet pan|skillet|saucepan|sauté pan|saute pan|stockpot|dutch oven|roasting pan|ice cream maker|slow cooker|charcoal grill|fireplace)\b/i,
  /\b(?:baking dish|pie dish|microwave[- ]safe mug|deep bowl|microwave[- ]safe plastic bowl|measuring cup|fat separator|offset spatula|pastry bag|stand mixer|pressure cooker|instant pot|kitchen torch|ramekins?|bamboo skewers?|kitchen (?:string|twine)|metal or wooden skewers?|cookie cutters?|round cutters?|muffin tin|waffle iron|pizza stone|scraper|slotted spoon|wire rack|heavy pot|pie plate|jar|bowl or cup|flower pot|trifle bowl|cake[- ]decorating turntable|turntable)\b/i,
  /\b(?:cheesecloth|parchment paper|wax paper|plastic wrap|aluminum foil|foil)\b/i,
  /\b(?:adjustable[- ]blade slicer|mandoline|food processor|blender|strainer|sieve|colander|pastry brush)\b/i,
  /\b(?:equipment|pan for|pan to|maker)\b/i,
  /\b(?:mug|bowl|dish|skewer|ramekin)\b.*\b(?:microwave|baking|for baking|for roasting|for serving)\b/i,
  /\b(?:toothpicks?|styrofoam cone|sealable bag|heavy[- ]duty sealable bag)\b/i,
];

const SERVING_PATTERNS = [
  /^(?:accompaniment|accompaniments|garnish|optional garnish)\s*:?$/i,
  /\bfor serving\b/i,
  /\bfor garnish\b/i,
  /\bto serve\b/i,
];

const EDITORIAL_PATTERNS = [
  /^(?:available at|available in|also called|see (?:recipe|note|below)|test[- ]kitchen tip|kitchen tip|where to buy)\b/i,
  /^(?:\*?available at|\*?available in)\b/i,
  /(?:https?:\/\/|www\.)/i,
  /\b(?:test[- ]kitchen|editor'?s note|chef'?s note)\b/i,
  /\bmarkets?\b.*\b(?:available|stores?)\b/i,
  /^and\s+(?:at|in)\s+/i,
  /^\*+$/,
  /^(?:0+|null|n\/a|none)$/i,
  /^(?:and|or|plus)\s+(?:[a-z]+\s+){0,6}(?:market|store|stores|website|\.com)\b/i,
];

const MODIFIER_ONLY_PATTERNS = [
  /^(?:optional|diced|drained|crosswise|toasted|quartered|sliced|chopped|minced|halved|peeled|seeded|trimmed|rinsed|washed|husked|hulled|shelled|divided|softened|melted|cooked|raw|fresh|additional|plus extra|plus more|as needed|to taste|standing at room temperature|at room temperature)$/i,
];

const CULINARY_NOTE_PATTERNS = [
  /^a deep[- ]fat thermometer$/i,
  /^a spice mill$/i,
  /^an ice cream maker$/i,
  /^a candy thermometer$/i,
];

const RECIPE_COMPONENT_PATTERNS = [
  /^(?:\d+\/\d+|\d+(?:\.\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])?\s*(?:batch|recipe|basic|extra[- ]flaky|best[- ]ever|classic)\b.*\b(?:dough|icing|coating|nougat|sauce|rub|spice(?:s)?|crust|shortbread|pastry)\b/i,
  /^(?:royal icing|caramel sauce|rhubarb compote|prepared marinara sauce|basic tart dough|extra[- ]flaky pastry dough|4-3-2-1 spice rub|blind-baked pie crust|buttery pie crust)$/i,
];

export function classifyNonFoodPart(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  if (EDITORIAL_PATTERNS.some((pattern) => pattern.test(text))) {
    return { kind: 'source_note', confidence: 0.995, reason: 'editorial_source_metadata' };
  }
  if (CULINARY_NOTE_PATTERNS.some((pattern) => pattern.test(text))) {
    return { kind: 'equipment', confidence: 0.99, reason: 'equipment_reference' };
  }
  if (EQUIPMENT_PATTERNS.some((pattern) => pattern.test(text))) {
    return { kind: 'equipment', confidence: 0.97, reason: 'equipment_reference' };
  }
  if (SERVING_PATTERNS.some((pattern) => pattern.test(text))) {
    return { kind: 'serving_note', confidence: 0.96, reason: 'serving_reference' };
  }
  if (RECIPE_COMPONENT_PATTERNS.some((pattern) => pattern.test(text))) {
    return { kind: 'recipe_component', confidence: 0.93, reason: 'named_recipe_component' };
  }
  if (MODIFIER_ONLY_PATTERNS.some((pattern) => pattern.test(text))) {
    return { kind: 'culinary_modifier', confidence: 0.99, reason: 'modifier_only' };
  }
  return null;
}
