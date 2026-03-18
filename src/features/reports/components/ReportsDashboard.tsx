import React, { useState } from 'react';
import { verifyEnrollmentByDni, StudentReportData } from '../reportsService';
import CertificateOfRegularity from './CertificateOfRegularity';
import TranscriptReport from './TranscriptReport';
import { processStudentTranscript, TranscriptYears } from '../analiticoService';

interface ReportsDashboardProps {
    onClose: () => void;
}

export default function ReportsDashboard({ onClose }: ReportsDashboardProps) {
    const [dni, setDni] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reportData, setReportData] = useState<StudentReportData | null>(null);
    const [transcriptData, setTranscriptData] = useState<TranscriptYears | null>(null);
    const [activeReport, setActiveReport] = useState<'regularidad' | 'analitico' | null>(null);
    const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dni.trim()) return;

        setLoading(true);
        setError(null);
        setReportData(null);

        try {
            const data = await verifyEnrollmentByDni(dni);
            if (data) {
                setReportData(data);
                setTranscriptData(null); // Reset on new search
            } else {
                setError('No se encontró una matriculación activa para el año en curso con ese DNI.');
            }
        } catch (err) {
            console.error(err);
            setError('Ocurrió un error al verificar la matriculación.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenTranscript = async () => {
        if (!reportData) return;
        setIsLoadingTranscript(true);
        setError(null);
        try {
            // Note: The database 'materias' are linked to the full plan name (e.g. "530 Piano"),
            // which in our ReportData interface corresponds to 'instrumento'.
            const data = await processStudentTranscript(reportData.dni, reportData.instrumento);
            setTranscriptData(data);
            setActiveReport('analitico');
        } catch (err) {
            console.error("Error fetching transcript data:", err);
            setError('Error al generar el analítico. Por favor, intente de nuevo.');
        } finally {
            setIsLoadingTranscript(false);
        }
    };

    if (activeReport === 'regularidad' && reportData) {
        return (
            <CertificateOfRegularity
                data={reportData}
                onClose={() => setActiveReport(null)}
            />
        );
    }

    if (activeReport === 'analitico' && reportData && transcriptData) {
        return (
            <TranscriptReport
                data={reportData}
                transcriptData={transcriptData}
                onClose={() => setActiveReport(null)}
            />
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Informes y Certificados</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Generación de documentación oficial</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-2xl border border-slate-200 transition-all hover:shadow-md"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end mb-10">
                    <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ingresar DNI del Alumno</label>
                        <input
                            type="text"
                            value={dni}
                            onChange={(e) => setDni(e.target.value)}
                            placeholder="Ej: 12345678"
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-600 transition-all"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full md:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        )}
                        Verificar Alumno
                    </button>
                </form>

                {error && (
                    <div className="p-6 bg-red-50 text-red-600 rounded-3xl border border-red-100 flex items-center gap-4 animate-in slide-in-from-top-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="font-bold text-sm">{error}</p>
                    </div>
                )}

                {reportData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in duration-300">
                        <div className="p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 group hover:border-indigo-300 transition-all">
                            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">Alumno Encontrado</h3>
                            <p className="text-xl font-bold text-slate-900 mb-1">{reportData.apellido}, {reportData.nombre}</p>
                            <p className="text-sm font-medium text-slate-500 mb-6">DNI {reportData.dni}</p>

                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 inline-flex mb-8">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Matriculado {reportData.anio_lectivo}</span>
                            </div>

                            <button
                                onClick={() => setActiveReport('regularidad')}
                                className="w-full mb-3 py-4 bg-white text-indigo-600 border-2 border-indigo-600 rounded-xl font-bold hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Certificado de Regularidad
                            </button>

                            <button
                                onClick={handleOpenTranscript}
                                disabled={isLoadingTranscript}
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoadingTranscript ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                )}
                                Certificado Analítico
                            </button>
                        </div>

                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col justify-center items-center text-center">
                            <div className="w-10 h-10 bg-slate-200 rounded-2xl mb-3 flex items-center justify-center text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nuevos informes en desarrollo</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
