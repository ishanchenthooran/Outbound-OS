import { useEffect, useState } from 'react'
import { createTrigger, getTriggers, updateTrigger } from '../api'

const EMPTY_FORM = {
  type: '',
  name: '',
  keywords: '',
  score_boost: '',
  active: true,
}

function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export default function TriggersTab() {
  const [triggers, setTriggers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  async function loadTriggers() {
    setLoading(true)
    setError(null)
    try {
      const data = await getTriggers()
      setTriggers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTriggers()
  }, [])

  function openAddForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEditForm(trigger) {
    setEditingId(trigger.id)
    setForm({
      type: trigger.type || '',
      name: trigger.name || '',
      keywords: (trigger.keywords || []).join(', '),
      score_boost: trigger.score_boost ?? '',
      active: !!trigger.active,
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const keywords = form.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
      const payload = {
        type: form.type,
        name: form.name,
        keywords,
        score_boost: Number(form.score_boost) || 0,
        active: form.active,
      }

      if (editingId) {
        await updateTrigger(editingId, payload)
      } else {
        await createTrigger({ id: slugify(form.name) || slugify(form.type), ...payload })
      }

      closeForm()
      await loadTriggers()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleActive(trigger) {
    setError(null)
    try {
      await updateTrigger(trigger.id, { active: !trigger.active })
      await loadTriggers()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Triggers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Buying signals that boost a company's score when detected.
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="px-4 py-2 rounded-md bg-[#3b82f6] text-white text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Add Trigger
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-[#e2e8f0] text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Keywords</th>
              <th className="px-4 py-3 font-medium">Score Boost</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Loading triggers…
                </td>
              </tr>
            )}
            {!loading && triggers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No triggers yet. Add one to start detecting buying signals.
                </td>
              </tr>
            )}
            {!loading &&
              triggers.map((trigger) => (
                <tr key={trigger.id} className="border-b border-[#e2e8f0] last:border-b-0">
                  <td className="px-4 py-3 text-slate-600">{trigger.type}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{trigger.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(trigger.keywords || []).map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-green-600">
                    +{trigger.score_boost}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(trigger)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        trigger.active ? 'bg-[#3b82f6]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          trigger.active ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEditForm(trigger)}
                      className="text-sm font-medium text-[#3b82f6] hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 border border-[#e2e8f0] rounded-lg p-5 bg-slate-50"
        >
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            {editingId ? 'Edit Trigger' : 'New Trigger'}
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
              <input
                type="text"
                required
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                placeholder="FUNDING_ROUND"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                placeholder="Funding Round"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Keywords (comma separated)
              </label>
              <input
                type="text"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                placeholder="series, raised, funding, seed, round"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Score Boost</label>
              <input
                type="number"
                required
                value={form.score_boost}
                onChange={(e) => setForm({ ...form, score_boost: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                placeholder="20"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-700 pb-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="h-4 w-4 rounded border-[#e2e8f0] text-[#3b82f6] focus:ring-[#3b82f6]"
                />
                Active
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-md bg-[#3b82f6] text-white text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving…' : editingId ? 'Save Changes' : 'Create Trigger'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 rounded-md border border-[#e2e8f0] text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
