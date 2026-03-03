"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/features/auth/authService';

interface StudentEditFormProps {
    student: UserProfile;
    onClose: () => void;
    isStudentView?: boolean;
}

export default function StudentEditForm({ student, onClose, isStudentView = false }: StudentEditFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ ...student });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from('perfiles')
            .update({
                nombre: formData.nombre,
                apellido: formData.apellido,
                email: formData.email,
                telefono: formData.telefono,
                telefono_urgencias: formData.telefono_urgencias,
                direccion: formData.direccion,
                ciudad: formData.ciudad,
                nacionalidad: formData.nacionalidad,
                fecha_nacimiento: formData.fecha_nacimiento,
                genero: formData.genero,
                observaciones_medicas: formData.observaciones_medicas,
                status: formData.status
            })
            .eq('id', student.id);

        if (!error) {
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-4xl w-full mx-auto animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 pb-8 border-b border-slate-50 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {isStudentView ? 'Mis Datos Personales' : 'Ficha del Estudiante'}
                    </h2>
                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">Información Completa de Perfil</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="bg-indigo-50 text-indigo-600 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-indigo-100 shadow-sm tabular-nums">
                        DNI: {student.dni}
                    </span>
                    {!isStudentView && (
                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter">
                            Rol: {student.rol}
                        </span>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Fila 1: Nombre y Apellido */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Apellido</label>
                        <input
                            type="text"
                            required
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-bold text-slate-900 outline-none uppercase"
                            value={formData.apellido}
                            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombres</label>
                        <input
                            type="text"
                            required
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-bold text-slate-900 outline-none uppercase"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha de Nacimiento</label>
                        <input
                            type="date"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-medium text-slate-900 outline-none"
                            value={formData.fecha_nacimiento || ''}
                            onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                        />
                    </div>

                    {/* Fila 2: Contacto */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                        <input
                            type="email"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-medium text-slate-900 outline-none"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono Personal</label>
                        <input
                            type="text"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-medium text-slate-900 outline-none"
                            value={formData.telefono || ''}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono Urgencias</label>
                        <input
                            type="text"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-medium text-slate-900 outline-none"
                            value={formData.telefono_urgencias || ''}
                            onChange={(e) => setFormData({ ...formData, telefono_urgencias: e.target.value })}
                        />
                    </div>

                    {/* Fila 3: Ubicación y Nacionalidad */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dirección</label>
                        <input
                            type="text"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-medium text-slate-900 outline-none"
                            value={formData.direccion || ''}
                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ciudad / Localidad</label>
                        <input
                            type="text"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-medium text-slate-900 outline-none"
                            value={formData.ciudad || ''}
                            onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nacionalidad</label>
                        <input
                            type="text"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-medium text-slate-900 outline-none"
                            value={formData.nacionalidad || ''}
                            onChange={(e) => setFormData({ ...formData, nacionalidad: e.target.value })}
                        />
                    </div>

                    {/* Fila 4: Otros */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Género</label>
                        <input
                            type="text"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-medium text-slate-900 outline-none"
                            value={formData.genero || ''}
                            onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                        />
                    </div>
                    {!isStudentView && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Estado Académico</label>
                            <div className="relative">
                                <select
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-bold text-slate-900 outline-none appearance-none cursor-pointer"
                                    value={formData.status || 'activo'}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                >
                                    <option value="activo">ACTIVO</option>
                                    <option value="egresado">EGRESADO</option>
                                    <option value="baja">BAJA</option>
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Observaciones Médicas / Generales</label>
                    <textarea
                        rows={3}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-medium text-slate-900 outline-none resize-none"
                        value={formData.observaciones_medicas || ''}
                        onChange={(e) => setFormData({ ...formData, observaciones_medicas: e.target.value })}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-10 border-t border-slate-50">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs disabled:opacity-50"
                    >
                        {loading ? 'GUARDANDO...' : 'Actualizar Información de Ficha'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-4 text-xs font-bold text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-2xl transition-all border border-slate-100 uppercase tracking-widest"
                    >
                        {isStudentView ? 'Cerrar Panel' : 'Volver'}
                    </button>
                </div>
            </form>
        </div>
    );
}
