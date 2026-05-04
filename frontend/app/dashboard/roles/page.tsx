"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Shield, X, Save, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import { createPortal } from 'react-dom';

const API = 'http://localhost:8000/api';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('lazarus-token') : '');

const Toast = Swal.mixin({
  toast: true, position: 'top-end', showConfirmButton: false,
  timer: 3000, background: '#18181B', color: '#F8FAFC',
  customClass: { popup: 'border border-[#27272a] rounded-xl' },
});
const Dark = Swal.mixin({
  background: '#18181B', color: '#F8FAFC',
  customClass: {
    popup: 'border border-[#27272a] rounded-2xl',
    confirmButton: 'px-5 py-2 rounded-xl font-bold text-white bg-[#1D427F] ml-2',
    cancelButton: 'px-5 py-2 rounded-xl font-bold text-white/60 border border-[#27272a] mr-2',
  },
  buttonsStyling: false,
});

interface Role {
  id: number;
  name: string;
  description: string;
  users_count?: number;
  created_at: string;
}

const emptyForm = { name: '', description: '' };

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.append('search', search);

      const r = await fetch(`${API}/roles?${p}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (r.status === 401) { localStorage.clear(); window.location.href = '/'; return; }
      const d = await r.json();
      if (d.success) setRoles(d.data);
    } catch { Toast.fire({ icon: 'error', title: 'Error al cargar roles' }); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => load(), 350);
    return () => clearTimeout(t);
  }, [search, load]);

  const openCreate = () => { setForm({ ...emptyForm }); setEditing(null); setModal('create'); };
  const openEdit = (r: Role) => { setEditing(r); setForm({ name: r.name, description: r.description ?? '' }); setModal('edit'); };
  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const isEdit = modal === 'edit';

    try {
      const r = await fetch(
        isEdit ? `${API}/roles/${editing!.id}` : `${API}/roles`,
        { method: isEdit ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(form) }
      );
      const d = await r.json();
      if (!d.success) {
        Dark.fire({ icon: 'error', title: isEdit ? 'Error al actualizar rol' : 'Error al crear rol', text: d.message });
        return;
      }
      Toast.fire({ icon: 'success', title: isEdit ? 'Rol actualizado' : 'Rol creado correctamente' });
      closeModal();
      load();
    } catch {
      Dark.fire({ icon: 'error', title: 'Error de conexión' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (role: Role) => {
    if (role.users_count && role.users_count > 0) {
      Dark.fire({ icon: 'error', title: 'No permitido', text: `Este rol tiene ${role.users_count} usuarios asignados. Quita los usuarios primero.` });
      return;
    }

    const res = await Dark.fire({
      title: `¿Eliminar rol "${role.name}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
    });
    if (!res.isConfirmed) return;

    try {
      const r = await fetch(`${API}/roles/${role.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
      const d = await r.json();
      if (!d.success) { Dark.fire({ icon: 'error', title: 'Error al eliminar rol', text: d.message }); return; }
      Toast.fire({ icon: 'success', title: 'Rol eliminado' });
      load();
    } catch { Dark.fire({ icon: 'error', title: 'Error de conexión' }); }
  };

  const inputCls = "w-full bg-[#09090B] border border-[#27272a] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#1D427F] focus:ring-1 focus:ring-[#1D427F]/30 transition-all placeholder:text-white/20";
  const labelCls = "text-xs font-bold text-white/50 mb-1.5 block uppercase tracking-wider";

  const ModalContent = () => (
    <div onClick={closeModal} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div onClick={e => e.stopPropagation()} className="bg-[#18181B] border border-[#27272a] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Shield size={18} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{modal === 'create' ? 'Nuevo Rol' : 'Editar Rol'}</h2>
            </div>
          </div>
          <button onClick={closeModal} className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"><X size={18} /></button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Nombre del rol *</label>
            <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Ej: Administrador" />
          </div>
          <div>
            <label className={labelCls}>Descripción</label>
            <input className={inputCls} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ej: Tiene acceso total al sistema" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#27272a]">
            <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-semibold border border-[#27272a] text-white/60 hover:text-white hover:bg-white/5 transition-all">Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1D427F] text-white text-sm font-bold hover:bg-[#15315E] transition-all disabled:opacity-50">
              {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Guardando...' : modal === 'create' ? 'Crear Rol' : 'Guardar Cambios'}
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield size={24} className="text-purple-400" /> Roles del Sistema
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Gestión de roles y permisos
          </p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#1D427F] text-white rounded-xl text-sm font-bold hover:bg-[#15315E] transition-all shadow-lg shadow-[#1D427F]/20">
          <Plus size={16} /> Nuevo Rol
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full bg-[#18181B] border border-[#27272a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#1D427F] placeholder:text-white/20 transition-all"
          />
        </div>
        <button onClick={load} className="p-2.5 bg-[#18181B] border border-[#27272a] rounded-xl text-white/50 hover:text-white hover:border-[#1D427F] transition-all" title="Actualizar">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-white/30">
          <RefreshCw size={24} className="animate-spin mr-3" /> Cargando roles...
        </div>
      ) : roles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-white/30">
          <Shield size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-semibold">No se encontraron roles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map(r => (
            <div key={r.id} className="bg-[#18181B] border border-[#27272a] rounded-xl p-5 hover:border-[#1D427F]/40 transition-all flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{r.name}</h3>
                    <p className="text-xs text-white/40 mt-0.5">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-white/40 hover:text-blue-400 hover:bg-blue-500/10 transition-all"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(r)} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-sm text-white/60 mb-4 flex-1">
                {r.description || 'Sin descripción'}
              </p>
              <div className="mt-auto pt-4 border-t border-[#27272a] flex justify-between items-center">
                <span className="text-xs text-white/50">Usuarios asignados:</span>
                <span className="text-sm font-bold text-white px-2 py-1 bg-[#09090B] border border-[#27272a] rounded-lg">
                  {r.users_count ?? 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && typeof document !== 'undefined' && createPortal(<ModalContent />, document.body)}
    </div>
  );
}
