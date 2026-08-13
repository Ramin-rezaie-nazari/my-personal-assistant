import { Injectable } from '@nestjs/common';

export type ProductCandidate = { productKey: string; title: string; brand?: string; quantityValue?: number; quantityUnit?: string; identifiers?: Record<string, string | undefined> };
export type CanonicalProduct = { productKey: string; title: string; brand: string | null; quantityValue: number | null; quantityUnit: string | null };
export type ProductMatch = { canonical: CanonicalProduct; score: number; confidence: number; matchedBy: string[]; ambiguous: boolean };

@Injectable()
export class ProductMatchingService {
  normalizeTitle(value: string): string { return value.toLowerCase().replace(/[\u200c\u0640]/g, '').replace(/[،,;|()[\]{}]/g, ' ').replace(/\s+/g, ' ').trim(); }
  match(reference: ProductCandidate, candidates: ProductCandidate[]): ProductMatch[] { return candidates.map((candidate) => this.score(reference, candidate)).sort((a, b) => b.confidence - a.confidence); }
  private score(reference: ProductCandidate, candidate: ProductCandidate): ProductMatch {
    const matchedBy: string[] = []; let score = 0; const refIds = reference.identifiers ?? {}; const candidateIds = candidate.identifiers ?? {};
    for (const key of ['gtin', 'ean', 'barcode', 'sku']) if (refIds[key] && candidateIds[key] && refIds[key] === candidateIds[key]) { score += key === 'sku' ? 0.45 : 0.65; matchedBy.push(key); }
    const refTitle = this.normalizeTitle(reference.title); const candidateTitle = this.normalizeTitle(candidate.title);
    if (refTitle === candidateTitle) { score += 0.2; matchedBy.push('exact_title'); } else if (refTitle && candidateTitle && (refTitle.includes(candidateTitle) || candidateTitle.includes(refTitle))) { score += 0.1; matchedBy.push('title_overlap'); }
    if (reference.brand && candidate.brand && this.normalizeTitle(reference.brand) === this.normalizeTitle(candidate.brand)) { score += 0.08; matchedBy.push('brand'); }
    if (reference.quantityValue != null && candidate.quantityValue != null && reference.quantityUnit && candidate.quantityUnit) {
      const sameUnit = this.normalizeTitle(reference.quantityUnit) === this.normalizeTitle(candidate.quantityUnit); const closeValue = Math.abs(reference.quantityValue - candidate.quantityValue) / Math.max(reference.quantityValue, 1) <= 0.01;
      if (sameUnit && closeValue) { score += 0.12; matchedBy.push('quantity'); }
    }
    const confidence = Math.min(1, Number(score.toFixed(4)));
    const titleOnlyNearMatch = matchedBy.length === 1 && matchedBy[0] === 'title_overlap';
    const ambiguous = titleOnlyNearMatch || (confidence >= 0.55 && confidence < 0.78);
    return { canonical: { productKey: candidate.productKey, title: candidate.title, brand: candidate.brand ?? null, quantityValue: candidate.quantityValue ?? null, quantityUnit: candidate.quantityUnit ?? null }, score: confidence, confidence, matchedBy, ambiguous };
  }
}
