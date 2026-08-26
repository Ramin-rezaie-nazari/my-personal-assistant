import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { HouseholdItemNormalizerService } from './household-item-normalizer.service';

export type HouseholdItemResolution =
  | { status: 'resolved'; item: { id: string; name: string; category: string } }
  | { status: 'ambiguous'; candidates: Array<{ id: string; name: string; category: string }> }
  | { status: 'not_found'; query: string };

@Injectable()
export class HouseholdItemResolutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly normalizer: HouseholdItemNormalizerService,
  ) {}

  async resolve(userId: string, query: string): Promise<HouseholdItemResolution> {
    const key = this.normalizer.canonicalizeProductKey(query);
    if (!key) return { status: 'not_found', query };

    const items = await this.prisma.foodItem.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      select: { id: true, name: true, category: true },
      take: 50,
    });
    const matches = items.filter((item) => {
      const itemKey = this.normalizer.canonicalizeProductKey(item.name);
      return itemKey === key || itemKey.includes(key) || key.includes(itemKey);
    });
    if (matches.length === 1) return { status: 'resolved', item: matches[0] };
    if (matches.length > 1) return { status: 'ambiguous', candidates: matches.slice(0, 8) };
    return { status: 'not_found', query };
  }
}
