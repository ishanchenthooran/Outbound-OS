import { useEffect, useState } from 'react'
import { getLeads } from '../api'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'discovered', label: 'Discovered' },
  { id: 'enriched', label: 'Enriched' },
  { id: 'scored', label: 'Scored' },
  { id: 'email_ready', label: 'Email Ready' },
]

const STATUS_META = {
  discovered: { label: 'Discovered', className: 'bg-slate-100 text-slate-600' },
  enriched: { label: 'Enriched', className: 'bg-blue-100 text-blue-700' },
  scored: { label: 'Scored', className: 'bg-purple-100 text-purple-700' },
  email_ready: { label: 'Email Ready', className: 'bg-green-100 text-green-700' },
}

function scoreBadgeClasses(score) {
  if (score == null) return 'bg-slate-100 text-slate-500'
  if (score >= 80) return 'bg-green-100 text-green-700'
  if (score >= 60) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

function formatCriterion(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function LeadCardSkeleton() {
  return (
    <div className="border border-[#e2e8f0] rounded-lg p-4 animate-pulse">
      <div className="h-4 w-2/3 bg-slate-200 rounded mb-2" />
      <div className="h-3 w-1/3 bg-slate-100 rounded mb-4" />
      <div className="h-5 w-16 bg-slate-200 rounded-full" />
    </div>
  )
}

export default function LeadsTab() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const [copied, setCopied] = useState(false)

  async function loadLeads() {
    setLoading(true)
    setError(null)
    try {
      const data = await getLeads()
      setLeads(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeads()
  }, [])

  const filtered = leads.filter((lead) => {
    if (activeFilter !== 'all' && lead.status !== activeFilter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      (lead.name || '').toLowerCase().includes(q) || (lead.domain || '').toLowerCase().includes(q)
    )
  })

  function openLead(lead) {
    setSelectedLead(lead)
    setCopied(false)
  }

  function closePanel() {
    setSelectedLead(null)
    setCopied(false)
  }

  async function copyEmail() {
    if (!selectedLead?.email_draft) return
    try {
      await navigator.clipboard.writeText(selectedLead.email_draft)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('Could not copy to clipboard')
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500 mt-1">Companies discovered, scored, and ready for outreach.</p>
        </div>
        <button
          onClick={loadLeads}
          disabled={loading}
          className="px-3 py-1.5 rounded-md border border-[#e2e8f0] text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-md">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                activeFilter === f.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company or domain…"
          className="flex-1 min-w-[200px] max-w-xs px-3 py-2 rounded-md border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
        />
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LeadCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && leads.length === 0 && (
        <div className="flex flex-col items-start gap-2 mt-8 px-6 py-8 border border-dashed border-[#e2e8f0] rounded-lg text-slate-500">
          <span className="text-2xl">←</span>
          <p className="text-sm">
            No leads yet. Head to the <span className="font-medium text-slate-700">Pipeline</span> tab and run
            the pipeline to discover companies.
          </p>
        </div>
      )}

      {!loading && leads.length > 0 && filtered.length === 0 && (
        <div className="mt-8 px-6 py-8 border border-dashed border-[#e2e8f0] rounded-lg text-center text-slate-500 text-sm">
          No leads match your filters.
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lead) => {
            const statusMeta = STATUS_META[lead.status] || {
              label: lead.status,
              className: 'bg-slate-100 text-slate-600',
            }
            const topTriggers = (lead.fired_triggers || []).slice(0, 2)
            return (
              <button
                key={lead.id}
                onClick={() => openLead(lead)}
                className="text-left border border-[#e2e8f0] rounded-lg p-4 hover:border-[#3b82f6] hover:shadow-sm transition-all bg-white"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 truncate">{lead.name}</h3>
                  {lead.final_score != null && (
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${scoreBadgeClasses(lead.final_score)}`}
                    >
                      {Math.round(lead.final_score)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-3 truncate">{lead.domain}</p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusMeta.className}`}>
                    {statusMeta.label}
                  </span>
                  {topTriggers.map((trigger) => (
                    <span
                      key={trigger.id || trigger.name}
                      className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"
                    >
                      {trigger.name}
                    </span>
                  ))}
                </div>

                {(lead.funding_stage || lead.industry) && (
                  <p className="text-xs text-slate-500">
                    {[lead.industry, lead.funding_stage].filter(Boolean).join(' · ')}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}

      {selectedLead && (
        <>
          <div className="fixed inset-0 bg-slate-900/30 z-40" onClick={closePanel} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="flex items-start justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{selectedLead.name}</h2>
                <p className="text-sm text-slate-400">{selectedLead.domain}</p>
              </div>
              <button onClick={closePanel} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Score Breakdown</h3>
                {selectedLead.score_breakdown ? (
                  <table className="w-full text-sm border border-[#e2e8f0] rounded-md overflow-hidden">
                    <thead>
                      <tr className="bg-slate-50 text-left text-slate-500">
                        <th className="px-3 py-2 font-medium">Criterion</th>
                        <th className="px-3 py-2 font-medium text-right">Raw</th>
                        <th className="px-3 py-2 font-medium text-right">Weight</th>
                        <th className="px-3 py-2 font-medium text-right">Weighted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedLead.score_breakdown).map(([criterion, values]) => (
                        <tr key={criterion} className="border-t border-[#e2e8f0]">
                          <td className="px-3 py-2 text-slate-700">{formatCriterion(criterion)}</td>
                          <td className="px-3 py-2 text-right text-slate-600">{values.raw_score}</td>
                          <td className="px-3 py-2 text-right text-slate-600">{values.weight}</td>
                          <td className="px-3 py-2 text-right font-medium text-slate-900">{values.weighted_score}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[#e2e8f0] bg-slate-50">
                        <td colSpan={3} className="px-3 py-2 font-medium text-slate-700">
                          Final Score
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">
                          {selectedLead.final_score}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <p className="text-sm text-slate-400">Not scored yet.</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Fired Triggers</h3>
                {(selectedLead.fired_triggers || []).length > 0 ? (
                  <ul className="space-y-1.5">
                    {selectedLead.fired_triggers.map((trigger) => (
                      <li
                        key={trigger.id || trigger.name}
                        className="flex items-center justify-between px-3 py-2 rounded-md bg-amber-50 border border-amber-100 text-sm"
                      >
                        <span className="text-slate-700">{trigger.name}</span>
                        <span className="font-medium text-amber-700">+{trigger.score_boost}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">No triggers fired.</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-900">Drafted Email</h3>
                  {selectedLead.email_draft && (
                    <button
                      onClick={copyEmail}
                      className="px-2.5 py-1 rounded-md border border-[#e2e8f0] text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      {copied ? 'Copied!' : 'Copy Email'}
                    </button>
                  )}
                </div>
                <textarea
                  readOnly
                  value={selectedLead.email_draft || 'Email not drafted yet.'}
                  rows={12}
                  className="w-full px-3 py-2 rounded-md border border-[#e2e8f0] text-sm text-slate-700 bg-slate-50 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
