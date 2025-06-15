
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Key, Loader2 } from 'lucide-react';
import { perfectCorpApi } from '@/services/perfectCorpApi';
import { useToast } from '@/hooks/use-toast';

interface ApiKeyInputProps {
  onApiKeySet: (isValid: boolean) => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState(perfectCorpApi.getApiKey() || '');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Perfect Corp API key",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    
    try {
      const isValid = await perfectCorpApi.validateApiKey(apiKey);
      
      if (isValid) {
        perfectCorpApi.setApiKey(apiKey);
        toast({
          title: "Success",
          description: "API key validated and saved successfully!"
        });
        onApiKeySet(true);
      } else {
        toast({
          title: "Invalid API Key",
          description: "The provided API key is not valid. Please check and try again.",
          variant: "destructive"
        });
        onApiKeySet(false);
      }
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Could not validate API key. Please try again.",
        variant: "destructive"
      });
      onApiKeySet(false);
    } finally {
      setIsValidating(false);
    }
  };

  const hasExistingKey = perfectCorpApi.getApiKey();

  if (hasExistingKey) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center text-green-700 mb-2">
          <Key className="w-5 h-5 mr-2" />
          <span className="font-medium">API Key Configured</span>
        </div>
        <p className="text-green-600 text-sm mb-3">
          Perfect Corp API is ready for virtual try-on processing.
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            perfectCorpApi.setApiKey('');
            setApiKey('');
            onApiKeySet(false);
          }}
        >
          Change API Key
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-center text-blue-700 mb-3">
        <Key className="w-5 h-5 mr-2" />
        <span className="font-medium">Perfect Corp API Key Required</span>
      </div>
      
      <p className="text-blue-600 text-sm mb-4">
        To enable real virtual try-on, please enter your Perfect Corp API key. 
        This will be stored locally in your browser.
      </p>

      <div className="space-y-3">
        <Label htmlFor="api-key" className="text-sm font-medium text-gray-700">
          API Key
        </Label>
        <div className="relative">
          <Input
            id="api-key"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Perfect Corp API key"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        
        <Button 
          onClick={handleSaveApiKey}
          disabled={isValidating || !apiKey.trim()}
          className="w-full"
        >
          {isValidating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <Key className="w-4 h-4 mr-2" />
              Save & Validate API Key
            </>
          )}
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 mt-3">
        Don't have an API key? Visit{' '}
        <a 
          href="https://developer.perfectcorp.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Perfect Corp Developer Portal
        </a>
      </p>
    </div>
  );
};
