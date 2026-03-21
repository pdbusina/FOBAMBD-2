"use client";

import { useState, useEffect } from 'react';
import { commissionsService, Commission } from '@/features/commissions/commissionsService';
import { enrollmentCursadaService } from '@/features/commissions/enrollmentCursadaService';
import { upsertNotasBulk, getNotasExistentesBulk, Nota } from '../gradesService';

interface GradeRow {
    dni: string;
    nombre: string;
    apellido: string;
    perfil_id: string;
    nota: string;
    exists?: boolean;
}

export default function CommissionGradeForm({ onClose }: { onClose: () => void }) {
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [selectedCommissionId, setSelectedCommissionId] = useState('');
    const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Datos globales de la planilla
    const [condicion, setCondicion] = useState<'promoción' | 'examen' | 'equivalencia'>('promoción');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [libroFolio, setLibroFolio] = useState('');
    const [rows, setRows] = useState<GradeRow[]>([]);

    useEffect(() => {
        async function loadCommissions() {
            try {
                const data = await commissionsService.getAll();
                setCommissions(data);
            } catch (err) {
                setError('Error al cargar comisiones.');
            } finally {
                setLoading(false);
            }
        }
        loadCommissions();
    }, []);

    // Al seleccionar una comisión, cargar sus alumnos
    useEffect(() => {
        if (!selectedCommissionId) {
            setRows([]);
            setSelectedCommission(null);
            return;
        }

        const com = commissions.find(c => c.id === selectedCommissionId) || null;
        setSelectedCommission(com);

        async function loadStudents() {
            setLoading(true);
            setError('');
            try {
                const enrollments = await enrollmentCursadaService.getStudentsByCommission(selectedCommissionId);
                
                const newRows: GradeRow[] = enrollments.map((en: any) => ({
                    dni: en.perfiles.dni,
                    nombre: en.perfiles.nombre,
                    apellido: en.perfiles.apellido,
                    perfil_id: en.perfil_id,
                    nota: '',
                    exists: false
                }));

                setRows(newRows);
                
                // Verificar si ya tienen nota
                if (com && newRows.length > 0) {
                    const existing = await getNotasExistentesBulk(newRows.map(r => r.dni), com.materia_nombre);
                    const existingDnis = new Set(existing.map((n: any) => n.dni));
                    
                    setRows(newRows.map(row => ({
                        ...row,
                        exists: existingDnis.has(row.dni)
                    })));
                }
            } catch (err: any) {
                setError('Error al cargar alumnos de la comisión.');
            } finally {
                setLoading(false);
            }
        }
        loadStudents();
    }, [selectedCommissionId]);

    const handleNotaChange = (index: number, val: string) => {
        const updated = [...rows];
        updated[index].nota = val;
        setRows(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCommission || rows.length === 0) return;

        const incomplete = rows.some(r => !r.nota);
        if (incomplete) {
            setError('Todos los alumnos deben tener nota.');
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            const invalidGrade = rows.find(r => {
                const n = Number(r.nota);
                return isNaN(n) || !Number.isInteger(n) || n < 1 || n > 10;
            });

            if (invalidGrade) {
                setError(`La nota para el DNI ${invalidGrade.dni} debe ser un número entero entre 1 y 10.`);
                setSubmitting(false);
                return;
            }

            const notasParaGuardar: Nota[] = rows.map(row => ({
                perfil_id: row.perfil_id,
                dni: row.dni,
                nombre_materia: selectedCommission.materia_nombre,
                nota: row.nota,
                condicion: condicion,
                obs_optativa_ensamble: selectedCommission.obs_optativa_ensamble || '',
                libro_folio: libroFolio,
                fecha: fecha
            }));

            await upsertNotasBulk(notasParaGuardar);
            setSuccessMsg(`¡Notas de ${rows.length} alumnos guardadas con éxito!`);
            
            setTimeout(() => onClose(), 3000);
        } catch (err: any) {
            setError('Error al guardar notas: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && commissions.length === 0) return (
        <div className="flex justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-6xl w-full mx-auto animate-in fade-in duration-500 overflow-hidden">
            <div className="flex justify-between items-center mb-10 pb-8 border-b border-slate-50">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Carga de Notas por Comisión</h2>
                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">Poblar planilla desde alumnos inscriptos</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                    <div className="space-y-2 lg:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Seleccionar Comisión Vigente</label>
                        <select
                            required
                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-900 uppercase appearance-none cursor-pointer shadow-sm"
                            value={selectedCommissionId}
                            onChange={(e) => setSelectedCommissionId(e.target.value)}
                        >
                            <option value="">-- ELIJA UNA COMISIÓN --</option>
                            {commissions.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.materia_nombre} {c.obs_optativa_ensamble ? `(${c.obs_optativa_ensamble})` : ''} - {c.dia} {c.hora} - {c.docente_nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Condición</label>
                        <select
                            required
                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-900 uppercase shadow-sm"
                            value={condicion}
                            onChange={(e: any) => setCondicion(e.target.value)}
                        >
                            <option value="promoción">PROMOCIÓN</option>
                            <option value="examen">EXAMEN</option>
                            <option value="equivalencia">EQUIVALENCIA</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha de Calificación</label>
                        <input
                            required
                            type="date"
                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-slate-900"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Libro / Folio</label>
                        <input
                            type="text"
                            placeholder="Ej: L1 F23"
                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-slate-900"
                            value={libroFolio}
                            onChange={(e) => setLibroFolio(e.target.value)}
                        />
                    </div>
                </div>

                {rows.length > 0 && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Alumnos Inscriptos en {selectedCommission?.materia_nombre}</h3>
                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border border-indigo-100">
                                {rows.length} Alumnos
                            </span>
                        </div>

                        <div className="overflow-x-auto rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                            <table className="w-full text-left border-collapse bg-white">
                                <thead>
                                    <tr className="bg-slate-900 border-b border-slate-800">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">DNI</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Apellido y Nombre</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40 text-center">Nota</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {rows.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-8 py-4 font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">{row.dni}</td>
                                            <td className="px-8 py-4 font-bold text-slate-900 uppercase text-sm">
                                                {row.apellido}, {row.nombre}
                                            </td>
                                            <td className="px-8 py-4 relative">
                                                <input
                                                    required
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    placeholder="1-10"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-center"
                                                    value={row.nota}
                                                    onChange={(e) => handleNotaChange(idx, e.target.value)}
                                                />
                                                {row.exists && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500" title="Atención: Ya tiene una nota en esta materia. Se actualizará.">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {error && <p className="text-red-500 font-bold text-xs uppercase px-2">{error}</p>}
                        {successMsg && <p className="text-green-600 font-bold text-xs uppercase px-2">{successMsg}</p>}

                        <div className="pt-8">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-100 disabled:opacity-50"
                            >
                                {submitting ? 'GUARDANDO NOTAS...' : 'GUARDAR TODAS LAS CALIFICACIONES'}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
