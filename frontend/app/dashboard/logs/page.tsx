"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Activity, Filter, AlertCircle } from 'lucide-react';

const API = 'http://localhost:8000/api';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('lazarus-token') : '');

interface Log { id: number; action: string; description: string; ip_address: string; validation_status: string; created_at: string; }

const actionLabels: Record<string, { label: string; color: string }> = {
  create_client:  { label: 'Crear Cliente',   color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  update_client:  { label: 'Editar Cliente',  color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  delete_client:  { label: 'Eliminar Cliente',color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  create_license: { label: 'Crear Licencia',  color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  update_license: { label: 'Editar Licencia', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  delete_license: { label: 'Revocar Licencia',color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  create_payment: { label: 'Crear Pago',      color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  update_payment: { label: 'Editar Pago',     color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  delete_payment: { label: 'Eliminar Pago',   color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  create_user:    { label: 'Crear Usuario',   color: 'bg-teal-500/15 text-teal-400 border-teal-500/30' },
  update_user:    { label: 'Editar Usuario',  color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  delete_user:    { label: 'Eliminar Usuario',color: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.append('search', search);
      if (actionFilter) p.append('action', actionFilter);
      if (from) p.append('from', from);
      if (to) p.append('to', to);
      const r = await fetch(`${API}/logs?${p}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (r.status === 401) { localStorage.clear(); window.location.href = '/'; return; }
      const d = await r.json();
      setLogs(d.success ? d.data : []);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }, [search, actionFilter, from, to]);

  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [load]);

  const actionTypes = Array.from(new Set(Object.keys(actionLabels)));

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Activity size={24} className="text-orange-400" /> Logs del Sistema</h1>
          <p className="text-sm text-white/40 mt-1">Registro de todas las operaciones realizadas en el sistema</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 bg-[#18181B] border border-[#27272a] text-white rounded-xl text-sm font-semibold hover:border-[#1D427F] transition-all">
          <RefreshCw size={15} /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total registros', value: logs.length },
          { label: 'Creaciones', value: logs.filter(l => l.action.startsWith('create')).length },
          { label: 'Modificaciones', value: logs.filter(l => l.action.startsWith('update')).length },
          { label: 'Eliminaciones', value: logs.filter(l => l.action.startsWith('delete')).length },
        ].map(s => (
          <div key={s.label} className="bg-[#18181B] border border-[#27272a] rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar en logs..." className="w-full bg-[#18181B] border border-[#27272a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#1D427F] placeholder:text-white/20 transition-all" />
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="bg-[#18181B] border border-[#27272a] rounded-xl px-3 py-2.5 text-sm text-white outline-none">
          <option value="">Todas las acciones</option>
          {actionTypes.map(a => <option key={a} value={a}>{actionLabels[a]?.label ?? a}</option>)}
        </select>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="bg-[#18181B] border border-[#27272a] rounded-xl px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark]" title="Desde" />
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="bg-[#18181B] border border-[#27272a] rounded-xl px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark]" title="Hasta" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-white/30"><RefreshCw size={24} className="animate-spin mr-3" /> Cargando logs...</div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-white/30"><AlertCircle size={48} className="mb-4 opacity-30" /><p className="text-lg font-semibold">No hay registros de actividad</p></div>
      ) : (
        <div className="space-y-2">
          {logs.map(l => {
            const ac = actionLabels[l.action] ?? { label: l.action, color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' };
            return (
              <div key={l.id} className="bg-[#18181B] border border-[#27272a] rounded-xl p-4 flex items-start gap-4 hover:border-[#1D427F]/30 transition-all">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${ac.color}`}>{ac.label}</span>
                    <span className="text-xs text-white/30">{l.ip_address}</span>
                  </div>
                  <p className="text-sm text-white/70 truncate">{l.description}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-white/30">{new Date(l.created_at).toLocaleDateString('es-CO')}</p>
                  <p className="text-[10px] text-white/20">{new Date(l.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
