
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
  },
  {
    id: '4',
    name: 'Leather Jacket',
    brand: 'Zara',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=600&fit=crop',
    category: 'upper_body',
    rating: 4.7,
    colors: ['black']
  },
  {
    id: '5',
    name: 'Chino Shorts',
    brand: 'Gap',
    price: 44.99,
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=600&fit=crop',
    category: 'lower_body',
    rating: 4.3,
    colors: ['khaki']
  },
  {
    id: '6',
    name: 'Striped Shirt',
    brand: 'Banana Republic',
    price: 69.50,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=600&fit=crop',
    category: 'upper_body',
    rating: 4.1,
    colors: ['navy', 'white']
  },
  {
    id: '7',
    name: 'Denim Skirt',
    brand: 'Old Navy',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=600&fit=crop',
    category: 'lower_body',
    rating: 4.4,
    colors: ['blue']
  },
  {
    id: '8',
    name: 'Pencil Dress',
    brand: 'Ann Taylor',
    price: 98.00,
    image: 'https://images.unsplash.com/photo-1566479179817-92e8b94be0f0?w=400&h=600&fit=crop',
    category: 'full_body',
    rating: 4.6,
    colors: ['red']
  },
  {
    id: '9',
    name: 'Bomber Jacket',
    brand: 'Adidas',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5c?w=400&h=600&fit=crop',
    category: 'upper_body',
    rating: 4.8,
    colors: ['green']
  },
  {
    id: '10',
    name: 'Cargo Pants',
    brand: 'REI',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1584701154663-7f6d85d8b3df?w=400&h=600&fit=crop',
    category: 'lower_body',
    rating: 4.0,
    colors: ['olive']
  },
];

export type { ClothingItem };
