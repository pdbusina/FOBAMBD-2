import React, { useState, useEffect } from 'react';
import { enrollmentCursadaService, EnrollmentCursada } from '../enrollmentCursadaService';

interface EnrollmentCursadaListProps {
    perfilId?: string; // Si se provee, filtra solo para ese alumno (vista estudiante)
    rol: 'admin' | 'preceptor' | 'estudiante';
    refreshTrigger?: number;
}

export default function EnrollmentCursadaList({ perfilId, rol, refreshTrigger = 0 }: EnrollmentCursadaListProps) {
    const [enrollments, setEnrollments] = useState<EnrollmentCursada[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadEnrollments();
    }, [perfilId, refreshTrigger]);

    const loadEnrollments = async () => {
        setLoading(true);
        try {
            if (rol === 'estudiante' && perfilId) {
                const data = await enrollmentCursadaService.getByStudent(perfilId);
                setEnrollments(data);
            } else {
                const data = await enrollmentCursadaService.getAll();
                setEnrollments(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUnenroll = async (id: string, materia: string) => {
        if (!confirm(`¿Seguro que desea dar de baja la inscripción a ${materia}?`)) return;
        try {
            await enrollmentCursadaService.unenroll(id);
            setEnrollments(enrollments.filter(e => e.id !== id));
        } catch (err) {
            console.error(err);
            alert('Error al dar de baja.');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4 bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-slate-100">
            <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Cargando cursadas...</p>
        </div>
    );

    return (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in duration-500">
            <div className="bg-slate-900 px-8 py-5 flex justify-between items-center text-white">
                <div>
                    <h3 className="text-lg font-bold">Inscripciones Actuales</h3>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Ciclo Lectivo {new Date().getFullYear()}</p>
                </div>
                <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-black uppercase tracking-widest">
                    {enrollments.length} Registros
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50">
                        <tr>
                            {rol !== 'estudiante' && <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Alumno</th>}
                            <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Materia</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Horario y Aula</th>
                            <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                            {rol !== 'estudiante' && <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acción</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {enrollments.length === 0 && (
                            <tr>
                                <td colSpan={rol === 'estudiante' ? 3 : 5} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                    No se encontraron inscripciones registradas.
                                </td>
                            </tr>
                        )}
                        {enrollments.map(e => (
                            <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group">
                                {rol !== 'estudiante' && (
                                    <td className="px-8 py-5">
                                        <p className="font-bold text-slate-900">{e.perfiles?.apellido}, {e.perfiles?.nombre}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">DNI {e.perfiles?.dni}</p>
                                    </td>
                                )}
                                <td className="px-8 py-5">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-indigo-600 group-hover:underline underline-offset-4 decoration-indigo-200 cursor-default">
                                                {e.comisiones?.materia_nombre}
                                            </p>
                                            {e.obs_optativa_ensamble && (
                                                <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter border border-amber-200">
                                                    {e.obs_optativa_ensamble}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic mt-0.5">Prof: {e.comisiones?.docente_nombre}</p>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-sm font-bold">{e.comisiones?.dia} {e.comisiones?.hora}</span>
                                        </div>
                                        {e.comisiones?.aula && (
                                            <div className="flex items-center gap-2 text-indigo-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                                <span className="text-[10px] font-black uppercase tracking-widest">Aula {e.comisiones.aula}</span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border ${
                                        e.estado === 'inscripto' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                        e.estado === 'regular' ? 'bg-green-50 text-green-600 border-green-100' :
                                        'bg-slate-50 text-slate-500 border-slate-100'
                                    }`}>
                                        {e.estado}
                                    </span>
                                </td>
                                {rol !== 'estudiante' && (
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => handleUnenroll(e.id, e.comisiones?.materia_nombre || '')}
                                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Dar de baja"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                                            </svg>
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
