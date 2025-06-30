
import { Shirt, User, Package } from 'lucide-react';
import { GarmentCategory } from './types';

export const garmentCategories: GarmentCategory[] = [
  { value: 'upper_body', label: 'Upper Body', icon: Shirt, description: 'Shirts, tops, jackets, dresses' },
  { value: 'lower_body', label: 'Lower Body', icon: User, description: 'Pants, shorts, skirts' },
  { value: 'full_body', label: 'Full Body', icon: Package, description: 'Dresses, jumpsuits, full outfits' }
];
