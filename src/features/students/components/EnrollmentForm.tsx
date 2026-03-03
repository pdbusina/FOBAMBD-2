"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/features/auth/authService';
import { InstrumentoPlan, getInstrumentosPlanes, enrollStudent } from '../enrollmentService';

export default function EnrollmentForm({ onClose, onEnrollSuccess }: { onClose: () => void, onEnrollSuccess?: () => void }) {
    const [dniSearch, setDniSearch] = useState('');
    const [student, setStudent] = useState<UserProfile | null>(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    const [instrumentos, setInstrumentos] = useState<InstrumentoPlan[]>([]);
    const [selectedInst, setSelectedInst] = useState('');
    const [selectedTurno, setSelectedTurno] = useState<'mañana' | 'tarde' | 'vespertino'>('mañana');

    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const loadInstruments = async () => {
            const data = await getInstrumentosPlanes();
            setInstrumentos(data);
        };
        loadInstruments();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dniSearch) return;

        setSearching(true);
        setSearchError('');
        setStudent(null);
        setMessage(null);

        const { data, error } = await supabase
            .from('perfiles')
            .select('*')
            .eq('dni', dniSearch)
            .maybeSingle();

        if (error) {
            setSearchError('Error al buscar estudiante.');
        } else if (!data) {
            setSearchError('No se encontró ningún estudiante con ese DNI.');
        } else {
            setStudent(data);
        }
        setSearching(false);
    };

    const handleEnroll = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student || !selectedInst) return;

        setSubmitting(true);
        setMessage(null);

        try {
            await enrollStudent({
                perfil_id: student.id,
                instrumento_plan_id: selectedInst,
                anio_lectivo: new Date().getFullYear()
            });
            setMessage({ text: '¡Matriculación exitosa!', type: 'success' });

            // Notificar al padre para refrescar listados
            if (onEnrollSuccess) onEnrollSuccess();

            // Limpiar después de éxito para permitir otra carga si se desea
            setTimeout(() => {
                setStudent(null);
                setDniSearch('');
                setSelectedInst('');
                setMessage(null);
            }, 3000);
        } catch (err: any) {
            setMessage({ text: err.message || 'Error al procesar la matrícula.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-2xl w-full mx-auto animate-in fade-in zoom-in duration-500">
            <div className="flex justify-between items-center mb-10 pb-8 border-b border-slate-50">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Nueva Matriculación</h2>
                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">Inscripción a Instrumento y Plan de Estudios</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Paso 1: Búsqueda por DNI */}
            <form onSubmit={handleSearch} className="mb-10">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-3">Buscar por DNI del Alumno</label>
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Ingrese DNI..."
                        disabled={searching || !!student}
                        className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-bold text-slate-900 outline-none uppercase disabled:opacity-50"
                        value={dniSearch}
                        onChange={(e) => setDniSearch(e.target.value)}
                    />
                    {!student ? (
                        <button
                            type="submit"
                            disabled={searching || !dniSearch}
                            className="bg-slate-900 text-white px-8 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50"
                        >
                            {searching ? '...' : 'Buscar'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => { setStudent(null); setDniSearch(''); setMessage(null); }}
                            className="bg-slate-100 text-slate-500 px-8 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
                {searchError && <p className="text-red-500 text-xs font-bold mt-3 ml-1 uppercase">{searchError}</p>}
            </form>

            {/* Paso 2: Datos del Alumno y Selección de Instrumento */}
            {student && (
                <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 mb-8">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Alumno Encontrado</p>
                        <h3 className="text-lg font-bold text-slate-900 uppercase">
                            {student.apellido}, {student.nombre}
                        </h3>
                    </div>

                    <form onSubmit={handleEnroll} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Seleccionar Instrumento y Plan de Estudios</label>
                            <div className="relative">
                                <select
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-bold text-slate-900 outline-none appearance-none cursor-pointer uppercase"
                                    value={selectedInst}
                                    onChange={(e) => setSelectedInst(e.target.value)}
                                >
                                    <option value="">-- SELECCIONE UN INSTRUMENTO --</option>
                                    {instrumentos.map(inst => (
                                        <option key={inst.id} value={inst.id}>
                                            {inst.nombre_completo}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 transition-transform group-focus-within:rotate-180">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={submitting || !selectedInst}
                                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs disabled:opacity-50"
                            >
                                {submitting ? 'MATRICULANDO...' : 'Confirmar Inscripción'}
                            </button>
                        </div>

                        {message && (
                            <div className={`p-5 rounded-2xl border animate-in slide-in-from-bottom-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                                }`}>
                                <p className="text-center font-bold text-xs uppercase tracking-widest">{message.text}</p>
                            </div>
                        )}
                    </form>
                </div>
            )}
        </div>
    );
}
