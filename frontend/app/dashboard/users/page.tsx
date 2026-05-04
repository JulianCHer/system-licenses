"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Plus, Edit2, Trash2, UserCog, Shield,
  Eye, X, Save, RefreshCw, ChevronLeft, ChevronRight,
  ChevronDown, Check,
} from 'lucide-react';
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface AppUser {
  id: number;
  name: string;
  username: string;
  role_id: number;
  role_name: string;
  state: string;
  created_at: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
}

interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

// ─── Main page ────────────────────────────────────────────────────────────────
const emptyForm = { name: '', username: '', password: '', role_id: '' };
const PER_PAGE = 20;

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  // ─ Load Roles ────────────────────────────────────────────────────────────
  const loadRoles = async () => {
    try {
      const r = await fetch(`${API}/roles`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const d = await r.json();
      if (d.success) setRoles(d.data);
    } catch (e) { console.error('Error fetching roles'); }
  };

  useEffect(() => { loadRoles(); }, []);

  // ─ Load Users ────────────────────────────────────────────────────────────
  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        per_page: String(PER_PAGE),
      });
      if (search) params.append('search', search);
      if (roleFilter !== 'all') params.append('role_id', roleFilter);

      const r = await fetch(`${API}/users?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (r.status === 401) { localStorage.clear(); window.location.href = '/'; return; }
      const d = await r.json();
      if (d.success) {
        setUsers(d.data);
        setPagination({ total: d.total, per_page: d.per_page, current_page: d.current_page, last_page: d.last_page });
      }
    } catch { Toast.fire({ icon: 'error', title: 'Error al cargar usuarios' }); }
    finally { setLoading(false); }
  }, [search, roleFilter, page]);

  // Debounce the search input to avoid hammering the server
  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => load(1), 350);
    return () => clearTimeout(t);
  }, [search, roleFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─ Modal helpers ─────────────────────────────────────────────────────────
  const openCreate = () => { setForm({ ...emptyForm }); setEditing(null); setModal('create'); };
  const openEdit = (u: AppUser) => { setEditing(u); setForm({ name: u.name, username: u.username, password: '', role_id: String(u.role_id) }); setModal('edit'); };
  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role_id) { Dark.fire({ icon: 'warning', title: 'Selecciona un rol' }); return; }

    setSaving(true);
    const isEdit = modal === 'edit';
    const payload: Record<string, any> = { name: form.name, username: form.username, role_id: Number(form.role_id) };
    if (form.password) payload.password = form.password;

    try {
      const r = await fetch(
        isEdit ? `${API}/users/${editing!.id}` : `${API}/users`,
        { method: isEdit ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );
      const d = await r.json();
      if (!d.success) {
        Dark.fire({ icon: 'error', title: isEdit ? 'Error al actualizar usuario' : 'Error al crear usuario', text: d.message });
        return;
      }
      Toast.fire({ icon: 'success', title: isEdit ? 'Usuario actualizado' : 'Usuario creado correctamente' });
      closeModal();
      load(isEdit ? page : 1);
    } catch {
      Dark.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo conectar con el servidor.' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (u: AppUser) => {
    const res = await Dark.fire({
      title: `¿Eliminar a "${u.username}"?`,
      text: 'El usuario quedará inactivo y no podrá ingresar al sistema.',
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
    });
    if (!res.isConfirmed) return;
    try {
      const r = await fetch(`${API}/users/${u.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
      const d = await r.json();
      if (!d.success) { Dark.fire({ icon: 'error', title: 'Error al eliminar usuario', text: d.message }); return; }
      Toast.fire({ icon: 'success', title: 'Usuario eliminado' });
      const nextPage = users.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      load(nextPage);
    } catch { Dark.fire({ icon: 'error', title: 'Error de conexión' }); }
  };

  // ─ RolePicker Component ──────────────────────────────────────────────────
  function RolePicker({ user }: { user: AppUser }) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    const changeRole = async (roleId: number) => {
      if (roleId === user.role_id) { setOpen(false); return; }
      setSaving(true);
      try {
        const r = await fetch(`${API}/users/${user.id}/role`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ role_id: roleId }),
        });
        const d = await r.json();
        if (!d.success) { Toast.fire({ icon: 'error', title: d.message ?? 'Error al cambiar rol' }); }
        else { Toast.fire({ icon: 'success', title: 'Rol actualizado' }); load(page); }
      } catch { Toast.fire({ icon: 'error', title: 'Error de conexión' }); }
      finally { setSaving(false); setOpen(false); }
    };

    const isSystemAdmin = user.role_name?.toLowerCase() === 'admin';
    const colorClass = isSystemAdmin ? 'bg-purple-500/15 text-purple-300 border-purple-500/40' : 'bg-blue-500/15 text-blue-300 border-blue-500/40';
    const icon = isSystemAdmin ? <Shield size={12} /> : <UserCog size={12} />;

    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          disabled={saving}
          className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 ${colorClass}`}
        >
          {saving ? <RefreshCw size={11} className="animate-spin" /> : icon}
          {user.role_name ?? 'Sin rol'}
          <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1.5 z-30 bg-[#18181B] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden w-44">
            {roles.map(r => (
              <button
                key={r.id}
                onClick={() => changeRole(r.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-white/5 ${r.id === user.role_id ? 'text-white font-semibold' : 'text-white/60'}`}
              >
                <span>{r.name}</span>
                {r.id === user.role_id && <Check size={13} className="text-blue-400" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─ Styles ────────────────────────────────────────────────────────────────
  const inputCls = "w-full bg-[#09090B] border border-[#27272a] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#1D427F] focus:ring-1 focus:ring-[#1D427F]/30 transition-all placeholder:text-white/20";
  const labelCls = "text-xs font-bold text-white/50 mb-1.5 block uppercase tracking-wider";

  // ─ Modal ─────────────────────────────────────────────────────────────────
  const ModalContent = () => (
    <div onClick={closeModal} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div onClick={e => e.stopPropagation()} className="bg-[#18181B] border border-[#27272a] rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <UserCog size={18} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{modal === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}</h2>
              <p className="text-xs text-white/30">{modal === 'create' ? 'Completa los datos del nuevo usuario' : `Editando a @${editing?.username}`}</p>
            </div>
          </div>
          <button onClick={closeModal} className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"><X size={18} /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Nombre completo *</label>
            <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Ej: Ana Martínez" />
          </div>
          <div>
            <label className={labelCls}>Nombre de usuario *</label>
            <input className={inputCls} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required placeholder="Ej: AnaM01 (sin espacios)" />
          </div>
          <div>
            <label className={labelCls}>{modal === 'edit' ? 'Nueva contraseña (vacío = sin cambios)' : 'Contraseña *'}</label>
            <input type="password" className={inputCls} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={modal === 'create'} placeholder="Mínimo 6 caracteres" />
          </div>

          <div>
            <label className={labelCls}>Rol del usuario *</label>
            <select className={inputCls} value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })} required>
              <option value="" disabled>Selecciona un rol...</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name} — {r.description}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#27272a]">
            <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-semibold border border-[#27272a] text-white/60 hover:text-white hover:bg-white/5 transition-all">Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1D427F] text-white text-sm font-bold hover:bg-[#15315E] transition-all disabled:opacity-50">
              {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Guardando...' : modal === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ─ Pagination controls ───────────────────────────────────────────────────
  const PageBar = () => {
    if (!pagination || pagination.last_page <= 1) return null;
    const { current_page, last_page, total, per_page } = pagination;
    const from = (current_page - 1) * per_page + 1;
    const to = Math.min(current_page * per_page, total);

    return (
      <div className="flex items-center justify-between px-1 mt-4">
        <p className="text-xs text-white/30">
          Mostrando <span className="text-white/60 font-medium">{from}–{to}</span> de <span className="text-white/60 font-medium">{total}</span> usuarios
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={current_page === 1} className="p-1.5 rounded-lg border border-[#27272a] text-white/40 hover:text-white hover:border-[#1D427F] disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronLeft size={14} /></button>
          {Array.from({ length: Math.min(last_page, 7) }, (_, i) => {
            const pg = last_page <= 7 ? i + 1 : (current_page <= 4 ? i + 1 : current_page - 3 + i);
            if (pg < 1 || pg > last_page) return null;
            return (
              <button key={pg} onClick={() => setPage(pg)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${pg === current_page ? 'bg-[#1D427F] text-white' : 'border border-[#27272a] text-white/40 hover:text-white hover:border-[#1D427F]'}`}>{pg}</button>
            );
          })}
          <button onClick={() => setPage(p => Math.min(p + 1, last_page))} disabled={current_page === last_page} className="p-1.5 rounded-lg border border-[#27272a] text-white/40 hover:text-white hover:border-[#1D427F] disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronRight size={14} /></button>
        </div>
      </div>
    );
  };

  // ─ Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCog size={24} className="text-purple-400" /> Usuarios
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Gestión de accesos y credenciales del sistema
          </p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#1D427F] text-white rounded-xl text-sm font-bold hover:bg-[#15315E] transition-all shadow-lg shadow-[#1D427F]/20">
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      {/* ── Filtros ── */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o usuario..."
            className="w-full bg-[#18181B] border border-[#27272a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#1D427F] placeholder:text-white/20 transition-all"
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-[#18181B] border border-[#27272a] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#1D427F] transition-all">
          <option value="all">Todos los roles</option>
          {roles.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <button onClick={() => { load(page); loadRoles(); }} className="p-2.5 bg-[#18181B] border border-[#27272a] rounded-xl text-white/50 hover:text-white hover:border-[#1D427F] transition-all" title="Actualizar">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#18181B] border border-[#27272a] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Total Usuarios (Filtro)</p>
          <p className="text-2xl font-bold text-white">{pagination?.total ?? '—'}</p>
        </div>
        {roles.slice(0, 3).map(r => (
          <div key={r.id} className="bg-[#18181B] border border-[#27272a] rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1">{r.name}</p>
            <p className="text-2xl font-bold text-white">{users.filter(u => u.role_id === r.id).length}</p>
          </div>
        ))}
      </div>

      {/* ── Tabla ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-white/30">
          <RefreshCw size={24} className="animate-spin mr-3" /> Cargando usuarios...
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-white/30">
          <UserCog size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-semibold">No se encontraron usuarios</p>
          <p className="text-sm mt-1">Crea el primero con el botón "Nuevo Usuario"</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-[#27272a]">
            <table className="w-full">
              <thead className="bg-[#18181B] border-b border-[#27272a]">
                <tr>
                  {['Usuario', 'Rol', 'Estado', 'Creado', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-white/40 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${u.username}&backgroundColor=transparent`}
                          alt=""
                          loading="lazy"
                          className="w-9 h-9 rounded-xl bg-[#09090B] border border-[#27272a] flex-shrink-0"
                        />
                        <div>
                          <p className="text-sm font-semibold text-white">{u.name}</p>
                          <p className="text-xs text-white/40">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RolePicker user={u} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${u.state === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
                        {u.state === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/40">
                      {new Date(u.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-white/40 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Editar usuario">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(u)} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Eliminar usuario">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PageBar />
        </>
      )}

      {modal && typeof document !== 'undefined' && createPortal(<ModalContent />, document.body)}
    </div>
  );
}
