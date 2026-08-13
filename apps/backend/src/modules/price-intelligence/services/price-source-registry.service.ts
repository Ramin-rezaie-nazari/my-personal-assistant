import { Injectable } from '@nestjs/common';
import { PriceSourceKind } from '../models/price-intelligence.model';

export type PriceSourceDefinition = {
  id: string;
  name: string;
  kind: PriceSourceKind;
  baseUrl?: string;
  enabled: boolean;
  adapterId: string;
  notes?: string;
};

@Injectable()
export class PriceSourceRegistryService {
  private readonly definitions: PriceSourceDefinition[] = [
    {
      id: 'torob',
      name: 'Torob',
      kind: 'marketplace',
      baseUrl: 'https://torob.com',
      enabled: false,
      adapterId: 'torob',
      notes: 'Enable after the source-specific parser/adapter is configured.',
    },
    {
      id: 'emalls',
      name: 'Emalls',
      kind: 'marketplace',
      baseUrl: 'https://emalls.ir',
      enabled: false,
      adapterId: 'emalls',
      notes: 'Enable after the source-specific parser/adapter is configured.',
    },
  ];

  list(enabledOnly = false): PriceSourceDefinition[] {
    return enabledOnly ? this.definitions.filter((source) => source.enabled) : [...this.definitions];
  }

  get(id: string): PriceSourceDefinition | null {
    return this.definitions.find((source) => source.id === id) ?? null;
  }
}
