
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
      const response = await fetch('/api/test-perfect-corp')
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
