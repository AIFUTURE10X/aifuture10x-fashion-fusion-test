
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CatalogSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export const CatalogSearchBar: React.FC<CatalogSearchBarProps> = ({
  searchQuery,
  onSearchChange,
}) => (
  <div className="flex flex-col sm:flex-row gap-4">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <Input
        placeholder="Search clothing items..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
    <Button variant="outline" className="shrink-0">
      <Filter className="w-4 h-4 mr-2" />
      Filters
    </Button>
  </div>
);
