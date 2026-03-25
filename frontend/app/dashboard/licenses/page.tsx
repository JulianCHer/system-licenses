"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, KeyRound, Building2, ChevronDown, Monitor, Clock, Box, Save, X, Users } from 'lucide-react';

interface License {
  id: number;
  license_key: string;
  start_date: string;
  end_date: string;
  status: string;
  max_devices: number;
}

interface Client {
  id: number;
  full_name: string;
  company_name: string | null;
  email: string;
  phone_number: string | null;
  establishment_type: string | null;
  licenses: License[];
}

export default function LicensesModule() {
  const [clients, setClients] = useState<Client[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  // Filtros
  const [searchName, setSearchName] = useState('');
  const [establishmentFilter, setEstablishmentFilter] = useState('');
  
  // Modal State para Edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Modal State para Creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({ full_name: '', company_name: '', email: '', phone_number: '', establishment_type: '' });
  const [newLicenseData, setNewLicenseData] = useState({ end_date: '', max_devices: 1 });
  const [isCreating, setIsCreating] = useState(false);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('lazarus-token');
      if (!token) return;

      const params = new URLSearchParams();
      if (searchName) params.append('name', searchName);
      if (establishmentFilter) params.append('establishment_type', establishmentFilter);

      const res = await fetch(`http://localhost:8000/api/clients?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  useEffect(() => {
    // Implementar un pequeño delay de debounce para no saturar el server al tipear
    const debounce = setTimeout(() => {
      fetchClients();
    }, 400);
    return () => clearTimeout(debounce);
  }, [searchName, establishmentFilter]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleEraseClient = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que quieres Desactivar a este cliente? Pasará a la papelera (erased).')) return;
    try {
      const token = localStorage.getItem('lazarus-token');
      await fetch(`http://localhost:8000/api/clients/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchClients(); // recargar
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      const token = localStorage.getItem('lazarus-token');
      await fetch(`http://localhost:8000/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(editingClient)
      });
      setIsEditModalOpen(false);
      fetchClients();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const token = localStorage.getItem('lazarus-token');
      
      // 1. Crear el Cliente en la Base de Datos
      const clientRes = await fetch(`http://localhost:8000/api/clients`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newClientData)
      });
      const clientData = await clientRes.json();
      if (!clientData.success) {
        alert('Hubo un problema registrando el cliente. Podría existir ya el correo.');
        setIsCreating(false);
        return;
      }

      // 2. Crear y Atarla a una Licencia Nueva
      await fetch(`http://localhost:8000/api/licenses`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: clientData.client.id,
          product_id: 1, // ID default por ahora en etapa temprana
          start_date: new Date().toISOString().split('T')[0],
          end_date: newLicenseData.end_date,
          max_devices: newLicenseData.max_devices
        })
      });
      
      setIsCreateModalOpen(false);
      setNewClientData({ full_name: '', company_name: '', email: '', phone_number: '', establishment_type: '' });
      setNewLicenseData({ end_date: '', max_devices: 1 });
      fetchClients();
    } catch (e) {
      console.error(e);
      alert('Hubo un error de conexión procesando la Licencia.');
    } finally {
      setIsCreating(false);
    }
  };

  // UI Secundario: Modal de Creación
  const renderCreateModal = () => {
    if (!isCreateModalOpen) return null;
    return (
      <div className="fixed inset-0 bg-[#09090B]/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200 lg:p-4">
        <div className="bg-[#18181B] border border-[#27272a] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center p-6 border-b border-[#27272a] sticky top-0 bg-[#18181B] z-10">
            <div>
              <h2 className="text-xl font-bold text-[#F8FAFC]">Autorizar Nueva Licencia</h2>
              <p className="text-xs text-[#F8FAFC]/50 mt-1">Ingresa los datos para registrar un nuevo punto comercial en la red Lazarus.</p>
            </div>
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-[#F8FAFC]/40 hover:text-white transition bg-[#27272a]/50 p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400"><X size={20} /></button>
          </div>
          <form onSubmit={handleCreateFlow} className="p-6 space-y-6">
            
            {/* Sección Cliente */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 border-b border-[#27272a]/50 pb-2"><Users size={16} /> 1. Expediente del Adquiriente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Nombre Completo *</label>
                  <input type="text" value={newClientData.full_name} onChange={e => setNewClientData({...newClientData, full_name: e.target.value})} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-2.5 text-sm outline-none focus:border-[#1D427F] text-white" required placeholder="Ej: John Doe" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Razón Social o Empresa *</label>
                  <input type="text" value={newClientData.company_name} onChange={e => setNewClientData({...newClientData, company_name: e.target.value})} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-2.5 text-sm outline-none focus:border-[#1D427F] text-white" required placeholder="La esquina SAS" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Correo Base (Para Auth) *</label>
                  <input type="email" value={newClientData.email} onChange={e => setNewClientData({...newClientData, email: e.target.value})} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-2.5 text-sm outline-none focus:border-[#1D427F] text-white" required placeholder="contacto@empresa.com" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Línea de Teléfono</label>
                  <input type="text" value={newClientData.phone_number} onChange={e => setNewClientData({...newClientData, phone_number: e.target.value})} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-2.5 text-sm outline-none focus:border-[#1D427F] text-white" placeholder="+57 ..." />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Clasificación de Establecimiento *</label>
                  <select value={newClientData.establishment_type} onChange={e => setNewClientData({...newClientData, establishment_type: e.target.value})} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-2.5 text-sm outline-none focus:border-[#1D427F] text-[#F8FAFC]" required>
                    <option value="">Seleccionar Clasificación Técnica...</option>
                    <option value="Sistem">Sistem</option>
                    <option value="MiniMarket">MiniMarket</option>
                    <option value="Retail">Retail</option>
                    <option value="Restaurante">Restaurante</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sección Config Licencia */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 border-b border-[#27272a]/50 pb-2"><KeyRound size={16} /> 2. Propiedades de la Licencia Generada</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Expiración (Corte T1) *</label>
                  <input type="date" value={newLicenseData.end_date} onChange={e => setNewLicenseData({...newLicenseData, end_date: e.target.value})} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-2.5 text-sm outline-none focus:border-[#1D427F] text-[#F8FAFC] [color-scheme:dark]" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Equipos Físicos Máximos *</label>
                  <input type="number" min="1" max="100" value={newLicenseData.max_devices} onChange={e => setNewLicenseData({...newLicenseData, max_devices: parseInt(e.target.value)})} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-2.5 text-sm outline-none focus:border-[#1D427F] text-white" required />
                </div>
              </div>
              <p className="text-[10px] text-[#F8FAFC]/40 bg-[#1D427F]/10 border border-[#1D427F]/20 p-3 rounded-lg flex items-center gap-2 mb-2">
                <Box size={14} className="text-blue-400" />
                El Token encriptado (LZR-XXXXXX) de validación única por hardware se generará automáticamente tras guardar y se asociará perpetuamente a la matriz de esta empresa.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-3 sticky bottom-0 bg-[#18181B] border-t border-[#27272a] p-4 -mx-6 -mb-6 rounded-b-2xl shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-[#27272a] text-[#F8FAFC]/60 hover:text-white hover:bg-[#27272a]/50 transition-colors">Cancelar Abort</button>
              <button type="submit" disabled={isCreating} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1D427F] to-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/30 hover:from-[#15315E] hover:to-[#1D427F] transition-all disabled:opacity-50 min-w-[180px] justify-center">
                {isCreating ? <Clock size={16} className="animate-spin" /> : <KeyRound size={16} />} 
                {isCreating ? 'Procesando Hash...' : 'Ejecutar Generación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // UI Secundario: Modal de Edición
  const renderEditModal = () => {
    if (!isEditModalOpen || !editingClient) return null;
    return (
      <div className="fixed inset-0 bg-[#09090B]/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
        <div className="bg-[#18181B] border border-[#27272a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
          <div className="flex justify-between items-center p-6 border-b border-[#27272a]">
            <h2 className="text-xl font-bold text-[#F8FAFC]">Editar Cliente</h2>
            <button onClick={() => setIsEditModalOpen(false)} className="text-[#F8FAFC]/40 hover:text-white transition"><X size={20} /></button>
          </div>
          <form onSubmit={handleUpdateClient} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Nombre Completo</label>
              <input type="text" value={editingClient.full_name} onChange={e => setEditingClient({...editingClient, full_name: e.target.value})} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-2.5 text-sm outline-none focus:border-[#1D427F]" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Empresa / Negocio</label>
                <input type="text" value={editingClient.company_name || ''} onChange={e => setEditingClient({...editingClient, company_name: e.target.value})} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-2.5 text-sm outline-none focus:border-[#1D427F]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Teléfono</label>
                <input type="text" value={editingClient.phone_number || ''} onChange={e => setEditingClient({...editingClient, phone_number: e.target.value})} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-2.5 text-sm outline-none focus:border-[#1D427F]" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Tipo de Establecimiento</label>
              <select value={editingClient.establishment_type || ''} onChange={e => setEditingClient({...editingClient, establishment_type: e.target.value})} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-2.5 text-sm outline-none focus:border-[#1D427F] text-[#F8FAFC]">
                <option value="">Seleccionar Tipo...</option>
                <option value="Sistem">Sistem</option>
                <option value="MiniMarket">MiniMarket</option>
                <option value="Retail">Retail</option>
                <option value="Restaurante">Restaurante</option>
              </select>
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-[#27272a] hover:bg-[#27272a]/50 transition-colors">Cancelar</button>
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D427F] text-white text-sm font-bold shadow-lg shadow-[#1D427F]/30 hover:bg-[#15315e] transition-all">
                <Save size={16} /> Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Cabecera Principal y Filtros */}
      <div className="mb-8 bg-[#18181B] rounded-[24px] p-6 shadow-xl border border-[#27272a] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#1D427F]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 w-full mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">Licencias Activas</h1>
            <p className="text-[#F8FAFC]/50 text-sm mt-1">Gestión consolidada de accesos, clientes empresariales y auditoría.</p>
          </div>
          <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1D427F] text-[#F8FAFC] text-sm font-bold shadow-lg shadow-[#1D427F]/25 hover:bg-[#15315E] transform transition-all active:scale-95 border border-[#1D427F]">
            <Plus size={18} />
            Crear Licencia
          </button>
        </div>

        {/* Barra de Filtros interactiva */}
        <div className="flex flex-col md:flex-row gap-4 relative z-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F8FAFC]/40" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre de cliente o empresa..." 
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full bg-[#09090B]/50 border border-[#27272a] focus:border-[#1D427F] rounded-xl py-3 pl-12 pr-4 text-sm font-medium text-[#F8FAFC] placeholder:text-[#F8FAFC]/30 outline-none transition-all shadow-inner focus:shadow-[0_0_15px_rgba(29,66,127,0.1)]"
            />
          </div>
          <div className="relative w-full md:w-64">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F8FAFC]/40" size={18} />
            <select 
              className="w-full bg-[#09090B]/50 border border-[#27272a] focus:border-[#1D427F] rounded-xl py-3 pl-11 pr-10 text-sm font-medium text-[#F8FAFC] appearance-none outline-none transition-all cursor-pointer"
              value={establishmentFilter}
              onChange={(e) => setEstablishmentFilter(e.target.value)}
            >
              <option value="">Cualquier Establecimiento</option>
              <option value="Sistem">Sistem</option>
              <option value="MiniMarket">MiniMarket</option>
              <option value="Retail">Retail</option>
              <option value="Restaurante">Restaurante</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F8FAFC]/40 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* Listado Principal - Stackable Cards */}
      <div className="space-y-4 pb-20">
        {clients.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#27272a] rounded-[24px]">
             <Box className="mx-auto text-[#27272a] mb-3" size={48} />
             <h3 className="text-[#F8FAFC]/60 font-semibold mb-1">No hay clientes encontrados.</h3>
             <p className="text-[#F8FAFC]/30 text-sm">Prueba ajustando los filtros de búsqueda.</p>
          </div>
        ) : (
          clients.map((client) => {
            const isExpanded = expandedId === client.id;
            const activeLicenses = client.licenses?.length || 0;

            return (
              <div 
                key={client.id} 
                className={`bg-[#18181B] border transition-all duration-300 rounded-[24px] overflow-hidden 
                  ${isExpanded ? 'border-[#1D427F]/50 shadow-[0_10px_30px_rgba(0,0,0,0.4)] relative z-20' : 'border-[#27272a] hover:border-[#1D427F]/30 hover:shadow-lg relative z-10'}
                `}
              >
                {/* Visual Front of the Card */}
                <div 
                  onClick={() => toggleExpand(client.id)}
                  className="p-5 flex flex-col md:flex-row items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-4 flex-1">
                     <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.full_name}&backgroundColor=1D427F`} alt="avatar" className="w-12 h-12 rounded-xl border border-[#27272a] shadow-sm transform group-hover:scale-105 transition-transform" />
                     <div>
                       <h3 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                         {client.full_name}
                         {activeLicenses > 0 && <span className="bg-[#1D427F]/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full border border-[#1D427F]/30">Licenciado</span>}
                       </h3>
                       <div className="flex items-center gap-3 text-sm text-[#F8FAFC]/40 mt-1 font-medium">
                         <span className="flex items-center gap-1.5"><Building2 size={12}/> {client.company_name || 'Sin especificar'}</span>
                         <span className="w-1 h-1 bg-[#27272a] rounded-full"></span>
                         <span className="text-[#F8FAFC]/30">{client.email}</span>
                       </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-6 mt-4 md:mt-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-[#F8FAFC]/30 mb-1">Total Licencias</div>
                      <div className="text-xl font-extrabold text-[#F8FAFC] leading-none">{activeLicenses}</div>
                    </div>
                    {/* Acciones de la Tarjeta */}
                    <div className="flex items-center gap-2">
                       <button onClick={(e) => { e.stopPropagation(); openEditModal(client); }} className="p-2 rounded-lg bg-[#27272a]/40 text-[#F8FAFC]/60 hover:text-white hover:bg-blue-500/20 hover:border-blue-500/30 border border-transparent transition-all" title="Editar Información">
                         <Edit2 size={18} />
                       </button>
                       <button onClick={(e) => { e.stopPropagation(); handleEraseClient(client.id); }} className="p-2 rounded-lg bg-[#27272a]/40 text-[#F8FAFC]/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 border border-transparent transition-all" title="Desactivar / Papelera">
                         <Trash2 size={18} />
                       </button>
                       <ChevronDown size={20} className={`text-[#F8FAFC]/30 ml-2 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Expanded Accordion Area (Inner Detail) */}
                {isExpanded && (
                  <div className="bg-[#09090B]/50 border-t border-[#27272a] p-6 animate-in slide-in-from-top-2 duration-300">
                     <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        
                        {/* Info Lateral Detallada */}
                        <div className="lg:col-span-1 space-y-4">
                           <div className="text-xs font-bold text-[#F8FAFC]/60 uppercase tracking-widest bg-[#27272a]/30 inline-block px-3 py-1 rounded-lg">Ficha del Cliente</div>
                           <div>
                             <div className="text-[#F8FAFC]/40 text-xs font-semibold mb-0.5">Tipo de Establecimiento</div>
                             <div className="text-[#F8FAFC] text-sm">{client.establishment_type || 'No configurado'}</div>
                           </div>
                           <div>
                             <div className="text-[#F8FAFC]/40 text-xs font-semibold mb-0.5">Teléfono</div>
                             <div className="text-[#F8FAFC] text-sm">{client.phone_number || 'No especificado'}</div>
                           </div>
                           <button className="w-full mt-2 py-2.5 rounded-xl border border-[#1D427F]/40 bg-[#1D427F]/10 text-blue-400 hover:bg-[#1D427F]/20 text-xs font-bold transition-colors">
                             Ver Historial Transaccional
                           </button>
                        </div>

                        {/* Sub-Listado de Licencias */}
                        <div className="lg:col-span-3">
                           <div className="flex justify-between items-end mb-4 border-b border-[#27272a]/50 pb-2">
                             <div className="text-sm font-bold text-[#F8FAFC]">Inventario de Licencias</div>
                             <div className="text-xs text-[#F8FAFC]/40">{activeLicenses} registradas globalmente</div>
                           </div>
                           
                           {activeLicenses === 0 ? (
                             <div className="text-center py-6 text-sm text-[#F8FAFC]/40 font-medium">Aún no hay licencias generadas para este negocio.</div>
                           ) : (
                             <div className="space-y-3">
                               {client.licenses.map((lic, idx) => (
                                 <div key={idx} className="bg-[#18181B] border border-[#27272a] p-4 rounded-xl flex items-center justify-between group hover:border-[#1D427F]/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-lg bg-[#27272a]/50 flex items-center justify-center text-[#F8FAFC]/40 group-hover:text-blue-400 transition-colors">
                                        <KeyRound size={18} />
                                      </div>
                                      <div>
                                        <div className="text-sm font-bold text-[#F8FAFC] font-mono tracking-wide">{lic.license_key}</div>
                                        <div className="text-xs font-medium text-[#F8FAFC]/40 flex gap-3 mt-1">
                                          <span className="flex items-center gap-1"><Monitor size={10}/> {lic.max_devices} Eqps. permitidos</span>
                                          <span className="flex items-center gap-1"><Clock size={10}/> Vence: {new Date(lic.end_date).toLocaleDateString()}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border shadow-sm
                                      ${lic.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}
                                    `}>
                                      {lic.status}
                                    </div>
                                 </div>
                               ))}
                             </div>
                           )}
                        </div>

                     </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {renderCreateModal()}
      {renderEditModal()}
    </div>
  );
}
