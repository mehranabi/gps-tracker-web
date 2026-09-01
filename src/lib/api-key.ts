import { timingSafeEqual } from 'node:crypto'

export function getProvidedApiKey(request: Request) {
  return request.headers.get('authorization')
}

export function isValidApiKey(provided: string | null) {
  const expected = process.env.API_KEY

  if (!expected || provided === null) {
    return false
  }

  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(provided)

  if (expectedBuffer.length !== providedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, providedBuffer)
}
