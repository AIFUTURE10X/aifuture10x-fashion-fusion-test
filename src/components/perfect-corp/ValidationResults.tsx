
import { Alert } from '@/components/ui/alert'
import { CheckCircle, XCircle } from 'lucide-react'
import type { ValidationResult } from './validationUtils'

interface ValidationResultsProps {
  validation: ValidationResult;
}

export function ValidationResults({ validation }: ValidationResultsProps) {
  return (
    <Alert className={validation.apiKey.valid && validation.rsaKey.valid ? "border-green-500" : "border-red-500"}>
      <div className="space-y-3">
        <div className="font-semibold">Validation Results:</div>
        
        {/* API Key Validation */}
        <div>
          <div className="flex items-center gap-2">
            {validation.apiKey.valid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium">API Key</span>
          </div>
          {!validation.apiKey.valid && (
            <ul className="ml-6 text-xs text-red-600 space-y-1">
              {!validation.apiKey.provided && <li>• API Key is required</li>}
              {validation.apiKey.length < 10 && validation.apiKey.provided && <li>• API Key seems too short</li>}
              {!validation.apiKey.format && validation.apiKey.provided && <li>• API Key contains invalid characters</li>}
            </ul>
          )}
        </div>
        
        {/* RSA Key Validation */}
        <div>
          <div className="flex items-center gap-2">
            {validation.rsaKey.valid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium">RSA Public Key</span>
          </div>
          {!validation.rsaKey.valid && (
            <ul className="ml-6 text-xs text-red-600 space-y-1">
              {!validation.rsaKey.provided && <li>• RSA Key is required</li>}
              {!validation.rsaKey.hasBeginHeader && <li>• Missing: -----BEGIN PUBLIC KEY-----</li>}
              {!validation.rsaKey.hasEndHeader && <li>• Missing: -----END PUBLIC KEY-----</li>}
              {validation.rsaKey.length < 400 && validation.rsaKey.provided && <li>• Key seems too short ({validation.rsaKey.length} chars, expected 400+)</li>}
            </ul>
          )}
        </div>
      </div>
    </Alert>
  )
}
