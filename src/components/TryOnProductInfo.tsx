import React from "react";
import { Button } from "@/components/ui/button";

interface ProductInfoProps {
  selectedClothing: {
    image: string;
    name: string;
    brand: string;
    price: number;
  };
}

export const TryOnProductInfo: React.FC<ProductInfoProps> = ({
  selectedClothing,
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 -mt-8">
    <div className="aspect-square bg-gray-100 rounded-xl mb-4 overflow-hidden">
      <img
        src={selectedClothing.image}
        alt={selectedClothing.name}
        className="w-full h-full object-cover"
      />
    </div>
    <h4 className="font-semibold text-gray-900 mb-1">
      {selectedClothing.name}
    </h4>
    <p className="text-gray-600 text-sm mb-3">{selectedClothing.brand}</p>
    <div className="flex items-center justify-between">
      <span className="text-xl font-bold text-gray-900">
        ${selectedClothing.price}
      </span>
      <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600">
        Add to Cart
      </Button>
    </div>
  </div>
);

export default TryOnProductInfo;
