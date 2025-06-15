
import React from 'react';
import { X, Facebook, Twitter, Instagram, Link, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tryOnResult: string | null;
  selectedClothing: any;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  tryOnResult,
  selectedClothing
}) => {
  const shareUrl = window.location.href;
  const shareText = `Check out how I look in this ${selectedClothing?.name} from ${selectedClothing?.brand}! 🔥 #VirtualTryOn #StyleTry`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to your clipboard",
      });
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleSocialShare = (platform: string) => {
    let url = '';
    
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so we'll copy to clipboard
        handleCopyLink();
        toast({
          title: "Ready for Instagram!",
          description: "Link copied! You can paste it in your Instagram story or bio",
        });
        return;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const handleDownload = () => {
    // In a real implementation, this would download the try-on result
    toast({
      title: "Download started",
      description: "Your try-on result is being downloaded",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Share Your Try-On
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="text-center">
            <div className="w-32 h-40 bg-gray-100 rounded-xl mx-auto mb-4 overflow-hidden">
              {tryOnResult && (
                <img
                  src={tryOnResult}
                  alt="Try-on result"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <h3 className="font-semibold text-gray-900">{selectedClothing?.name}</h3>
            <p className="text-gray-600 text-sm">{selectedClothing?.brand}</p>
          </div>

          {/* Social Sharing */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Share on social media</h4>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="flex flex-col items-center py-4 h-auto"
                onClick={() => handleSocialShare('facebook')}
              >
                <Facebook className="w-6 h-6 text-blue-600 mb-2" />
                <span className="text-sm">Facebook</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center py-4 h-auto"
                onClick={() => handleSocialShare('twitter')}
              >
                <Twitter className="w-6 h-6 text-blue-400 mb-2" />
                <span className="text-sm">Twitter</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center py-4 h-auto"
                onClick={() => handleSocialShare('instagram')}
              >
                <Instagram className="w-6 h-6 text-pink-600 mb-2" />
                <span className="text-sm">Instagram</span>
              </Button>
            </div>
          </div>

          {/* Copy Link */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Share link</h4>
            <div className="flex space-x-2">
              <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 truncate">
                {shareUrl}
              </div>
              <Button variant="outline" onClick={handleCopyLink}>
                <Link className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Download */}
          <div>
            <Button
              onClick={handleDownload}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Image
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
