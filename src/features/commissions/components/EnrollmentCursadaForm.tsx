import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { enrollmentCursadaService } from '../enrollmentCursadaService';
import { commissionsService, Commission } from '../commissionsService';

interface EnrollmentCursadaFormProps {
    onClose: () => void;
    onSuccess?: () => void;
}

export default function EnrollmentCursadaForm({ onClose, onSuccess }: EnrollmentCursadaFormProps) {
    const [dni, setDni] = useState('');
    const [student, setStudent] = useState<any>(null);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [selectedCommission, setSelectedCommission] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadCommissions();
    }, []);

    const loadCommissions = async () => {
        try {
            const data = await commissionsService.getAll();
            setCommissions(data);
        } catch (err) {
            console.error(err);
        }
    };

    const searchStudent = async () => {
        if (!dni) return;
        setLoading(true);
        setError(null);
        setStudent(null);
        try {
            const { data, error } = await supabase
                .from('perfiles')
                .select('*')
                .eq('dni', dni)
                .single();

            if (error) throw new Error('Alumno no encontrado.');
            setStudent(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student || !selectedCommission) return;

        setLoading(true);
        setError(null);
        try {
            await enrollmentCursadaService.enrollStudent(student.id, selectedCommission);
            setSuccess(`¡Incripción exitosa para ${student.nombre}!`);
            if (onSuccess) onSuccess();
            // Limpiar para nueva inscripción
            setStudent(null);
            setDni('');
            setSelectedCommission('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inscripción a Materias</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asignación de comisiones</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 text-slate-400 hover:text-slate-900 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8">
                {/* BUSCADOR */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar Alumno por DNI</label>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={dni}
                            onChange={e => setDni(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && searchStudent()}
                            placeholder="Ej: 12345678"
                            className="flex-1 px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600 transition-all placeholder:text-slate-300"
                        />
                        <button
                            onClick={searchStudent}
                            disabled={loading}
                            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
                        >
                            {loading ? '...' : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm font-bold">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="p-6 bg-green-50 text-green-600 rounded-[2rem] border border-green-100 flex flex-col items-center text-center gap-2 animate-in zoom-in">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="font-bold">{success}</p>
                        <button onClick={() => setSuccess(null)} className="text-[10px] font-black uppercase tracking-widest mt-2 hover:underline">Inscribir otro</button>
                    </div>
                )}

                {student && !success && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 flex items-center gap-6">
                            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-indigo-600 font-black text-xl shadow-sm border border-indigo-50">
                                {student.nombre[0]}{student.apellido[0]}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{student.apellido}, {student.nombre}</h3>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">DNI {student.dni}</p>
                            </div>
                        </div>

                        <form onSubmit={handleEnroll} className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleccionar Comisión</label>
                                <select
                                    value={selectedCommission}
                                    onChange={e => setSelectedCommission(e.target.value)}
                                    className="w-full px-6 py-5 bg-slate-50 border-none rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600 appearance-none bg-no-repeat bg-[right_1.5rem_center] transition-all"
                                    required
                                >
                                    <option value="">Elegir comisión...</option>
                                    {commissions.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.materia_nombre} - {c.dia} {c.hora} (Prof: {c.docente_nombre})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="submit"
                                    disabled={loading || !selectedCommission}
                                    className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-bold hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 uppercase tracking-widest text-xs"
                                >
                                    {loading ? 'Procesando...' : 'Confirmar Inscripción'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStudent(null)}
                                    className="px-8 py-5 bg-slate-100 text-slate-500 rounded-3xl font-bold hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
                                >
                                    Cambiar Alumno
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
