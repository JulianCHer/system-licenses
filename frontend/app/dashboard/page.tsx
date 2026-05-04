"use client";
import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, CheckCircle2, Clock, XCircle, Plus, UploadCloud, Video, KeyRound, RefreshCw, Activity } from 'lucide-react';
import Swal from 'sweetalert2';

const API = 'http://localhost:8000/api';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('lazarus-token') : '');

interface DashboardData {
  stats: {
    total_licenses: number;
    expiring_licenses: number;
    active_licenses: number;
    pending_payments: number;
  };
  chart: number[];
  urgent: {
    id: number;
    amount: string | number;
    created_at: string;
    business_name: string;
    client_name: string;
  } | null;
  users: Array<{
    name: string;
    role_name: string;
    state: string;
  }>;
  expirations: Array<{
    id: number;
    license_key: string;
    expires_at: string;
    business_name: string;
    client_name: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/dashboard`, { 
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          Accept: 'application/json' 
        } 
      });
      if (r.status === 401) {
        localStorage.clear();
        window.location.href = '/';
        return;
      }
      const d = await r.json();
      if (d.success) {
        setData(d.data);
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
      Swal.fire({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
        icon: 'error', title: 'Error cargando datos',
        background: '#18181B', color: '#F8FAFC'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const daysLabels = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return ['D','L','M','M','J','V','S'][d.getDay()];
  });

  const maxChartVal = data ? Math.max(...data.chart, 1) : 1; // Prevent div by 0

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-white/50">
        <Activity size={48} className="animate-pulse mb-4 text-[#1D427F]" />
        <h2 className="text-xl font-bold">Cargando Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto animate-in">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight mb-2 flex items-center gap-3">
            Dashboard
            <button onClick={loadData} disabled={loading} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all disabled:opacity-50">
               <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </h1>
          <p className="text-[#F8FAFC]/50 text-sm">Gestiona, prioriza y monitorea todas tus licencias activas e ingresos de forma centralizada.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-transparent border border-[#F8FAFC]/20 text-[#F8FAFC] text-sm font-semibold hover:bg-[#F8FAFC]/5 transition-all shadow-sm">
            <UploadCloud size={16} /> Importar
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D427F] text-[#F8FAFC] text-sm font-bold shadow-lg shadow-[#1D427F]/25 hover:bg-[#15315E] transform transition-all active:scale-95 border border-[#1D427F]">
            <Plus size={18} /> Nueva Licencia
          </button>
        </div>
      </div>

      {/* Grid Superior: Tarjetas Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-[#1D427F] to-[#0f2854] rounded-[24px] p-6 shadow-xl shadow-[#1D427F]/20 relative overflow-hidden border border-[#1D427F]/50 flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-white/80 font-medium text-sm">Total Licencias</h3>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors">
              <ArrowUpRight size={16} className="text-white" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-4xl font-extrabold text-white mb-2">{data?.stats.total_licenses || 0}</div>
            <div className="flex items-center gap-2 text-xs text-white/80 bg-white/10 w-max px-2 py-1 rounded-md backdrop-blur-sm">
               Histórico de emitidas
            </div>
          </div>
        </div>

        <div className="rounded-[24px] p-6 shadow-lg border border-[#27272a] bg-[#18181B] flex flex-col justify-between hover:border-[#1D427F]/50 transition-all duration-300 group relative overflow-hidden cursor-pointer">
            <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-[#1D427F]/5 rounded-full blur-xl group-hover:bg-[#1D427F]/10 group-hover:scale-150 transition-all duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-[#F8FAFC]/60 font-medium text-sm">Por Expirar (7 días)</h3>
              <div className="w-8 h-8 rounded-full border border-[#27272a] flex items-center justify-center group-hover:border-[#1D427F]/50 transition-colors text-[#F8FAFC]/40 group-hover:text-[#F8FAFC] group-hover:bg-[#1D427F]/10">
                <ArrowUpRight size={16}/>
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-4xl font-extrabold text-[#F8FAFC] mb-2">{data?.stats.expiring_licenses || 0}</div>
              <div className="flex items-center gap-1.5 text-xs text-[#F8FAFC]/50 bg-[#27272a]/30 w-max px-2 py-1 rounded-md">
                <span className="text-yellow-500">•</span> <span className="font-medium">Requieren atención</span>
              </div>
            </div>
        </div>

        <div className="rounded-[24px] p-6 shadow-lg border border-[#27272a] bg-[#18181B] flex flex-col justify-between hover:border-[#1D427F]/50 transition-all duration-300 group relative overflow-hidden cursor-pointer">
            <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-[#1D427F]/5 rounded-full blur-xl group-hover:bg-[#1D427F]/10 group-hover:scale-150 transition-all duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-[#F8FAFC]/60 font-medium text-sm">Licencias Activas</h3>
              <div className="w-8 h-8 rounded-full border border-[#27272a] flex items-center justify-center group-hover:border-[#1D427F]/50 transition-colors text-[#F8FAFC]/40 group-hover:text-[#F8FAFC] group-hover:bg-[#1D427F]/10">
                <CheckCircle2 size={16}/>
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-4xl font-extrabold text-[#F8FAFC] mb-2">{data?.stats.active_licenses || 0}</div>
              <div className="flex items-center gap-1.5 text-xs text-[#F8FAFC]/50 bg-[#27272a]/30 w-max px-2 py-1 rounded-md">
                <span className="text-green-500">•</span> <span className="font-medium">Sistemas operativos</span>
              </div>
            </div>
        </div>

        <div className="rounded-[24px] p-6 shadow-lg border border-[#27272a] bg-[#18181B] flex flex-col justify-between hover:border-[#1D427F]/50 transition-all duration-300 group relative overflow-hidden cursor-pointer">
            <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-[#1D427F]/5 rounded-full blur-xl group-hover:bg-[#1D427F]/10 group-hover:scale-150 transition-all duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-[#F8FAFC]/60 font-medium text-sm">Pagos Pendientes</h3>
              <div className="w-8 h-8 rounded-full border border-[#27272a] flex items-center justify-center group-hover:border-[#1D427F]/50 transition-colors text-[#F8FAFC]/40 group-hover:text-[#F8FAFC] group-hover:bg-[#1D427F]/10">
                <ArrowDownRight size={16}/>
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-4xl font-extrabold text-[#F8FAFC] mb-2">{data?.stats.pending_payments || 0}</div>
              <div className="flex items-center gap-1.5 text-xs text-[#F8FAFC]/50 bg-[#27272a]/30 w-max px-2 py-1 rounded-md">
                <span className="text-red-500">•</span> <span className="font-medium">Pendientes de validar</span>
              </div>
            </div>
        </div>
      </div>

      {/* Grid Central */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Gráfico Analíticas */}
        <div className="lg:col-span-2 bg-[#18181B] rounded-[24px] p-8 pb-4 shadow-lg border border-[#27272a] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#1D427F]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="flex justify-between flex-row items-center mb-10 relative z-10">
            <div>
              <h2 className="text-lg font-bold text-[#F8FAFC]">Analíticas de Emisión</h2>
              <p className="text-xs text-[#F8FAFC]/40 mt-1">Licencias generadas en los últimos 7 días</p>
            </div>
            <button className="text-[#F8FAFC]/40 hover:text-[#F8FAFC] transition-colors bg-[#27272a]/30 p-2 rounded-lg hover:bg-[#27272a]/80"><MoreHorizontal size={20} /></button>
          </div>
          
          <div className="flex justify-between items-end h-[180px] mt-6 px-2 gap-4 relative z-10 border-b border-[#27272a]/50 pb-2">
            {data?.chart.map((val, i) => {
              const h = maxChartVal > 0 ? (val / maxChartVal) * 100 : 0;
              const isToday = i === 6;
              return (
                <div key={i} className="flex flex-col items-center gap-3 w-full group/bar cursor-pointer relative h-full justify-end">
                  <div className="absolute top-0 opacity-0 group-hover/bar:opacity-100 transition-all text-[10px] font-bold bg-[#F8FAFC] text-[#09090B] px-2 py-1 rounded-md shadow-lg -translate-y-full group-hover/bar:-translate-y-6 pointer-events-none z-20">
                    {val} regs
                  </div>
                  <div 
                    className={`w-full rounded-t-xl transition-all duration-500 ease-out group-hover/bar:brightness-125
                      ${isToday && val > 0 ? 'bg-gradient-to-t from-[#0f2854] to-[#1D427F] shadow-[0_-5px_20px_rgba(29,66,127,0.3)]' 
                      : val > 0 ? 'bg-gradient-to-t from-[#18181B] to-[#1D427F]/60' 
                      : 'bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.02)_2px,rgba(255,255,255,0.02)_5px)] border border-[#F8FAFC]/5 hover:bg-[#F8FAFC]/5'}`} 
                    style={{ height: `${Math.max(h, 5)}%` }} // 5% minimum height just for visibility of empty days
                  ></div>
                  <span className={`text-[11px] font-bold ${isToday ? 'text-[#F8FAFC]' : 'text-[#F8FAFC]/40'} mt-1`}>{daysLabels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recordatorios */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#18181B] rounded-[24px] p-6 shadow-lg border border-[#27272a] flex-1 flex flex-col justify-between group hover:border-[#1D427F]/30 transition-colors relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-[#1D427F]/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-bold text-[#F8FAFC]/60 uppercase tracking-widest bg-[#27272a]/50 px-2 py-1 rounded-md">
                  {data?.urgent ? 'Pago Pendiente' : 'Al Día'}
                </h2>
              </div>
              <h3 className="text-xl font-bold text-[#F8FAFC] leading-snug mb-2">
                {data?.urgent ? `Validar pago de ${data.urgent.business_name || data.urgent.client_name}` : 'No hay pagos urgentes'}
              </h3>
              {data?.urgent && (
                <p className="text-[#F8FAFC]/50 text-xs flex items-center gap-1.5 font-medium">
                  <Clock size={12} className="text-[#1D427F]" />
                  Monto: ${data.urgent.amount} - {new Date(data.urgent.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
            {data?.urgent && (
              <button className="relative z-10 mt-6 w-full py-3.5 bg-[#1D427F]/10 border border-[#1D427F]/30 text-[#1D427F] font-bold text-sm rounded-xl hover:bg-[#1D427F] hover:text-[#F8FAFC] transition-all flex justify-center items-center gap-2 group/btn shadow-[0_4px_14px_rgba(0,0,0,0.2)] hover:shadow-[#1D427F]/20">
                <CheckCircle2 size={18} className="transition-transform group-hover/btn:scale-110" />
                Revisar Pago
              </button>
            )}
          </div>

          <div className="bg-gradient-to-br from-[#1D427F]/20 to-transparent border border-[#1D427F]/30 rounded-[24px] p-6 shadow-lg relative overflow-hidden group cursor-pointer hover:bg-[#1D427F]/30 transition-colors">
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#1D427F] opacity-20 blur-[40px] rounded-full group-hover:opacity-40 transition-opacity"></div>
            <div className="relative z-10">
              <h3 className="text-[#F8FAFC]/80 text-sm font-semibold mb-1">Cierre Contable Mensual</h3>
              <div className="text-3xl font-extrabold text-[#F8FAFC] tracking-widest font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}
              </div>
              <div className="mt-5 flex gap-3">
                <button className="w-10 h-10 rounded-full bg-[#F8FAFC] text-[#1D427F] flex items-center justify-center shadow-lg hover:scale-105 transition-transform"><Activity size={18} fill="currentColor" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Validadores Activos */}
        <div className="bg-[#18181B] rounded-[24px] p-6 shadow-lg border border-[#27272a] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-[#F8FAFC]">Validadores Activos</h2>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {!data?.users?.length ? (
              <p className="text-[#F8FAFC]/40 text-sm text-center py-4">No hay usuarios activos</p>
            ) : (
              data.users.map((user, i) => (
                <div key={i} className="flex items-center justify-between group p-3 rounded-2xl hover:bg-[#F8FAFC]/5 transition-colors cursor-pointer border border-transparent hover:border-[#27272a]">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}&backgroundColor=1D427F`} className="w-10 h-10 rounded-full bg-[#27272a] shadow-sm transform group-hover:scale-105 transition-transform" alt={user.name} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#F8FAFC] group-hover:text-blue-400 transition-colors">{user.name}</div>
                      <div className="text-[11px] font-medium text-[#F8FAFC]/40">{user.role_name || 'Sin Rol'}</div>
                    </div>
                  </div>
                  <div className={`text-[10px] font-bold px-2.5 py-1 rounded-md border text-green-400 bg-green-500/10 border-green-500/20 uppercase tracking-wider`}>
                    {user.state}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Progress Donut */}
        <div className="bg-[#18181B] rounded-[24px] p-6 shadow-lg border border-[#27272a] flex flex-col justify-between items-center relative overflow-hidden group">
          <h2 className="text-lg font-bold text-[#F8FAFC] self-start mb-6">Proporción Licencias</h2>
          
          <div className="relative w-52 h-52 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="url(#stripePattern)" strokeWidth="12" className="opacity-10" />
              <defs>
                <pattern id="stripePattern" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                  <line x1="0" y="0" x2="0" y2="4" stroke="#F8FAFC" strokeWidth="2" />
                </pattern>
                <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1D427F" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              
              <circle 
                cx="50" cy="50" r="40" fill="transparent" stroke="url(#primaryGradient)" strokeWidth="12" 
                strokeDasharray="251.2" 
                strokeDashoffset={data?.stats.total_licenses > 0 ? 251.2 * (1 - (data.stats.active_licenses / data.stats.total_licenses)) : 251.2} 
                strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(29,66,127,0.8)] transition-all duration-1000" 
              />
              <circle 
                cx="50" cy="50" r="40" fill="transparent" stroke="#16a34a" strokeWidth="12" 
                strokeDasharray="251.2" 
                strokeDashoffset={data?.stats.total_licenses > 0 ? 251.2 * (1 - (data.stats.expiring_licenses / data.stats.total_licenses)) : 251.2} 
                strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(22,163,74,0.6)] transform origin-center rotate-[60deg] transition-all duration-1000" 
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-5xl font-extrabold text-[#F8FAFC] tracking-tighter">
                {data?.stats.total_licenses > 0 ? Math.round((data.stats.active_licenses / data.stats.total_licenses) * 100) : 0}<span className="text-2xl text-[#F8FAFC]/50">%</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#F8FAFC]/40 font-bold mt-1">Activas</span>
            </div>
          </div>

          <div className="flex gap-5 mt-6 w-full justify-center bg-[#27272a]/30 rounded-xl py-3 px-2 border border-[#27272a]/50">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.6)]"></div>
              <span className="text-xs font-semibold text-[#F8FAFC]/80">Activas ({data?.stats.active_licenses})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#16a34a] shadow-[0_0_5px_rgba(22,163,74,0.6)]"></div>
              <span className="text-xs font-semibold text-[#F8FAFC]/80">Por Expirar ({data?.stats.expiring_licenses})</span>
            </div>
          </div>
        </div>

        {/* Action List */}
        <div className="bg-[#18181B] rounded-[24px] p-6 shadow-lg border border-[#27272a] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-[#F8FAFC]">Próximos Vencimientos</h2>
          </div>
          
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar lg:max-h-[260px]">
            {!data?.expirations?.length ? (
              <p className="text-[#F8FAFC]/40 text-sm text-center py-4">No hay vencimientos próximos</p>
            ) : (
              data.expirations.map((item, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer p-2 rounded-2xl hover:bg-[#F8FAFC]/5 transition-colors border border-transparent hover:border-[#27272a]">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm bg-rose-500/10 text-rose-400 border border-rose-500/20`}>
                     <KeyRound size={18} />
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-bold text-[#F8FAFC] group-hover:text-blue-400 transition-colors truncate max-w-[150px]">{item.business_name || item.client_name}</div>
                      <div className="text-xs text-[#F8FAFC]/40 flex items-center gap-1.5 mt-1 font-medium">
                        <Clock size={12} /> {new Date(item.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-[#27272a] flex items-center justify-center text-[#F8FAFC]/30 group-hover:bg-[#1D427F]/20 group-hover:text-[#1D427F] group-hover:border-[#1D427F]/40 transition-colors">
                      <ArrowUpRight size={14} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
