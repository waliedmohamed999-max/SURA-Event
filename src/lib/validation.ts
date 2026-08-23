import { z } from "zod";

/**
 * Documents every applicant must upload before they can submit — commercial
 * registration, the CR owner's identity, tax certificate, and a company
 * profile. Enforced client-side in ApplicationForm (submit stays disabled
 * until all four are attached) and re-checked here isn't possible since
 * files are a separate multipart step (see POST /api/applications/:id/documents),
 * so REQUIRED_DOCUMENT_TYPES is also read by the admin approval action to
 * block approval on an application still missing one.
 */
export const REQUIRED_DOCUMENT_TYPES = [
  "commercial_registration",
  "identity_document",
  "tax_certificate",
  "brand_profile",
] as const;

export const createApplicationSchema = z.object({
  shopId: z.string().min(1, "Shop is required"),

  // Applicant information
  fullName: z.string().trim().min(2, "Full name is required").max(200),
  companyName: z.string().trim().min(2, "Company name is required").max(200),
  email: z.string().trim().email("Enter a valid email"),
  mobile: z.string().trim().min(6, "Enter a valid mobile number").max(30),
  country: z.string().trim().min(2, "Country is required").max(100),
  city: z.string().trim().min(2, "City is required").max(100),
  nationalAddress: z.string().trim().min(3, "National address is required").max(300),

  // Business information
  businessActivity: z.string().trim().min(2, "Business activity is required").max(500),
  brandCategory: z.string().trim().max(200).optional().or(z.literal("")),
  yearsInBusiness: z.coerce.number().int().min(0).max(150).optional(),
  website: z.string().trim().url("Enter a valid URL").max(300).optional().or(z.literal("")),
  instagram: z.string().trim().max(200).optional().or(z.literal("")),
  crNumber: z.string().trim().min(2, "Commercial registration number is required").max(100),
  // The CR owner's own mobile — distinct from the applicant's mobile above,
  // since the person filling out the form isn't always the owner.
  ownerMobile: z.string().trim().min(6, "Enter a valid mobile number").max(30),

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
