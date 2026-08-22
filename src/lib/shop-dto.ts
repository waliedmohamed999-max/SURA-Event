import type { Prisma } from "@/generated/prisma/client";
import type { GeometryDTO, ShopDTO } from "./types";

type ShopWithRelations = Prisma.ShopGetPayload<{ include: { category: true; geometry: true } }>;

/** Maps a DB shop row to the public-facing shape — never includes tenant/applicant data. */
export function toShopDTO(shop: ShopWithRelations): ShopDTO {
  return {
    id: shop.id,
    shopNumber: shop.shopNumber,
    category: shop.category,
    area: shop.area,
    width: shop.width,
    height: shop.height,
    location: shop.location,
    status: shop.status,
    rentalPrice: shop.rentalPrice,
    rentalPeriod: shop.rentalPeriod,
    description: shop.description,
    images: shop.images,
    geometry: shop.geometry ? (shop.geometry as unknown as GeometryDTO) : null,
  };
}
