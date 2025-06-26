
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function PerfectCorpSetupPage() {
  const [apiKey, setApiKey] = useState('')
  const [rsaKey, setRsaKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [validation, setValidation] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  
  const validateKeys = () => {
    // Clean the RSA key
    const cleanedKey = rsaKey.trim()
    
    const validationResult = {
      apiKey: {
        provided: !!apiKey,
        length: apiKey.length,
        valid: apiKey.length > 10,
        format: /^[A-Za-z0-9]+$/.test(apiKey)
      },
      rsaKey: {
        provided: !!cleanedKey,
        hasBeginHeader: cleanedKey.includes('-----BEGIN PUBLIC KEY-----'),
        hasEndHeader: cleanedKey.includes('-----END PUBLIC KEY-----'),
        length: cleanedKey.length,
        lineBreaks: cleanedKey.includes('\n'),
        valid: cleanedKey.includes('-----BEGIN PUBLIC KEY-----') && 
               cleanedKey.includes('-----END PUBLIC KEY-----') &&
               cleanedKey.length > 400
      }
    }
    
    setValidation(validationResult)
    return validationResult
  }
  
  const formatRSAKey = () => {
    let formatted = rsaKey.trim()
    
    // Remove any existing headers/footers to clean up
    formatted = formatted
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .trim()
    
    // Remove all whitespace and line breaks
    formatted = formatted.replace(/\s+/g, '')
    
    // Add proper headers with line breaks
    formatted = `-----BEGIN PUBLIC KEY-----\n${formatted}\n-----END PUBLIC KEY-----`
    
    setRsaKey(formatted)
  }
  
  const testConfiguration = async () => {
    try {
      const response = await fetch('/api/test-perfect-corp')
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({ error: 'Failed to test configuration' })
    }
  }
  
  const saveToSupabase = async () => {
    const validation = validateKeys()
    if (!validation.apiKey.valid || !validation.rsaKey.valid) {
      alert('Please fix validation errors before saving')
      return
    }
    
    setSaving(true)
    try {
      // Here we'll create a secure endpoint to update the Edge Function secrets
      const response = await fetch('/api/admin/update-perfect-corp-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          rsaKey: rsaKey.trim()
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update keys')
      }
      
      alert('Keys updated successfully! Please redeploy your Edge Functions.')
      
      // Test the new configuration
      await testConfiguration()
    } catch (error) {
      alert('Error saving keys: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }
  
  const exampleKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890abcdef...
(multiple lines of base64 characters)
...xyz123
-----END PUBLIC KEY-----`
  
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Perfect Corp API Setup</CardTitle>
          <CardDescription>
            Configure your Perfect Corp API credentials for authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instructions */}
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
          
          {/* API Key Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key (client_id)</label>
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="e.g., BMIL1PIJjCV96JlSl64RlVksHK1cD0PQ"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              This is shown as "API Key" in Perfect Corp console
            </p>
          </div>
          
          {/* RSA Key Input */}
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
              value={rsaKey}
              onChange={(e) => setRsaKey(e.target.value)}
              placeholder={exampleKey}
              className="font-mono text-xs"
              rows={15}
              style={{ WebkitTextSecurity: showKey ? 'none' : 'disc' }}
            />
            <div className="flex gap-2">
              <Button 
                onClick={formatRSAKey} 
                variant="outline" 
                size="sm"
              >
                Auto-format Key
              </Button>
              <Button 
                onClick={validateKeys} 
                variant="outline" 
                size="sm"
              >
                Validate Keys
              </Button>
              <Button 
                onClick={testConfiguration} 
                variant="outline" 
                size="sm"
              >
                Test Current Config
              </Button>
            </div>
          </div>
          
          {/* Validation Results */}
          {validation && (
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
          )}
          
          {/* Test Results */}
          {testResult && (
            <Alert>
              <AlertDescription>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={saveToSupabase}
              disabled={saving || !apiKey || !rsaKey}
            >
              {saving ? 'Saving...' : 'Save to Supabase'}
            </Button>
          </div>
          
          {/* Important Notes */}
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
        </CardContent>
      </Card>
    </div>
  )
}
