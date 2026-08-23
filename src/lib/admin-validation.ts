import { z } from "zod";

const pointSchema = z.object({ x: z.number(), y: z.number() });

export const shopGeometrySchema = z.object({
  polygonPoints: z.array(pointSchema).min(3),
  centerPoint: pointSchema,
  labelPosition: pointSchema,
  rotation: z.number().default(0),
});

export const updateShopSchema = z.object({
  shopNumber: z.string().trim().min(1).optional(),
  categoryId: z.string().optional(),
  area: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  location: z.string().nullable().optional(),
  status: z
    .enum(["available", "application_pending", "under_review", "approved", "rented", "reserved", "unavailable"])
    .optional(),
  rentalPrice: z.number().nullable().optional(),
  rentalPeriod: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  geometry: shopGeometrySchema.optional(),
});

export const createShopSchema = z.object({
  shopNumber: z.string().trim().min(1),
  categoryId: z.string(),
  area: z.number().nullable().optional(),
  location: z.string().nullable().optional(),
  geometry: shopGeometrySchema,
});
