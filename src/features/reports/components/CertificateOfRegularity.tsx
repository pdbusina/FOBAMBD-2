import React from 'react';

interface CertificateOfRegularityProps {
    data: {
        nombre: string;
        apellido: string;
        dni: string;
        plan: string;
        instrumento: string;
        anio_lectivo: number;
    };
    onClose: () => void;
}

export default function CertificateOfRegularity({ data, onClose }: CertificateOfRegularityProps) {

    const today = new Date().toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col items-center gap-6 p-4">
            {/* Non-printable UI */}
            <div className="w-full max-w-2xl flex justify-between items-center print:hidden">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold transition-colors"
                >
                    ← Volver
                </button>
                <div className="flex gap-4">
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

            {/* Printable Certificate */}
            <div id="certificate-print-area" className="print-area bg-white shadow-2xl border border-slate-200 print:shadow-none print:border-none overflow-hidden relative"
                style={{
                    width: '210mm',
                    height: '148.5mm', // Half A4
                    padding: '20mm',
                    boxSizing: 'border-box',
                    backgroundColor: 'white'
                }}>

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col">
                        <h1 className="text-base font-bold text-slate-900 uppercase tracking-tight">Escuela Superior de Música de Neuquén</h1>
                        <p className="text-xs text-slate-500 font-medium">Consejo Provincial de Educación</p>
                    </div>
                    {/* El tamaño del logo se controla con las clases w-16 (ancho) y h-16 (alto) del div contenedor. 
                        Ejemplos: w-20 h-20 (más grande), w-12 h-12 (más chico) */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex items-center justify-center">
                        <img src="/logo.png" alt="ESMN Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-[0.1em] border-b-2 border-slate-900 inline-block pb-1">Certificado de Regularidad</h2>
                </div>

                {/* Body Content */}
                <div className="text-slate-800 leading-relaxed text-base">
                    <p className="mb-4">
                        Se certifica por la presente que el/la alumno/a <strong>{data.apellido}, {data.nombre}</strong>, con DNI <strong>{data.dni}</strong>; es <strong>alumno regular</strong> del Nivel FOBAM en el plan de estudios <strong>{data.plan}</strong> ({data.instrumento}) durante el ciclo lectivo <strong>{data.anio_lectivo}</strong>.
                    </p>
                    <p>
                        A pedido del interesado y para ser presentado ante las autoridades que lo requieran, se extiende el presente certificado en la ciudad de Neuquén, {today}.
                    </p>
                </div>

                {/* Footer / Signature Area */}
                <div className="mt-32 flex justify-end text-center">
                    <div>
                        <div className="w-48 border-t border-slate-900 mb-2"></div>
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Sello y Firma</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase">Nivel FOBAM</p>
                    </div>
                </div>

                {/* Extra Decoration for Authenticity */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500"></div>
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
                        padding: 20mm !important; /* Keep internal padding matching inline style */
                        box-shadow: none !important;
                        border: none !important;
                        width: 210mm !important;
                        height: 148.5mm !important;
                        color: #0f172a; /* Fallback baseline color */
                    }
                }
            `}</style>
        </div>
    );
}
