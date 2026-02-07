const DEFAULT_LENGTH = 10

function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive)
}

function pickChar(chars: string): string {
  return chars[randomInt(chars.length)]
}

function shuffleString(input: string): string {
  const arr = input.split('')
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.join('')
}

export function generatePassword(length: number = DEFAULT_LENGTH): string {
  const normalizedLength = Math.max(8, Math.min(64, Math.floor(length)))

  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const digits = '0123456789'

  // Ensure basic complexity: at least one from each set
  let result = ''
  result += pickChar(lower)
  result += pickChar(upper)
  result += pickChar(digits)

  const all = lower + upper + digits
  while (result.length < normalizedLength) {
    result += pickChar(all)
  }

  return shuffleString(result)
}

export function generateSecurePassword(length: number = 12): string {
  return generatePassword(length)
}
