import { z } from "zod";

export const createApplicationSchema = z.object({
  shopId: z.string().min(1, "Shop is required"),

  // Applicant information
  fullName: z.string().trim().min(2, "Full name is required").max(200),
  companyName: z.string().trim().max(200).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email"),
  mobile: z.string().trim().min(6, "Enter a valid mobile number").max(30),
  country: z.string().trim().min(2, "Country is required").max(100),
  city: z.string().trim().min(2, "City is required").max(100),

  // Business information
  businessActivity: z.string().trim().min(2, "Business activity is required").max(500),
  brandCategory: z.string().trim().max(200).optional().or(z.literal("")),
  yearsInBusiness: z.coerce.number().int().min(0).max(150).optional(),
  website: z.string().trim().url("Enter a valid URL").max(300).optional().or(z.literal("")),
  instagram: z.string().trim().max(200).optional().or(z.literal("")),
  crNumber: z.string().trim().max(100).optional().or(z.literal("")),

  // Shop requirements
  preferredRentalPeriod: z.string().trim().max(100).optional().or(z.literal("")),
  staffCount: z.coerce.number().int().min(0).max(1000).optional(),
  additionalRequirements: z.string().trim().max(2000).optional().or(z.literal("")),

  agreedToTerms: z
    .boolean()
    .refine((v) => v === true, { message: "You must agree to the terms and conditions" }),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const trackApplicationSchema = z.object({
  applicationNumber: z.string().trim().min(3),
  contact: z.string().trim().min(3), // email or mobile
});

export const shopListQuerySchema = z.object({
  category: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});
