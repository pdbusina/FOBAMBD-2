"use client";

import { useEffect, useState } from 'react';
import { getAllEnrollments } from '../enrollmentService';

export default function EnrollmentList({ refreshTrigger }: { refreshTrigger: number }) {
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const currentYear = new Date().getFullYear();

    const fetchEnrollments = async () => {
        setLoading(true);
        const data = await getAllEnrollments(currentYear);
        setEnrollments(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchEnrollments();
    }, [refreshTrigger]);

    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 w-full h-full flex flex-col animate-in fade-in duration-500">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Matriculados {currentYear}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Listado General del Ciclo</p>
                </div>
                <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold">
                    {enrollments.length} Registros
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading && enrollments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4"></div>
                        <p className="text-xs font-bold uppercase tracking-widest">Cargando...</p>
                    </div>
                ) : enrollments.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <p className="text-sm font-medium italic">No hay matriculaciones registradas aún.</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {enrollments.map((enr) => (
                            <div
                                key={enr.id}
                                className="group flex items-center gap-3 p-2 px-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-white hover:shadow-md transition-all duration-200"
                            >
                                <div className="text-[10px] font-bold text-indigo-500 tabular-nums w-16">
                                    {enr.perfil?.dni}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[11px] font-bold text-slate-900 uppercase truncate">
                                        {enr.perfil?.apellido}, {enr.perfil?.nombre}
                                    </h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-[10px] font-medium text-slate-500 uppercase truncate max-w-[120px]">
                                        {enr.instrumento?.nombre_completo.replace(/^\d+\s*/, '')}
                                    </div>
                                    <div className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-tighter border border-indigo-100">
                                        P{enr.instrumento?.plan_estudios}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
