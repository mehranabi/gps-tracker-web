'use client'

import { AlertCircleIcon } from 'lucide-react'
import { FormEvent, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ApiKeyGateProps = {
  error: string | null
  isSubmitting: boolean
  onSubmit: (apiKey: string) => void
}

export function ApiKeyGate({ error, isSubmitting, onSubmit }: ApiKeyGateProps) {
  const [apiKey, setApiKey] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(apiKey.trim())
  }

  return (
    <main className='flex flex-1 items-center justify-center p-6'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>GPS Tracker</CardTitle>
          <CardDescription>
            Enter a valid API key to view location records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='api-key'>API key</Label>
              <Input
                autoComplete='off'
                id='api-key'
                onChange={(event) => setApiKey(event.target.value)}
                required
                type='password'
                value={apiKey}
              />
            </div>
            {error ? (
              <Alert variant='destructive'>
                <AlertCircleIcon />
                <AlertTitle>Access denied</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Button disabled={isSubmitting || apiKey.trim().length === 0}>
              {isSubmitting ? 'Checking…' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
