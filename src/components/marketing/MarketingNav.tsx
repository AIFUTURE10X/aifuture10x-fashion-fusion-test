import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

export const MarketingNav = () => {
  return (
    <nav className="sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-white font-bold text-xl font-poppins">
              unowUafter
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-white/10 font-poppins">
                  Products <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white/95 backdrop-blur-md border-white/20">
                <DropdownMenuItem>
                  <Link to="/" className="w-full">Virtual Try-On</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>AI Fashion Assistant</DropdownMenuItem>
                <DropdownMenuItem>API Access</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-white/10 font-poppins">
                  Solutions <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white/95 backdrop-blur-md border-white/20">
                <DropdownMenuItem>For Retailers</DropdownMenuItem>
                <DropdownMenuItem>For Developers</DropdownMenuItem>
                <DropdownMenuItem>Enterprise</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-white/10 font-poppins">
                  Resources <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white/95 backdrop-blur-md border-white/20">
                <DropdownMenuItem>Documentation</DropdownMenuItem>
                <DropdownMenuItem>Case Studies</DropdownMenuItem>
                <DropdownMenuItem>Blog</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" className="text-white hover:bg-white/10 font-poppins">
              Pricing
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="outline" className="text-white border-white/30 hover:bg-white/10 font-poppins">
                Try App
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
