"use client";

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/features/auth/authService';
import StudentList from '@/features/students/components/StudentList';
import StudentForm from '@/features/students/components/StudentForm';
import StudentEditForm from '@/features/students/components/StudentEditForm';
import EnrollmentForm from '@/features/students/components/EnrollmentForm';
import EnrollmentList from '@/features/students/components/EnrollmentList';
import IndividualGradeForm from '@/features/grades/components/IndividualGradeForm';
import GradeSheetForm from '@/features/grades/components/GradeSheetForm';
import TranscriptForm from '@/features/grades/components/TranscriptForm';
import ReportsDashboard from '@/features/reports/components/ReportsDashboard';
import CursadosViewer from '@/features/students/components/CursadosViewer';
import UserManagement from '@/features/auth/components/UserManagement';
import BulkUpload from '@/features/admin/components/BulkUpload';
import CommissionsManager from '@/features/commissions/components/CommissionsManager';
import EnrollmentCursadaForm from '@/features/commissions/components/EnrollmentCursadaForm';
import EnrollmentCursadaList from '@/features/commissions/components/EnrollmentCursadaList';
import StatsDashboard from '@/features/admin/components/StatsDashboard';
import BackupManager from '@/features/admin/components/BackupManager';

export default function DashboardPage() {
    const { user, profile: apiProfile, loading } = useAuth();
    const [forcedProfile, setForcedProfile] = useState<UserProfile | null>(null);
    const [view, setView] = useState<'summary' | 'students' | 'add_student' | 'edit_profile' | 'enrollment' | 'grades' | 'reports' | 'cursados' | 'users' | 'bulk_upload' | 'commissions' | 'enrollment_cursada' | 'stats' | 'backup'>('summary');
    const [gradeSubView, setGradeSubView] = useState<'individual' | 'planilla' | 'analitico'>('individual');
    const [enrollmentRefresh, setEnrollmentRefresh] = useState(0);
    const [selectedStudentDni, setSelectedStudentDni] = useState<string | null>(null);
    const router = useRouter();

    const profile = apiProfile || forcedProfile;

    const handleEnrollFromList = (dni: string) => {
        setSelectedStudentDni(dni);
        setView('enrollment');
    };

    useEffect(() => {
        if (!loading && !user) {
            window.location.assign('/login');
        }
    }, [user, loading]);

    const handleForceEntry = () => {
        if (user?.email === 'businatrabajo@gmail.com') {
            setForcedProfile({
                id: user.id,
                dni: 'admin_01',
                nombre: 'Administrador (Acceso Forzado)',
                apellido: 'Sistema',
                email: user.email,
                rol: 'admin',
                observaciones_medicas: null
            });
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error("Logout error:", e);
        } finally {
            // Limpieza total y redirección forzada
            setForcedProfile(null);
            window.location.assign('/login');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!user) return null;

    if (!profile) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 font-sans">
            <div className="max-w-md w-full bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-100 text-center animate-in fade-in zoom-in duration-500">
                <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red-50 text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Acceso Restringido</h2>
                <p className="text-slate-500 font-medium mb-10">
                    Tu usuario es válido, pero no tienes una ficha de perfil activa en el sistema.
                </p>

                {user.email === 'businatrabajo@gmail.com' && (
                    <div className="mb-8 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-left">
                        <p className="text-xs font-bold text-indigo-600 uppercase mb-2 tracking-widest text-center">Modo SuperAdmin</p>
                        <p className="text-sm text-slate-600 mb-5 text-center leading-relaxed">Puedes forzar la entrada para realizar reparaciones de emergencia si el perfil no carga.</p>
                        <button
                            onClick={handleForceEntry}
                            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-[10px]"
                        >
                            Forzar Entrada al Panel
                        </button>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-bold shadow-lg shadow-slate-200"
                    >
                        Reintentar Conexión
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full py-4 bg-white text-slate-500 rounded-2xl hover:bg-slate-50 transition-all font-bold border border-slate-200"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            <header className="bg-white/80 backdrop-blur-md px-8 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-100">
                        F
                    </div>
                    <h1
                        className="text-xl font-bold text-slate-900 cursor-pointer tracking-tight hover:text-indigo-600 transition-colors"
                        onClick={() => setView('summary')}
                    >
                        FOBAMBD <span className="text-indigo-600">2.0</span>
                    </h1>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-900">{profile.nombre} {profile.apellido}</p>
                        <p className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase py-0.5 px-2 bg-indigo-50 rounded-lg inline-block border border-indigo-100">
                            {profile.rol}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all rounded-xl border border-slate-200 hover:border-red-200"
                        title="Salir del sistema"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </header>

            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
                {view === 'summary' && (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        <div className="flex flex-col md:flex-row gap-6 items-center bg-indigo-600 p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden">
                            <div className="relative z-10 flex-1">
                                <h2 className="text-3xl font-bold mb-2">¡Hola de nuevo, {profile.nombre}!</h2>
                                <p className="text-indigo-100 font-medium">Sistema de Gestión Académica FOBAM - ESMN</p>
                            </div>
                            <div className="relative z-10 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80 text-center">Estado</p>
                                <p className="text-sm font-bold flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    Sistema Estable
                                </p>
                            </div>
                            {/* Círculos decorativos */}
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                            <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {(profile.rol === 'admin' || profile.rol === 'preceptor') && (
                                <div
                                    className="group bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 border border-slate-100 transition-all cursor-pointer ring-0 hover:ring-2 hover:ring-indigo-100"
                                    onClick={() => setView('enrollment')}
                                >
                                    <div className="mb-6 w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-slate-900 group-hover:text-indigo-600 transition-colors">MATRICULACIÓN</h3>
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed">Inscripción rápida por DNI a instrumentos y planes vigentes.</p>
                                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center text-xs font-bold text-indigo-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                                        Matricular <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                    </div>
                                </div>
                            )}

                            {(profile.rol === 'admin' || profile.rol === 'preceptor') && (
                                <div
                                    className="group bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 border border-slate-100 transition-all cursor-pointer ring-0 hover:ring-2 hover:ring-indigo-100"
                                    onClick={() => setView('grades')}
                                >
                                    <div className="mb-6 w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-slate-900 group-hover:text-amber-600 transition-colors">GESTIÓN DE NOTAS</h3>
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed">Carga individual, planillas y analíticos de alumnos.</p>
                                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center text-xs font-bold text-amber-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                                        Entrar <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                    </div>
                                </div>
                            )}

                            {(profile.rol === 'admin' || profile.rol === 'preceptor') && (
                                <div
                                    className="group bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 border border-slate-100 transition-all cursor-pointer ring-0 hover:ring-2 hover:ring-indigo-100"
                                    onClick={() => setView('students')}
                                >
                                    <div className="mb-6 w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-slate-900 group-hover:text-indigo-600 transition-colors">LISTADO ALUMNOS</h3>
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed">Gestión completa de fichas, datos personales y médicos.</p>
                                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center text-xs font-bold text-indigo-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                                        Entrar <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                    </div>
                                </div>
                            )}

                            <div
                                className="group bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 border border-slate-100 transition-all cursor-pointer ring-0 hover:ring-2 hover:ring-indigo-100"
                                onClick={() => setView('reports')}
                            >
                                <div className="mb-6 w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-slate-900 group-hover:text-indigo-600 transition-colors">INFORMES</h3>
                                <p className="text-slate-500 font-medium text-sm leading-relaxed">Generación de certificados de regularidad y otros documentos.</p>
                                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center text-xs font-bold text-indigo-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                                    Entrar <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                </div>
                            </div>

                            <div
                                className="group bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-emerald-100/50 border border-slate-100 transition-all cursor-pointer ring-0 hover:ring-2 hover:ring-emerald-100"
                                onClick={() => setView('cursados')}
                            >
                                <div className="mb-6 w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-slate-900 group-hover:text-emerald-600 transition-colors">ESTADO DE CURSADA</h3>
                                <p className="text-slate-500 font-medium text-sm leading-relaxed">Correlatividades y habilitaciones.</p>
                                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center text-xs font-bold text-emerald-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                                    Revisar <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                </div>
                            </div>

                            {profile.rol === 'estudiante' && (
                                <div
                                    className="group bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 border border-slate-100 transition-all cursor-pointer ring-0 hover:ring-2 hover:ring-indigo-100"
                                    onClick={() => setView('edit_profile')}
                                >
                                    <div className="mb-6 w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-slate-900 group-hover:text-indigo-600 transition-colors">MIS DATOS</h3>
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed">Manten tu perfil actualizado con tus últimos datos.</p>
                                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center text-xs font-bold text-indigo-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                                        Editar Perfil <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                    </div>
                                </div>
                            )}

                            {profile.rol === 'admin' && (
                                <div
                                    className="group bg-gradient-to-br from-indigo-900 to-indigo-800 p-8 rounded-[2rem] shadow-lg hover:shadow-2xl hover:shadow-indigo-900/40 border border-indigo-700 transition-all cursor-pointer ring-0 hover:ring-2 hover:ring-indigo-400"
                                    onClick={() => setView('bulk_upload')}
                                >
                                    <div className="mb-6 w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-indigo-900 transition-all duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-indigo-100 transition-colors">CARGA MASIVA</h3>
                                    <p className="text-indigo-300 font-medium text-sm leading-relaxed">Importación de estudiantes y notas por planilla CSV.</p>
                                    <div className="mt-8 pt-6 border-t border-indigo-700 flex items-center text-xs font-bold text-indigo-300 uppercase tracking-widest group-hover:gap-2 transition-all">
                                        Importar <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                    </div>
                                </div>
                            )}

                            {profile.rol === 'admin' && (
                                <div
                                    className="group bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2rem] shadow-lg hover:shadow-2xl hover:shadow-slate-900/40 border border-slate-700 transition-all cursor-pointer ring-0 hover:ring-2 hover:ring-slate-400"
                                    onClick={() => setView('users')}
                                >
                                    <div className="mb-6 w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-all duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-slate-100 transition-colors">GESTIÓN DE USUARIOS</h3>
                                    <p className="text-slate-400 font-medium text-sm leading-relaxed">Altas web, personal y permisos del sistema.</p>
                                    <div className="mt-8 pt-6 border-t border-slate-700 flex items-center text-xs font-bold text-slate-300 uppercase tracking-widest group-hover:gap-2 transition-all">
                                        Administrar <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                    </div>
                                </div>
                            )}

                            {(profile.rol === 'admin' || profile.rol === 'preceptor') && (
                                <div
                                    className="group bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 border border-slate-100 transition-all cursor-pointer ring-0 hover:ring-2 hover:ring-indigo-100"
                                    onClick={() => setView('enrollment_cursada')}
                                >
                                    <div className="mb-6 w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-slate-900 group-hover:text-emerald-600 transition-colors">INSCRIPCIÓN MATERIAS</h3>
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed">Asignar alumnos a comisiones y horarios específicos.</p>
                                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center text-xs font-bold text-emerald-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                                        Gestionar <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                    </div>
                                </div>
                            )}

                            {profile.rol === 'admin' && (
                                <div
                                    className="group bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 border border-slate-100 transition-all cursor-pointer ring-0 hover:ring-2 hover:ring-indigo-100"
                                    onClick={() => setView('commissions')}
                                >
                                    <div className="mb-6 w-14 h-14 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-slate-900 group-hover:text-slate-900 transition-colors">COMISIONES</h3>
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed">Administrar oferta horaria, aulas y cupos (Individual/Masivo).</p>
                                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-900 group-hover:gap-2 transition-all">
                                        Administrar <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                    </div>
                                </div>
                            )}

                            {profile.rol === 'admin' && (
                                <div
                                    className="group bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 border border-slate-100 transition-all cursor-pointer ring-0 hover:ring-2 hover:ring-indigo-100"
                                    onClick={() => setView('stats')}
                                >
                                    <div className="mb-6 w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-slate-900 group-hover:text-rose-600 transition-colors">ESTADÍSTICAS</h3>
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed">Informes censales, matriz de edades y métricas de gestión.</p>
                                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center text-xs font-bold text-rose-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                                        Ver Censo <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                    </div>
                                </div>
                            )}

                            {profile.rol === 'admin' && (
                                <div
                                    className="group bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-slate-100/50 border border-slate-100 transition-all cursor-pointer ring-0 hover:ring-2 hover:ring-slate-100"
                                    onClick={() => setView('backup')}
                                >
                                    <div className="mb-6 w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-slate-700 group-hover:text-white transition-all duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-slate-900 group-hover:text-slate-700 transition-colors">BACKUP</h3>
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed">Exportación de seguridad y redundancia de datos.</p>
                                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:gap-2 transition-all">
                                        Entrar <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                    </div>
                                </div>
                            )}

                            {profile.rol === 'estudiante' && (
                                <div
                                    className="group bg-emerald-600 p-8 rounded-[2rem] shadow-lg hover:shadow-emerald-200 border border-emerald-500 transition-all cursor-pointer text-white"
                                    onClick={() => setView('enrollment_cursada')}
                                >
                                    <div className="mb-6 w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-emerald-600 transition-all duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-white">MIS CURSADAS</h3>
                                    <p className="text-emerald-100 font-medium text-sm leading-relaxed">Consulta tus inscripciones actuales y horarios asignados.</p>
                                    <div className="mt-8 pt-6 border-t border-emerald-500 flex items-center text-xs font-bold text-white uppercase tracking-widest group-hover:gap-2 transition-all">
                                        Ver Mis Materias <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-100/50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col justify-center items-center text-center group">
                                <div className="w-12 h-12 bg-slate-200 rounded-2xl mb-4 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nuevos Módulos Proximamente</p>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'students' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setView('summary')}
                                    className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-2xl border border-slate-200 transition-all hover:shadow-md"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Estudiantes</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestión de registros académicos</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setView('add_student')}
                                className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] font-bold hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Registrar Nuevo
                            </button>
                        </div>
                        <StudentList onEnroll={handleEnrollFromList} />
                    </div>
                )}

                {view === 'add_student' && (
                    <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-500">
                        <div className="w-full max-w-md mb-8 flex items-center justify-start gap-4">
                            <button
                                onClick={() => setView('students')}
                                className="p-3 bg-white text-slate-400 hover:text-red-500 rounded-2xl border border-slate-200 transition-all hover:bg-red-50 hover:border-red-100"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cancelar Registro</span>
                        </div>
                        <StudentForm
                            onSuccess={() => setView('students')}
                            onCancel={() => setView('students')}
                        />
                    </div>
                )}

                {view === 'enrollment' && (
                    <div className="animate-in slide-in-from-bottom-8 duration-700 w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            <EnrollmentForm
                                initialDni={selectedStudentDni || undefined}
                                onClose={() => {
                                    setView('summary');
                                    setSelectedStudentDni(null);
                                }}
                                onEnrollSuccess={() => setEnrollmentRefresh(prev => prev + 1)}
                            />
                            <div className="h-[calc(100vh-180px)] sticky top-24">
                                <EnrollmentList refreshTrigger={enrollmentRefresh} />
                            </div>
                        </div>
                    </div>
                )}

                {view === 'grades' && (
                    <div className="animate-in slide-in-from-bottom-8 duration-700 w-full flex flex-col items-center gap-8">
                        <div className="w-full max-w-4xl flex bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                            <button
                                onClick={() => setGradeSubView('individual')}
                                className={`flex-1 py-3 font-bold text-xs uppercase tracking-widest rounded-xl transition-all ${gradeSubView === 'individual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Carga Individual
                            </button>
                            <button
                                onClick={() => setGradeSubView('planilla')}
                                className={`flex-1 py-3 font-bold text-xs uppercase tracking-widest rounded-xl transition-all ${gradeSubView === 'planilla' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Carga de Planilla
                            </button>
                            <button
                                onClick={() => setGradeSubView('analitico')}
                                className={`flex-1 py-3 font-bold text-xs uppercase tracking-widest rounded-xl transition-all ${gradeSubView === 'analitico' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Carga de Analítico
                            </button>
                        </div>

                        {gradeSubView === 'individual' ? (
                            <IndividualGradeForm onClose={() => setView('summary')} />
                        ) : gradeSubView === 'planilla' ? (
                            <GradeSheetForm onClose={() => setView('summary')} />
                        ) : (
                            <TranscriptForm onClose={() => setView('summary')} />
                        )}
                    </div>
                )}

                {view === 'edit_profile' && (
                    <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
                        <div className="w-full max-w-2xl mb-8 flex justify-start items-center gap-4">
                            <button
                                onClick={() => setView('summary')}
                                className="p-4 bg-white text-slate-900 rounded-2xl border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-bold flex items-center gap-2 shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Volver al Inicio
                            </button>
                        </div>
                        <StudentEditForm
                            student={profile}
                            onClose={() => setView('summary')}
                            isStudentView={profile.rol === 'estudiante'}
                        />
                    </div>
                )}
                {view === 'reports' && (
                    <ReportsDashboard onClose={() => setView('summary')} />
                )}
                {view === 'cursados' && (
                    <CursadosViewer profile={profile} onClose={() => setView('summary')} />
                )}
                {view === 'users' && (
                    <UserManagement onClose={() => setView('summary')} />
                )}
                {view === 'bulk_upload' && (
                    <div className="animate-in slide-in-from-bottom-8 duration-700 w-full flex flex-col items-center">
                        <BulkUpload onClose={() => setView('summary')} />
                    </div>
                )}
                {view === 'commissions' && (
                    <CommissionsManager onClose={() => setView('summary')} />
                )}
                {view === 'enrollment_cursada' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                        {profile.rol === 'admin' || profile.rol === 'preceptor' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                <EnrollmentCursadaForm 
                                    onClose={() => setView('summary')} 
                                    onSuccess={() => setEnrollmentRefresh(prev => prev + 1)}
                                />
                                <div className="h-[calc(100vh-180px)] sticky top-24">
                                    <EnrollmentCursadaList 
                                        rol={profile.rol} 
                                        refreshTrigger={enrollmentRefresh} 
                                    />
                                </div>
                            </div>
                        ) : (
                            <EnrollmentCursadaList 
                                rol={profile.rol} 
                                perfilId={profile.id} 
                            />
                        )}
                    </div>
                )}
                {view === 'stats' && (
                    <StatsDashboard onClose={() => setView('summary')} />
                )}
                {view === 'backup' && (
                    <BackupManager onClose={() => setView('summary')} />
                )}
            </main>
        </div>
    );
}
