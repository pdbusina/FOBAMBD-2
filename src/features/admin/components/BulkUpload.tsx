"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { parseCSV } from '@/lib/csvParser';
import { Nota, upsertNotasBulk } from '@/features/grades/gradesService';

interface BulkUploadProps {
    onClose: () => void;
}

type UploadTab = 'estudiantes' | 'notas';

export default function BulkUpload({ onClose }: BulkUploadProps) {
    const [tab, setTab] = useState<UploadTab>('estudiantes');
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [checkingConflicts, setCheckingConflicts] = useState(false);
    const [conflicts, setConflicts] = useState<Set<number>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [overwrite, setOverwrite] = useState(false);

    // Data for validation
    const [allMaterias, setAllMaterias] = useState<any[]>([]);
    const [allProfiles, setAllProfiles] = useState<any[]>([]);

    useEffect(() => {
        async function loadValidationData() {
            const [mats, profs] = await Promise.all([
                supabase.from('materias').select('id, nombre_materia'),
                supabase.from('perfiles').select('id, dni')
            ]);
            if (mats.data) setAllMaterias(mats.data);
            if (profs.data) setAllProfiles(profs.data);
        }
        loadValidationData();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setSuccessMsg(null);
            
            const reader = new FileReader();
            reader.onload = async (event) => {
                const text = event.target?.result as string;
                const data = parseCSV<any>(text);
                if (data.length > 0) {
                    setHeaders(Object.keys(data[0]));
                    setPreviewData(data);
                    checkConflicts(data, tab);
                } else {
                    setError('El archivo está vacío o no tiene el formato correcto.');
                }
            };
            reader.readAsText(selectedFile);
        }
    };

    const checkConflicts = async (data: any[], currentTab: UploadTab) => {
        setCheckingConflicts(true);
        const newConflicts = new Set<number>();

        if (currentTab === 'estudiantes') {
            const existingDnis = new Set(allProfiles.map(p => p.dni));
            data.forEach((row, idx) => {
                if (existingDnis.has(row.dni)) {
                    newConflicts.add(idx);
                }
            });
        } else {
            // Bulk check for grades
            const dnis = data.map(r => r.dni).filter(Boolean);
            const { data: existingNotas } = await supabase
                .from('notas')
                .select('dni, nombre_materia')
                .in('dni', dnis);
            
            if (existingNotas) {
                const existingPairs = new Set(existingNotas.map(n => `${n.dni}-${n.nombre_materia?.toLowerCase()}`));
                data.forEach((row, idx) => {
                    const key = `${row.dni}-${row.materia?.toLowerCase()}`;
                    if (existingPairs.has(key)) {
                        newConflicts.add(idx);
                    }
                });
            }
        }
        setConflicts(newConflicts);
        setCheckingConflicts(false);
    };

    const handleProcess = async () => {
        if (previewData.length === 0) return;
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            if (tab === 'estudiantes') {
                const toInsert = previewData.map((row, idx) => {
                    if (conflicts.has(idx) && !overwrite) return null;
                    return {
                        id: allProfiles.find(p => p.dni === row.dni)?.id || crypto.randomUUID(),
                        dni: row.dni,
                        apellido: row.apellido,
                        nombre: row.nombre,
                        rol: 'estudiante'
                    };
                }).filter(Boolean);

                if (toInsert.length > 0) {
                    const { error: upsertError } = await supabase
                        .from('perfiles')
                        .upsert(toInsert, { onConflict: 'dni' });
                    if (upsertError) throw upsertError;
                }
            } else {
                // Process Grades
                const notasToUpsert: Nota[] = previewData
                    .map((row, idx) => {
                        if (conflicts.has(idx) && !overwrite) return null;
                        
                        const profile = allProfiles.find(p => p.dni === row.dni);
                        if (!profile && !overwrite) {
                            return null;
                        }

                        const notaObj: Nota = {
                            perfil_id: profile?.id || '',
                            dni: row.dni,
                            nombre_materia: row.materia,
                            nota: String(row.nota),
                            condicion: (row.condicion?.toLowerCase() as 'promoción' | 'examen' | 'equivalencia') || 'promoción',
                            fecha: row.fecha || new Date().toISOString().split('T')[0],
                            libro_folio: row.libro_folio || '',
                            obs_optativa_ensamble: row.observaciones || ''
                        };
                        return notaObj;
                    })
                    .filter((n): n is Nota => n !== null);

                if (notasToUpsert.length > 0) {
                    await upsertNotasBulk(notasToUpsert);
                }
            }
            setSuccessMsg(`¡Carga masiva completada con éxito! (${previewData.length} registros analizados)`);
            setPreviewData([]);
            setFile(null);
        } catch (err: any) {
            setError('Error al procesar la carga: ' + (err.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-6xl w-full mx-auto animate-in fade-in zoom-in duration-500">
            <div className="flex justify-between items-center mb-10 pb-8 border-b border-slate-50">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Carga Masiva de Datos</h2>
                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">Administración del sistema</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => { setTab('estudiantes'); setPreviewData([]); setFile(null); }}
                    className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${tab === 'estudiantes' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                >
                    Estudiantes
                </button>
                <button
                    onClick={() => { setTab('notas'); setPreviewData([]); setFile(null); }}
                    className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${tab === 'notas' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                >
                    Notas
                </button>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-8">
                <div className="flex flex-col items-center">
                    <div className="w-full max-w-md">
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-[2rem] cursor-pointer bg-white hover:bg-slate-50 transition-colors group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-10 h-10 mb-3 text-slate-400 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                </svg>
                                <p className="mb-2 text-sm text-slate-500"><span className="font-bold">Haz clic para subir</span> o arrastra y suelta</p>
                                <p className="text-xs text-slate-400">CSV (separado por punto y coma ';')</p>
                            </div>
                            <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                        </label>
                    </div>
                    {file && (
                        <p className="mt-4 text-sm font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            {file.name}
                        </p>
                    )}
                </div>
            </div>

            {previewData.length > 0 && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Vista Previa ({previewData.length} registros)</h3>
                        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                            <input
                                type="checkbox"
                                id="overwrite"
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                checked={overwrite}
                                onChange={(e) => setOverwrite(e.target.checked)}
                            />
                            <label htmlFor="overwrite" className="text-[10px] font-bold text-amber-700 uppercase cursor-pointer">Sobrescribir datos existentes</label>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-[2rem] border border-slate-100 shadow-sm max-h-96">
                        <table className="w-full text-left border-collapse bg-white">
                            <thead className="sticky top-0 bg-slate-50 z-10">
                                <tr className="border-b border-slate-100">
                                    {headers.map(h => (
                                        <th key={h} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {previewData.map((row, idx) => (
                                    <tr key={idx} className={`${conflicts.has(idx) ? 'bg-amber-50/50' : 'hover:bg-slate-50'} transition-colors`}>
                                        {headers.map(h => (
                                            <td key={h} className="px-6 py-3 text-sm font-medium text-slate-600">{row[h]}</td>
                                        ))}
                                        <td className="px-6 py-3">
                                            {conflicts.has(idx) ? (
                                                <span className="text-[10px] font-bold text-amber-600 uppercase bg-amber-100 px-2 py-1 rounded-lg border border-amber-200">
                                                    Existente
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-green-600 uppercase bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                                                    Nuevo
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-4 mt-10">
                        {error && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-xs font-bold text-center underline animate-shake">{error}</div>}
                        <button
                            onClick={handleProcess}
                            disabled={loading || checkingConflicts}
                            className="w-full py-5 bg-slate-900 text-white rounded-3xl font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100 uppercase tracking-widest text-xs disabled:opacity-50"
                        >
                            {loading ? 'PROCESANDO...' : `CONFIRMAR CARGA DE ${previewData.length} REGISTROS`}
                        </button>
                    </div>
                </div>
            )}

            {successMsg && (
                <div className="mt-8 p-6 bg-green-50 border border-green-100 rounded-[2rem] text-green-700 text-center animate-in zoom-in">
                    <p className="text-sm font-bold uppercase tracking-widest mb-2">¡Operación Exitosa!</p>
                    <p className="text-xs font-medium">{successMsg}</p>
                </div>
            )}

            <div className="mt-12 p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-4">Ayuda sobre el formato</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <p className="text-[10px] font-bold text-blue-600 uppercase mb-2">Estudiantes (estudiantes.csv)</p>
                        <code className="text-[10px] block bg-white p-3 rounded-xl border border-blue-100 text-blue-800 leading-relaxed font-mono">
                            dni;apellido;nombre<br />
                            12345678;Pérez;Juan<br />
                            87654321;García;María
                        </code>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-blue-600 uppercase mb-2">Notas (notas.csv)</p>
                        <code className="text-[10px] block bg-white p-3 rounded-xl border border-blue-100 text-blue-800 leading-relaxed font-mono">
                            dni;materia;nota;condicion;fecha;libro_folio;observaciones<br />
                            12345678;Piano;8;promoción;2024-03-20;L1 F10;<br />
                            87654321;Taller;9;promoción;2024-03-20;L1 F11;Taller de Ensamble I
                        </code>
                    </div>
                </div>
            </div>
        </div>
    );
}
