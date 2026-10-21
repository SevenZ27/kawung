import assets from 'virtual:kawung-devices'

export async function deviceResource(id: 'iphone' | 'studio-display', signal: AbortSignal): Promise<ArrayBuffer> {
  const entry = assets[id]
  if (!entry) throw new Error('Device resources are not installed')
  const response = await fetch(`/device-resources/${entry.file}`, { signal })
  if (!response.ok) throw new Error('Device resource unavailable')
  const payload = new Uint8Array(await response.arrayBuffer())
  if (payload.length < 33 || new TextDecoder().decode(payload.subarray(0, 4)) !== 'KWP1') {
    throw new Error('Invalid device resource')
  }
  const key = await crypto.subtle.importKey('raw', Uint8Array.from(atob(entry.key), c => c.charCodeAt(0)), 'AES-GCM', false, ['decrypt'])
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: payload.slice(4, 16) }, key, payload.slice(16))
}
