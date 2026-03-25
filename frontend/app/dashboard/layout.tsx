"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, KeyRound, Users, BarChart3, Package,
  Settings, HelpCircle, LogOut, Search, Bell, Mail
} from 'lucide-react';
import Image from 'next/image';
import Logo_lazarus from '../../public/Logo.svg';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Guard de Autenticación: Valida si existe el token en el LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('lazarus-token');
      if (!token) {
        // Si no hay token, se devuelve al login sin guardar historial
        router.replace('/');
      }
    }
  }, [router]);

  return (
    <div className="flex h-screen bg-[#09090B] text-[#F8FAFC] overflow-hidden">

      {/* Sidebar Izquierdo */}
      <aside className="w-64 bg-[#18181B] border-r border-[#27272a] flex flex-col p-4 flex-shrink-0 relative z-20 shadow-2xl">

        {/* Isotipo / Logo de la Herramienta */}
        <div className="flex items-center gap-3 px-2 mb-8 mt-2 cursor-pointer">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center">
            <Image src={Logo_lazarus} alt='logo-lazarus' className='' />
          </div>
          <span className="text-xl font-bold tracking-wide">Lazarus</span>
        </div>

        {/* Menú Principal */}
        <div className="text-[10px] font-bold text-[#F8FAFC]/30 uppercase tracking-widest mb-3 px-2">Menú Principal</div>
        <nav className="flex-1 space-y-1 relative">

          {[
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/dashboard/licenses', label: 'Licencias', icon: KeyRound, badge: '12+' },
            { href: '/dashboard/clients', label: 'Clientes', icon: Users },
            { href: '/dashboard/analytics', label: 'Analíticas', icon: BarChart3 },
            { href: '/dashboard/products', label: 'Productos', icon: Package },
          ].map((item) => {
            // El dashboard exacto solo es activo si es igual. Los demás si la ruta actual 'arranca' con el href.
            const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href} className={`flex justify-between items-center px-3 py-2.5 rounded-xl transition-colors border relative overflow-hidden group ${isActive ? 'bg-[#1D427F]/20 text-[#F8FAFC] font-semibold border-[#1D427F]/40' : 'text-[#F8FAFC]/60 hover:text-[#F8FAFC] hover:bg-[#F8FAFC]/5 border-transparent'}`}>
                {isActive && <div className="absolute inset-0 bg-[#1D427F]/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                
                <div className="flex items-center gap-3 relative z-10 transition-transform group-hover:translate-x-1">
                  <Icon fill={isActive && item.href === '/dashboard' ? 'currentColor' : 'none'} size={18} />
                  <span>{item.label}</span>
                </div>
                
                {isActive ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] relative z-10"></div>
                ) : item.badge ? (
                  <div className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">{item.badge}</div>
                ) : null}
              </Link>
            );
          })}

        </nav>

        {/* Menú Secundario */}
        <div className="text-[10px] font-bold text-[#F8FAFC]/30 uppercase tracking-widest mb-3 px-2 mt-6">Ajustes Generales</div>
        <div className="space-y-1 mb-6">
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#F8FAFC]/60 hover:text-[#F8FAFC] hover:bg-[#F8FAFC]/5 transition-colors group">
            <div className="flex items-center gap-3 transition-transform group-hover:translate-x-1">
              <Settings size={18} />
              <span>Configuración</span>
            </div>
          </Link>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('lazarus-token');
                localStorage.removeItem('lazarus-user');
                router.replace('/');
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-colors group mt-2"
          >
            <div className="flex items-center gap-3 transition-transform group-hover:translate-x-1">
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </div>
          </button>
        </div>

      </aside>

      {/* Main Área de Contenido con Navbar incorporada */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#09090B] relative overflow-hidden">

        {/* Difuminados de Fondo base abstractos */}
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-[#1D427F] blur-[150px] opacity-[0.05] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-[#1D427F] blur-[180px] opacity-[0.03] rounded-full pointer-events-none"></div>

        {/* Navbar Header */}
        <header className="h-20 border-b border-[#27272a]/50 flex items-center justify-between px-8 bg-[#09090B]/60 backdrop-blur-md relative z-20">

          {/* Barra Búsqueda Global */}
          <div className="flex-1 max-w-md relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-[#F8FAFC]/40 group-focus-within:text-[#1D427F] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar tareas, clientes o licencias..."
              className="w-full bg-[#18181B] border border-[#27272a] rounded-full py-2.5 pl-11 pr-14 text-sm text-[#F8FAFC] placeholder:text-[#F8FAFC]/30 focus:outline-none focus:border-[#1D427F] focus:ring-1 focus:ring-[#1D427F]/50 transition-all shadow-sm"
            />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <div className="text-[10px] font-bold text-[#F8FAFC]/40 bg-[#27272a]/50 px-2 py-1 rounded-md border border-[#27272a]">⌘ F</div>
            </div>
          </div>

          {/* User & Notifications */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-full bg-[#18181B] border border-[#27272a] flex items-center justify-center text-[#F8FAFC]/60 hover:text-[#1D427F] hover:border-[#1D427F]/50 transition-all shadow-sm">
                <Mail size={18} />
              </button>
              <button className="w-10 h-10 rounded-full bg-[#18181B] border border-[#27272a] flex items-center justify-center text-[#F8FAFC]/60 hover:text-[#1D427F] hover:border-[#1D427F]/50 transition-all shadow-sm relative">
                <Bell size={18} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#18181B]"></span>
              </button>
            </div>

            <div className="h-8 w-px bg-[#27272a]"></div>

            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold text-[#F8FAFC] group-hover:text-blue-400 transition-colors tracking-wide">Administrador</div>
                <div className="text-xs text-[#F8FAFC]/40 font-medium">Lazarus admin</div>
              </div>
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#1D427F] to-blue-400 p-[2px] shadow-lg shadow-[#1D427F]/20">
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Julian&backgroundColor=transparent`} alt="User Avatar" className="w-full h-full rounded-full bg-[#18181B] object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* CONTENIDO DEL DASHBOARD INYECTADO AQUÍ */}
        <main className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
          {children}
        </main>

      </div>
    </div>
  );
}
