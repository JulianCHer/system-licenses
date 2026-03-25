import React from 'react';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, CheckCircle2, Clock, XCircle, Plus, UploadCloud, Video, KeyRound } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="max-w-[1400px] mx-auto animate-in">
      
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight mb-2">Dashboard</h1>
          <p className="text-[#F8FAFC]/50 text-sm">Gestiona, prioriza y monitorea todas tus licencias activas e ingresos de forma centralizada.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-transparent border border-[#F8FAFC]/20 text-[#F8FAFC] text-sm font-semibold hover:bg-[#F8FAFC]/5 transition-all shadow-sm">
            <UploadCloud size={16} />
            Importar Datos
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D427F] text-[#F8FAFC] text-sm font-bold shadow-lg shadow-[#1D427F]/25 hover:bg-[#15315E] transform transition-all active:scale-95 border border-[#1D427F]">
            <Plus size={18} />
            Crear Licencia
          </button>
        </div>
      </div>

      {/* Grid Superior: Tarjetas Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        
        {/* Tarjeta Principal Resaltada */}
        <div className="bg-gradient-to-br from-[#1D427F] to-[#0f2854] rounded-[24px] p-6 shadow-xl shadow-[#1D427F]/20 relative overflow-hidden border border-[#1D427F]/50 flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-white/80 font-medium text-sm">Total Licencias</h3>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors">
              <ArrowUpRight size={16} className="text-white" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-4xl font-extrabold text-white mb-2">1,204</div>
            <div className="flex items-center gap-2 text-xs text-white/80 bg-white/10 w-max px-2 py-1 rounded-md backdrop-blur-sm">
              <ArrowUpRight size={12} className="text-green-300" />
              <span className="font-semibold">24% Incremento este mes</span>
            </div>
          </div>
        </div>

        {/* Tarjetas Secundarias */}
        {[
          { title: 'Por Expirar', value: '45', icon: <ArrowUpRight size={16}/>, label: '+5 licencias que ayer', bgClass: 'bg-[#18181B]', colorClass: 'text-yellow-500' },
          { title: 'Licencias Activas', value: '986', icon: <ArrowUpRight size={16}/>, label: '+12% frente al mes pasado', bgClass: 'bg-[#18181B]', colorClass: 'text-green-500' },
          { title: 'Pagos Pendientes', value: '18', icon: <ArrowDownRight size={16}/>, label: 'Requieren validación', bgClass: 'bg-[#18181B]', colorClass: 'text-red-500' },
        ].map((card, i) => (
          <div key={i} className={`rounded-[24px] p-6 shadow-lg border border-[#27272a] ${card.bgClass} flex flex-col justify-between hover:border-[#1D427F]/50 transition-all duration-300 group relative overflow-hidden cursor-pointer`}>
            <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-[#1D427F]/5 rounded-full blur-xl group-hover:bg-[#1D427F]/10 group-hover:scale-150 transition-all duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-[#F8FAFC]/60 font-medium text-sm">{card.title}</h3>
              <div className="w-8 h-8 rounded-full border border-[#27272a] flex items-center justify-center group-hover:border-[#1D427F]/50 transition-colors text-[#F8FAFC]/40 group-hover:text-[#F8FAFC] group-hover:bg-[#1D427F]/10">
                {card.icon}
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-4xl font-extrabold text-[#F8FAFC] mb-2">{card.value}</div>
              <div className="flex items-center gap-1.5 text-xs text-[#F8FAFC]/50 bg-[#27272a]/30 w-max px-2 py-1 rounded-md">
                <span className={card.colorClass}>•</span>
                <span className="font-medium">{card.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid Central */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Gráfico de Barras Falso (Project Analytics) */}
        <div className="lg:col-span-2 bg-[#18181B] rounded-[24px] p-8 pb-4 shadow-lg border border-[#27272a] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#1D427F]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="flex justify-between flex-row items-center mb-10 relative z-10">
            <div>
              <h2 className="text-lg font-bold text-[#F8FAFC]">Analíticas de Emisión</h2>
              <p className="text-xs text-[#F8FAFC]/40 mt-1">Licencias generadas en los últimos 7 días</p>
            </div>
            <button className="text-[#F8FAFC]/40 hover:text-[#F8FAFC] transition-colors bg-[#27272a]/30 p-2 rounded-lg hover:bg-[#27272a]/80"><MoreHorizontal size={20} /></button>
          </div>
          
          {/* Gráfico CSS (Simulando imagen de referencia) */}
          <div className="flex justify-between items-end h-[180px] mt-6 px-2 gap-4 relative z-10 border-b border-[#27272a]/50 pb-2">
            {[40, 70, 95, 100, 80, 50, 60].map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-3 w-full group/bar cursor-pointer relative h-full justify-end">
                {/* Porcentaje Oculto (Tooltip) */}
                <div className="absolute top-0 opacity-0 group-hover/bar:opacity-100 transition-all text-[10px] font-bold bg-[#F8FAFC] text-[#09090B] px-2 py-1 rounded-md shadow-lg -translate-y-full group-hover/bar:-translate-y-6 pointer-events-none z-20">
                  {h}%
                </div>
                {/* Barra principal */}
                <div 
                  className={`w-full rounded-t-xl transition-all duration-500 ease-out group-hover/bar:brightness-125
                    ${i === 3 ? 'bg-gradient-to-t from-[#0f2854] to-[#1D427F] shadow-[0_-5px_20px_rgba(29,66,127,0.3)]' 
                    : i === 2 ? 'bg-gradient-to-t from-[#18181B] to-[#1D427F]/60' 
                    : 'bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.02)_2px,rgba(255,255,255,0.02)_5px)] border border-[#F8FAFC]/5 hover:bg-[#F8FAFC]/5'}`} 
                  style={{ height: `${h}%` }}
                ></div>
                {/* Día */}
                <span className={`text-[11px] font-bold ${i === 3 ? 'text-[#F8FAFC]' : 'text-[#F8FAFC]/40'} mt-1`}>{['D','L','M','M','J','V','S'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recordatorios y Acciones */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#18181B] rounded-[24px] p-6 shadow-lg border border-[#27272a] flex-1 flex flex-col justify-between group hover:border-[#1D427F]/30 transition-colors relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-[#1D427F]/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-bold text-[#F8FAFC]/60 uppercase tracking-widest bg-[#27272a]/50 px-2 py-1 rounded-md">Urgente</h2>
                <MoreHorizontal size={16} className="text-[#F8FAFC]/40 cursor-pointer hover:text-[#F8FAFC]" />
              </div>
              <h3 className="text-xl font-bold text-[#F8FAFC] leading-snug mb-2">Validar consignación de Lazarus Corp</h3>
              <p className="text-[#F8FAFC]/50 text-xs flex items-center gap-1.5 font-medium">
                <Clock size={12} className="text-[#1D427F]" />
                Factura #98302 venciendo hoy (14:00h)
              </p>
            </div>
            <button className="relative z-10 mt-6 w-full py-3.5 bg-[#1D427F]/10 border border-[#1D427F]/30 text-[#1D427F] font-bold text-sm rounded-xl hover:bg-[#1D427F] hover:text-[#F8FAFC] transition-all flex justify-center items-center gap-2 group/btn shadow-[0_4px_14px_rgba(0,0,0,0.2)] hover:shadow-[#1D427F]/20">
              <CheckCircle2 size={18} className="transition-transform group-hover/btn:scale-110" />
              Revisar Pago
            </button>
          </div>

          <div className="bg-gradient-to-br from-[#1D427F]/20 to-transparent border border-[#1D427F]/30 rounded-[24px] p-6 shadow-lg relative overflow-hidden group cursor-pointer hover:bg-[#1D427F]/30 transition-colors">
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#1D427F] opacity-20 blur-[40px] rounded-full group-hover:opacity-40 transition-opacity"></div>
            <div className="relative z-10">
              <h3 className="text-[#F8FAFC]/80 text-sm font-semibold mb-1">Cierre Contable Semanal</h3>
              <div className="text-3xl font-extrabold text-[#F8FAFC] tracking-widest font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                12<span className="text-[#F8FAFC]/40 animate-pulse">:</span>45<span className="text-[#F8FAFC]/40 animate-pulse">:</span>08
              </div>
              <div className="mt-5 flex gap-3">
                <button className="w-10 h-10 rounded-full bg-[#F8FAFC] text-[#1D427F] flex items-center justify-center shadow-lg hover:scale-105 transition-transform"><Video size={18} fill="currentColor" /></button>
                <button className="w-10 h-10 rounded-full bg-[#18181B]/50 border border-[#F8FAFC]/10 text-[#F8FAFC] flex items-center justify-center hover:bg-red-500 hover:border-red-500 transition-colors shadow-sm backdrop-blur-sm"><XCircle size={18} /></button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Grid Inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Team / Clients */}
        <div className="bg-[#18181B] rounded-[24px] p-6 shadow-lg border border-[#27272a] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-[#F8FAFC]">Validadores Activos</h2>
            <button className="flex items-center gap-1.5 text-xs font-semibold text-[#F8FAFC]/60 border border-[#27272a] rounded-lg px-2.5 py-1.5 hover:text-[#F8FAFC] hover:border-[#1D427F]/50 hover:bg-[#1D427F]/10 transition-colors">
              <Plus size={14} /> Añadir
            </button>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {[
              { name: 'Alexandra Deff', task: 'Revisando Banco de Bogotá', status: 'Activa', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
              { name: 'Edwin Adenike', task: 'Auditando facturas #100-150', status: 'Ocupado', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
              { name: 'Isaac Oluwat.', task: 'Soporte vía Ticket', status: 'Ausente', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
              { name: 'David Oshodi', task: 'Creando cuenta cliente', status: 'Activa', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
            ].map((user, i) => (
              <div key={i} className="flex items-center justify-between group p-3 rounded-2xl hover:bg-[#F8FAFC]/5 transition-colors cursor-pointer border border-transparent hover:border-[#27272a]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}&backgroundColor=1D427F`} className="w-10 h-10 rounded-full bg-[#27272a] shadow-sm transform group-hover:scale-105 transition-transform" alt={user.name} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#F8FAFC] group-hover:text-blue-400 transition-colors">{user.name}</div>
                    <div className="text-[11px] font-medium text-[#F8FAFC]/40">{user.task}</div>
                  </div>
                </div>
                <div className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${user.color} uppercase tracking-wider`}>
                  {user.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Donut */}
        <div className="bg-[#18181B] rounded-[24px] p-6 shadow-lg border border-[#27272a] flex flex-col justify-between items-center relative overflow-hidden group">
          <h2 className="text-lg font-bold text-[#F8FAFC] self-start mb-6">Estado Global</h2>
          
          <div className="relative w-52 h-52 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
            {/* Gráfico SVG Simulado estilo Donut */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Círculo Base (Pending) */}
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
              
              {/* Círculo Carga (Activas) */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="url(#primaryGradient)" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="75" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(29,66,127,0.8)]" />
              
              {/* Parte Terminadas (Expiring soon) */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#16a34a" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="230" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(22,163,74,0.6)] transform origin-center rotate-[60deg]" />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-5xl font-extrabold text-[#F8FAFC] tracking-tighter">70<span className="text-2xl text-[#F8FAFC]/50">%</span></span>
              <span className="text-[10px] uppercase tracking-widest text-[#F8FAFC]/40 font-bold mt-1">Activas</span>
            </div>
          </div>

          <div className="flex gap-5 mt-6 w-full justify-center bg-[#27272a]/30 rounded-xl py-3 px-2 border border-[#27272a]/50">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.6)]"></div>
              <span className="text-xs font-semibold text-[#F8FAFC]/80">Activas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#16a34a] shadow-[0_0_5px_rgba(22,163,74,0.6)]"></div>
              <span className="text-xs font-semibold text-[#F8FAFC]/80">Pausadas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#F8FAFC]/20"></div>
              <span className="text-xs font-semibold text-[#F8FAFC]/80">Expiradas</span>
            </div>
          </div>
        </div>

        {/* Action List (Right side of image equivalent) */}
        <div className="bg-[#18181B] rounded-[24px] p-6 shadow-lg border border-[#27272a] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-[#F8FAFC]">Próximos Vencimientos</h2>
            <button className="text-xs font-semibold text-[#1D427F] hover:text-[#F8FAFC] border border-[#1D427F]/30 hover:border-[#F8FAFC]/30 bg-[#1D427F]/5 hover:bg-[#F8FAFC]/5 rounded-lg px-3 py-1.5 transition-all">Reporte</button>
          </div>
          
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar lg:max-h-[260px]">
            {[
              { company: 'Constructora S.A', date: 'Nov 26, 2026', iconBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
              { name: 'Hotel Las Palmas', date: 'Nov 28, 2026', iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
              { name: 'Colegio Americano', date: 'Nov 30, 2026', iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
              { name: 'Grupo Tech SA', date: 'Dec 5, 2026', iconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' },
              { name: 'Agencia Digital', date: 'Dec 10, 2026', iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 group cursor-pointer p-2 rounded-2xl hover:bg-[#F8FAFC]/5 transition-colors border border-transparent hover:border-[#27272a]">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${item.iconBg}`}>
                   <KeyRound size={18} />
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-[#F8FAFC] group-hover:text-blue-400 transition-colors">{item.company || item.name}</div>
                    <div className="text-xs text-[#F8FAFC]/40 flex items-center gap-1.5 mt-1 font-medium">
                      <Clock size={12} /> Expira: {item.date}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-[#27272a] flex items-center justify-center text-[#F8FAFC]/30 group-hover:bg-[#1D427F]/20 group-hover:text-[#1D427F] group-hover:border-[#1D427F]/40 transition-colors">
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
