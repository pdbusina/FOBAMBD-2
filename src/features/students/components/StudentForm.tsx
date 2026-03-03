"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface StudentFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function StudentForm({ onSuccess, onCancel }: StudentFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        dni: '',
        apellido: '',
        nombre: '',
        rol: 'estudiante' as const
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Para el registro inicial, creamos el perfil.
        // Usamos el DNI como ID temporal hasta que el usuario se registre en Auth definitivamente.
        // Esto permite que el admin cargue la base sin que el alumno esté presente.
        const { error: insertError } = await supabase
            .from('perfiles')
            .insert([{
                id: crypto.randomUUID(),
                ...formData
            }]);

        if (insertError) {
            setError(insertError.message);
            setLoading(false);
        } else {
            onSuccess();
        }
    };

    return (
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-md w-full animate-in zoom-in duration-500">
            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Registro Inicial</h2>
                <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-widest">Nueva Ficha Académica</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">DNI / Identificador</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej: 12345678"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-bold text-slate-900 outline-none placeholder-slate-300"
                            value={formData.dni}
                            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">Apellido</label>
                        <input
                            type="text"
                            required
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-bold text-slate-900 outline-none uppercase"
                            value={formData.apellido}
                            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">Nombres</label>
                        <input
                            type="text"
                            required
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-bold text-slate-900 outline-none uppercase"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-xs font-bold text-center animate-pulse">
                        ⚠️ {error}
                    </div>
                )}

                <div className="flex flex-col gap-3 mt-10">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs disabled:opacity-50"
                    >
                        {loading ? 'Habilitando...' : 'Crear Ficha de Alumno'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full py-4 text-xs font-bold text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-2xl transition-all border border-slate-100 hover:border-red-100 uppercase tracking-widest"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}
