"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/features/auth/authService';
import StudentEditForm from './StudentEditForm';

export default function StudentList() {
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);

    useEffect(() => {
        fetchStudents();

        // Suscripción en tiempo real para actualizaciones inmediatas
        const channel = supabase
            .channel('perfiles_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'perfiles' }, () => {
                fetchStudents();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchStudents = async () => {
        const { data, error } = await supabase
            .from('perfiles')
            .select('*')
            .eq('rol', 'estudiante')
            .order('apellido', { ascending: true })
            .order('nombre', { ascending: true })
            .order('dni', { ascending: true });

        if (!error && data) {
            setStudents(data);
        }
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
                    fetchStudents();
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
                            students.map((student) => (
                                <tr key={student.id} className="hover:bg-indigo-50/30 transition-all group">
                                    <td className="px-6 py-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-900 font-bold text-sm group-hover:text-indigo-600 transition-colors uppercase">
                                                {student.apellido},
                                            </span>
                                            <span className="text-slate-500 font-medium text-sm group-hover:text-indigo-400 uppercase">
                                                {student.nombre}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-2 text-center">
                                        <span className="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded-xl text-[10px] font-bold border border-slate-200 tabular-nums">
                                            {student.dni}
                                        </span>
                                    </td>
                                    <td className="px-6 py-2 text-right">
                                        <button
                                            onClick={() => setEditingStudent(student)}
                                            className="inline-flex items-center gap-2 bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-1.5 rounded-xl font-bold text-[10px] transition-all border border-slate-200 hover:border-indigo-200 shadow-sm active:scale-95 group/btn"
                                        >
                                            Ver Ficha
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-0 group-hover/btn:opacity-100 -ml-2 group-hover/btn:ml-0 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
