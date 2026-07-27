import { useState } from 'react'
import PipelineTab from './components/PipelineTab'
import LeadsTab from './components/LeadsTab'
import TriggersTab from './components/TriggersTab'

const TABS = [
  {
    id: 'pipeline',
    label: 'Pipeline',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-4.13a4 4 0 100-8 4 4 0 000 8zm6 4v2a4 4 0 01-1 2.65" />
      </svg>
    ),
  },
  {
    id: 'triggers',
    label: 'Triggers',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('pipeline')

  return (
    <div className="flex h-screen w-screen bg-white text-slate-900">
      <aside className="w-56 shrink-0 bg-[#0f172a] flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <span className="text-white font-semibold tracking-tight text-lg">Outbound OS</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            )
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto bg-white">
        {activeTab === 'pipeline' && <PipelineTab />}
        {activeTab === 'leads' && <LeadsTab />}
        {activeTab === 'triggers' && <TriggersTab />}
      </main>
    </div>
  )
}
