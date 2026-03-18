"use client";

import { useState, useEffect } from 'react';
import { UserProfile } from '@/features/auth/authService';
import { getEnrolledStudentsList, getStudentEnrollments, getTranscriptData, Nota } from '@/features/grades/gradesService';
import { analyzeCorrelativas, ReporteCorrelativas } from '@/features/students/utils/correlativas';

interface CursadosViewerProps {
    profile: UserProfile;
    onClose: () => void;
}

export default function CursadosViewer({ profile, onClose }: CursadosViewerProps) {
    const isAdmin = profile.rol === 'admin' || profile.rol === 'preceptor';

    const [students, setStudents] = useState<any[]>([]);
    const [selectedDni, setSelectedDni] = useState<string>(isAdmin ? '' : profile.dni);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string>('');
    const [reporte, setReporte] = useState<ReporteCorrelativas | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cargar lista de alumnos si es admin
    useEffect(() => {
        if (isAdmin) {
            getEnrolledStudentsList()
                .then(setStudents)
                .catch(err => {
                    console.error("Error al cargar alumnos:", err);
                    setError("No se pudo cargar la lista de alumnos matriculados.");
                });
        }
    }, [isAdmin]);

    // Cuando cambia el DNI seleccionado, cargar sus planes
    useEffect(() => {
        if (!selectedDni) {
            setEnrollments([]);
            setSelectedPlan('');
            setReporte(null);
            return;
        }

        setLoading(true);
        setError(null);
        getStudentEnrollments(selectedDni)
            .then(data => {
                if (data && data.enrollments.length > 0) {
                    setEnrollments(data.enrollments);
                    // Autoseleccionar si hay uno solo
                    if (data.enrollments.length === 1) {
                        setSelectedPlan(data.enrollments[0].plan_estudios);
                    } else {
                        setSelectedPlan('');
                    }
                } else {
                    setEnrollments([]);
                    setSelectedPlan('');
                    setReporte(null);
                    setError('Este estudiante no tiene matriculaciones activas.');
                }
            })
            .catch(err => {
                console.error("Error al cargar matriculaciones:", err);
                setError('Error al obtener datos del estudiante.');
            })
            .finally(() => setLoading(false));

    }, [selectedDni]);

    // Cuando cambia el plan, calcular correlativas
    useEffect(() => {
        if (!selectedDni || !selectedPlan) {
            setReporte(null);
            return;
        }

        setLoading(true);
        getTranscriptData(selectedDni, selectedPlan)
            .then(({ materias, notas }) => {
                const nombresMaterias = materias.map(m => m.nombre_materia);
                const aprobadas = notas
                    .filter(n => ['promoción', 'examen', 'equivalencia'].includes(n.condicion.toLowerCase()))
                    .map(n => n.nombre_materia);

                const rep = analyzeCorrelativas(selectedPlan, nombresMaterias, aprobadas);
                setReporte(rep);
            })
            .catch(err => console.error("Error al generar reporte:", err))
            .finally(() => setLoading(false));

    }, [selectedDni, selectedPlan]);

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl border border-slate-200 transition-all hover:bg-slate-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Estado de Cursada</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Análisis de correlatividades</p>
                    </div>
                </div>
            </div>

            {isAdmin && (
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 ml-2">Seleccionar Estudiante</label>
                    <select
                        value={selectedDni}
                        onChange={(e) => setSelectedDni(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all"
                    >
                        <option value="">-- Buscar un alumno matriculado --</option>
                        {students.map(st => (
                            <option key={st.dni} value={st.dni}>
                                {st.apellido}, {st.nombre} ({st.dni})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-sm font-medium">
                    {error}
                </div>
            )}

            {!isAdmin && selectedDni && (
                <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100">
                    <h3 className="text-lg font-bold text-indigo-900">{profile.apellido}, {profile.nombre}</h3>
                    <p className="text-sm text-indigo-600 font-medium">Tu DNI: {profile.dni}</p>
                </div>
            )}

            {enrollments.length > 1 && (
                <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-200 animate-in fade-in">
                    <label className="block text-xs font-bold text-amber-800 uppercase tracking-wide mb-3">Múltiples Planes Detectados</label>
                    <select
                        value={selectedPlan}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        className="w-full p-4 bg-white border border-amber-300 rounded-2xl text-amber-900 font-medium focus:outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all shadow-sm"
                    >
                        <option value="">-- Seleccionar Plan de Estudios --</option>
                        {enrollments.map(en => (
                            <option key={en.id} value={en.plan_estudios}>
                                {en.nombre_plan || en.plan_estudios}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {loading && (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            )}

            {reporte && !loading && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* DISPONIBLES */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-emerald-100 overflow-hidden flex flex-col">
                            <div className="bg-emerald-50/50 p-6 border-b border-emerald-100 flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner">✓</div>
                                <div>
                                    <h3 className="text-lg font-bold text-emerald-900">Habilitadas</h3>
                                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Listas para cursar</p>
                                </div>
                            </div>
                            <div className="p-6 bg-slate-50/30 flex-1">
                                {reporte.disponibles.length > 0 ? (
                                    <ul className="space-y-3">
                                        {reporte.disponibles.map((m, i) => (
                                            <li key={i} className="bg-white p-4 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_4px_20px_-10px_rgba(16,185,129,0.15)] hover:-translate-y-0.5 transition-transform">
                                                <span className="font-bold text-slate-700">{m.nombre}</span>
                                                <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl whitespace-nowrap border border-emerald-100">
                                                    {m.motivo}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-emerald-600/50 text-center px-4">
                                        <p className="font-medium text-sm">No hay materias disponibles.</p>
                                        <p className="text-xs mt-1">¿Plan completado o faltan correlativas?</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* BLOQUEADAS */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-rose-100 overflow-hidden flex flex-col">
                            <div className="bg-rose-50/50 p-6 border-b border-rose-100 flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner">✗</div>
                                <div>
                                    <h3 className="text-lg font-bold text-rose-900">Bloqueadas</h3>
                                    <p className="text-xs font-bold text-rose-600 uppercase tracking-widest">Faltan correlativas</p>
                                </div>
                            </div>
                            <div className="p-6 bg-slate-50/30 flex-1">
                                {reporte.bloqueadas.length > 0 ? (
                                    <ul className="space-y-3">
                                        {reporte.bloqueadas.map((m, i) => (
                                            <li key={i} className="bg-white p-4 rounded-2xl border border-rose-100 shadow-[0_4px_20px_-10px_rgba(244,63,94,0.15)] flex flex-col gap-2">
                                                <div className="font-bold text-slate-700">{m.nombre}</div>
                                                <div className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-100">
                                                    <span className="font-bold block mb-1 uppercase tracking-widest text-[9px] text-rose-500">Requisitos Pendientes:</span> 
                                                    <span className="font-medium">{m.faltan?.join(" • ")}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-rose-600/50 text-center px-4">
                                        <p className="font-medium text-sm">¡Excelente!</p>
                                        <p className="text-xs mt-1">No tienes materias bloqueadas.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* HISTORIAL */}
                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Historial de Aprobadas</h3>
                            <span className="bg-slate-200 text-slate-600 font-bold px-3 py-1 rounded-full text-xs">{reporte.aprobadas.length}</span>
                        </div>
                        
                        {reporte.aprobadas.length > 0 ? (
                            <div className="flex flex-wrap gap-2.5">
                                {reporte.aprobadas.map((m, i) => (
                                    <span key={i} className="bg-white text-slate-600 border border-slate-200 shadow-sm px-4 py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 hover:shadow-md cursor-default">
                                        {m}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 font-medium text-center py-4 bg-white/50 rounded-2xl border border-dashed border-slate-200">
                                Aún no hay materias aprobadas registradas en este plan.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
