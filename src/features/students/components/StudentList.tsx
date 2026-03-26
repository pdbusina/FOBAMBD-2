"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/features/auth/authService';
import StudentEditForm from './StudentEditForm';
import { getEnrolledProfileIds } from '../enrollmentService';

interface StudentListProps {
    onEnroll?: (dni: string) => void;
}

export default function StudentList({ onEnroll }: StudentListProps) {
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);

    useEffect(() => {
        fetchStudentsAndStatus();

        let timeoutId: ReturnType<typeof setTimeout>;
        const debouncedFetch = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                fetchStudentsAndStatus();
            }, 500); // Wait 500ms after the last event before doing the fetch
        };

        // Suscripción en tiempo real para actualizaciones inmediatas
        const channel = supabase
            .channel('perfiles_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'perfiles' }, debouncedFetch)
            .subscribe();

        const enrollChannel = supabase
            .channel('enroll_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matriculaciones' }, debouncedFetch)
            .subscribe();

        return () => {
            clearTimeout(timeoutId);
            supabase.removeChannel(channel);
            supabase.removeChannel(enrollChannel);
        };
    }, []);

    const fetchStudentsAndStatus = async () => {
        const currentYear = new Date().getFullYear();
        const [profilesRes, enrolledRes] = await Promise.all([
            supabase
                .from('perfiles')
                .select(`
                    *,
                    matriculaciones (
                        anio_lectivo,
                        instrumentos_planes (
                            nombre_completo,
                            plan_estudios
                        )
                    )
                `)
                .eq('rol', 'estudiante')
                .order('apellido', { ascending: true })
                .order('nombre', { ascending: true })
                .order('dni', { ascending: true }),
            getEnrolledProfileIds(currentYear)
        ]);

        if (!profilesRes.error && profilesRes.data) {
            setStudents(profilesRes.data);
        }
        setEnrolledIds(enrolledRes);
        setLoading(false);
    };

    if (loading) return (
        <div className="flex justify-center p-12">
            <div className="animate-pulse text-blue-500 font-medium">Cargando base de datos...</div>
        </div>
    );

    if (editingStudent) {
        return (
            <StudentEditForm
                student={editingStudent}
                onClose={() => {
                    setEditingStudent(null);
                    fetchStudentsAndStatus();
                }}
            />
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-700">
            <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Listado de Alumnos</h2>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Total registrados en el sistema</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold border border-indigo-100 uppercase tracking-widest">
                        {students.length} Estudiantes
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold border border-emerald-100 uppercase tracking-widest">
                        {enrolledIds.size} Inscriptos {new Date().getFullYear()}
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto text-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-bold tracking-[0.15em]">
                        <tr>
                            <th className="px-6 py-3 font-bold">Apellido y Nombres</th>
                            <th className="px-6 py-3 font-bold text-center">DNI / Identificación</th>
                            <th className="px-6 py-3 text-right font-bold">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-10 py-24 text-center text-slate-300 italic text-lg font-medium">
                                    No hay estudiantes registrados aún.
                                </td>
                            </tr>
                        ) : (
                            students.map((student) => {
                                const isEnrolled = enrolledIds.has(student.id);
                                return (
                                    <tr key={student.id} className="hover:bg-indigo-50/30 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-900 font-bold text-sm group-hover:text-indigo-600 transition-colors uppercase">
                                                        {student.apellido},
                                                    </span>
                                                    <span className="text-slate-500 font-medium text-sm group-hover:text-indigo-400 uppercase">
                                                        {student.nombre}
                                                    </span>
                                                    {isEnrolled && (
                                                        <span className="ml-2 text-[8px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-emerald-200">
                                                            Inscripto {new Date().getFullYear()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {(student as any).matriculaciones?.map((m: any, idx: number) => (
                                                        <span key={idx} className="text-[9px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-lg border border-slate-100 font-bold uppercase tracking-tight">
                                                            {m.instrumentos_planes?.nombre_completo}
                                                            <span className="ml-1 opacity-50">({m.anio_lectivo})</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-2 text-center">
                                            <span className="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded-xl text-[10px] font-bold border border-slate-200 tabular-nums">
                                                {student.dni}
                                            </span>
                                        </td>
                                        <td className="px-6 py-2 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {!isEnrolled && onEnroll && (
                                                    <button
                                                        onClick={() => onEnroll(student.dni)}
                                                        className="inline-flex items-center gap-2 bg-indigo-600 text-white hover:bg-slate-900 px-4 py-1.5 rounded-xl font-bold text-[10px] transition-all shadow-md shadow-indigo-100 active:scale-95 uppercase tracking-widest"
                                                    >
                                                        Matricular
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setEditingStudent(student)}
                                                    className="inline-flex items-center gap-2 bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-1.5 rounded-xl font-bold text-[10px] transition-all border border-slate-200 hover:border-indigo-200 shadow-sm active:scale-95 group/btn"
                                                >
                                                    Ficha
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-0 group-hover/btn:opacity-100 -ml-2 group-hover/btn:ml-0 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
