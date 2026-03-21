import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface BackupManagerProps {
    onClose: () => void;
}

export default function BackupManager({ onClose }: BackupManagerProps) {
    const [loading, setLoading] = useState(false);

    const downloadBackup = async (format: 'json') => {
        setLoading(true);
        try {
            // Tablas principales a exportar
            const tables = ['perfiles', 'matriculaciones', 'comisiones', 'inscripciones_cursada', 'notas', 'instrumentos_planes', 'materias'];
            const fullBackup: any = {};

            for (const table of tables) {
                const { data } = await supabase.from(table).select('*');
                fullBackup[table] = data;
            }

            const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fobambd_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert('Error al generar el backup.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Seguridad y Respaldo</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Backups y redundancia de datos</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 text-slate-400 hover:text-red-500 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Descarga Manual */}
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Backup Manual</h3>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                            Descarga una copia completa de la base de datos en formato JSON. Este archivo contiene la información de alumnos, notas, comisiones e inscripciones.
                        </p>
                    </div>
                    <button
                        onClick={() => downloadBackup('json')}
                        disabled={loading}
                        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 uppercase tracking-widest text-[10px]"
                    >
                        {loading ? 'Generando...' : 'Descargar JSON'}
                    </button>
                </div>

                {/* Info Redundancia */}
                <div className="bg-slate-900 p-10 rounded-[3rem] shadow-xl text-white space-y-8">
                    <div className="space-y-4">
                        <div className="w-14 h-14 bg-white/10 text-indigo-400 rounded-2xl flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-black text-white">Estrategia de Redundancia</h3>
                        <p className="text-sm text-slate-400 leading-relaxed font-medium">
                            Para garantizar la disponibilidad total, se recomienda configurar un volcado automático periódico.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Opción Recomendada</h4>
                            <p className="text-xs text-slate-300 font-bold">GitHub Actions (Nube)</p>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                Crear un flujo de trabajo que ejecute <code className="bg-black/50 px-1 rounded text-white italic">supabase db dump</code> semanalmente y guarde el resultado en un repo privado.
                            </p>
                        </div>
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Opción NAS / Local</h4>
                            <p className="text-xs text-slate-300 font-bold">Script Cron (Local)</p>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                Un script en PowerShell o Bash que use el Supabase CLI para clonar la base de datos a un disco duro externo o NAS Synology.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-indigo-50/50 p-8 rounded-[2rem] border border-indigo-100 flex items-start gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-indigo-900 font-medium leading-relaxed">
                    <strong>Nota:</strong> Los archivos de backup contienen datos sensibles (DNI, Nombres, Calificaciones). Guárdalos en un lugar seguro y encriptado.
                </p>
            </div>
        </div>
    );
}
