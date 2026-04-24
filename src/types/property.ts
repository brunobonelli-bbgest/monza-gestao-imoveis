export type PropertyStatus = 'rented' | 'vacant' | 'maintenance';
export type PropertyType = 'house' | 'apartment' | 'studio' | 'commercial';

export interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  neighborhood: string;
  status: PropertyStatus;
  isUnderMaintenance: boolean;
  type: PropertyType;
  rentValue: number;
  ownerId: string;
  images: string[];
  cep?: string;
}
