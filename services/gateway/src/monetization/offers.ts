import { type KrOffer } from "@kindrail/protocol";

export const OFFERS: KrOffer[] = [
  {
    offerId: "starter_pack_v1",
    name: "Starter Pack",
    priceCents: 499,
    currency: "USD",
    grants: {
      gold: 1200,
      shards: 60,
      keys: 1
    }
  }
];

export function getOffer(offerId: string): KrOffer | null {
  return OFFERS.find((o) => o.offerId === offerId) ?? null;
}

