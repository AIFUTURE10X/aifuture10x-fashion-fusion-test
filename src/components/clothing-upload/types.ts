
export interface ClothingItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  colors: string[];
  perfect_corp_ref_id?: string;
}

export interface ClothingUploadProps {
  onClothingAdd: (clothing: ClothingItem) => void;
  onClose: () => void;
  editingItem?: ClothingItem | null;
}

export interface GarmentCategory {
  value: string;
  label: string;
  icon: any;
  description: string;
}
