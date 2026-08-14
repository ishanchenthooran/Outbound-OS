import { useEffect, useRef, useState } from 'react'
import { deleteLeads, getPipelineStatus, runPipeline } from '../api'

const FUNDING_STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+']
const POLL_INTERVAL_MS = 3000
const MAX_POLL_MS = 10 * 60 * 1000
const EMPTY_STATUS = { discovered: 0, enriched: 0, scored: 0, email_ready: 0, total: 0 }

export default function PipelineTab() {
  const [form, setForm] = useState({
    industry: '',
    headcount_min: 10,
    headcount_max: 200,
    funding_stage: 'Series A',
    geography: 'United States',
    tech_stack_signals: '',
    score_threshold: 70,
  })
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [status, setStatus] = useState(EMPTY_STATUS)

  const pollTimerRef = useRef(null)
  const pollStartRef = useRef(null)

  function stopPolling() {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }

  useEffect(() => {
    getPipelineStatus().then(setStatus).catch(() => {})
    return stopPolling
  }, [])

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function pollStatus() {
    try {
      const data = await getPipelineStatus()
      setStatus(data)

      const complete = data.total > 0 && data.email_ready === data.total
      const timedOut = Date.now() - pollStartRef.current > MAX_POLL_MS

      if (complete || timedOut) {
        stopPolling()
        setRunning(false)
        if (complete) setSuccess(true)
      }
    } catch (err) {
      setError(err.message)
      stopPolling()
      setRunning(false)
    }
  }

  async function handleRunPipeline() {
    setError(null)
    setSuccess(false)
    setRunning(true)
    try {
      await runPipeline({
        industry: form.industry,
        headcount_min: Number(form.headcount_min),
        headcount_max: Number(form.headcount_max),
        funding_stage: form.funding_stage,
        geography: form.geography,
        tech_stack_signals: form.tech_stack_signals,
        score_threshold: Number(form.score_threshold),
      })
      pollStartRef.current = Date.now()
      stopPolling()
      pollTimerRef.current = setInterval(pollStatus, POLL_INTERVAL_MS)
      pollStatus()
    } catch (err) {
      setError(err.message)
      setRunning(false)
    }
  }

  async function handleReset() {
    setError(null)
    setSuccess(false)
    stopPolling()
    setRunning(false)
    try {
      await deleteLeads()
    } catch (err) {
      setError(err.message)
    }
    setStatus(EMPTY_STATUS)
  }

  const stats = [
    { label: 'Discovered', value: status.discovered },
    { label: 'Enriched', value: status.enriched },
    { label: 'Scored', value: status.scored },
    { label: 'Email Ready', value: status.email_ready },
  ]

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Pipeline</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure your ICP and run the discovery → enrichment → scoring → email pipeline.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 px-4 py-2 rounded-md bg-green-50 border border-green-200 text-sm text-green-700">
          Pipeline complete, all leads are email ready.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-[#e2e8f0] rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">ICP Config</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Industry</label>
              <input
                type="text"
                value={form.industry}
                onChange={(e) => updateField('industry', e.target.value)}
                placeholder="SaaS"
                className="w-full px-3 py-2 rounded-md border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Headcount Min</label>
                <input
                  type="number"
                  value={form.headcount_min}
                  onChange={(e) => updateField('headcount_min', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Headcount Max</label>
                <input
                  type="number"
                  value={form.headcount_max}
                  onChange={(e) => updateField('headcount_max', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Funding Stage</label>
              <select
                value={form.funding_stage}
                onChange={(e) => updateField('funding_stage', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6] bg-white"
              >
                {FUNDING_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Geography</label>
              <input
                type="text"
                value={form.geography}
                onChange={(e) => updateField('geography', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tech Stack Signals</label>
              <input
                type="text"
                value={form.tech_stack_signals}
                onChange={(e) => updateField('tech_stack_signals', e.target.value)}
                placeholder="HubSpot, Salesforce, Clay"
                className="w-full px-3 py-2 rounded-md border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Score Threshold: {form.score_threshold}
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={form.score_threshold}
                onChange={(e) => updateField('score_threshold', Number(e.target.value))}
                className="w-full accent-[#3b82f6]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-[#e2e8f0] rounded-lg p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Discovery Source</h2>
            <div className="flex items-center justify-between px-3 py-2.5 rounded-md bg-slate-50 border border-[#e2e8f0]">
              <span className="text-sm text-slate-700">Claude Web Search</span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Active
              </span>
            </div>
          </div>

          <div className="border border-[#e2e8f0] rounded-lg p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Enrichment Sources</h2>
            <ul className="space-y-2">
              <li className="flex items-center justify-between px-3 py-2.5 rounded-md bg-slate-50 border border-[#e2e8f0]">
                <span className="text-sm text-slate-700">Wappalyzer</span>
                <span className="text-xs text-slate-400">tech stack</span>
              </li>
              <li className="flex items-center justify-between px-3 py-2.5 rounded-md bg-slate-50 border border-[#e2e8f0]">
                <span className="text-sm text-slate-700">Claude Web Search</span>
                <span className="text-xs text-slate-400">signals, funding, hiring, news</span>
              </li>
            </ul>
          </div>

          <div className="border border-[#e2e8f0] rounded-lg p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">ICP Score Threshold</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-[#3b82f6]">{form.score_threshold}</span>
              <span className="text-sm text-slate-400">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleRunPipeline}
        disabled={running}
        className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-[#3b82f6] text-white text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {running && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {running ? 'Running Pipeline…' : 'Run Pipeline'}
      </button>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Pipeline Monitor</h2>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-md border border-[#e2e8f0] text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Reset
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="border border-[#e2e8f0] rounded-lg p-4">
              <div className="text-2xl font-semibold text-slate-900">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
