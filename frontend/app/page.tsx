"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import background_login from '../public/back2.svg';
import Logo_lazarus from '../public/Logo.svg';
import TechLoading from '../public/Tech_Loading.json';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para credenciales y respuestas
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Al cargar la página, recuperar el usuario si se usó "Recordarme" previamente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUsername = localStorage.getItem('lazarus-rememberme');
      if (savedUsername) {
        setUsername(savedUsername);
        setRememberMe(true);
      }
    }
  }, []);

  // Petición real al backend de Laravel
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Credenciales inválidas o cuenta inactiva
        setErrorMsg(data.message || 'Error al iniciar sesión.');
        setIsLoading(false);
      } else {
        // Login exitoso
        setSuccess(true);
        // Guardamos el token para peticiones futuras
        if (typeof window !== 'undefined') {
          localStorage.setItem('lazarus-token', data.token);
          localStorage.setItem('lazarus-user', JSON.stringify(data.user));
          
          if (rememberMe) {
            localStorage.setItem('lazarus-rememberme', username);
          } else {
            localStorage.removeItem('lazarus-rememberme');
          }
        }
        
        // Dejamos correr la animación de Lottie unos segundos por estética antes de entrar a fondo
        setTimeout(() => {
          // Aquí sería ideal un router.push('/dashboard') usando next/navigation
          // Por el momento mostramos una alerta para confirmarte que funciona:
          alert(`¡Bienvenido ${data.user.full_name}! Login validado con la Base de Datos.`);
          setIsLoading(false);
        }, 3000);
      }
    } catch (error) {
      setErrorMsg('No hay conexión con el servidor (¿Está encendido el backend?).');
      setIsLoading(false);
    }
  };

  return (
    <main className="login-wrapper min-h-screen flex flex-col items-center justify-center bg-base relative overflow-hidden px-4">

      <div className="login-background absolute inset-0 z-0 opacity-20 object-cover pointer-events-none">
        <Image
          src={background_login}
          alt="Fondo espacial"
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="login-container relative z-10 w-full max-w-md">

        {/* Espacio Contenedor del Logo / Animación */}
        <div className="logo-wrapper flex justify-center mb-[-40px] relative z-20 h-24">
          
          {/* Logo Lazarus Original */}
          <div className={`logo-box absolute w-24 h-24 bg-[#18181B]/30 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-2xl border border-custom transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-center ${isLoading ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}>
            <Image src={Logo_lazarus} alt='Logo lazarus' className='w-[80%]' />
          </div>

          {/* Animación Lottie */}
          <div className={`lottie-wrapper absolute w-40 h-40 -top-8 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-center ${isLoading ? 'rotate-0 scale-100 opacity-100 delay-100' : '-rotate-90 scale-50 opacity-0 pointer-events-none'}`}>
            {isLoading && (
              <DotLottieReact
                data={TechLoading}
                loop
                autoplay
              />
            )}
          </div>

        </div>

        <div className="login-card bg-[#18181B]/30 backdrop-blur-md rounded-3xl p-8 pt-14 shadow-2xl border border-custom mt-2">

          <div className="login-header text-center mb-6">
            <h1 className="login-title text-2xl font-bold text-base-fg tracking-wide">Bienvenido a Lazarus</h1>
            
            {/* Mensaje de Error / Éxito Dinámico */}
            {errorMsg && (
              <p className="mt-3 text-sm text-red-400 bg-red-900/20 py-2 px-3 rounded-lg border border-red-500/30">
                {errorMsg}
              </p>
            )}
            {success && (
              <p className="mt-3 text-sm text-green-400 bg-green-900/20 py-2 px-3 rounded-lg border border-green-500/30">
                ¡Conexión exitosa, entrando al sistema!
              </p>
            )}
          </div>

          <form onSubmit={handleLogin} className="login-form space-y-4">

            {/* Input Usuario */}
            <div className="input-group-username space-y-1">
              <label className="text-xs font-semibold text-[#F8FAFC]/70 uppercase tracking-wider ml-1">Usuario</label>
              <input
                type="text"
                placeholder="Ingresa tu usuario"
                disabled={isLoading || success}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="username-input w-full bg-[#09090B] text-base-fg border border-custom rounded-xl px-4 py-3 placeholder:text-[#F8FAFC]/30 focus:outline-none focus:border-[#1D427F] focus:ring-1 focus:ring-[#1D427F] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>

            {/* Input Contraseña */}
            <div className="input-group-password space-y-1">
              <label className="text-xs font-semibold text-[#F8FAFC]/70 uppercase tracking-wider ml-1">Contraseña</label>
              <div className="password-wrapper relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  disabled={isLoading || success}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="password-input w-full bg-[#09090B] text-base-fg border border-custom rounded-xl px-4 py-3 placeholder:text-[#F8FAFC]/30 focus:outline-none focus:border-[#1D427F] focus:ring-1 focus:ring-[#1D427F] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
                <button 
                  type="button" 
                  disabled={isLoading || success} 
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn absolute right-4 top-3.5 text-[#F8FAFC]/40 hover:text-base-fg transition-colors disabled:opacity-50"
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Opciones Adicionales */}
            <div className="login-options flex items-center justify-between mt-2">
              <label className="remember-me flex items-center space-x-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  disabled={isLoading || success} 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-custom bg-[#09090B] checked:bg-[#1D427F] accent-[#1D427F] cursor-pointer disabled:opacity-50" 
                />
                <span className="text-xs text-[#F8FAFC]/80 group-hover:text-base-fg transition-colors">Recordarme</span>
              </label>

              <a href="#" className="forgot-password text-xs text-[#1D427F] hover:text-[#F8FAFC] transition-colors font-semibold">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Botón Principal */}
            <div className="submit-button-wrapper pt-4">
              <button
                type="submit"
                disabled={isLoading || success}
                className="submit-button w-full bg-[#1D427F] text-base-fg font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-[#15315E] transition-colors shadow-lg shadow-[#1D427F]/20 disabled:opacity-50 disabled:cursor-wait"
              >
                {isLoading ? 'Autenticando...' : 'Ingresar'}
              </button>
            </div>

          </form>

        </div>

      </div>
    </main>
  );
}
