
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export const MarketingLink = () => {
  return (
    <div className="fixed top-4 right-4 z-50">
      <Link to="/marketing">
        <Button 
          variant="outline" 
          className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 font-poppins"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Marketing Page
        </Button>
      </Link>
    </div>
  );
};
