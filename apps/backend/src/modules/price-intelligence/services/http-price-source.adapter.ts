import {
  NormalizedPrice,
  PriceSourceKind,
} from '../models/price-intelligence.model';

export type HttpSourceConfig = {
  id: string;
  kind: PriceSourceKind;
  baseUrl: string;
  searchUrlTemplate: string;
  timeoutMs?: number;
  userAgent?: string;
};

type JsonRecord = Record<string, unknown>;

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
      const url = this.config.searchUrlTemplate.replace(
        '{query}',
        encodeURIComponent(query),
      );
      const response = await fetch(url, {
        headers: {
          accept: 'text/html,application/xhtml+xml,application/json',
          'user-agent':
            this.config.userAgent ??
            'MyPersonalAssistant/1.0 price-intelligence',
        },
        signal: AbortSignal.timeout(this.config.timeoutMs ?? 12_000),
      });
      if (!response.ok)
        throw new Error(`price_source_http_${this.id}_${response.status}`);
      output.push(...this.parse(productKey, await response.text(), url));
    }
    return output;
  }

  private parse(
    productKey: string,
    html: string,
    sourceUrl: string,
  ): NormalizedPrice[] {
    const prices: NormalizedPrice[] = [];
    const seen = new Set<string>();
    const add = (
      title: string,
      amount: number,
      currency: unknown,
      availability: unknown,
      url: string,
    ) => {
      if (!amount || amount <= 0) return;
      const cleanTitle = title.trim() || productKey.replace(/-/g, ' ');
      if (!this.isRelevant(cleanTitle, productKey)) return;
      const normalized = this.normalize(
        productKey,
        cleanTitle,
        amount,
        currency,
        availability,
        url,
      );
      const fingerprint = `${normalized.sourceId}|${normalized.url}|${normalized.amount}|${this.normalizeText(normalized.title)}`;
      if (!seen.has(fingerprint)) {
        seen.add(fingerprint);
        prices.push(normalized);
      }
    };

    for (const block of html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    )) {
      this.walkJson(this.safeJson(this.decode(block[1])), (node) => {
        const offers = Array.isArray(node.offers)
          ? node.offers
          : node.offers
            ? [node.offers]
            : [];
        const specifications = Array.isArray(node.priceSpecification)
          ? node.priceSpecification
          : node.priceSpecification
            ? [node.priceSpecification]
            : [];
        for (const offer of [...offers, ...specifications]) {
          if (!this.isRecord(offer)) continue;
          add(
            String(node.name ?? productKey),
            this.number(offer.price ?? offer.lowPrice ?? offer.highPrice),
            offer.priceCurrency ?? offer.currency,
            offer.availability,
            String(offer.url ?? node.url ?? sourceUrl),
          );
        }
        if (node['@type'] === 'Offer' || node.price !== undefined) {
          add(
            String(node.name ?? productKey),
            this.number(node.price ?? node.lowPrice),
            node.priceCurrency ?? node.currency,
            node.availability,
            String(node.url ?? sourceUrl),
          );
        }
      });
    }

    for (const block of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)) {
      const text = block[1].trim();
      if (!text || !/["'](?:price|lowPrice|currentPrice)["']\s*:/.test(text))
        continue;
      this.walkJson(this.safeJson(this.decode(text)), (node) => {
        const amount = this.number(
          node.price ?? node.currentPrice ?? node.lowPrice,
        );
        if (!amount) return;
        add(
          String(node.name ?? node.title ?? productKey),
          amount,
          node.priceCurrency ??
            node.currency ??
            this.currencyNear(text, node.price),
          node.availability,
          String(node.url ?? sourceUrl),
        );
      });
    }

    if (!prices.length) {
      const meta =
        /<meta[^>]+itemprop=["']price["'][^>]+content=["']([^"']+)["'][^>]*>/i.exec(
          html,
        );
      if (meta)
        add(
          productKey.replace(/-/g, ' '),
          this.number(meta[1]),
          this.currencyNear(html, meta[1]),
          'unknown',
          sourceUrl,
        );
    }

    if (!prices.length) {
      const toman = /([0-9۰-۹,٬\.]+)\s*(?:تومان|تومن)/i.exec(html);
      const rial = /([0-9۰-۹,٬\.]+)\s*ریال/i.exec(html);
      const generic =
        /(?:"price"|data-price|price)["'=:\s]+(?:"|')?([0-9۰-۹,٬\.]+)/i.exec(
          html,
        );
      if (toman)
        add(
          productKey.replace(/-/g, ' '),
          this.number(toman[1]),
          'IRT',
          'unknown',
          sourceUrl,
        );
      else if (rial)
        add(
          productKey.replace(/-/g, ' '),
          this.number(rial[1]),
          'IRR',
          'unknown',
          sourceUrl,
        );
      else if (generic)
        add(
          productKey.replace(/-/g, ' '),
          this.number(generic[1]),
          this.currencyNear(html, generic[1]),
          'unknown',
          sourceUrl,
        );
    }
    return prices;
  }

  private walkJson(value: unknown, visitor: (node: JsonRecord) => void) {
    if (Array.isArray(value)) {
      for (const item of value) this.walkJson(item, visitor);
      return;
    }
    if (!this.isRecord(value)) return;
    visitor(value);
    for (const child of Object.values(value)) this.walkJson(child, visitor);
  }

  private safeJson(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  private normalize(
    productKey: string,
    title: string,
    amount: number,
    currency: unknown,
    availability: unknown,
    url: string,
  ): NormalizedPrice {
    const rawCurrency = String(currency ?? '').toUpperCase();
    const isRial =
      rawCurrency === 'IRR' ||
      rawCurrency.includes('RIAL') ||
      rawCurrency.includes('ریال');
    return {
      productKey,
      title,
      sourceId: this.id,
      sourceKind: this.kind,
      url,
      currency: 'IRT',
      amount: isRial ? amount / 10 : amount,
      availability: this.availability(availability),
      observedAt: new Date(),
    };
  }

  private isRelevant(title: string, key: string) {
    const normalizedTitle = this.normalizeText(title);
    const normalizedKey = this.normalizeText(key.replace(/-/g, ' '));
    if (!normalizedKey) return true;
    const tokens = normalizedKey
      .split(' ')
      .filter((token) => token.length >= 2);
    return (
      tokens.length === 0 ||
      tokens.some((token) => normalizedTitle.includes(token))
    );
  }

  private normalizeText(value: string) {
    return value
      .toLocaleLowerCase('fa-IR')
      .replace(/[يى]/g, 'ی')
      .replace(/[ك]/g, 'ک')
      .replace(/\u200c/g, ' ')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private currencyNear(html: string, value: unknown) {
    const index = html.indexOf(String(value));
    const window =
      index >= 0 ? html.slice(Math.max(0, index - 120), index + 120) : html;
    if (/ریال|rial/i.test(window)) return 'IRR';
    return 'IRT';
  }

  private availability(value: unknown): NormalizedPrice['availability'] {
    const text = String(value ?? '').toLowerCase();
    if (
      text.includes('outofstock') ||
      text.includes('out_of_stock') ||
      text.includes('ناموجود')
    )
      return 'out_of_stock';
    if (
      text.includes('instock') ||
      text.includes('in_stock') ||
      text.includes('موجود')
    )
      return 'in_stock';
    return 'unknown';
  }

  private number(value: unknown) {
    const fa = String(value ?? '')
      .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٬،]/g, ',');
    const parsed = Number(fa.replace(/,/g, '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private decode(value: string) {
    return value
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }

  private isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
