
import { Alert, AlertDescription } from '@/components/ui/alert'

export function ImportantNotes() {
  return (
    <Alert variant="default">
      <AlertDescription className="text-xs space-y-2">
        <p className="font-semibold">Important Notes:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>The "Secret key" from Perfect Corp is actually an RSA public key</li>
          <li>Make sure to copy the ENTIRE key including BEGIN/END lines</li>
          <li>The key should be multiple lines, not a single line</li>
          <li>After saving, you'll need to redeploy your Edge Functions</li>
          <li>Keys are encrypted when stored in Supabase</li>
        </ul>
      </AlertDescription>
    </Alert>
  )
}
