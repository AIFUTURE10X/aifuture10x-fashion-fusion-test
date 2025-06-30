
interface ClothingItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  colors: string[];
  perfect_corp_ref_id?: string;
  style_category?: string;
}

export const clothingData: ClothingItem[] = [];

export type { ClothingItem };
