"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Users, Building2, Phone, Mail, X, Save, RefreshCw, ChevronDown, KeyRound } from 'lucide-react';
import Swal from 'sweetalert2';
import { createPortal } from 'react-dom';

const API = 'http://localhost:8000/api';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('lazarus-token') : '');

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, background: '#18181B', color: '#F8FAFC', customClass: { popup: 'border border-[#27272a] rounded-xl' } });
const Dark = Swal.mixin({ background: '#18181B', color: '#F8FAFC', confirmButtonColor: '#1D427F', cancelButtonColor: '#3f3f46', customClass: { popup: 'border border-[#27272a] rounded-2xl', confirmButton: 'px-5 py-2 rounded-xl font-bold text-white ml-2', cancelButton: 'px-5 py-2 rounded-xl font-bold mr-2' }, buttonsStyling: false });

interface License { id: number; license_key: string; type: string; status: string; expires_at: string | null; }
interface Client { id: number; client_name: string; business_name: string | null; nit: string | null; type_enterprise: string | null; email: string; phone: string | null; status: string; licenses?: License[]; }

const empty: Omit<Client, 'id' | 'status' | 'licenses'> = { client_name: '', business_name: '', nit: '', type_enterprise: '', email: '', phone: '' };

const statusBadge = (s: string) => {
  const m: Record<string, string> = { active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', suspended: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', expired: 'bg-red-500/15 text-red-400 border-red-500/30', revoked: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' };
  const label: Record<string, string> = { active: 'Activa', suspended: 'Suspendida', expired: 'Expirada', revoked: 'Revocada', pending: 'Pendiente' };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${m[s] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'}`}>{label[s] ?? s}</span>;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.append('search', search);
      const r = await fetch(`${API}/clients?${p}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (r.status === 401) { localStorage.clear(); window.location.href = '/'; return; }
      const d = await r.json();
      setClients(d.success ? d.data : []);
    } catch { Toast.fire({ icon: 'error', title: 'Error de conexión al cargar clientes' }); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [load]);

  const openCreate = () => { setForm({ ...empty }); setModal('create'); };
  const openEdit = (c: Client) => { setEditing(c); setForm({ client_name: c.client_name, business_name: c.business_name ?? '', nit: c.nit ?? '', type_enterprise: c.type_enterprise ?? '', email: c.email, phone: c.phone ?? '' }); setModal('edit'); };
  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = modal === 'edit';
      const url = isEdit ? `${API}/clients/${editing!.id}` : `${API}/clients`;
      const r = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!d.success) { Dark.fire({ icon: 'error', title: isEdit ? 'Error al actualizar cliente' : 'Error al crear cliente', text: d.message }); return; }
      Toast.fire({ icon: 'success', title: isEdit ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente' });
      closeModal(); load();
    } catch { Dark.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo conectar con el servidor.' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (c: Client) => {
    const res = await Dark.fire({ title: `¿Eliminar a ${c.client_name}?`, text: 'Esta acción no se puede deshacer.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
    if (!res.isConfirmed) return;
    try {
      const r = await fetch(`${API}/clients/${c.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
      const d = await r.json();
      if (!d.success) { Dark.fire({ icon: 'error', title: 'Error al eliminar cliente', text: d.message }); return; }
      Toast.fire({ icon: 'success', title: 'Cliente eliminado correctamente' }); load();
    } catch { Dark.fire({ icon: 'error', title: 'Error de conexión' }); }
  };

  const inputCls = "w-full bg-[#09090B] border border-[#27272a] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#1D427F] focus:ring-1 focus:ring-[#1D427F]/40 transition-all placeholder:text-white/20";
  const labelCls = "text-xs font-bold text-white/50 mb-1 block uppercase tracking-wider";

  const ModalContent = () => (
    <div onClick={closeModal} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div onClick={e => e.stopPropagation()} className="bg-[#18181B] border border-[#27272a] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1D427F]/20 border border-[#1D427F]/40 flex items-center justify-center"><Users size={18} className="text-blue-400" /></div>
            <h2 className="text-lg font-bold text-white">{modal === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}</h2>
          </div>
          <button onClick={closeModal} className="text-white/40 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div><label className={labelCls}>Nombre del cliente *</label><input className={inputCls} value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} required placeholder="Ej: Juan García" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Razón social</label><input className={inputCls} value={form.business_name ?? ''} onChange={e => setForm({ ...form, business_name: e.target.value })} placeholder="Ej: MiEmpresa SAS" /></div>
            <div><label className={labelCls}>NIT</label><input className={inputCls} value={form.nit ?? ''} onChange={e => setForm({ ...form, nit: e.target.value })} placeholder="900.000.000-1" /></div>
          </div>
          <div><label className={labelCls}>Tipo de empresa</label><input className={inputCls} value={form.type_enterprise ?? ''} onChange={e => setForm({ ...form, type_enterprise: e.target.value })} placeholder="Ej: Hotelería, Comercio, Restaurante..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Correo electrónico *</label><input type="email" className={inputCls} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="contacto@empresa.com" /></div>
            <div><label className={labelCls}>Teléfono</label><input className={inputCls} value={form.phone ?? ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+57 300..." /></div>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Users size={24} className="text-blue-400" /> Clientes</h1>
          <p className="text-sm text-white/40 mt-1">Gestión de clientes y sus empresas asociadas</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#1D427F] text-white rounded-xl text-sm font-bold hover:bg-[#15315E] transition-all shadow-lg shadow-[#1D427F]/20">
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, empresa, email o NIT..." className="w-full bg-[#18181B] border border-[#27272a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#1D427F] placeholder:text-white/20 transition-all" />
        </div>
        <button onClick={load} className="p-2.5 bg-[#18181B] border border-[#27272a] rounded-xl text-white/50 hover:text-white hover:border-[#1D427F] transition-all" title="Actualizar"><RefreshCw size={16} /></button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total clientes', value: clients.length, color: 'blue' },
          { label: 'Con licencias', value: clients.filter(c => (c.licenses?.length ?? 0) > 0).length, color: 'emerald' },
          { label: 'Sin licencias', value: clients.filter(c => (c.licenses?.length ?? 0) === 0).length, color: 'yellow' },
          { label: 'Licencias activas', value: clients.reduce((a, c) => a + (c.licenses?.filter(l => l.status === 'active').length ?? 0), 0), color: 'purple' },
        ].map(s => (
          <div key={s.label} className="bg-[#18181B] border border-[#27272a] rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-white/30"><RefreshCw size={24} className="animate-spin mr-3" /> Cargando clientes...</div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-white/30">
          <Users size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-semibold">No se encontraron clientes</p>
          <p className="text-sm mt-1">Crea el primer cliente haciendo clic en "Nuevo Cliente"</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map(c => (
            <div key={c.id} className="bg-[#18181B] border border-[#27272a] rounded-xl overflow-hidden hover:border-[#1D427F]/40 transition-all">
              <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1D427F]/30 to-blue-600/20 border border-[#1D427F]/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-400">{c.client_name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{c.client_name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {c.business_name && <span className="text-xs text-white/40 flex items-center gap-1"><Building2 size={11} />{c.business_name}</span>}
                      <span className="text-xs text-white/30 flex items-center gap-1"><Mail size={11} />{c.email}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="hidden md:flex items-center gap-1 text-xs text-white/40"><KeyRound size={12} />{c.licenses?.length ?? 0} lic.</span>
                  {c.licenses && c.licenses.length > 0 && (
                    <div className="hidden md:flex gap-1">{c.licenses.slice(0, 2).map(l => statusBadge(l.status))}</div>
                  )}
                  <button onClick={e => { e.stopPropagation(); openEdit(c); }} className="p-1.5 rounded-lg text-white/40 hover:text-blue-400 hover:bg-blue-500/10 transition-all"><Edit2 size={14} /></button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(c); }} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                  <ChevronDown size={16} className={`text-white/30 transition-transform ${expanded === c.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {expanded === c.id && (
                <div className="border-t border-[#27272a] bg-[#09090B]/50 p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div><p className="text-xs text-white/30 mb-1">NIT</p><p className="font-medium text-white/80">{c.nit || '—'}</p></div>
                    <div><p className="text-xs text-white/30 mb-1">Tipo empresa</p><p className="font-medium text-white/80">{c.type_enterprise || '—'}</p></div>
                    <div><p className="text-xs text-white/30 mb-1">Teléfono</p><p className="font-medium text-white/80">{c.phone || '—'}</p></div>
                    <div><p className="text-xs text-white/30 mb-1">Estado</p><span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${c.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>{c.status === 'active' ? 'Activo' : 'Eliminado'}</span></div>
                  </div>
                  {c.licenses && c.licenses.length > 0 ? (
                    <div>
                      <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-2">Licencias</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {c.licenses.map(l => (
                          <div key={l.id} className="bg-[#18181B] border border-[#27272a] rounded-lg p-3 flex items-center justify-between">
                            <span className="font-mono text-xs text-blue-300">{l.license_key}</span>
                            <div className="flex items-center gap-2">{statusBadge(l.status)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-white/30 text-center py-2">Sin licencias asignadas</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && typeof document !== 'undefined' && createPortal(<ModalContent />, document.body)}
    </div>
  );
}
