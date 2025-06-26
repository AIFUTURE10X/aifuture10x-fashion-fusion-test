
import { Input } from '@/components/ui/input'

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ApiKeyInput({ value, onChange }: ApiKeyInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">API Key (client_id)</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., BMIL1PIJjCV96JlSl64RlVksHK1cD0PQ"
        className="font-mono"
      />
      <p className="text-xs text-muted-foreground">
        This is shown as "API Key" in Perfect Corp console
      </p>
    </div>
  )
}
