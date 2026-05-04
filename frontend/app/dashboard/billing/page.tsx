"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, CreditCard, RefreshCw, X, Save, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { createPortal } from 'react-dom';

const API = 'http://localhost:8000/api';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('lazarus-token') : '');

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, background: '#18181B', color: '#F8FAFC', customClass: { popup: 'border border-[#27272a] rounded-xl' } });
const Dark = Swal.mixin({ background: '#18181B', color: '#F8FAFC', confirmButtonColor: '#1D427F', cancelButtonColor: '#3f3f46', customClass: { popup: 'border border-[#27272a] rounded-2xl', confirmButton: 'px-5 py-2 rounded-xl font-bold text-white ml-2', cancelButton: 'px-5 py-2 rounded-xl font-bold mr-2' }, buttonsStyling: false });

interface Payment { id: number; license_id: number; license_key: string; license_type: string; client_name: string; business_name: string | null; amount: string; gateway_reference: string | null; status: string; paid_at: string | null; created_at: string; }
interface License { id: number; license_key: string; client_name: string; }

const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pendiente',  color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: <Clock size={12} /> },
  completed: { label: 'Completado', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: <CheckCircle size={12} /> },
  failed:    { label: 'Fallido',    color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: <XCircle size={12} /> },
};

const emptyForm = { license_id: '', amount: '', status: 'completed', gateway_reference: '', paid_at: '' };

const fmt = (v: string | number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Number(v));

