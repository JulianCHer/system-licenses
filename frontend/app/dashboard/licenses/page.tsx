"use client";

import React, { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import TechLoading from '../../../public/Tech_Loading.json';
import { createPortal } from 'react-dom';
import { Search, Plus, Edit2, Trash2, KeyRound, Building2, ChevronDown, Monitor, Clock, Box, Save, X, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#18181B',
  color: '#F8FAFC',
  iconColor: '#3b82f6',
  customClass: {
    popup: 'border border-[#27272a] shadow-lg rounded-xl',
  }
});

const DarkSwal = Swal.mixin({
  background: '#18181B',
  color: '#F8FAFC',
  confirmButtonColor: '#1D427F',
  cancelButtonColor: '#27272a',
  customClass: {
    popup: 'border border-[#27272a] rounded-2xl shadow-2xl',
    confirmButton: 'px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1D427F] to-blue-600 text-white font-bold ml-2 outline-none',
    cancelButton: 'px-5 py-2.5 rounded-lg text-[#F8FAFC]/60 hover:text-white border border-[#27272a] mr-2 transition-colors'
  },
  buttonsStyling: false
});

interface License {
  id: number;
  license_key: string;
  app_type: string | null;
  plan_type: string | null;
  start_date: string;
  end_date: string;
  status: string;
  max_devices: number;
}

interface Client {
  id: number;
  full_name: string;
  company_name: string | null;
  establishment_type: string | null;
  nit: string | null;
  email: string;
  phone: string | null;
  licenses: License[];
}

