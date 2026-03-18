"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Solicitud {
    id: string;
    dni: string;
    email: string;
    nombre: string;
    apellido: string;
    estado: string;
    created_at: string;
}

interface PerfilDB {
    id: string;
    dni: string;
    nombre: string;
}

export default function UserManagement({ onClose }: { onClose: () => void }) {
    const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [perfilesExistentes, setPerfilesExistentes] = useState<Record<string, string>>({}); // dni -> id
    
    // Formulario Manual
    const [manualForm, setManualForm] = useState({
        dni: '', nombre: '', apellido: '', email: '', rol: 'preceptor'
    });
    const [manualMsg, setManualMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        // 1. Cargar solicitudes pendientes
        const { data: sols } = await supabase
            .from('solicitudes_acceso')
            .select('*')
            .eq('estado', 'pendiente')
            .order('created_at', { ascending: false });

        if (sols) setSolicitudes(sols);

        // 2. Pre-cargar DNIs de perfiles existentes para ver si podemos vincular.
        // Hacemos un mapeo de DNI a ID.
        const { data: perfiles } = await supabase.from('perfiles').select('id, dni, nombre, apellido');
        if (perfiles) {
            const map: Record<string, string> = {};
            perfiles.forEach(p => map[p.dni] = p.id);
            setPerfilesExistentes(map);
        }
        setLoading(false);
    };

    const handleAction = async (action: 'approve_request' | 'reject_request', sol: Solicitud) => {
        const confirmMsg = action === 'approve_request' 
            ? `¿Dar de alta a ${sol.nombre} ${sol.apellido} (DNI ${sol.dni})?` 
            : `¿Rechazar la solicitud de ${sol.dni}?`;
            
        if (!window.confirm(confirmMsg)) return;

        setActionLoading(sol.id);
        
        try {
            const old_perfil_id = perfilesExistentes[sol.dni];
            if (action === 'approve_request' && !old_perfil_id) {
                alert("Atención: El DNI solicitado no figura en la base de datos de Alumnos pre-cargados. Primero el alumno debe estar cargado desde 'Matriculación/Alumnos Nuevos' antes de aprobar su alta web.");
                setActionLoading(null);
                return;
            }

            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    payload: { ...sol, solicitud_id: sol.id, old_perfil_id }
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error en la petición');
            
            alert(result.message);
            loadData();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading('manual_submit');
        setManualMsg({ type: '', text: '' });

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_manual',
                    payload: manualForm
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            setManualMsg({ type: 'success', text: result.message });
            setManualForm({ dni: '', nombre: '', apellido: '', email: '', rol: 'preceptor' });
            loadData();
        } catch (error: any) {
            setManualMsg({ type: 'error', text: error.message });
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-7xl w-full mx-auto animate-in fade-in zoom-in duration-500 overflow-hidden">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-50">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">Gestión de Accesos</h2>
                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-[0.2em]">Administración de Usuarios</p>
                </div>
                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SOLICITUDES DE ESTUDIANTES PENDIENTES */}
                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                             </svg>
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Solicitudes de Estudiantes</h3>
                    </div>

                    {loading ? (
                        <div className="animate-pulse text-xs font-bold text-slate-400 text-center py-10 uppercase">Cargando...</div>
                    ) : solicitudes.length === 0 ? (
                        <div className="bg-white p-8 rounded-2xl text-center border border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No hay web-solicitudes pendientes</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {solicitudes.map(sol => {
                                const fichaExiste = !!perfilesExistentes[sol.dni];
                                return (
                                    <div key={sol.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 group hover:border-indigo-300 transition-colors shadow-sm">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-slate-900 text-sm uppercase">{sol.apellido}, {sol.nombre}</h4>
                                                {fichaExiste ? (
                                                    <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-black uppercase tracking-wider border border-emerald-100">Ficha OK</span>
                                                ) : (
                                                    <span className="text-[9px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-black uppercase tracking-wider border border-red-100">No Matrículado</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-500">DNI: {sol.dni}</p>
                                            <p className="text-[11px] font-bold text-slate-500">Mail: <span className="text-indigo-600">{sol.email}</span></p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleAction('reject_request', sol)}
                                                disabled={actionLoading !== null}
                                                className="px-4 py-2 bg-slate-50 text-slate-500 hover:text-red-600 hover:bg-red-50 font-bold rounded-xl text-[10px] uppercase tracking-wider border border-slate-200 transition-all disabled:opacity-50"
                                            >
                                                Denegar
                                            </button>
                                            <button 
                                                onClick={() => handleAction('approve_request', sol)}
                                                disabled={actionLoading !== null || !fichaExiste}
                                                className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white font-bold rounded-xl text-[10px] uppercase tracking-wider border border-emerald-200 transition-all disabled:opacity-50"
                                            >
                                                {actionLoading === sol.id ? '...' : 'Vincular Alta'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ALTA MANUAL (PRECEPTORES/ADMINS) */}
                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                             </svg>
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Crear Personal (Alta Directa)</h3>
                    </div>

                    <form onSubmit={handleManualSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">DNI</label>
                                <input type="text" required value={manualForm.dni} onChange={e => setManualForm({...manualForm, dni: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="12345678" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Rol</label>
                                <select value={manualForm.rol} onChange={e => setManualForm({...manualForm, rol: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-indigo-600 uppercase focus:ring-2 focus:ring-indigo-100 outline-none">
                                    <option value="preceptor">Preceptor</option>
                                    <option value="admin">Administrador</option>
                                    <option value="estudiante">Estudiante</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Nombres</label>
                                <input type="text" required value={manualForm.nombre} onChange={e => setManualForm({...manualForm, nombre: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-100 outline-none uppercase" />
                            </div>
                             <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Apellido</label>
                                <input type="text" required value={manualForm.apellido} onChange={e => setManualForm({...manualForm, apellido: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-100 outline-none uppercase" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Email (Usuario Web)</label>
                            <input type="email" required value={manualForm.email} onChange={e => setManualForm({...manualForm, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="mail@ejemplo.com" />
                        </div>

                        {manualMsg.text && (
                            <div className={`p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center border ${manualMsg.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                {manualMsg.text}
                            </div>
                        )}

                        <div className="pt-2">
                            <button type="submit" disabled={actionLoading === 'manual_submit'} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-900 transition-colors shadow-md disabled:opacity-50">
                                {actionLoading === 'manual_submit' ? 'Creando Usuario...' : 'Crear Usuario Directamente'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
