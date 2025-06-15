
import React from 'react';
import { Button } from '@/components/ui/button';

interface Category {
  id: string;
  label: string;
}
interface CategoryFilterProps {
  categories: Category[];
  selected: string;
  onChange: (categoryId: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selected,
  onChange,
}) => (
  <div className="flex flex-wrap gap-2 mt-4">
    {categories.map((category) => (
      <Button
        key={category.id}
        variant={selected === category.id ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange(category.id)}
        className={
          selected === category.id
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-none'
            : ''
        }
      >
        {category.label}
      </Button>
    ))}
  </div>
);
