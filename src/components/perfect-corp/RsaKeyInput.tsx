
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Eye, EyeOff } from 'lucide-react'

interface RsaKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  onFormat: () => void;
  onValidate: () => void;
  onTest: () => void;
}

export function RsaKeyInput({ value, onChange, onFormat, onValidate, onTest }: RsaKeyInputProps) {
  const [showKey, setShowKey] = useState(false)
  
  const exampleKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890abcdef...
(multiple lines of base64 characters)
...xyz123
-----END PUBLIC KEY-----`

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Secret Key (RSA Public Key)</label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowKey(!showKey)}
        >
          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={exampleKey}
        className={`font-mono text-xs ${!showKey ? 'text-transparent bg-gray-100' : ''}`}
        rows={15}
      />
      {!showKey && value && (
        <div className="text-xs text-muted-foreground">
          RSA Key is hidden. Click the eye icon to show it.
        </div>
      )}
      <div className="flex gap-2">
        <Button 
          onClick={onFormat} 
          variant="outline" 
          size="sm"
        >
          Auto-format Key
        </Button>
        <Button 
          onClick={onValidate} 
          variant="outline" 
          size="sm"
        >
          Validate Keys
        </Button>
        <Button 
          onClick={onTest} 
          variant="outline" 
          size="sm"
        >
          Test Current Config
        </Button>
      </div>
    </div>
  )
}