export default function LicensesModule() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Filtros
  const [searchName, setSearchName] = useState('');
  const [establishmentFilter, setEstablishmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  // Modal State para Edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Modal State para Creación Wizard Multi-Paso
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    full_name: '', email: '', phone: '',
    company_name: '', nit: '', establishment_type: '', license_count: 1,
    licenses: [
      { app_type: '', plan_type: '', start_date: new Date().toISOString().split('T')[0], end_date: '', status: 'pending' }
    ]
  });
  const [isCreating, setIsCreating] = useState(false);

  // Modal State para Pagos
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payingLicense, setPayingLicense] = useState<License | null>(null);
  const [paymentData, setPaymentData] = useState({ amount_paid: '', payment_method: '', reference_number: '', evidence: null as File | null });

  // Modal State para Historial de Pagos
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLicense, setHistoryLicense] = useState<License | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [isPaying, setIsPaying] = useState(false);

  // Modal State para Historial Global
  const [isGlobalHistoryModalOpen, setIsGlobalHistoryModalOpen] = useState(false);
  const [globalHistoryClient, setGlobalHistoryClient] = useState<Client | null>(null);
  const [globalPaymentHistory, setGlobalPaymentHistory] = useState<any[]>([]);
  const [globalHistoryFilter, setGlobalHistoryFilter] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);

  const OpenLicensePaymentForm = (lic: License, e: React.MouseEvent) => {
    e.stopPropagation();
    setPayingLicense(lic);
    setIsPaymentModalOpen(true);
  };

  const ListLicenses = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('lazarus-token');
      if (!token) return;

      const params = new URLSearchParams();
      if (searchName) params.append('name', searchName);
      if (establishmentFilter) params.append('establishment_type', establishmentFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`http://localhost:8000/api/clients?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
        localStorage.removeItem('lazarus-token');
        window.location.href = '/';
        return;
      }

      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Implementar un pequeño delay de debounce para no saturar el server al tipear
    const debounce = setTimeout(() => {
      ListLicenses();
    }, 400);
    return () => clearTimeout(debounce);
  }, [searchName, establishmentFilter]);

  const ToggleClientLicenses = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const DisableClientLicense = async (id: number) => {
    const result = await DarkSwal.fire({
      title: '¿Desactivar cliente?',
      text: 'El cliente y sus licencias pasarán a la papelera (estado erased) y dejarán de ser válidas de inmediato.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, Desactivar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    setIsSyncing(true);
    try {
      const token = localStorage.getItem('lazarus-token');
      const res = await fetch(`http://localhost:8000/api/clients/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
        localStorage.removeItem('lazarus-token');
        window.location.href = '/';
        return;
      }
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        DarkSwal.fire({ icon: 'error', title: 'Falla Interna', text: data.message || 'Error desconocido al procesar el servidor.' });
        return;
      }

      ListLicenses(); // recargar
      Toast.fire({ icon: 'success', title: 'Perfil movido a papelera correctamente' });
    } catch (e) {
      console.error(e);
      DarkSwal.fire({ icon: 'error', title: 'Error interno', text: 'Falló la conexión al borrar el cliente.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const OpenEditClientDetails = (client: Client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const UpdateClientInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setIsSyncing(true);
    try {
      const token = localStorage.getItem('lazarus-token');
      const res = await fetch(`http://localhost:8000/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingClient)
      });

      if (res.status === 401) {
        localStorage.removeItem('lazarus-token');
        DarkSwal.fire({ icon: 'error', title: 'Sesión Vencida', text: 'Tu sesión ha expirado por seguridad. Inicia sesión nuevamente.' }).then(() => window.location.href = '/');
        setIsEditModalOpen(false);
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        DarkSwal.fire({ icon: 'error', title: 'Error de Edición', text: data.message });
        return;
      }
      setIsEditModalOpen(false);
      ListLicenses();
      Toast.fire({ icon: 'success', title: 'Cambios guardados con éxito' });
    } catch (e) {
      console.error(e);
      DarkSwal.fire({ icon: 'error', title: 'Error de Red', text: 'Falló la conexión al actualizar.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const RegisterLicensePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingLicense) return;
    setIsPaying(true);
    setIsSyncing(true);
    try {
      const token = localStorage.getItem('lazarus-token');

      const formData = new FormData();
      formData.append('license_id', payingLicense.id.toString());
      formData.append('amount_paid', paymentData.amount_paid);
      formData.append('payment_method', paymentData.payment_method);
      if (paymentData.reference_number) formData.append('reference_number', paymentData.reference_number);

      if (paymentData.payment_method === 'Transferencia') {
        if (!paymentData.evidence) {
          DarkSwal.fire({ icon: 'warning', title: 'Comprobante Requerido', text: 'Debes adjuntar la imagen de la transferencia.' });
          setIsPaying(false);
          return;
        }
        formData.append('evidence', paymentData.evidence);
      }

      const res = await fetch(`http://localhost:8000/api/payments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.status === 401) {
        localStorage.removeItem('lazarus-token');
        DarkSwal.fire({ icon: 'error', title: 'Sesión Vencida', text: 'Tu sesión expiró. Inicia sesión nuevamente.' }).then(() => window.location.href = '/');
        setIsPaying(false);
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        DarkSwal.fire({ icon: 'error', title: 'Error de Pago', text: data.message });
        return;
      }
      setIsPaymentModalOpen(false);
      setPaymentData({ amount_paid: '', payment_method: '', reference_number: '', evidence: null });
      ListLicenses();
      Toast.fire({ icon: 'success', title: '¡Abono Registrado y Licencia Activada!' });
    } catch (err: any) {
      console.error(err);
      DarkSwal.fire({ icon: 'error', title: 'Fallo Crítico', text: 'No pudimos procesar el pago contra la base de datos.' });
    } finally {
      setIsPaying(false);
      setIsSyncing(false);
    }
  };

  const LoadPaymentHistory = async (lic: License, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryLicense(lic);
    setIsHistoryModalOpen(true);
    setPaymentHistory([]);

    setIsSyncing(true);
    try {
      const token = localStorage.getItem('lazarus-token');
      const res = await fetch(`http://localhost:8000/api/licenses/${lic.id}/payments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('lazarus-token');
        window.location.href = '/';
        return;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        setPaymentHistory(data.payments);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  const LoadGlobalPaymentHistory = async (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setGlobalHistoryClient(client);
    setIsGlobalHistoryModalOpen(true);
    setGlobalPaymentHistory([]);

    setIsSyncing(true);
    try {
      const token = localStorage.getItem('lazarus-token');
      const res = await fetch(`http://localhost:8000/api/clients/${client.id}/payments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('lazarus-token');
        window.location.href = '/';
        return;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        setGlobalPaymentHistory(data.payments);
      }
    } catch (error) {
      console.error('Error loading global payment history', error);
      DarkSwal.fire({ icon: 'error', title: 'Error', text: 'Imposible cargar el historial contable.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const TriggerLicenseDisable = async (lic: License, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await DarkSwal.fire({
      title: '¿Suspender Licencia?',
      text: '¿Estás seguro de que deseas interrumpir el servicio de esta licencia por falta de pago?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, Suspender',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    setIsSyncing(true);
    try {
      const token = localStorage.getItem('lazarus-token');
      const res = await fetch(`http://localhost:8000/api/licenses/${lic.id}/disable`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
        localStorage.removeItem('lazarus-token');
        window.location.href = '/';
        return;
      }

      ListLicenses();
      Toast.fire({ icon: 'success', title: 'Licencia suspendida correctamente.' });
    } catch (error) {
      console.error(error);
      DarkSwal.fire({ icon: 'error', title: 'Fallo de Red', text: 'Error al comunicarse con el servidor.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const SaveLicenses = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (wizardStep < 3) {
      setWizardStep(wizardStep + 1);
      return;
    }

    setIsCreating(true);
    setIsSyncing(true);
    try {
      const token = localStorage.getItem('lazarus-token');

      // 1. POST Cliente (Pasos 1 y 2)
      const clientPayload = {
        full_name: wizardData.full_name,
        company_name: wizardData.company_name,
        nit: wizardData.nit,
        establishment_type: wizardData.establishment_type,
        email: wizardData.email,
        phone: wizardData.phone
      };

      const clientRes = await fetch(`http://localhost:8000/api/clients`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(clientPayload)
      });

      if (clientRes.status === 401) {
        localStorage.removeItem('lazarus-token');
        DarkSwal.fire({ icon: 'error', title: 'Sesión Inválida', text: 'Tu sesión expiró o la DB fue reiniciada. Inicia sesión nuevamente.' }).then(() => window.location.href = '/');
        setIsCreating(false);
        return;
      }

      const clientData = await clientRes.json();
      if (!clientRes.ok || !clientData.success) {
        DarkSwal.fire({ icon: 'error', title: 'Fallo al Guardar Cliente', text: clientData.message || 'Error desconocido al insertar en DB.' });
        setIsCreating(false);
        return;
      }

      // 2. POST Licencias (Paso 3)
      const licRes = await fetch(`http://localhost:8000/api/licenses`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          enterprise_id: clientData.client.id,
          licenses: wizardData.licenses
        })
      });

      if (licRes.status === 401) {
        localStorage.removeItem('lazarus-token');
        DarkSwal.fire({ icon: 'error', title: 'Sesión Inválida', text: 'La conexión caducó mientras se asignaban las licencias.' }).then(() => window.location.href = '/');
        setIsCreating(false);
        return;
      }

      const licData = await licRes.json();
      if (!licRes.ok || !licData.success) {
        DarkSwal.fire({ icon: 'error', title: 'Fallo al Generar Licencia', text: licData.message || 'Error desconocido creando el lote.' });
        setIsCreating(false);
        return;
      }

      setIsCreateModalOpen(false);
      setWizardStep(1);
      setWizardData({ full_name: '', email: '', phone: '', company_name: '', nit: '', establishment_type: '', license_count: 1, licenses: [{ app_type: '', plan_type: '', start_date: new Date().toISOString().split('T')[0], end_date: '', status: 'pending' }] });
      ListLicenses();
      Toast.fire({ icon: 'success', title: 'Proceso de Licenciamiento Finalizado' });
    } catch (e: any) {
      console.error(e);
      DarkSwal.fire({ icon: 'error', title: 'Fallo Crítico', text: e.message || 'Hubo un error de conexión procesando la Licencia.' });
    } finally {
      setIsCreating(false);
      setIsSyncing(false);
    }
  };

  const ViewEvidenceAsPdf = async (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSyncing(true);
    try {
      const fullUrl = `http://localhost:8000${url}`;
      const res = await fetch(fullUrl);
      if (!res.ok) throw new Error("Fetch failed");
      const blob = await res.blob();
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.setFontSize(16);
        pdf.text("Comprobante de Pago LZR", 105, 20, { align: 'center' });
        const imgExt = url.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG';
        pdf.addImage(base64data, imgExt, 15, 30, 180, 0); 
        window.open(pdf.output('bloburl'), '_blank');
        setIsSyncing(false);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error(error);
      DarkSwal.fire({ icon: 'error', title: 'Fallo al Generar PDF', text: 'No pudimos incrustar la evidencia en el documento.' });
      setIsSyncing(false);
    }
  };

  // UI Secundario: Modal de Creación Wizard
  const RenderCreateLicenseForm = () => {
    if (!isCreateModalOpen) return null;
    const modalContent = (
      <div onClick={() => setIsCreateModalOpen(false)} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-in fade-in duration-200 lg:p-4">
        <div onClick={(e) => e.stopPropagation()} className="bg-[#18181B] border border-[#27272a] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center p-6 border-b border-[#27272a] sticky top-0 bg-[#18181B] z-10">
            <div>
              <h2 className="text-xl font-bold text-[#F8FAFC]">Crear Licencia</h2>
              <div className="flex gap-2 mt-2">
                <div className={`h-1.5 w-16 rounded-full transition-colors ${wizardStep >= 1 ? 'bg-[#1D427F]' : 'bg-[#27272a]'}`}></div>
                <div className={`h-1.5 w-16 rounded-full transition-colors ${wizardStep >= 2 ? 'bg-[#1D427F]' : 'bg-[#27272a]'}`}></div>
                <div className={`h-1.5 w-16 rounded-full transition-colors ${wizardStep >= 3 ? 'bg-[#1D427F]' : 'bg-[#27272a]'}`}></div>
              </div>
            </div>
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-[#F8FAFC]/40 hover:text-white transition bg-[#27272a]/50 p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400"><X size={20} /></button>
          </div>
          <form onSubmit={SaveLicenses} className="p-6 space-y-6">

            {wizardStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 border-b border-[#27272a]/50 pb-2"><Users size={16} /> Paso 1: Información del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Nombre Completo del Representante *</label>
                    <input type="text" value={wizardData.full_name} onChange={e => setWizardData({ ...wizardData, full_name: e.target.value })} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-3 text-sm outline-none focus:border-[#1D427F] text-white" required placeholder="Ej: John Doe" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Correo Electrónico Corporativo *</label>
                    <input type="email" value={wizardData.email} onChange={e => setWizardData({ ...wizardData, email: e.target.value })} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-3 text-sm outline-none focus:border-[#1D427F] text-white" required placeholder="contacto@empresa.com" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Teléfono / WhatsApp *</label>
                    <input type="text" value={wizardData.phone} onChange={e => setWizardData({ ...wizardData, phone: e.target.value })} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-3 text-sm outline-none focus:border-[#1D427F] text-white" required placeholder="+57 ..." />
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 border-b border-[#27272a]/50 pb-2"><Building2 size={16} /> Paso 2: Detalles de la Organización</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Razón Social / Nombre de la empresa *</label>
                    <input type="text" value={wizardData.company_name} onChange={e => setWizardData({ ...wizardData, company_name: e.target.value })} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-3 text-sm outline-none focus:border-[#1D427F] text-white" required placeholder="Ej: TechCorp SAS" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">NIT / Identificador fiscal *</label>
                    <input type="text" value={wizardData.nit} onChange={e => setWizardData({ ...wizardData, nit: e.target.value })} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-3 text-sm outline-none focus:border-[#1D427F] text-white" required placeholder="900.000.000-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Tipo de Empresa *</label>
                    <input type="text" value={wizardData.establishment_type} onChange={e => setWizardData({ ...wizardData, establishment_type: e.target.value })} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-3 text-sm outline-none focus:border-[#1D427F] text-white" required placeholder="Hotelería y turismo, comercio,etc" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Cantidad de Licencias a Generar *</label>
                    <input type="number" min="1" max="1000" value={wizardData.license_count || ''} onChange={e => {
                      const newCount = parseInt(e.target.value) || 1;
                      let newLicenses = [...wizardData.licenses];
                      if (newCount > newLicenses.length) {
                        for (let i = newLicenses.length; i < newCount; i++) {
                          newLicenses.push({
                            app_type: '', plan_type: '', start_date: new Date().toISOString().split('T')[0], end_date: '', status: 'pending'
                          });
                        }
                      } else if (newCount < newLicenses.length) {
                        newLicenses = newLicenses.slice(0, newCount);
                      }
                      setWizardData({ ...wizardData, license_count: newCount, licenses: newLicenses });
                    }} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-3 text-sm outline-none focus:border-[#1D427F] text-white font-mono text-lg" required />
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 border-b border-[#27272a]/50 pb-2"><KeyRound size={16} /> Paso 3: Configuración Individual de Licencias ({wizardData.license_count})</h3>

                <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {wizardData.licenses.map((licConfig, idx) => (
                    <div key={idx} className="bg-[#18181B] border border-[#27272a] p-4 rounded-xl relative">
                      <div className="absolute top-0 right-0 bg-[#27272a]/50 text-[#F8FAFC]/50 text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                        LICENCIA #{idx + 1}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Aplicativo *</label>
                          <select value={licConfig.app_type} onChange={e => {
                            const newLicenses = [...wizardData.licenses];
                            newLicenses[idx].app_type = e.target.value;
                            setWizardData({ ...wizardData, licenses: newLicenses });
                          }} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-3 text-sm outline-none focus:border-[#1D427F] text-white" required>
                            <option value="">Seleccionar Aplicativo...</option>
                            <option value="Hotel">Lazarus Hotel Manager</option>
                            <option value="Parqueadero">Lazarus Parking Sys</option>
                            <option value="Restaurante">Lazarus POS Restaurante</option>
                            <option value="Retail">Lazarus Comercio Retail</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Tipo de Plan *</label>
                          <select value={licConfig.plan_type} onChange={e => {
                            const selectedPlan = e.target.value;
                            const newLicenses = [...wizardData.licenses];
                            let newEndDate = licConfig.end_date;

                            if (licConfig.start_date) {
                              const [y, m, d] = licConfig.start_date.split('-').map(Number);
                              const dateObj = new Date(y, m - 1, d);
                              if (selectedPlan === 'Mensual' || selectedPlan === 'Prueba') dateObj.setMonth(dateObj.getMonth() + 1);
                              else if (selectedPlan === 'Anual') dateObj.setFullYear(dateObj.getFullYear() + 1);
                              newEndDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                            }

                            newLicenses[idx].plan_type = selectedPlan;
                            newLicenses[idx].end_date = newEndDate;
                            setWizardData({ ...wizardData, licenses: newLicenses });
                          }} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-3 text-sm outline-none focus:border-[#1D427F] text-white" required>
                            <option value="" disabled hidden>Seleccionar Plan...</option>
                            <option value="Mensual">Mensual (1 Mes)</option>
                            <option value="Anual">Anual (1 Año)</option>
                            <option value="Prueba">Prueba (Demo 1 Mes)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Fecha de Inicio *</label>
                          <input type="date" value={licConfig.start_date} onChange={e => {
                            const newStartDate = e.target.value;
                            const newLicenses = [...wizardData.licenses];
                            let newEndDate = licConfig.end_date;

                            if (licConfig.plan_type && newStartDate) {
                              const [y, m, d] = newStartDate.split('-').map(Number);
                              const dateObj = new Date(y, m - 1, d);
                              if (licConfig.plan_type === 'Mensual' || licConfig.plan_type === 'Prueba') dateObj.setMonth(dateObj.getMonth() + 1);
                              else if (licConfig.plan_type === 'Anual') dateObj.setFullYear(dateObj.getFullYear() + 1);
                              newEndDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                            }

                            newLicenses[idx].start_date = newStartDate;
                            newLicenses[idx].end_date = newEndDate;
                            setWizardData({ ...wizardData, licenses: newLicenses });
                          }} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-3 text-sm outline-none focus:border-[#1D427F] text-white [color-scheme:dark]" required />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Fecha de Expiración *</label>
                          <input type="date" value={licConfig.end_date} onChange={e => {
                            const newLicenses = [...wizardData.licenses];
                            newLicenses[idx].end_date = e.target.value;
                            setWizardData({ ...wizardData, licenses: newLicenses });
                          }} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-3 text-sm outline-none focus:border-[#1D427F] text-white [color-scheme:dark]" required />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="w-full bg-[#18181B] border border-[#27272a] rounded-lg p-3 text-sm text-orange-400 font-bold border-l-2 border-l-orange-500 shadow-inner flex items-center justify-between">
                  <span>Todas las licencias se crearán "Pendientes"</span>
                  <span className="text-[10px] text-orange-400/50 uppercase tracking-widest hidden sm:block">Reactivación post-pago</span>
                </div>
              </div>
            )}

            <div className="pt-6 flex justify-between items-center sticky bottom-0 bg-[#18181B] border-t border-[#27272a] mt-6 -mx-6 -mb-6 p-4 rounded-b-2xl shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
              <div>
                {wizardStep > 1 && (
                  <button type="button" onClick={() => setWizardStep(wizardStep - 1)} className="px-5 py-2.5 text-sm font-semibold text-[#F8FAFC]/60 hover:text-white hover:bg-[#27272a] rounded-lg transition-colors">← Atras</button>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setIsCreateModalOpen(false); setWizardStep(1); }} className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-[#27272a] text-[#F8FAFC]/60 hover:text-white hover:bg-[#27272a]/50 transition-colors">Cancelar</button>

                {wizardStep < 3 ? (
                  <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#1D427F]/20 border border-[#1D427F]/50 text-blue-400 text-sm font-bold hover:bg-[#1D427F]/40 transition-all shadow-lg shadow-[#1D427F]/10">Siguiente →</button>
                ) : (
                  <button type="submit" disabled={isCreating} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1D427F] to-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/30 hover:from-[#15315E] hover:to-[#1D427F] transition-all disabled:opacity-50">
                    {isCreating ? <Clock size={18} className="animate-spin" /> : <Save size={18} />}
                    {isCreating ? 'Finalizando...' : 'Finalizar y Guardar'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    );
    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
  };

  // UI Secundario: Modal de Edición
  const RenderEditClientForm = () => {
    if (!isEditModalOpen || !editingClient) return null;
    const modalContent = (
      <div onClick={() => setIsEditModalOpen(false)} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-in fade-in duration-200">
        <div onClick={(e) => e.stopPropagation()} className="bg-[#18181B] border border-[#27272a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
          <div className="flex justify-between items-center p-6 border-b border-[#27272a]">
            <h2 className="text-xl font-bold text-[#F8FAFC]">Editar Cliente</h2>
            <button onClick={() => setIsEditModalOpen(false)} className="text-[#F8FAFC]/40 hover:text-white transition"><X size={20} /></button>
          </div>
          <form onSubmit={UpdateClientInfo} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Nombre Completo</label>
              <input type="text" value={editingClient.full_name} onChange={e => setEditingClient({ ...editingClient, full_name: e.target.value })} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-2.5 text-sm outline-none focus:border-[#1D427F]" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Empresa / Negocio</label>
                <input type="text" value={editingClient.company_name || ''} onChange={e => setEditingClient({ ...editingClient, company_name: e.target.value })} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-2.5 text-sm outline-none focus:border-[#1D427F]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Teléfono</label>
                <input type="text" value={editingClient.phone || ''} onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-2.5 text-sm outline-none focus:border-[#1D427F] text-white" />
              </div>
            </div>
            <div className="pt-2">
              <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">NIT / Identificador Fiscal</label>
              <input type="text" value={editingClient.nit || ''} onChange={e => setEditingClient({ ...editingClient, nit: e.target.value })} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-2.5 text-sm outline-none focus:border-[#1D427F] text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Tipo de Organización</label>
              <input type="text" value={editingClient.establishment_type || ''} onChange={e => setEditingClient({ ...editingClient, establishment_type: e.target.value })} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-2.5 text-sm outline-none focus:border-[#1D427F] text-white" placeholder="Ej: S.A.S., Persona Natural, etc." />
            </div>

            {editingClient.licenses && editingClient.licenses.length > 0 && (
              <div className="pt-4 border-t border-[#27272a]/50">
                <h3 className="text-sm font-bold text-[#1D427F] mb-4 flex items-center gap-2"><KeyRound size={16} /> Gestionar Licencias del Cliente</h3>
                <div className="space-y-4 max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
                  {editingClient.licenses.map((lic, idx) => (
                    <div key={lic.id || idx} className="bg-[#09090B] border border-[#27272a] rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-mono text-[#F8FAFC]/50">{lic.license_key}</span>
                        {lic.status === 'disabled' && <span className="text-[10px] text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded">SUSPENDIDA</span>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-[#F8FAFC]/40 block mb-1">Aplicativo</label>
                          <select value={lic.app_type || ''} onChange={e => {
                            const newC = { ...editingClient };
                            newC.licenses![idx].app_type = e.target.value;
                            setEditingClient(newC);
                          }} className="w-full bg-[#18181B] border border-[#27272a] rounded text-xs p-2 text-white outline-none focus:border-[#1D427F]">
                            <option value="Hotel">Lazarus Hotel Manager</option>
                            <option value="Parking">Lazarus Parking Control</option>
                            <option value="Restaurant">Lazarus Restaurante POS</option>
                            <option value="Retail">Lazarus Comercio Retail</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#F8FAFC]/40 block mb-1">Plan</label>
                          <select value={lic.plan_type || ''} onChange={e => {
                            const newC = { ...editingClient };
                            newC.licenses![idx].plan_type = e.target.value;
                            setEditingClient(newC);
                          }} className="w-full bg-[#18181B] border border-[#27272a] rounded text-xs p-2 text-white outline-none focus:border-[#1D427F]">
                            <option value="Mensual">Mensual (30 Días)</option>
                            <option value="Anual">Anual (365 Días)</option>
                            <option value="Prueba">Prueba (30 Días)</option>
                            <option value="Vitalicia">Vitalicia</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#F8FAFC]/40 block mb-1">Inicio</label>
                          <input type="date" value={lic.start_date ? typeof lic.start_date === 'string' ? lic.start_date.split(' ')[0] : lic.start_date : ''} onChange={e => {
                            const newC = { ...editingClient };
                            newC.licenses![idx].start_date = e.target.value;
                            setEditingClient(newC);
                          }} className="w-full bg-[#18181B] border border-[#27272a] rounded text-xs p-2 text-white outline-none focus:border-[#1D427F]" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#F8FAFC]/40 block mb-1">Corte / Expiración</label>
                          <input type="date" value={lic.end_date ? typeof lic.end_date === 'string' ? lic.end_date.split(' ')[0] : lic.end_date : ''} onChange={e => {
                            const newC = { ...editingClient };
                            newC.licenses![idx].end_date = e.target.value;
                            setEditingClient(newC);
                          }} className="w-full bg-[#18181B] border border-[#27272a] rounded text-xs p-2 text-white outline-none focus:border-[#1D427F]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-[#27272a] text-[#F8FAFC]/60 hover:text-white hover:bg-[#27272a]/50 transition-colors">Cancelar</button>
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D427F] text-white text-sm font-bold shadow-lg shadow-[#1D427F]/30 hover:bg-[#15315e] transition-all">
                <Save size={16} /> Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    );
    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
  };

  // UI Secundario: Modal de Pagos
  const RenderLicensePaymentForm = () => {
    if (!isPaymentModalOpen || !payingLicense) return null;
    const modalContent = (
      <div onClick={() => setIsPaymentModalOpen(false)} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-in fade-in duration-200 backdrop-blur-sm">
        <div onClick={(e) => e.stopPropagation()} className="bg-[#18181B] border border-[#27272a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
          <div className="flex justify-between items-center p-6 border-b border-[#27272a] bg-gradient-to-r from-[#18181B] to-[#1D427F]/20">
            <div>
              <h2 className="text-xl font-bold text-[#F8FAFC]">Registrar Abono / Pago</h2>
              <p className="text-xs text-blue-400 font-mono mt-1 font-bold">{payingLicense.license_key}</p>
            </div>
            <button onClick={() => setIsPaymentModalOpen(false)} className="text-[#F8FAFC]/40 hover:text-white transition bg-[#27272a]/50 p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400"><X size={20} /></button>
          </div>
          <form onSubmit={RegisterLicensePayment} className="p-6 space-y-5">
            <div>
              <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Monto Abonado (Moneda Local o USD) *</label>
              <input type="number" step="0.01" min="1" value={paymentData.amount_paid} onChange={e => setPaymentData({ ...paymentData, amount_paid: e.target.value })} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-3 text-lg font-mono outline-none focus:border-[#1D427F] text-blue-400 font-bold" required placeholder="0.00" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Método de Pago *</label>
                <select value={paymentData.payment_method} onChange={e => setPaymentData({ ...paymentData, payment_method: e.target.value })} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-3 text-sm outline-none focus:border-[#1D427F] text-[#F8FAFC]" required>
                  <option value="" disabled hidden>Seleccionar...</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Referencia (Opcional)</label>
                <input type="text" value={paymentData.reference_number} onChange={e => setPaymentData({ ...paymentData, reference_number: e.target.value })} className="w-full bg-[#09090B] border border-[#27272a] rounded-lg p-3 text-sm outline-none focus:border-[#1D427F] text-white" placeholder="# Factura/Trx" />
              </div>
            </div>

            {paymentData.payment_method === 'Transferencia' && (
              <div className="pt-2 animate-in slide-in-from-top-2">
                <label className="text-xs font-bold text-[#F8FAFC]/50 mb-1 block">Comprobante de Transferencia (Imagen) *</label>
                <input type="file" accept="image/*" onChange={e => setPaymentData({ ...paymentData, evidence: e.target.files ? e.target.files[0] : null })} className="w-full bg-[#09090B] border border-[#27272a] text-[#F8FAFC] rounded-lg p-2 text-sm outline-none focus:border-[#1D427F] file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#1D427F]/20 file:text-blue-400 hover:file:bg-[#1D427F]/30" required />
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3 border-t border-[#27272a]/50 mt-4">
              <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-[#27272a] text-[#F8FAFC]/60 hover:text-white hover:bg-[#27272a]/50 transition-colors">Cancelar</button>
              <button type="submit" disabled={isPaying} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#1D427F] text-white text-sm font-bold shadow-lg shadow-[#1D427F]/30 hover:bg-[#15315E] transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95">
                {isPaying ? <Clock size={18} className="animate-spin" /> : <Save size={18} />}
                {isPaying ? 'Abonando...' : 'Confirmar Pago'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
  };

  // UI Secundario: Modal de Historial de Pagos
  const RenderPaymentHistoryModal = () => {
    if (!isHistoryModalOpen || !historyLicense) return null;

    const filteredHistory = paymentHistory.filter(pay => {
      if (historyFilter === 'all') return true;
      const payDate = new Date(pay.created_at);
      const now = new Date();
      if (historyFilter === '30days') return (now.getTime() - payDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
      if (historyFilter === 'this_year') return payDate.getFullYear() === now.getFullYear();
      if (historyFilter === 'last_year') return payDate.getFullYear() === (now.getFullYear() - 1);
      return true;
    });

    const modalContent = (
      <div onClick={() => setIsHistoryModalOpen(false)} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-in fade-in duration-200">
        <div onClick={(e) => e.stopPropagation()} className="bg-[#18181B] border border-[#27272a] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[85vh] flex flex-col">
          <div className="flex justify-between items-start md:items-center p-6 border-b border-[#27272a] bg-gradient-to-r from-[#18181B] to-[#1D427F]/20">
            <div>
              <h2 className="text-xl font-bold text-[#F8FAFC]">Historial de Transacciones</h2>
              <div className="flex flex-col md:flex-row md:items-center gap-3 mt-2">
                <p className="text-xs text-blue-400 font-mono font-bold">{historyLicense.license_key}</p>
                <select value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)} className="bg-[#09090B] border border-[#27272a] text-xs text-[#F8FAFC]/70 font-semibold rounded px-2 py-1 outline-none focus:border-[#1D427F] cursor-pointer hover:bg-[#27272a]/50 transition-colors">
                  <option value="all">Historial Completo</option>
                  <option value="30days">Últimos 30 días</option>
                  <option value="this_year">Listar de este Año</option>
                  <option value="last_year">Listar del Año Pasado</option>
                </select>
              </div>
            </div>
            <button onClick={() => setIsHistoryModalOpen(false)} className="text-[#F8FAFC]/40 hover:text-white transition"><X size={20} /></button>
          </div>
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <p>No se encontraron abonos registrados bajo este filtro.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((pay, i) => (
                  <div key={i} className="p-4 bg-[#09090B] border border-[#27272a] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-[#F8FAFC]">${parseFloat(pay.amount_paid).toLocaleString()}</p>
                      <p className="text-xs text-[#F8FAFC]/50 mt-1 uppercase tracking-wider">{pay.payment_method}</p>
                    </div>
                    <div className="text-left md:text-right flex-1">
                      <p className="text-xs text-[#F8FAFC]/50">{new Date(pay.created_at).toLocaleDateString()}</p>
                      {pay.reference_number && <p className="text-[10px] font-mono text-blue-400 mt-1">REF: {pay.reference_number}</p>}
                    </div>
                    {pay.evidence_url && (
                      <button type="button" onClick={(e) => ViewEvidenceAsPdf(pay.evidence_url, e)} className="px-4 py-2 bg-[#1D427F]/20 text-blue-400 border border-[#1D427F]/50 rounded-lg text-xs font-bold hover:bg-[#1D427F]/40 transition-colors flex items-center justify-center gap-2 shrink-0">
                        Ver Soporte
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
  };

  // UI Secundario: Modal de Historial Global de Pagos
  const RenderGlobalPaymentHistoryModal = () => {
    if (!isGlobalHistoryModalOpen || !globalHistoryClient) return null;

    const filteredHistory = globalPaymentHistory.filter(pay => {
      if (globalHistoryFilter === 'all') return true;
      const payDate = new Date(pay.created_at);
      const now = new Date();
      if (globalHistoryFilter === '30days') return (now.getTime() - payDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
      if (globalHistoryFilter === 'this_year') return payDate.getFullYear() === now.getFullYear();
      if (globalHistoryFilter === 'last_year') return payDate.getFullYear() === (now.getFullYear() - 1);
      return true;
    });

    const modalContent = (
      <div onClick={() => setIsGlobalHistoryModalOpen(false)} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-in fade-in duration-200">
        <div onClick={(e) => e.stopPropagation()} className="bg-[#18181B] border border-[#27272a] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[85vh] flex flex-col">
          <div className="flex justify-between items-start md:items-center p-6 border-b border-[#27272a] bg-gradient-to-r from-[#18181B] to-[#1D427F]/20">
            <div>
              <h2 className="text-xl font-bold text-[#F8FAFC]">Historial Contable Global</h2>
              <div className="flex flex-col md:flex-row md:items-center gap-3 mt-2">
                <p className="text-xs text-[#F8FAFC]/50 font-bold">{globalHistoryClient.full_name}</p>
                <select value={globalHistoryFilter} onChange={(e) => setGlobalHistoryFilter(e.target.value)} className="bg-[#09090B] border border-[#27272a] text-xs text-[#F8FAFC]/70 font-semibold rounded px-2 py-1 outline-none focus:border-[#1D427F] cursor-pointer hover:bg-[#27272a]/50 transition-colors">
                  <option value="all">Historial Completo</option>
                  <option value="30days">Últimos 30 días</option>
                  <option value="this_year">Listar de este Año</option>
                  <option value="last_year">Listar del Año Pasado</option>
                </select>
              </div>
            </div>
            <button onClick={() => setIsGlobalHistoryModalOpen(false)} className="text-[#F8FAFC]/40 hover:text-white transition"><X size={20} /></button>
          </div>
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <p>No se encontraron abonos registrados bajo este cliente.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((pay, i) => (
                  <div key={i} className="p-4 bg-[#09090B] border border-[#27272a] rounded-xl flex flex-col md:flex-row justify-between gap-4 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1D427F]"></div>
                    <div className="pl-2">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-[#F8FAFC]">${parseFloat(pay.amount_paid).toLocaleString()}</p>
                        <span className="text-[10px] bg-[#1D427F]/20 text-blue-400 px-2 py-0.5 rounded font-mono border border-[#1D427F]/30">{pay.license_key || 'Genérico'}</span>
                      </div>
                      <p className="text-xs text-[#F8FAFC]/70 font-semibold">{pay.payment_method}</p>
                    </div>
                    <div className="text-left md:text-right flex-1 pl-2 md:pl-0">
                      <p className="text-xs text-[#F8FAFC]/50">{new Date(pay.created_at).toLocaleDateString()}</p>
                      {pay.reference_number && <p className="text-[10px] font-mono text-blue-400 mt-1">REF: {pay.reference_number}</p>}
                    </div>
                    {pay.evidence_url && (
                      <button type="button" onClick={(e) => ViewEvidenceAsPdf(pay.evidence_url, e)} className="ml-2 px-4 py-2 bg-[#1D427F]/20 text-blue-400 border border-[#1D427F]/50 rounded-lg text-xs font-bold hover:bg-[#1D427F]/40 transition-colors flex items-center justify-center gap-2 shrink-0">
                        Ver Soporte
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Cabecera Principal y Filtros */}
      <div className="mb-8 bg-[#18181B] rounded-[24px] p-6 shadow-xl border border-[#27272a] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#1D427F]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 w-full mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">Licencias Activas</h1>
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
              <option value="" selected hidden className="bg-[#18181B] text-[#F8FAFC]">Cualquier Establecimiento</option>
              <option value="Hotel" className="bg-[#18181B] text-[#F8FAFC]">Hotel</option>
              <option value="Parking" className="bg-[#18181B] text-[#F8FAFC]">Parqueadero</option>
              <option value="Restaurant" className="bg-[#18181B] text-[#F8FAFC]">Restaurante</option>
              <option value="Retail" className="bg-[#18181B] text-[#F8FAFC]">Comercio</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F8FAFC]/40 pointer-events-none" size={16} />
          </div>
          <div className="relative w-full md:w-56">
            <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F8FAFC]/40" size={18} />
            <select
              className="w-full bg-[#09090B]/50 border border-[#27272a] focus:border-[#1D427F] rounded-xl py-3 pl-11 pr-10 text-sm font-medium text-[#F8FAFC] appearance-none outline-none transition-all cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="active" className="bg-[#18181B] text-[#F8FAFC]">Licencias Activas</option>
              <option value="pending" className="bg-[#18181B] text-[#F8FAFC]">Pendientes de Pago</option>
              <option value="disabled" className="bg-[#18181B] text-[#F8FAFC]">Deshabilitadas</option>
              <option value="erased" className="bg-[#18181B] text-[#F8FAFC]">En Papelera</option>
              <option value="all" className="bg-[#18181B] text-[#F8FAFC]">Todos los estados</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F8FAFC]/40 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* Listado Principal - Stackable Cards */}
      <div className="space-y-4 pb-20">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
            <DotLottieReact data={TechLoading} loop autoplay className="w-[150px] h-[150px] opacity-70" />
            <p className="text-[#F8FAFC]/50 mt-4 text-sm font-bold tracking-widest uppercase animate-pulse">Cargando Licencias...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#27272a] rounded-[24px]">
            <Box className="mx-auto text-[#27272a] mb-3" size={48} />
            <h3 className="text-[#F8FAFC]/60 font-semibold mb-1">No hay licencias encontrados.</h3>
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
                  onClick={() => ToggleClientLicenses(client.id)}
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
                        <span className="flex items-center gap-1.5"><Building2 size={12} /> {client.company_name || 'Sin especificar'}</span>
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
                      <button onClick={(e) => { e.stopPropagation(); OpenEditClientDetails(client); }} className="p-2 rounded-lg bg-[#27272a]/40 text-[#F8FAFC]/60 hover:text-white hover:bg-blue-500/20 hover:border-blue-500/30 border border-transparent transition-all" title="Editar Información">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); DisableClientLicense(client.id); }} className="p-2 rounded-lg bg-[#27272a]/40 text-[#F8FAFC]/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 border border-transparent transition-all" title="Desactivar">
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
                          <div className="text-[#F8FAFC]/40 text-xs font-semibold mb-0.5">Identificación NIT</div>
                          <div className="text-[#F8FAFC] text-sm">{client.nit || 'No Registrado'}</div>
                        </div>
                        <div>
                          <div className="text-[#F8FAFC]/40 text-xs font-semibold mb-0.5">Tipo Organización</div>
                          <div className="text-[#F8FAFC] text-sm">{client.establishment_type || 'No configurado'}</div>
                        </div>
                        <div>
                          <div className="text-[#F8FAFC]/40 text-xs font-semibold mb-0.5">Teléfono</div>
                          <div className="text-[#F8FAFC] text-sm">{client.phone || 'No especificado'}</div>
                        </div>
                        <button onClick={(e) => LoadGlobalPaymentHistory(client, e)} className="w-full mt-2 py-2.5 rounded-xl border border-[#1D427F]/40 bg-[#1D427F]/10 text-blue-400 hover:bg-[#1D427F]/20 text-xs font-bold transition-colors shadow-sm active:scale-95">
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
                                    <div className="text-[10px] font-bold text-blue-400 bg-[#1D427F]/10 border border-[#1D427F]/20 px-2 py-0.5 rounded-md inline-block mt-1 mb-1 shadow-sm">
                                      {lic.app_type || 'Aplicación Genérica'} • Plan {lic.plan_type || 'Base'}
                                    </div>
                                    <div className="text-[10px] font-medium text-[#F8FAFC]/50 flex gap-3">
                                      <span className="flex items-center gap-1"><Clock size={10} /> Inicia: {new Date(lic.start_date || '').toLocaleDateString()}</span>
                                      <span className="flex items-center gap-1"><Clock size={10} /> Expira: {new Date(lic.end_date).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border shadow-sm
                                        ${lic.status === 'active' ? 'bg-[#1D427F]/20 text-blue-400 border-[#1D427F]/50' :
                                      lic.status === 'pending' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                        'bg-red-500/10 text-red-400 border-red-500/20'}
                                      `}>
                                    {lic.status === 'active' ? 'Activa' : lic.status === 'pending' ? 'Pendiente' : 'Deshabilitada'}
                                  </div>

                                  {lic.status !== 'erased' && (
                                    <div className="flex flex-col gap-1.5 w-full md:w-auto">
                                      <button onClick={(e) => OpenLicensePaymentForm(lic, e)} className="text-[10px] font-bold bg-[#1D427F]/20 text-blue-400 hover:bg-[#1D427F]/40 border border-[#1D427F]/50 px-3 py-1.5 rounded transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 w-full">
                                        💳 Registrar Pago / Abonar
                                      </button>

                                      <div className="flex items-center gap-2">
                                        <button onClick={(e) => LoadPaymentHistory(lic, e)} className="text-[10px] font-bold bg-[#27272a]/50 text-[#F8FAFC]/70 hover:bg-[#27272a] hover:text-white border border-[#27272a] flex-1 py-1.5 rounded transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95">
                                          📜 Historial
                                        </button>
                                        {lic.status === 'active' && (
                                          <button onClick={(e) => TriggerLicenseDisable(lic, e)} className="text-[10px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 flex-1 py-1.5 rounded transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95" title="Suspender (Corte de Servicio)">
                                            🚫 Suspender
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
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

      {RenderCreateLicenseForm()}
      {RenderEditClientForm()}
      {RenderLicensePaymentForm()}
      {RenderPaymentHistoryModal()}
      {RenderGlobalPaymentHistoryModal()}
      {isSyncing && typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 bg-[#09090B]/80 backdrop-blur-sm z-[99999] flex flex-col items-center justify-center animate-in fade-in duration-200">
          <DotLottieReact data={TechLoading} loop autoplay className="w-[180px] h-[180px]" />
          <p className="text-[#1D427F] font-extrabold tracking-widest text-[16px] animate-pulse mt-2 uppercase drop-shadow-lg">
            Cargando información...
          </p>
        </div>,
        document.body
      ) : null}
    </div>
  );
}
