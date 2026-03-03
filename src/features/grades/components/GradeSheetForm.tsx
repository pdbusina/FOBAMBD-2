"use client";

import { useState, useEffect } from 'react';
import {
    getUniqueMateriaNames,
    getEnrolledStudentsList,
    upsertNotasBulk,
    getNotasExistentesBulk,
    Nota
} from '../gradesService';

interface GradeRow {
    dni: string;
    nombre: string;
    apellido: string;
    perfil_id: string;
    nota: string;
    exists?: boolean;
}

export default function GradeSheetForm({ onClose }: { onClose: () => void }) {
    const [materiaNames, setMateriaNames] = useState<string[]>([]);
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Form settings
    const [selectedMateria, setSelectedMateria] = useState('');
    const [obsOptativa, setObsOptativa] = useState('');
    const [condicion, setCondicion] = useState<'promoción' | 'examen' | 'equivalencia'>('promoción');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [libroFolio, setLibroFolio] = useState('');
    const [cantidadEstudiantes, setCantidadEstudiantes] = useState<number>(0);
    const [rows, setRows] = useState<GradeRow[]>([]);

    useEffect(() => {
        async function loadData() {
            try {
                const [names, students] = await Promise.all([
                    getUniqueMateriaNames(),
                    getEnrolledStudentsList()
                ]);
                setMateriaNames(names);
                setAllStudents(students);
            } catch (err: any) {
                setError('Error al cargar datos iniciales.');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const isOptativaOEnsamble = (nombre: string) => {
        const n = nombre.toLowerCase();
        return n.includes('optativa') || n.includes('ensamble') || n.includes('taller');
    };

    const handleCantidadChange = (val: number) => {
        setCantidadEstudiantes(val);
        const newRows: GradeRow[] = [];
        for (let i = 0; i < val; i++) {
            newRows.push({
                dni: '',
                nombre: '',
                apellido: '',
                perfil_id: '',
                nota: '',
                exists: false
            });
        }
        setRows(newRows);
    };

    const checkDuplicates = async (materia: string, currentRows: GradeRow[]) => {
        if (!materia) return;
        const dnis = currentRows.map(r => r.dni).filter(Boolean);
        if (dnis.length === 0) return;

        try {
            const existing = await getNotasExistentesBulk(dnis, materia);
            const existingDnis = new Set(existing.map((n: any) => n.dni));

            setRows(prev => prev.map(row => ({
                ...row,
                exists: existingDnis.has(row.dni)
            })));
        } catch (err) {
            console.error("Error checking duplicates:", err);
        }
    };

    // Re-chequear cuando cambia la materia
    useEffect(() => {
        if (selectedMateria && rows.length > 0) {
            checkDuplicates(selectedMateria, rows);
        }
    }, [selectedMateria]);

    const handleRowChange = (index: number, field: keyof GradeRow, value: string) => {
        const updatedRows = [...rows];

        if (field === 'dni') {
            const student = allStudents.find(s => s.dni === value);
            updatedRows[index] = {
                ...updatedRows[index],
                dni: value,
                nombre: student?.nombre || '',
                apellido: student?.apellido || '',
                perfil_id: student?.id || '',
                exists: false
            };
            // Si hay materia, chequear duplicado para esta fila
            if (selectedMateria && value) {
                checkDuplicates(selectedMateria, updatedRows);
            }
        } else {
            updatedRows[index] = {
                ...updatedRows[index],
                [field]: value
            };
        }

        setRows(updatedRows);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMateria || rows.length === 0) return;

        // Validaciones básicas
        const incomplete = rows.some(r => !r.dni || !r.nota);
        if (incomplete) {
            setError('Todos los alumnos deben tener DNI y Nota.');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccessMsg('');

        try {
            // Validar que todas las notas sean enteras del 1 al 10
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
                nombre_materia: selectedMateria,
                nota: row.nota,
                condicion: condicion,
                obs_optativa_ensamble: obsOptativa,
                libro_folio: libroFolio,
                fecha: fecha
            }));

            await upsertNotasBulk(notasParaGuardar);
            setSuccessMsg(`¡Planilla de ${rows.length} alumnos guardada con éxito!`);

            // Opcional: limpiar form
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (err: any) {
            setError('Error al guardar la planilla: ' + (err.message || 'Error desconocido'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-6xl w-full mx-auto animate-in fade-in zoom-in duration-500 overflow-hidden">
            <div className="flex justify-between items-center mb-10 pb-8 border-b border-slate-50">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Carga de Planilla de Calificaciones</h2>
                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">Ingreso masivo por materia</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* SECCIÓN 1: Materia y Datos Globales */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                    <div className="lg:col-span-2 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Materia</label>
                        <select
                            required
                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-900 uppercase appearance-none cursor-pointer shadow-sm"
                            value={selectedMateria}
                            onChange={(e) => setSelectedMateria(e.target.value)}
                        >
                            <option value="">-- SELECCIONE MATERIA --</option>
                            {materiaNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    {isOptativaOEnsamble(selectedMateria) && (
                        <div className="lg:col-span-2 space-y-2 animate-in slide-in-from-left-4 duration-300">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Detalle (Optativa/Ensamble)</label>
                            <input
                                required
                                type="text"
                                placeholder="Nombre del espacio curricular..."
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-900 uppercase shadow-sm"
                                value={obsOptativa}
                                onChange={(e) => setObsOptativa(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Condición</label>
                        <select
                            required
                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-900 uppercase appearance-none cursor-pointer shadow-sm"
                            value={condicion}
                            onChange={(e: any) => setCondicion(e.target.value)}
                        >
                            <option value="promoción">PROMOCIÓN</option>
                            <option value="examen">EXAMEN</option>
                            <option value="equivalencia">EQUIVALENCIA</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
                        <input
                            required
                            type="date"
                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-900 uppercase shadow-sm appearance-none"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Libro / Folio</label>
                        <input
                            type="text"
                            placeholder="Ej: L1 F23"
                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-900 uppercase shadow-sm"
                            value={libroFolio}
                            onChange={(e) => setLibroFolio(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cant. Estudiantes</label>
                        <input
                            required
                            type="number"
                            min="1"
                            max="50"
                            placeholder="0"
                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-900 shadow-sm"
                            value={cantidadEstudiantes || ''}
                            onChange={(e) => handleCantidadChange(parseInt(e.target.value) || 0)}
                        />
                    </div>
                </div>

                {/* SECCIÓN 2: Listado de Estudiantes */}
                {rows.length > 0 && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Listado de Carga</h3>
                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border border-indigo-100">
                                {rows.length} Estudiantes
                            </span>
                        </div>

                        <div className="overflow-x-auto rounded-[2rem] border border-slate-100 shadow-sm">
                            <table className="w-full text-left border-collapse bg-white">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-64">DNI Estudiante</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apellido y Nombre</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-40">Nota</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {rows.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3">
                                                <select
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                                    value={row.dni}
                                                    onChange={(e) => handleRowChange(idx, 'dni', e.target.value)}
                                                >
                                                    <option value="">Buscar DNI...</option>
                                                    {allStudents.map(s => (
                                                        <option key={s.dni} value={s.dni}>
                                                            {s.dni} - {s.apellido}, {s.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="px-4 py-3 bg-slate-50/50 rounded-xl text-sm font-medium text-slate-500 uppercase">
                                                    {row.apellido && row.nombre ? `${row.apellido}, ${row.nombre}` : '- Elija un DNI -'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 relative group">
                                                <input
                                                    required
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    step="1"
                                                    placeholder="Ej: 8"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-100 transition-all outline-none uppercase text-center"
                                                    value={row.nota}
                                                    onChange={(e) => handleRowChange(idx, 'nota', e.target.value)}
                                                />
                                                {row.exists && (
                                                    <div className="absolute -right-2 -top-2 bg-amber-500 text-white p-1 rounded-full shadow-lg group-hover:scale-110 transition-transform cursor-help" title="Ya existe una nota para este alumno en esta materia. Se sobrescribirá.">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
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

                        {rows.some(r => r.exists) && (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                                <div className="text-amber-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="text-xs font-bold text-amber-700 uppercase tracking-tight">
                                    Atención: Se han detectado alumnos que ya tienen nota en esta materia. Si continúas, las notas existentes serán actualizadas.
                                </p>
                            </div>
                        )}

                        {error && <p className="text-red-500 text-xs font-bold mt-4 px-2 uppercase">{error}</p>}
                        {successMsg && <p className="text-green-600 text-xs font-bold mt-4 px-2 uppercase">{successMsg}</p>}

                        <div className="pt-8">
                            <button
                                type="submit"
                                disabled={submitting || rows.length === 0}
                                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100 uppercase tracking-widest text-xs disabled:opacity-50"
                            >
                                {submitting ? 'PROCESANDO PLANILLA...' : 'GUARDAR TODAS LAS NOTAS'}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
