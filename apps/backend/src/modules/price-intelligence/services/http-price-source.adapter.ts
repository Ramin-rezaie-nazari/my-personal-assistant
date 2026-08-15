import { NormalizedPrice, PriceSourceKind } from '../models/price-intelligence.model';

export type HttpSourceConfig = {
  id: string;
  kind: PriceSourceKind;
  baseUrl: string;
  searchUrlTemplate: string;
  timeoutMs?: number;
};

export class HttpPriceSourceAdapter {
  readonly id: string;
  readonly kind: PriceSourceKind;

  constructor(private readonly config: HttpSourceConfig) {
    this.id = config.id;
    this.kind = config.kind;
  }

  async fetchPrices(productKeys: string[]): Promise<NormalizedPrice[]> {
    const output: NormalizedPrice[] = [];
    for (const productKey of productKeys) {
      const query = productKey.replace(/-/g, ' ');
      const url = this.config.searchUrlTemplate.replace('{query}', encodeURIComponent(query));
      const response = await fetch(url, {
        headers: { accept: 'text/html,application/xhtml+xml,application/json', 'user-agent': 'MyPersonalAssistant/1.0 price-intelligence' },
        signal: AbortSignal.timeout(this.config.timeoutMs ?? 12_000),
      });
      if (!response.ok) throw new Error(`price_source_http_${this.id}_${response.status}`);
      output.push(...this.parse(productKey, await response.text(), url));
    }
    return output;
  }

  private parse(productKey: string, html: string, sourceUrl: string): NormalizedPrice[] {
    const prices: NormalizedPrice[] = [];
    const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    for (const block of blocks) {
      try {
        const parsed = JSON.parse(this.decode(block[1]));
        const nodes = Array.isArray(parsed) ? parsed : [parsed];
        for (const node of nodes) {
          const offers = Array.isArray(node?.offers) ? node.offers : node?.offers ? [node.offers] : [];
          for (const offer of offers) {
            const amount = this.number(offer?.price ?? offer?.lowPrice);
            if (!amount || amount <= 0) continue;
            const title = String(node?.name ?? productKey).trim();
            if (!this.isRelevant(title, productKey)) continue;
            prices.push(this.normalize(productKey, title, amount, offer?.priceCurrency, offer?.availability, offer?.url ?? sourceUrl));
          }
        }
      } catch {
        // Ignore malformed JSON-LD and use the HTML fallback.
      }
    }
    if (!prices.length) {
      const patterns = [/(?:"price"|data-price|price)["'=:\s]+(?:"|')?([0-9۰-۹,٬\.]+)/gi, /([0-9۰-۹,٬\.]+)\s*(?:تومان|تومن|ریال)/gi];
      for (const pattern of patterns) {
        const match = pattern.exec(html);
        if (!match) continue;
        const amount = this.number(match[1]);
        if (amount > 0) prices.push(this.normalize(productKey, productKey.replace(/-/g, ' '), amount, 'IRR', 'unknown', sourceUrl));
        break;
      }
    }
    return prices;
  }

  private normalize(productKey: string, title: string, amount: number, currency: unknown, availability: unknown, url: string): NormalizedPrice {
    const rawCurrency = String(currency ?? '').toUpperCase();
    return { productKey, title, sourceId: this.id, sourceKind: this.kind, url, currency: rawCurrency || 'IRR', amount, availability: this.availability(availability), observedAt: new Date() };
  }

  private isRelevant(title: string, key: string) {
    const tokens = key.split('-').filter(Boolean);
    const normalized = title.toLocaleLowerCase('fa-IR');
    return tokens.length === 0 || tokens.some((token) => normalized.includes(token));
  }

  private availability(value: unknown): NormalizedPrice['availability'] {
    const text = String(value ?? '').toLowerCase();
    if (text.includes('outofstock') || text.includes('out_of_stock')) return 'out_of_stock';
    if (text.includes('instock') || text.includes('in_stock')) return 'in_stock';
    return 'unknown';
  }

  private number(value: unknown) {
    const fa = String(value ?? '').replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٬،]/g, ',');
    const parsed = Number(fa.replace(/,/g, '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private decode(value: string) {
    return value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  }
}
