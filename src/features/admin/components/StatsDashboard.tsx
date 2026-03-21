import React, { useState, useEffect } from 'react';
import { statsService, StatsData } from '../statsService';

interface StatsDashboardProps {
    onClose: () => void;
}

const matrixColumns = ['12', '13', '14', '15', '16', '17', '18', '19', '20-24', '+25'];

export default function StatsDashboard({ onClose }: StatsDashboardProps) {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await statsService.getDashboardStats();
            setStats(data);
        } catch (err) {
            console.error(err);
            setError('Error al cargar estadísticas.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-40 gap-6 bg-white rounded-[3rem] border border-slate-100 shadow-xl">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Procesando Datos Censales...</p>
        </div>
    );

    if (error || !stats) return (
        <div className="p-10 bg-red-50 text-red-600 rounded-[2.5rem] border border-red-100 text-center font-bold">
            {error || 'No se pudieron cargar los datos.'}
        </div>
    );

    return (
        <div className="w-full max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
            <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Informe Estadístico</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Censo Académico {new Date().getFullYear()}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all border border-slate-100"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* KPIs Rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Estudiantes Activos', value: stats.totalEstudiantesActivos, color: 'indigo' },
                    { label: 'Matrículas Plan', value: stats.totalMatriculacionesInstrumento, color: 'blue' },
                    { label: 'Inscripciones Materia', value: stats.totalInscripcionesMaterias, color: 'emerald' },
                    { label: 'Instrumentos', value: stats.totalInstrumentos, color: 'purple' }
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 group hover:border-indigo-200 transition-all">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{kpi.label}</p>
                        <p className={`text-4xl font-black text-${kpi.color}-600`}>{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* MATRIZ CENSAL */}
            <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 p-8 text-white">
                    <h3 className="text-xl font-bold">Matrícula por Año de Estudio y Edad</h3>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Desagregación según Instrumento Fundamental o Lenguaje Musical</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-400">
                                <th rowSpan={2} className="px-6 py-4 text-left font-black uppercase tracking-widest border-r border-slate-200">Año</th>
                                <th rowSpan={2} className="px-6 py-4 text-center font-black uppercase tracking-widest bg-slate-100 border-r border-slate-200 text-slate-900">Total</th>
                                <th rowSpan={2} className="px-6 py-4 text-center font-black uppercase tracking-widest border-r border-slate-200">Masc.</th>
                                <th colSpan={matrixColumns.length} className="px-6 py-2 text-center font-black uppercase tracking-widest border-b border-slate-200">Edad</th>
                            </tr>
                            <tr className="bg-slate-50 text-slate-400">
                                {matrixColumns.map(age => (
                                    <th key={age} className="px-3 py-3 text-center font-black border-r border-slate-100 last:border-r-0 text-[10px]">{age}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {[1, 2, 3, 4, 5].map(anio => {
                                const row = stats.ageMatrix[anio];
                                return (
                                    <tr key={anio} className="hover:bg-indigo-50/50 transition-colors">
                                        <td className="px-6 py-4 font-black text-slate-900 border-r border-slate-100">{anio}° Año</td>
                                        <td className="px-6 py-4 text-center font-black text-indigo-600 bg-indigo-50 border-r border-slate-100">{row.total}</td>
                                        <td className="px-6 py-4 text-center text-slate-500 border-r border-slate-100">{row.masculinos}</td>
                                        {matrixColumns.map(age => (
                                            <td key={age} className="px-3 py-4 text-center border-r border-slate-50 last:border-r-0">
                                                {row.ages[age] > 0 ? (
                                                    <span className="font-bold text-slate-800">{row.ages[age]}</span>
                                                ) : (
                                                    <span className="text-slate-200">-</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-slate-900 text-white font-black">
                            <tr>
                                <td className="px-6 py-5 border-r border-slate-700">TOTALES</td>
                                <td className="px-6 py-5 text-center bg-indigo-600 border-r border-slate-700">
                                    {Object.values(stats.ageMatrix).reduce((acc, r) => acc + r.total, 0)}
                                </td>
                                <td className="px-6 py-5 text-center border-r border-slate-700">
                                    {Object.values(stats.ageMatrix).reduce((acc, r) => acc + r.masculinos, 0)}
                                </td>
                                {matrixColumns.map(age => (
                                    <td key={age} className="px-3 py-5 text-center border-r border-slate-700 last:border-r-0">
                                        {Object.values(stats.ageMatrix).reduce((acc, r) => acc + (r.ages[age] || 0), 0)}
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* DESGLOSES SECUNDARIOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-10">
                    <StatsTable title="Inscriptos por Instrumento" data={stats.porInstrumento} headers={['Instrumento']} />
                    <StatsTable title="Top 20 Materias" data={stats.porMateria} headers={['Materia']} />
                </div>
                <div className="space-y-10">
                    <StatsTable title="Distribución por Género" data={stats.porGenero} headers={['Género']} />
                    <StatsTable title="Distribución por Edades" data={stats.porEdadGeneral} headers={['Rango']} />
                    <StatsTable title="Nacionalidades" data={stats.porNacionalidad} headers={['Nacionalidad']} />
                </div>
            </div>
        </div>
    );
}

function StatsTable({ title, data, headers }: { title: string, data: any[], headers: string[] }) {
    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-50">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-50 text-xs">
                    <thead className="bg-slate-50/50">
                        <tr>
                            {headers.map((h, i) => (
                                <th key={i} className="px-8 py-3 text-left font-black text-slate-400 uppercase tracking-widest">{h}</th>
                            ))}
                            <th className="px-8 py-3 text-right font-black text-slate-400 uppercase tracking-widest">Cantidad</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {data.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                {headers.map((h, j) => (
                                    <td key={j} className="px-8 py-4 font-bold text-slate-700">{row[Object.keys(row)[0]]}</td>
                                ))}
                                <td className="px-8 py-4 text-right">
                                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-black">{row.count}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
