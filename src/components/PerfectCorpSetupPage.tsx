
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SetupInstructions } from './perfect-corp/SetupInstructions'
import { ApiKeyInput } from './perfect-corp/ApiKeyInput'
import { RsaKeyInput } from './perfect-corp/RsaKeyInput'
import { ValidationResults } from './perfect-corp/ValidationResults'
import { TestResults } from './perfect-corp/TestResults'
import { ImportantNotes } from './perfect-corp/ImportantNotes'
import { validateKeys, formatRSAKey, type ValidationResult } from './perfect-corp/validationUtils'

export default function PerfectCorpSetupPage() {
  const [apiKey, setApiKey] = useState('')
  const [rsaKey, setRsaKey] = useState('')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  
  const handleValidateKeys = () => {
    const validationResult = validateKeys(apiKey, rsaKey)
    setValidation(validationResult)
    return validationResult
  }
  
  const handleFormatRSAKey = () => {
    const formatted = formatRSAKey(rsaKey)
    setRsaKey(formatted)
  }
  
  const testConfiguration = async () => {
    try {
      const response = await fetch('https://bpjlxtjbrunzibehbyrk.supabase.co/functions/v1/perfectcorp-auth/test', {
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwamx4dGpicnVuemliZWhieXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjE1NTcsImV4cCI6MjA2NTUzNzU1N30.w3_oTurN_UesG_DpwNU67f216flzYmOnDo-lrEMLYDw`
        }
      })
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({ error: 'Failed to test configuration' })
    }
  }
  
  const saveToSupabase = async () => {
    const validation = handleValidateKeys()
    if (!validation.apiKey.valid || !validation.rsaKey.valid) {
      alert('Please fix validation errors before saving')
      return
    }
    
    setSaving(true)
    try {
      const response = await fetch('https://bpjlxtjbrunzibehbyrk.supabase.co/functions/v1/update-perfect-corp-keys', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwamx4dGpicnVuemliZWhieXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjE1NTcsImV4cCI6MjA2NTUzNzU1N30.w3_oTurN_UesG_DpwNU67f216flzYmOnDo-lrEMLYDw`
        },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          rsaKey: rsaKey.trim()
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update keys')
      }
      
      alert('Keys validated successfully! Please follow the instructions to update your Supabase secrets.')
      
      // Show the result which includes instructions
      setTestResult(result)
      
      // Test the current configuration
      await testConfiguration()
    } catch (error) {
      alert('Error saving keys: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }
  
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
          <SetupInstructions />
          
          <ApiKeyInput value={apiKey} onChange={setApiKey} />
          
          <RsaKeyInput 
            value={rsaKey} 
            onChange={setRsaKey}
            onFormat={handleFormatRSAKey}
            onValidate={handleValidateKeys}
            onTest={testConfiguration}
          />
          
          {validation && <ValidationResults validation={validation} />}
          
          {testResult && <TestResults testResult={testResult} />}
          
          <div className="flex justify-end gap-2">
            <Button
              onClick={saveToSupabase}
              disabled={saving || !apiKey || !rsaKey}
            >
              {saving ? 'Saving...' : 'Save to Supabase'}
            </Button>
          </div>
          
          <ImportantNotes />
        </CardContent>
      </Card>
    </div>
  )
}
