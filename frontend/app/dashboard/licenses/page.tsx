"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, KeyRound, RefreshCw, X, Save, AlertTriangle, Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import Swal from 'sweetalert2';
import { createPortal } from 'react-dom';

const API = 'http://localhost:8000/api';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('lazarus-token') : '');

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, background: '#18181B', color: '#F8FAFC', customClass: { popup: 'border border-[#27272a] rounded-xl' } });
const Dark = Swal.mixin({ background: '#18181B', color: '#F8FAFC', confirmButtonColor: '#1D427F', cancelButtonColor: '#3f3f46', customClass: { popup: 'border border-[#27272a] rounded-2xl', confirmButton: 'px-5 py-2 rounded-xl font-bold text-white ml-2', cancelButton: 'px-5 py-2 rounded-xl font-bold mr-2' }, buttonsStyling: false });

interface License { id: number; license_key: string; client_id: number; client_name: string; business_name: string | null; client_email: string; type: string; status: string; expires_at: string | null; pc_macaddress: string | null; created_at: string; }
interface Client { id: number; client_name: string; business_name: string | null; }

const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active:    { label: 'Activa',     color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: <CheckCircle size={12} /> },
  suspended: { label: 'Suspendida', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',   icon: <AlertTriangle size={12} /> },
  expired:   { label: 'Expirada',   color: 'bg-red-500/15 text-red-400 border-red-500/30',             icon: <XCircle size={12} /> },
  revoked:   { label: 'Revocada',   color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',          icon: <XCircle size={12} /> },
};
const typeMap: Record<string, string> = { trial: 'Prueba', monthly: 'Mensual', anual: 'Anual' };

const emptyForm = { client_id: '', type: 'trial', status: 'active', expires_at: '', pc_macaddress: '' };

const daysLeft = (expires_at: string | null) => {
  if (!expires_at) return null;
  const diff = Math.ceil((new Date(expires_at).getTime() - Date.now()) / 86400000);
  return diff;
};

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showExpiring, setShowExpiring] = useState(false);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<License | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const r = await fetch(`${API}/clients`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const d = await r.json();
      setClients(d.success ? d.data : []);
    } catch { } finally { setLoadingClients(false); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.append('search', search);
      if (statusFilter !== 'all') p.append('status', statusFilter);
      if (typeFilter !== 'all') p.append('type', typeFilter);
      if (showExpiring) p.append('expiring', '1');
      const r = await fetch(`${API}/licenses?${p}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (r.status === 401) { localStorage.clear(); window.location.href = '/'; return; }
      const d = await r.json();
      setLicenses(d.success ? d.data : []);
    } catch { Toast.fire({ icon: 'error', title: 'Error al cargar licencias' }); }
    finally { setLoading(false); }
  }, [search, statusFilter, typeFilter, showExpiring]);

  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [load]);
  useEffect(() => { loadClients(); }, []);

  const openCreate = () => { setForm({ ...emptyForm }); setEditing(null); setModal('create'); };
  const openEdit = (l: License) => { setEditing(l); setForm({ client_id: String(l.client_id), type: l.type, status: l.status, expires_at: l.expires_at ? l.expires_at.split('T')[0] : '', pc_macaddress: l.pc_macaddress ?? '' }); setModal('edit'); };
  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = modal === 'edit';
      const payload = { ...form, client_id: Number(form.client_id), expires_at: form.expires_at || null };
      const r = await fetch(isEdit ? `${API}/licenses/${editing!.id}` : `${API}/licenses`, { method: isEdit ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!d.success) { Dark.fire({ icon: 'error', title: isEdit ? 'Error al actualizar licencia' : 'Error al crear licencia', text: d.message }); return; }
      Toast.fire({ icon: 'success', title: isEdit ? 'Licencia actualizada' : 'Licencia creada correctamente' });
      closeModal(); load();
    } catch { Dark.fire({ icon: 'error', title: 'Error de conexión' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (l: License) => {
    const res = await Dark.fire({ title: '¿Revocar licencia?', text: `La licencia ${l.license_key} quedará como revocada.`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, revocar', cancelButtonText: 'Cancelar' });
    if (!res.isConfirmed) return;
    try {
      const r = await fetch(`${API}/licenses/${l.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
      const d = await r.json();
      if (!d.success) { Dark.fire({ icon: 'error', title: 'Error al revocar licencia', text: d.message }); return; }
      Toast.fire({ icon: 'success', title: 'Licencia revocada correctamente' }); load();
    } catch { Dark.fire({ icon: 'error', title: 'Error de conexión' }); }
  };

  const inputCls = "w-full bg-[#09090B] border border-[#27272a] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#1D427F] transition-all placeholder:text-white/20";
  const labelCls = "text-xs font-bold text-white/50 mb-1 block uppercase tracking-wider";

  const expiringCount = licenses.filter(l => { const d = daysLeft(l.expires_at); return d !== null && d >= 0 && d <= 30 && l.status === 'active'; }).length;
  const expiredCount = licenses.filter(l => l.status === 'expired').length;

  const ModalContent = () => (
    <div onClick={closeModal} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div onClick={e => e.stopPropagation()} className="bg-[#18181B] border border-[#27272a] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1D427F]/20 border border-[#1D427F]/40 flex items-center justify-center"><KeyRound size={18} className="text-blue-400" /></div>
            <h2 className="text-lg font-bold text-white">{modal === 'create' ? 'Nueva Licencia' : 'Editar Licencia'}</h2>
          </div>
          <button onClick={closeModal} className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Cliente selector con botón refrescar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>Cliente *</label>
              <button type="button" onClick={loadClients} disabled={loadingClients} className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                <RefreshCw size={10} className={loadingClients ? 'animate-spin' : ''} /> Actualizar clientes
              </button>
            </div>
            <select className={inputCls} value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} required>
              <option value="">Seleccionar cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.client_name}{c.business_name ? ` — ${c.business_name}` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tipo de licencia *</label>
              <select className={inputCls} value={form.type} onChange={e => {
                const t = e.target.value;
                let exp = '';
                if (t === 'trial' || t === 'monthly') { const d = new Date(); d.setMonth(d.getMonth() + 1); exp = d.toISOString().split('T')[0]; }
                else if (t === 'anual') { const d = new Date(); d.setFullYear(d.getFullYear() + 1); exp = d.toISOString().split('T')[0]; }
                setForm({ ...form, type: t, expires_at: exp });
              }}>
                <option value="trial">Prueba</option>
                <option value="monthly">Mensual</option>
                <option value="anual">Anual</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Estado *</label>
              <select className={inputCls} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">Activa</option>
                <option value="suspended">Suspendida</option>
                <option value="expired">Expirada</option>
                <option value="revoked">Revocada</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Fecha expiración</label><input type="date" className={`${inputCls} [color-scheme:dark]`} value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} /></div>
            <div><label className={labelCls}>MAC Address PC</label><input className={inputCls} value={form.pc_macaddress} onChange={e => setForm({ ...form, pc_macaddress: e.target.value })} placeholder="AA:BB:CC:DD:EE:FF" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-semibold border border-[#27272a] text-white/60 hover:text-white hover:bg-white/5 transition-all">Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1D427F] text-white text-sm font-bold hover:bg-[#15315E] transition-all disabled:opacity-50">
              {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}{saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><KeyRound size={24} className="text-blue-400" /> Licencias</h1>
          <p className="text-sm text-white/40 mt-1">Gestión de licencias de software por cliente</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#1D427F] text-white rounded-xl text-sm font-bold hover:bg-[#15315E] transition-all shadow-lg shadow-[#1D427F]/20"><Plus size={16} /> Nueva Licencia</button>
      </div>

      {/* Alertas */}
      {(expiringCount > 0 || expiredCount > 0) && (
        <div className="flex gap-3 flex-wrap">
          {expiringCount > 0 && <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2.5 text-yellow-400 text-sm"><Clock size={16} /><span>{expiringCount} licencia{expiringCount > 1 ? 's' : ''} próxima{expiringCount > 1 ? 's' : ''} a vencer</span></div>}
          {expiredCount > 0 && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-red-400 text-sm"><XCircle size={16} /><span>{expiredCount} licencia{expiredCount > 1 ? 's' : ''} expirada{expiredCount > 1 ? 's' : ''}</span></div>}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por clave o cliente..." className="w-full bg-[#18181B] border border-[#27272a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#1D427F] placeholder:text-white/20 transition-all" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-[#18181B] border border-[#27272a] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#1D427F]">
          <option value="all">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="suspended">Suspendidas</option>
          <option value="expired">Expiradas</option>
          <option value="revoked">Revocadas</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-[#18181B] border border-[#27272a] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#1D427F]">
          <option value="all">Todos los tipos</option>
          <option value="trial">Prueba</option>
          <option value="monthly">Mensual</option>
          <option value="anual">Anual</option>
        </select>
        <button onClick={() => setShowExpiring(!showExpiring)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${showExpiring ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-[#18181B] border-[#27272a] text-white/50 hover:text-white'}`}>
          <Clock size={15} /> Próx. a vencer
        </button>
        <button onClick={load} className="p-2.5 bg-[#18181B] border border-[#27272a] rounded-xl text-white/50 hover:text-white hover:border-[#1D427F] transition-all"><RefreshCw size={16} /></button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: licenses.length, color: 'text-white' },
          { label: 'Activas', value: licenses.filter(l => l.status === 'active').length, color: 'text-emerald-400' },
          { label: 'Suspendidas', value: licenses.filter(l => l.status === 'suspended').length, color: 'text-yellow-400' },
          { label: 'Expiradas', value: licenses.filter(l => l.status === 'expired').length, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#18181B] border border-[#27272a] rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-white/30"><RefreshCw size={24} className="animate-spin mr-3" /> Cargando licencias...</div>
      ) : licenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-white/30"><KeyRound size={48} className="mb-4 opacity-30" /><p className="text-lg font-semibold">No se encontraron licencias</p></div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#27272a]">
          <table className="w-full">
            <thead className="bg-[#18181B] border-b border-[#27272a]">
              <tr>{['Clave de Licencia', 'Cliente', 'Tipo', 'Estado', 'Expiración', 'Acciones'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-bold text-white/40 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {licenses.map(l => {
                const sm = statusMap[l.status] ?? { label: l.status, color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30', icon: null };
                const days = daysLeft(l.expires_at);
                const isExpiringSoon = days !== null && days >= 0 && days <= 30 && l.status === 'active';
                return (
                  <tr key={l.id} className={`hover:bg-[#18181B]/50 transition-colors ${isExpiringSoon ? 'bg-yellow-500/5' : ''}`}>
                    <td className="px-4 py-3"><span className="font-mono text-xs text-blue-300 bg-blue-500/10 px-2 py-1 rounded-lg">{l.license_key}</span></td>
                    <td className="px-4 py-3"><p className="text-sm text-white font-medium">{l.client_name}</p>{l.business_name && <p className="text-xs text-white/40">{l.business_name}</p>}</td>
                    <td className="px-4 py-3"><span className="text-xs text-white/60 bg-white/5 px-2 py-0.5 rounded-lg">{typeMap[l.type] ?? l.type}</span></td>
                    <td className="px-4 py-3"><span className={`flex items-center gap-1 w-fit text-[11px] font-bold px-2 py-0.5 rounded-full border ${sm.color}`}>{sm.icon}{sm.label}</span></td>
                    <td className="px-4 py-3">
                      {l.expires_at ? (
                        <div>
                          <p className="text-sm text-white/70">{new Date(l.expires_at).toLocaleDateString('es-CO')}</p>
                          {days !== null && <p className={`text-[10px] font-bold ${days < 0 ? 'text-red-400' : days <= 30 ? 'text-yellow-400' : 'text-white/30'}`}>{days < 0 ? `Hace ${Math.abs(days)}d` : `${days}d restantes`}</p>}
                        </div>
                      ) : <span className="text-white/30 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(l)} className="p-1.5 rounded-lg text-white/40 hover:text-blue-400 hover:bg-blue-500/10 transition-all"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(l)} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {modal && typeof document !== 'undefined' && createPortal(<ModalContent />, document.body)}
    </div>
  );
}
