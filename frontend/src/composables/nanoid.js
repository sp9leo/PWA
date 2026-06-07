const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function nanoid(size = 12) {
  let id = ''
  const bytes = crypto.getRandomValues(new Uint8Array(size))
  for (let i = 0; i < size; i++) {
    id += alphabet[bytes[i] % alphabet.length]
  }
  return id
}
