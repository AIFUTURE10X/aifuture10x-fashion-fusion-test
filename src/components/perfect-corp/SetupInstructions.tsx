
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export function SetupInstructions() {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">How to get your Perfect Corp API credentials:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Log into <a href="https://yce.perfectcorp.com/account/apikey" target="_blank" className="underline">Perfect Corp Console</a></li>
            <li>Go to Account → API Key tab</li>
            <li>Create a new API Key if you haven't already</li>
            <li>Copy the <strong>API Key</strong> (this is your client_id)</li>
            <li>Copy the <strong>Secret key</strong> (this is the RSA public key)</li>
            <li>⚠️ The Secret key is only shown once when created!</li>
          </ol>
        </div>
      </AlertDescription>
    </Alert>
  )
}
