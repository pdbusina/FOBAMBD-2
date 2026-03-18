import React, { useMemo } from 'react';
import { ProcessedMateria, TranscriptYears } from '../analiticoService';
import { StudentReportData } from '../reportsService';

interface TranscriptReportProps {
    data: StudentReportData;
    transcriptData: TranscriptYears;
    onClose: () => void;
}

export default function TranscriptReport({ data, transcriptData, onClose }: TranscriptReportProps) {
    // Generate derived list of years to split into pages
    const { aniosPagina1, aniosPagina2 } = useMemo(() => {
        const anios = Object.keys(transcriptData).sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (isNaN(numA)) return 1;
            if (isNaN(numB)) return -1;
            return numA - numB;
        });

        // Split standard 3 years for page 1, 4+ years for page 2
        return {
            aniosPagina1: anios.filter(a => parseInt(a) <= 3 || isNaN(parseInt(a))),
            aniosPagina2: anios.filter(a => parseInt(a) > 3)
        };
    }, [transcriptData]);

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        // Validating date to ensure we don't return 'Invalid Date'
        if (isNaN(d.getTime())) return dateString; 
        
        // Ensure timezone doesn't mess up the date by adding a fixed noon time to the string
        const secureDate = new Date(`${dateString}T12:00:00Z`);
        return secureDate.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const renderPage = (aniosList: string[], paginaNum: number) => (
        <div 
            className={`bg-white p-10 border border-slate-200 relative print:border-none print:p-0 ${paginaNum > 1 ? 'print:break-before-page mt-8 print:mt-0' : ''}`} 
            style={{ 
                width: '210mm', 
                minHeight: '297mm', // A4 height
                boxSizing: 'border-box',
                padding: '15mm' // Margin for printing
            }}
        >
            {/* Header */}
            <div className="flex justify-between items-end border-b-2 border-slate-900 pb-2 mb-4">
                <div className="flex flex-col h-full justify-between pb-1">
                    <div>
                        <h2 className="text-xl font-black uppercase text-slate-900 tracking-tight">Escuela Superior de Música de Neuquén</h2>
                        <h3 className="text-sm font-bold text-slate-700 uppercase">Formación Básica en Música (FOBAM)</h3>
                    </div>
                    <p className="mt-8 text-sm text-slate-600 font-medium">Plan de Estudios: <strong className="text-slate-900">{data.instrumento}</strong></p>
                </div>
                <div className="w-32 h-32 relative">
                    <img 
                        src="/logo.png" 
                        alt="Logo ESMN" 
                        className="object-contain w-full h-full"
                    />
                </div>
            </div>

            {/* Student Data */}
            <div className="grid grid-cols-3 gap-2 text-[13px] border-b border-slate-200 pb-2 mb-4">
                <p><strong className="text-slate-900 uppercase text-[9px] tracking-widest block mb-0.5">Apellidos</strong> {data.apellido}</p>
                <p><strong className="text-slate-900 uppercase text-[9px] tracking-widest block mb-0.5">Nombres</strong> {data.nombre}</p>
                <p><strong className="text-slate-900 uppercase text-[9px] tracking-widest block mb-0.5">DNI</strong> {data.dni}</p>
            </div>

            {/* Curriculum Data */}
            <div className="space-y-4">
                {aniosList.map(anio => (
                    <div key={anio} className="mb-4">
                        <h4 className="text-xs font-black uppercase tracking-widest bg-slate-100 text-slate-900 p-1.5 border border-slate-300">
                            Año de Cursado: {anio}
                        </h4>
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="p-2 border border-slate-900 text-left font-bold w-1/2">Materia</th>
                                    <th className="p-2 border border-slate-900 text-center font-bold">Condición</th>
                                    <th className="p-2 border border-slate-900 text-center font-bold font-mono">Nota</th>
                                    <th className="p-2 border border-slate-900 text-center font-bold">Fecha</th>
                                    <th className="p-2 border border-slate-900 text-center font-bold">Libro/Folio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transcriptData[anio].map(m => (
                                    <tr key={m.id} className="h-8">
                                        <td className="p-2 border border-slate-900 text-slate-800 font-medium">
                                            {m.materiaNombre}
                                        </td>
                                        <td className="p-2 border border-slate-900 text-center text-slate-600 capitalize">
                                            {m.notaData?.condicion || ''}
                                        </td>
                                        <td className="p-2 border border-slate-900 text-center font-black text-sm">
                                            {m.notaData?.nota || ''}
                                        </td>
                                        <td className="p-2 border border-slate-900 text-center text-slate-600">
                                            {formatDate(m.notaData?.fecha)}
                                        </td>
                                        <td className="p-2 border border-slate-900 text-center text-slate-600">
                                            {m.notaData?.libro_folio || ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>

            {/* Print Footer - Move out of absolute, push down exactly linearly below content */}
            {paginaNum === (aniosPagina2.length > 0 ? 2 : 1) && (
                <div className="w-full mt-6">
                    {/* One line strictly below the tables */}
                    <div className="w-full text-left text-sm font-medium text-slate-800">
                        <p>Neuquén Capital, {new Date().toLocaleDateString('es-AR')}</p>
                    </div>
                    {/* Increased space drastically (pt-32 approx 4-5 lines) */}
                    <div className="w-full flex justify-around items-end pt-32">
                        <div className="flex flex-col items-center">
                            <div className="w-48 border-t border-slate-900 mb-2"></div>
                            <p className="text-[10px] font-bold uppercase text-slate-800 tracking-widest">Sello de la Institución</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-48 border-t border-slate-900 mb-2"></div>
                            <p className="text-[10px] font-bold uppercase text-slate-800 tracking-widest">Firma Autorizada</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col items-center gap-6 p-4">
            {/* Non-printable UI */}
            <div className="w-full max-w-4xl flex justify-between items-center print:hidden">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold transition-colors"
                >
                    ← Volver
                </button>
                <div className="flex gap-4">
                    <span className="bg-indigo-50 text-indigo-600 px-4 py-3 rounded-xl text-sm font-bold border border-indigo-100 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                        Formato A4 Doble Cara
                    </span>
                    <button
                        onClick={handlePrint}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-slate-900 transition-all flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        IMPRIMIR / DESCARGAR
                    </button>
                </div>
            </div>

            {/* Printable Area Container */}
            <div className="print-area bg-slate-100 p-8 rounded-3xl print:bg-white print:p-0 print:rounded-none flex flex-col items-center">
                {renderPage(aniosPagina1, 1)}
                {aniosPagina2.length > 0 && renderPage(aniosPagina2, 2)}
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    /* Reset HTML structure */
                    html, body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    /* Hide everything visually but keep the DOM hierarchy intact */
                    body * {
                        visibility: hidden;
                    }
                    /* Show only the print area and its contents */
                    .print-area, .print-area * {
                        visibility: visible;
                    }
                    /* Position the print area at the absolute top-left of the page */
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        margin: 0;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        width: 100% !important;
                        background: white !important;
                    }
                }
            `}</style>
        </div>
    );
}
