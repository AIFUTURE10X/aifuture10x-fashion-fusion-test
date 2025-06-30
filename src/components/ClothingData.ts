
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
}

export const clothingData: ClothingItem[] = [
  {
    id: '1',
    name: 'Classic White Tee',
    brand: 'Uniqlo',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=600&fit=crop',
    category: 'upper_body',
    rating: 4.5,
    colors: ['white']
  },
  {
    id: '2',
    name: 'Slim Fit Jeans',
    brand: 'Levi\'s',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=600&fit=crop',
    category: 'lower_body',
    rating: 4.2,
    colors: ['blue']
  },
  {
    id: '3',
    name: 'Summer Dress',
    brand: 'H&M',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=600&fit=crop',
    category: 'full_body',
    rating: 4.0,
    colors: ['floral']
  }
];

export type { ClothingItem };
