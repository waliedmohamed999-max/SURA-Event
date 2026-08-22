export interface CategoryDTO {
  id: string;
  key: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  icon: string | null;
  colorHex: string;
  displayOrder: number;
}

export interface StatusDTO {
  key: string;
  labelEn: string;
  labelAr: string;
  colorHex: string;
  order: number;
}

export interface GeometryDTO {
  polygonPoints: { x: number; y: number }[];
  centerPoint: { x: number; y: number };
  labelPosition: { x: number; y: number };
  rotation: number;
}

export interface ShopDTO {
  id: string;
  shopNumber: string;
  category: CategoryDTO;
  area: number | null;
  width: number | null;
  height: number | null;
  location: string | null;
  status: string;
  rentalPrice: number | null;
  rentalPeriod: string | null;
  description: string | null;
  images: string[];
  geometry: GeometryDTO | null;
}

export interface DecorativeZoneDTO {
  key: string;
  labelEn: string;
  labelAr: string;
  polygonPoints: { x: number; y: number }[];
  labelPosition: { x: number; y: number };
}
