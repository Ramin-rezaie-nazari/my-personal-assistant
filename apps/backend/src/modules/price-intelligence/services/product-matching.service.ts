import { Injectable } from '@nestjs/common';

export type ProductCandidate = {
  productKey: string;
  title: string;
  brand?: string;
  quantityValue?: number;
  quantityUnit?: string;
  identifiers?: Record<string, string | undefined>;
};

export type CanonicalProduct = {
  productKey: string;
  title: string;
  brand: string | null;
  quantityValue: number | null;
  quantityUnit: string | null;
};

export type ProductMatch = {
  canonical: CanonicalProduct;
  score: number;
  confidence: number;
  matchedBy: string[];
  ambiguous: boolean;
};

@Injectable()
export class ProductMatchingService {
  normalizeTitle(value: string): string {
    return value.toLowerCase().replace(/[\u200c\u0640]/g, '').replace(/[،,;|()[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  match(reference: ProductCandidate, candidates: ProductCandidate[]): ProductMatch[] {
    return candidates.map((candidate) => this.score(reference, candidate)).sort((a, b) => b.confidence - a.confidence);
  }

  private score(reference: ProductCandidate, candidate: ProductCandidate): ProductMatch {
    const matchedBy: string[] = [];
    let score = 0;
    const refIds = reference.identifiers ?? {};
    const candidateIds = candidate.identifiers ?? {};
    for (const key of ['gtin', 'ean', 'barcode', 'sku']) {
      if (refIds[key] && candidateIds[key] && refIds[key] === candidateIds[key]) {
        score += key === 'sku' ? 0.45 : 0.65;
        matchedBy.push(key);
      }
    }
    const refTitle = this.normalizeTitle(reference.title);
    const candidateTitle = this.normalizeTitle(candidate.title);
    if (refTitle === candidateTitle) { score += 0.2; matchedBy.push('exact_title'); }
    else if (refTitle && candidateTitle && (refTitle.includes(candidateTitle) || candidateTitle.includes(refTitle))) { score += 0.1; matchedBy.push('title_overlap'); }
    if (reference.brand && candidate.brand && this.normalizeTitle(reference.brand) === this.normalizeTitle(candidate.brand)) { score += 0.08; matchedBy.push('brand'); }

    if (reference.quantityValue != null && candidate.quantityValue != null && reference.quantityUnit && candidate.quantityUnit) {
      const refUnit = this.quantityUnit(reference.quantityUnit);
      const candidateUnit = this.quantityUnit(candidate.quantityUnit);
      if (refUnit && candidateUnit && refUnit.kind === candidateUnit.kind) {
        const refBase = reference.quantityValue * refUnit.factor;
        const candidateBase = candidate.quantityValue * candidateUnit.factor;
        const relativeDifference = Math.abs(refBase - candidateBase) / Math.max(refBase, 1e-9);
        if (relativeDifference <= 0.01) { score += 0.12; matchedBy.push('quantity'); }
        else { score -= 0.25; matchedBy.push('quantity_mismatch'); }
      } else if (refUnit && candidateUnit) {
        score -= 0.4;
        matchedBy.push('incompatible_quantity_unit');
      }
    }

    const confidence = Math.min(1, Math.max(0, Number(score.toFixed(4))));
    const hasIdentifier = matchedBy.some((key) => ['gtin', 'ean', 'barcode', 'sku'].includes(key));
    const ambiguous = !hasIdentifier && (matchedBy.includes('exact_title') || matchedBy.includes('title_overlap')) && matchedBy.includes('brand');
    return {
      canonical: { productKey: candidate.productKey, title: candidate.title, brand: candidate.brand ?? null, quantityValue: candidate.quantityValue ?? null, quantityUnit: candidate.quantityUnit ?? null },
      score: confidence,
      confidence,
      matchedBy,
      ambiguous,
    };
  }

  private quantityUnit(value: string): { kind: 'mass' | 'volume' | 'count'; factor: number } | null {
    const unit = this.normalizeTitle(value).replace(/\s/g, '');
    if (unit === 'g' || unit === 'gram' || unit === 'grams') return { kind: 'mass', factor: 1 };
    if (unit === 'kg' || unit === 'kilogram' || unit === 'kilograms') return { kind: 'mass', factor: 1000 };
    if (unit === 'mg' || unit === 'milligram' || unit === 'milligrams') return { kind: 'mass', factor: 0.001 };
    if (unit === 'ml' || unit === 'milliliter' || unit === 'milliliters') return { kind: 'volume', factor: 1 };
    if (unit === 'l' || unit === 'liter' || unit === 'liters') return { kind: 'volume', factor: 1000 };
    if (['piece', 'pieces', 'pc', 'pcs', 'عدد'].includes(unit)) return { kind: 'count', factor: 1 };
    return null;
  }
}
