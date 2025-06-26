
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TestResultsProps {
  testResult: any;
}

export function TestResults({ testResult }: TestResultsProps) {
  return (
    <Alert>
      <AlertDescription>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(testResult, null, 2)}
        </pre>
      </AlertDescription>
    </Alert>
  )
}