export default function BillingPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [loadingLic, setLoadingLic] = useState(false);

  const loadLicenses = async () => {
    setLoadingLic(true);
    try {
      const r = await fetch(`${API}/licenses?status=active`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const d = await r.json();
      setLicenses(d.success ? d.data : []);
    } catch { } finally { setLoadingLic(false); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.append('search', search);
      if (statusFilter !== 'all') p.append('status', statusFilter);
      if (from) p.append('from', from);
      if (to) p.append('to', to);
      const r = await fetch(`${API}/payments?${p}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (r.status === 401) { localStorage.clear(); window.location.href = '/'; return; }
      const d = await r.json();
      if (d.success) { setPayments(d.data); setTotal(d.total ?? 0); }
    } catch { Toast.fire({ icon: 'error', title: 'Error al cargar pagos' }); }
    finally { setLoading(false); }
  }, [search, statusFilter, from, to]);

  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [load]);
  useEffect(() => { loadLicenses(); }, []);

  const openCreate = () => { setForm({ ...emptyForm, paid_at: new Date().toISOString().split('T')[0] }); setEditing(null); setModal('create'); };
  const openEdit = (p: Payment) => { setEditing(p); setForm({ license_id: String(p.license_id), amount: p.amount, status: p.status, gateway_reference: p.gateway_reference ?? '', paid_at: p.paid_at ? p.paid_at.split('T')[0] : '' }); setModal('edit'); };
  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = modal === 'edit';
      const payload = { ...form, license_id: Number(form.license_id), amount: parseFloat(form.amount), paid_at: form.paid_at || null };
      const r = await fetch(isEdit ? `${API}/payments/${editing!.id}` : `${API}/payments`, { method: isEdit ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!d.success) { Dark.fire({ icon: 'error', title: isEdit ? 'Error al actualizar pago' : 'Error al registrar pago', text: d.message }); return; }
      Toast.fire({ icon: 'success', title: isEdit ? 'Pago actualizado' : 'Pago registrado correctamente' });
      closeModal(); load();
    } catch { Dark.fire({ icon: 'error', title: 'Error de conexión' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (p: Payment) => {
    const res = await Dark.fire({ title: '¿Eliminar pago?', text: `Pago de ${fmt(p.amount)} — Esta acción no se puede deshacer.`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
    if (!res.isConfirmed) return;
    try {
      const r = await fetch(`${API}/payments/${p.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
      const d = await r.json();
      if (!d.success) { Dark.fire({ icon: 'error', title: 'Error al eliminar pago', text: d.message }); return; }
      Toast.fire({ icon: 'success', title: 'Pago eliminado' }); load();
    } catch { Dark.fire({ icon: 'error', title: 'Error de conexión' }); }
  };

  const inputCls = "w-full bg-[#09090B] border border-[#27272a] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#1D427F] transition-all placeholder:text-white/20";
  const labelCls = "text-xs font-bold text-white/50 mb-1 block uppercase tracking-wider";

  const ModalContent = () => (
    <div onClick={closeModal} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div onClick={e => e.stopPropagation()} className="bg-[#18181B] border border-[#27272a] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center"><CreditCard size={18} className="text-emerald-400" /></div>
            <h2 className="text-lg font-bold text-white">{modal === 'create' ? 'Registrar Pago' : 'Editar Pago'}</h2>
          </div>
          <button onClick={closeModal} className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>Licencia *</label>
              <button type="button" onClick={loadLicenses} disabled={loadingLic} className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                <RefreshCw size={10} className={loadingLic ? 'animate-spin' : ''} /> Actualizar licencias
              </button>
            </div>
            <select className={inputCls} value={form.license_id} onChange={e => setForm({ ...form, license_id: e.target.value })} required>
              <option value="">Seleccionar licencia...</option>
              {licenses.map(l => <option key={l.id} value={l.id}>{l.license_key} — {l.client_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Monto (COP) *</label><input type="number" step="0.01" min="0" className={inputCls} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required placeholder="0.00" /></div>
            <div>
              <label className={labelCls}>Estado *</label>
              <select className={inputCls} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="completed">Completado</option>
                <option value="pending">Pendiente</option>
                <option value="failed">Fallido</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Referencia / No. comprobante</label><input className={inputCls} value={form.gateway_reference} onChange={e => setForm({ ...form, gateway_reference: e.target.value })} placeholder="TRF-000123" /></div>
            <div><label className={labelCls}>Fecha de pago</label><input type="date" className={`${inputCls} [color-scheme:dark]`} value={form.paid_at} onChange={e => setForm({ ...form, paid_at: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-semibold border border-[#27272a] text-white/60 hover:text-white hover:bg-white/5 transition-all">Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-50">
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><CreditCard size={24} className="text-emerald-400" /> Facturación</h1>
          <p className="text-sm text-white/40 mt-1">Registro y control de pagos por periodo</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"><Plus size={16} /> Registrar Pago</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total recaudado', value: fmt(total), color: 'text-emerald-400' },
          { label: 'Pagos', value: payments.length, color: 'text-white' },
          { label: 'Completados', value: payments.filter(p => p.status === 'completed').length, color: 'text-emerald-400' },
          { label: 'Pendientes', value: payments.filter(p => p.status === 'pending').length, color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#18181B] border border-[#27272a] rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color} truncate`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar pago..." className="w-full bg-[#18181B] border border-[#27272a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#1D427F] placeholder:text-white/20 transition-all" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-[#18181B] border border-[#27272a] rounded-xl px-3 py-2.5 text-sm text-white outline-none">
          <option value="all">Todos</option><option value="completed">Completados</option><option value="pending">Pendientes</option><option value="failed">Fallidos</option>
        </select>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="bg-[#18181B] border border-[#27272a] rounded-xl px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark]" title="Desde" />
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="bg-[#18181B] border border-[#27272a] rounded-xl px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark]" title="Hasta" />
        <button onClick={load} className="p-2.5 bg-[#18181B] border border-[#27272a] rounded-xl text-white/50 hover:text-white hover:border-emerald-500/50 transition-all"><RefreshCw size={16} /></button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-white/30"><RefreshCw size={24} className="animate-spin mr-3" /> Cargando pagos...</div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-white/30"><DollarSign size={48} className="mb-4 opacity-30" /><p className="text-lg font-semibold">No se encontraron pagos</p></div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#27272a]">
          <table className="w-full">
            <thead className="bg-[#18181B] border-b border-[#27272a]">
              <tr>{['Licencia', 'Cliente', 'Monto', 'Estado', 'Referencia', 'Fecha', 'Acciones'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-bold text-white/40 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {payments.map(p => {
                const sm = statusMap[p.status] ?? { label: p.status, color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30', icon: null };
                return (
                  <tr key={p.id} className="hover:bg-[#18181B]/50 transition-colors">
                    <td className="px-4 py-3"><span className="font-mono text-xs text-blue-300 bg-blue-500/10 px-2 py-1 rounded-lg">{p.license_key}</span></td>
                    <td className="px-4 py-3"><p className="text-sm text-white">{p.client_name}</p>{p.business_name && <p className="text-xs text-white/40">{p.business_name}</p>}</td>
                    <td className="px-4 py-3"><span className="text-emerald-400 font-bold text-sm">{fmt(p.amount)}</span></td>
                    <td className="px-4 py-3"><span className={`flex items-center gap-1 w-fit text-[11px] font-bold px-2 py-0.5 rounded-full border ${sm.color}`}>{sm.icon}{sm.label}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-white/50 font-mono">{p.gateway_reference || '—'}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-white/60">{p.paid_at ? new Date(p.paid_at).toLocaleDateString('es-CO') : new Date(p.created_at).toLocaleDateString('es-CO')}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-white/40 hover:text-blue-400 hover:bg-blue-500/10 transition-all"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(p)} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
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
