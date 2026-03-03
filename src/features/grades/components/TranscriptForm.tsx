"use client";

import { useState, useEffect } from 'react';
import {
    getStudentEnrollments,
    getTranscriptData,
    upsertNotasBulk,
    Nota,
    Materia
} from '../gradesService';

interface TranscriptRow extends Materia {
    nota_id?: string;
    nota_valor: string;
    condicion: 'promoción' | 'examen' | 'equivalencia';
    fecha: string;
    libro_folio: string;
    obs_optativa_ensamble: string;
    existing: boolean;
}

export default function TranscriptForm({ onClose }: { onClose: () => void }) {
    const [dni, setDni] = useState('');
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    const [studentData, setStudentData] = useState<any>(null);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [rows, setRows] = useState<TranscriptRow[]>([]);
    const [loadingTranscript, setLoadingTranscript] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dni) return;
        setSearching(true);
        setError('');
        setStudentData(null);
        setRows([]);
        setSelectedPlanId('');

        try {
            const data = await getStudentEnrollments(dni);
            if (!data) {
                setError('Estudiante no encontrado o sin perfil.');
            } else if (data.enrollments.length === 0) {
                setError('Estudiante sin matriculaciones registradas.');
            } else {
                setStudentData(data);
                if (data.enrollments.length === 1) {
                    setSelectedPlanId(data.enrollments[0].plan_id);
                }
            }
        } catch (err: any) {
            setError('Error al buscar estudiante: ' + err.message);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        if (selectedPlanId && studentData) {
            loadTranscript();
        }
    }, [selectedPlanId]);

    const loadTranscript = async () => {
        if (!selectedPlanId) return;
        setLoadingTranscript(true);
        setError('');
        console.log("Loading transcript for DNI:", dni, "Plan ID:", selectedPlanId);

        try {
            const enrollment = studentData.enrollments.find((e: any) => e.plan_id === selectedPlanId);
            if (!enrollment) {
                console.warn("Enrollment not found for ID:", selectedPlanId);
                setError('No se pudo encontrar la información del plan seleccionado.');
                return;
            }

            console.log("Fetching transcript for Plan Estudios:", enrollment.nombre_plan);
            const data = await getTranscriptData(dni, enrollment.nombre_plan);
            const { materias, notas } = data;

            console.log(`Found ${materias.length} materias and ${notas.length} notas for student.`);

            if (materias.length === 0) {
                setError(`No se encontraron materias configuradas para el plan "${enrollment.nombre_plan}" (${enrollment.plan_estudios}).`);
                setRows([]);
                return;
            }

            // Mapear materias a filas con sus respectivas notas si existen
            // Las notas se buscan solo por DNI (ya filtrado en el servicio) y nombre_materia
            let transcriptRows: TranscriptRow[] = materias.map(m => {
                const nota = notas.find(n => n.nombre_materia === m.nombre_materia);
                return {
                    ...m,
                    nota_id: nota?.id,
                    nota_valor: nota?.nota || '',
                    condicion: (nota?.condicion as any) || 'promoción',
                    fecha: nota?.fecha || new Date().toISOString().split('T')[0],
                    libro_folio: nota?.libro_folio || '',
                    obs_optativa_ensamble: nota?.obs_optativa_ensamble || '',
                    existing: !!nota
                };
            });

            // Lógica de Exclusión Plan 530 - 1er Año
            const planNombre = enrollment.plan_estudios || '';

            if (planNombre.startsWith('530')) {
                const expCorp = transcriptRows.find(r => r.anio === 1 && r.nombre_materia === 'Expresión Corporal');
                const danzFolk = transcriptRows.find(r => r.anio === 1 && r.nombre_materia === 'Danzas Folklóricas');

                if (expCorp?.existing && !danzFolk?.existing) {
                    transcriptRows = transcriptRows.filter(r => !(r.anio === 1 && r.nombre_materia === 'Danzas Folklóricas'));
                } else if (!expCorp?.existing && danzFolk?.existing) {
                    transcriptRows = transcriptRows.filter(r => !(r.anio === 1 && r.nombre_materia === 'Expresión Corporal'));
                }
            }

            setRows(transcriptRows);
        } catch (err: any) {
            console.error("Error in loadTranscript:", err);
            setError('Error al cargar analítico: ' + (err.message || 'Error desconocido'));
        } finally {
            setLoadingTranscript(false);
        }
    };

    const handleRowChange = (index: number, field: keyof TranscriptRow, value: string) => {
        const updatedRows = [...rows];
        updatedRows[index] = { ...updatedRows[index], [field]: value };
        setRows(updatedRows);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccessMsg('');

        try {
            // Validar notas antes de procesar
            const invalidGrade = rows.find(r => {
                if (r.nota_valor.trim() === '') return false;
                const n = Number(r.nota_valor);
                // Debe ser un número entero entre 1 y 10
                return isNaN(n) || !Number.isInteger(n) || n < 1 || n > 10;
            });

            if (invalidGrade) {
                setError(`La nota para "${invalidGrade.nombre_materia}" debe ser un número entero entre 1 y 10.`);
                setSubmitting(false);
                return;
            }

            // Solo enviar las que tienen nota
            // Omitimos el id para que el upsert se maneje por la restricción UNIQUE(dni, nombre_materia)
            const notasParaGuardar: Nota[] = rows
                .filter(r => r.nota_valor.trim() !== '')
                .map(r => ({
                    perfil_id: studentData.profile.id,
                    dni: dni,
                    nombre_materia: r.nombre_materia,
                    materia_id: r.id,
                    nota: r.nota_valor,
                    condicion: r.condicion,
                    fecha: r.fecha,
                    libro_folio: r.libro_folio,
                    obs_optativa_ensamble: r.obs_optativa_ensamble
                }));

            await upsertNotasBulk(notasParaGuardar);
            setSuccessMsg('Analítico actualizado con éxito.');
            // Recargar para ver cambios
            loadTranscript();
        } catch (err: any) {
            setError('Error al guardar analítico: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const isOptativaOEnsamble = (nombre: string) => {
        const n = nombre.toLowerCase();
        return n.includes('optativa') || n.includes('ensamble') || n.includes('taller');
    };

    return (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-7xl w-full mx-auto animate-in fade-in zoom-in duration-500 overflow-hidden">
            <div className="flex justify-between items-center mb-10 pb-8 border-b border-slate-50">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Carga de Analítico</h2>
                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">Gestión completa del historial académico</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Búsqueda */}
            <form onSubmit={handleSearch} className="mb-10 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                    <input
                        required
                        type="text"
                        placeholder="DNI DEL ESTUDIANTE..."
                        className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-900 transition-all outline-none"
                        value={dni}
                        onChange={(e) => setDni(e.target.value)}
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={searching}
                    className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 uppercase tracking-widest text-xs disabled:opacity-50"
                >
                    {searching ? 'BUSCANDO...' : 'BUSCAR ALUMNO'}
                </button>
            </form>

            {error && <p className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold uppercase border border-red-100">{error}</p>}
            {successMsg && <p className="mb-6 p-4 bg-green-50 text-green-600 rounded-2xl text-xs font-bold uppercase border border-green-100">{successMsg}</p>}

            {studentData && (
                <div className="space-y-10 animate-in slide-in-from-top-4 duration-500">
                    {/* Info Alumno */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 gap-6">
                        <div>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Perfil del Estudiante</p>
                            <h3 className="text-xl font-black text-slate-900 uppercase">
                                {studentData.profile.apellido}, {studentData.profile.nombre}
                            </h3>
                            <p className="text-sm font-bold text-indigo-600">DNI: {dni}</p>
                        </div>

                        <div className="flex flex-col gap-2 w-full md:w-auto">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Plan de Estudios</label>
                            <select
                                className="px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-slate-900 uppercase shadow-sm outline-none"
                                value={selectedPlanId}
                                onChange={(e) => setSelectedPlanId(e.target.value)}
                            >
                                <option value="">-- SELECCIONE UN PLAN --</option>
                                {studentData.enrollments.map((en: any) => (
                                    <option key={en.plan_id} value={en.plan_id}>
                                        {en.nombre_plan} ({en.plan_estudios})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Analítico */}
                    {loadingTranscript ? (
                        <div className="flex justify-center p-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        rows.length > 0 && (
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="overflow-x-auto rounded-[2.5rem] border border-slate-100 shadow-sm bg-white">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-12 text-center">Año</th>
                                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[200px]">Materia</th>
                                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24 text-center">Nota</th>
                                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-48">Condición</th>
                                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-40">Fecha</th>
                                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-32">Libro/Folio</th>
                                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Observaciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {rows.map((row, idx) => (
                                                <tr key={idx} className={`hover:bg-slate-50 transition-colors ${row.existing ? 'bg-green-50/20' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600">
                                                            {row.anio}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-bold text-slate-900 uppercase leading-tight">{row.nombre_materia}</p>
                                                        {row.existing && <span className="text-[9px] font-bold text-green-600 uppercase tracking-tighter bg-green-50 px-1.5 py-0.5 rounded border border-green-100 inline-block mt-1">Cargada</span>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="10"
                                                            step="1"
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-sm font-black text-slate-900 text-center focus:ring-2 focus:ring-indigo-100 outline-none uppercase"
                                                            value={row.nota_valor}
                                                            onChange={(e) => handleRowChange(idx, 'nota_valor', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-100 outline-none uppercase"
                                                            value={row.condicion}
                                                            onChange={(e: any) => handleRowChange(idx, 'condicion', e.target.value)}
                                                        >
                                                            <option value="promoción">PROMOCIÓN</option>
                                                            <option value="examen">EXAMEN</option>
                                                            <option value="equivalencia">EQUIVALENCIA</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="date"
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-100 outline-none"
                                                            value={row.fecha}
                                                            onChange={(e) => handleRowChange(idx, 'fecha', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="text"
                                                            placeholder="..."
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-100 outline-none uppercase"
                                                            value={row.libro_folio}
                                                            onChange={(e) => handleRowChange(idx, 'libro_folio', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {(isOptativaOEnsamble(row.nombre_materia)) && (
                                                            <input
                                                                type="text"
                                                                placeholder="Faltan datos..."
                                                                className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-100 outline-none uppercase"
                                                                value={row.obs_optativa_ensamble}
                                                                onChange={(e) => handleRowChange(idx, 'obs_optativa_ensamble', e.target.value)}
                                                            />
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="pt-8 sticky bottom-0 bg-white/80 backdrop-blur-md py-6 border-t border-slate-100 flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-5 bg-slate-900 text-white rounded-[2rem] font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 uppercase tracking-widest text-xs disabled:opacity-50"
                                    >
                                        {submitting ? 'GUARDANDO CAMBIOS...' : 'ACTUALIZAR ANALÍTICO COMPLETO'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-10 py-5 bg-white text-slate-400 border border-slate-200 rounded-[2rem] font-bold hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
                                    >
                                        CANCELAR
                                    </button>
                                </div>
                            </form>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
