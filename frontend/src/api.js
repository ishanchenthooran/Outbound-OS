const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`${options?.method || 'GET'} ${path} failed: ${res.status} ${detail}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export function runPipeline(icpConfig) {
  return request('/api/pipeline/run', {
    method: 'POST',
    body: JSON.stringify(icpConfig),
  })
}

export function getPipelineStatus() {
  return request('/api/pipeline/status')
}

export function getLeads() {
  return request('/api/leads')
}

export function getLead(id) {
  return request(`/api/leads/${id}`)
}

export function updateLeadStatus(id, status) {
  return request(`/api/leads/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function deleteLeads() {
  return request('/api/leads', { method: 'DELETE' })
}

export function getTriggers() {
  return request('/api/triggers')
}

export function createTrigger(trigger) {
  return request('/api/triggers', {
    method: 'POST',
    body: JSON.stringify(trigger),
  })
}

export function updateTrigger(id, updates) {
  return request(`/api/triggers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}
