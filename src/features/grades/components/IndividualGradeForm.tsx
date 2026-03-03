"use client";

import { useState, useEffect } from 'react';
import { getStudentEnrollments, getMateriasByPlan, getNotaExistente, upsertNota, Materia, Nota } from '../gradesService';

export default function GradeEntryForm({ onClose }: { onClose: () => void }) {
    const [dniSearch, setDniSearch] = useState('');
    const [searching, setSearching] = useState(false);
    const [studentData, setStudentData] = useState<any>(null);
    const [error, setError] = useState('');

    const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
    const [materias, setMaterias] = useState<Materia[]>([]);
    const [selectedMateria, setSelectedMateria] = useState<string>('');

    const [existingNota, setExistingNota] = useState<Nota | null>(null);
    const [loadingMateria, setLoadingMateria] = useState(false);

    // Form fields
    const [notaValue, setNotaValue] = useState('');
    const [condicion, setCondicion] = useState<'promoción' | 'examen' | 'equivalencia'>('promoción');
    const [obsOptativa, setObsOptativa] = useState('');
    const [libroFolio, setLibroFolio] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dniSearch) return;

        setSearching(true);
        setError('');
        setStudentData(null);
        setSelectedEnrollment(null);
        setMaterias([]);
        setSelectedMateria('');
        setExistingNota(null);

        try {
            const data = await getStudentEnrollments(dniSearch);
            if (!data) {
                setError('Estudiante no encontrado.');
            } else if (data.enrollments.length === 0) {
                setError('El estudiante existe pero no tiene matriculaciones (históricas o actuales).');
            } else {
                setStudentData(data);
                if (data.enrollments.length === 1) {
                    handleSelectEnrollment(data.enrollments[0]);
                }
            }
        } catch (err: any) {
            setError('Error al buscar datos del alumno.');
        } finally {
            setSearching(false);
        }
    };

    const handleSelectEnrollment = async (enrollment: any) => {
        setSelectedEnrollment(enrollment);
        setLoadingMateria(true);
        try {
            // El plan_estudios en materias_fobam.csv es "530 Arpa"
            // El nombre_plan en el servicio es instrumentos_planes.nombre_completo que es "530 Arpa"
            const data = await getMateriasByPlan(enrollment.nombre_plan);
            setMaterias(data);
        } catch (err: any) {
            setError('Error al cargar materias del plan.');
        } finally {
            setLoadingMateria(false);
        }
    };

    const handleMateriaChange = async (materiaId: string) => {
        setSelectedMateria(materiaId);
        if (!materiaId) return;

        const materia = materias.find(m => m.id === materiaId);
        if (!materia) return;

        setLoadingMateria(true);
        try {
            const nota = await getNotaExistente(dniSearch, materia.nombre_materia);
            if (nota) {
                setExistingNota(nota);
                setNotaValue(nota.nota);
                setCondicion(nota.condicion);
                setObsOptativa(nota.obs_optativa_ensamble || '');
                setLibroFolio(nota.libro_folio || '');
                setFecha(nota.fecha || new Date().toISOString().split('T')[0]);
                setSuccessMsg('Nota previa encontrada. Puedes editarla.');
                setTimeout(() => setSuccessMsg(''), 3000);
            } else {
                setExistingNota(null);
                setNotaValue('');
                setCondicion('promoción');
                setObsOptativa('');
                setLibroFolio('');
                setFecha(new Date().toISOString().split('T')[0]);
            }
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoadingMateria(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentData || !selectedMateria || !notaValue) return;

        const materia = materias.find(m => m.id === selectedMateria);
        if (!materia) return;

        setSubmitting(true);
        setSuccessMsg('');

        try {
            // Validar nota (entero entre 1 y 10)
            const n = Number(notaValue);
            if (isNaN(n) || !Number.isInteger(n) || n < 1 || n > 10) {
                setError('La nota debe ser un número entero entre 1 y 10.');
                setSubmitting(false);
                return;
            }

            const nota: Nota = {
                id: existingNota?.id,
                perfil_id: studentData.profile.id,
                dni: dniSearch,
                nombre_materia: materia.nombre_materia,
                materia_id: materia.id,
                nota: notaValue,
                condicion: condicion,
                obs_optativa_ensamble: obsOptativa,
                libro_folio: libroFolio,
                fecha: fecha
            };

            await upsertNota(nota);
            setSuccessMsg('¡Nota registrada con éxito!');

            // Auto-reset después de un tiempo si se desea o dejar para seguir editando
            if (!existingNota) {
                setTimeout(() => {
                    setSelectedMateria('');
                    setNotaValue('');
                    setCondicion('promoción');
                    setObsOptativa('');
                    setLibroFolio('');
                    setSuccessMsg('');
                }, 3000);
            }
        } catch (err: any) {
            setError('Error al guardar la nota: ' + (err.message || 'Error desconocido'));
        } finally {
            setSubmitting(false);
        }
    };

    const isOptativaOEnsamble = (materiaNombre: string) => {
        const n = materiaNombre.toLowerCase();
        return n.includes('optativa') || n.includes('ensamble') || n.includes('taller');
    };

    return (
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-4xl w-full mx-auto animate-in fade-in zoom-in duration-500">
            <div className="flex justify-between items-center mb-10 pb-8 border-b border-slate-50">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Carga Individual de Notas</h2>
                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">Historial Académico del Alumno</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Paso 1: Búsqueda */}
            <form onSubmit={handleSearch} className="mb-10">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-3">DNI del Alumno</label>
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Ingrese DNI..."
                        disabled={searching || !!studentData}
                        className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-bold text-slate-900 uppercase disabled:opacity-50"
                        value={dniSearch}
                        onChange={(e) => setDniSearch(e.target.value)}
                    />
                    {!studentData ? (
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
                            onClick={() => { setStudentData(null); setDniSearch(''); setError(''); }}
                            className="bg-slate-100 text-slate-500 px-8 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                            Cambiar
                        </button>
                    )}
                </div>
                {error && <p className="text-red-500 text-xs font-bold mt-3 ml-1 uppercase">{error}</p>}
                {successMsg && <p className="text-green-600 text-xs font-bold mt-3 ml-1 uppercase">{successMsg}</p>}
            </form>

            {studentData && (
                <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Estudiante</p>
                            <h3 className="text-lg font-bold text-slate-900 uppercase">
                                {studentData.profile.apellido}, {studentData.profile.nombre}
                            </h3>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">DNI</p>
                            <p className="font-bold text-slate-700">{dniSearch}</p>
                        </div>
                    </div>

                    {/* Selección de Plan si hay varios */}
                    {studentData.enrollments.length > 1 && !selectedEnrollment && (
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Elegir Plan/Instrumento para cargar nota</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {studentData.enrollments.map((en: any) => (
                                    <button
                                        key={en.id}
                                        onClick={() => handleSelectEnrollment(en)}
                                        className="p-5 text-left border border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                                    >
                                        <p className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-indigo-400">Ciclo {en.anio_lectivo}</p>
                                        <p className="font-bold text-slate-700 group-hover:text-indigo-700">{en.nombre_plan}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedEnrollment && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Materia ({selectedEnrollment.nombre_plan})</label>
                                    <select
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-900 uppercase appearance-none cursor-pointer"
                                        value={selectedMateria}
                                        onChange={(e) => handleMateriaChange(e.target.value)}
                                        disabled={loadingMateria}
                                    >
                                        <option value="">-- SELECCIONE MATERIA --</option>
                                        {materias.map(m => (
                                            <option key={m.id} value={m.id}>
                                                Año {m.anio}: {m.nombre_materia}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Condición</label>
                                    <select
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-900 uppercase appearance-none cursor-pointer"
                                        value={condicion}
                                        onChange={(e: any) => setCondicion(e.target.value)}
                                    >
                                        <option value="promoción">PROMOCIÓN</option>
                                        <option value="examen">EXAMEN</option>
                                        <option value="equivalencia">EQUIVALENCIA</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha de la Nota</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-900 uppercase appearance-none cursor-pointer"
                                        value={fecha}
                                        onChange={(e) => setFecha(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nota</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        max="10"
                                        step="1"
                                        placeholder="1-10"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 font-black text-slate-900 focus:border-indigo-500 outline-none transition-all placeholder:font-bold"
                                        value={notaValue}
                                        onChange={(e) => setNotaValue(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Libro / Folio</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: L1 F23"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-900 uppercase"
                                        value={libroFolio}
                                        onChange={(e) => setLibroFolio(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Detalle (Optativa/Ensamble)</label>
                                    <input
                                        type="text"
                                        placeholder="Nombre del espacio..."
                                        required={selectedMateria ? isOptativaOEnsamble(materias.find(m => m.id === selectedMateria)?.nombre_materia || '') : false}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-900 uppercase"
                                        value={obsOptativa}
                                        onChange={(e) => setObsOptativa(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={submitting || !selectedMateria || !notaValue}
                                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs disabled:opacity-50"
                                >
                                    {submitting ? 'GUARDANDO...' : existingNota ? 'ACTUALIZAR NOTA' : 'REGISTRAR NOTA'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
