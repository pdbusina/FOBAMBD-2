"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Register specific
    const [dni, setDni] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError('Credenciales incorrectas o usuario no encontrado.');
            setLoading(false);
        } else {
            router.push('/dashboard');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        // Validar formato de DNI
        if (!/^\d{7,8}$/.test(dni)) {
            setError('El DNI debe tener 7 u 8 números sin puntos.');
            setLoading(false);
            return;
        }

        const { error: dbError } = await supabase.from('solicitudes_acceso').insert([{
            dni, nombre, apellido, email, estado: 'pendiente'
        }]);

        if (dbError) {
            if (dbError.code === '23505') {
                setError('Ya existe una solicitud pendiente o aprobada para este DNI o Email.');
            } else {
                setError('Error al enviar la solicitud: ' + dbError.message);
            }
        } else {
            setSuccess('¡Solicitud enviada! Un administrador revisará tus datos y habilitará tu acceso.');
            setDni(''); setNombre(''); setApellido(''); setEmail(''); setPassword('');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-md w-full p-8 md:p-12 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(79,70,229,0.1)] border border-slate-100 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 rounded-2xl mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                    FOBAMBD <span className="text-indigo-600">2.0</span>
                </h2>
                <p className="text-slate-500 font-medium">
                    Gestión Académica
                </p>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
                <button 
                    onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                    className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Ingresar
                </button>
                <button 
                    onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
                    className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'register' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Solicitar Alta
                </button>
            </div>

            {mode === 'login' ? (
                <form className="space-y-6 animate-in slide-in-from-left-4 duration-300" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest mb-1 block">Correo Electrónico (Usuario)</label>
                            <input type="email" required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-bold placeholder-slate-300" placeholder="mail@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest mb-1 block">Contraseña (DNI si eres estudiante)</label>
                            <input type="password" required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-bold placeholder-slate-300" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    </div>

                    {error && <div className="text-red-500 text-xs font-bold text-center bg-red-50 py-3 rounded-xl border border-red-100 uppercase tracking-widest">{error}</div>}

                    <div className="pt-2">
                        <button type="submit" disabled={loading} className="w-full py-4 text-xs font-bold uppercase tracking-[0.2em] rounded-xl text-white bg-indigo-600 hover:bg-slate-900 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50">
                            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                        </button>
                    </div>
                </form>
            ) : (
                <form className="space-y-5 animate-in slide-in-from-right-4 duration-300" onSubmit={handleRegister}>
                    <div>
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest mb-1 block">DNI (Sin puntos)</label>
                        <input type="text" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-bold" value={dni} onChange={(e) => setDni(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-widest mb-1 block">Nombres</label>
                            <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-bold uppercase" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-widest mb-1 block">Apellidos</label>
                            <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-bold uppercase" value={apellido} onChange={(e) => setApellido(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest mb-1 block">Correo Electrónico (Será tu usuario)</label>
                        <input type="email" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-bold" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    {error && <div className="text-red-500 text-[10px] font-bold text-center bg-red-50 p-3 rounded-xl border border-red-100 uppercase tracking-widest">{error}</div>}
                    {success && <div className="text-emerald-600 text-[10px] font-bold text-center bg-emerald-50 p-3 rounded-xl border border-emerald-100 uppercase tracking-widest leading-relaxed">{success}</div>}

                    <div className="pt-2">
                        <button type="submit" disabled={loading} className="w-full py-4 text-xs font-bold uppercase tracking-[0.2em] rounded-xl text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50">
                            {loading ? 'Enviando...' : 'Pedir Acceso'}
                        </button>
                    </div>
                </form>
            )}
            
            <p className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                © 2026 FOBAM ESMN
            </p>
        </div>
    );
}
