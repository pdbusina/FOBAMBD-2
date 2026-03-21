import React, { useState, useEffect } from 'react';
import { commissionsService, CommissionInsert, Commission } from '../commissionsService';
import { MATERIAS_FOBAM } from '../materiasData';

interface CommissionsManagerProps {
    onClose: () => void;
}

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function CommissionsManager({ onClose }: CommissionsManagerProps) {
    const [view, setView] = useState<'list' | 'add' | 'bulk'>('list');
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form individual
    const [form, setForm] = useState<CommissionInsert>({
        materia_nombre: '',
        dia: 'Lunes',
        hora: '18:00',
        docente_nombre: '',
        aula: '',
        cupo_maximo: 30,
        anio_lectivo: new Date().getFullYear(),
        obs_optativa_ensamble: ''
    });

    useEffect(() => {
        loadCommissions();
    }, []);

    const loadCommissions = async () => {
        setLoading(true);
        try {
            const data = await commissionsService.getAll();
            setCommissions(data);
        } catch (err) {
            console.error(err);
            setError('Error al cargar comisiones.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await commissionsService.create(form);
            setSuccess('Comisión creada con éxito.');
            setForm({ ...form, materia_nombre: '', docente_nombre: '', aula: '', obs_optativa_ensamble: '' });
            loadCommissions();
            setView('list');
        } catch (err) {
            console.error(err);
            setError('Error al crear la comisión.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que desea eliminar esta comisión?')) return;
        try {
            await commissionsService.delete(id);
            setCommissions(commissions.filter(c => c.id !== id));
        } catch (err) {
            console.error(err);
            alert('Error al eliminar');
        }
    };

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        try {
            const text = await file.text();
            const parsed = commissionsService.parseCommissionsCSV(text);
            if (parsed.length === 0) throw new Error('No se encontraron registros válidos.');
            
            await commissionsService.bulkUpload(parsed);
            setSuccess(`Se cargaron ${parsed.length} comisiones con éxito.`);
            loadCommissions();
            setView('list');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error en la carga masiva.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Comisiones</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Oferta académica y horarios</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setView(view === 'list' ? 'add' : 'list')}
                        className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold transition-all text-xs uppercase tracking-widest ${view === 'add' ? 'bg-slate-200 text-slate-600' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'}`}
                    >
                        {view === 'add' ? 'Ver Lista' : 'Nueva Comisión'}
                    </button>
                    <button
                        onClick={() => setView('bulk')}
                        className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold transition-all text-xs uppercase tracking-widest ${view === 'bulk' ? 'bg-slate-200 text-slate-600' : 'bg-slate-900 text-white shadow-lg'}`}
                    >
                        Carga Masiva
                    </button>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-xl border border-slate-200 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold text-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-50 text-green-600 rounded-2xl border border-green-100 font-bold text-sm">
                    {success}
                </div>
            )}

            {view === 'list' && (
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Materia</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Obs</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Horario</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Docente</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Cupo</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando Oferta...</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {!loading && commissions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                            No hay comisiones cargadas para el ciclo lectivo actual.
                                        </td>
                                    </tr>
                                )}
                                {commissions.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase text-xs">{c.materia_nombre}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ciclo {c.anio_lectivo}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            {c.obs_optativa_ensamble ? (
                                                <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tight border border-amber-200">
                                                    {c.obs_optativa_ensamble}
                                                </span>
                                            ) : (
                                                <span className="text-slate-200 text-[10px] font-bold">—</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700">{c.dia}</span>
                                                <span className="text-xs text-slate-500 font-medium">{c.hora} hs</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="font-medium text-slate-600">{c.docente_nombre}</p>
                                            {c.aula && <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest italic">Aula {c.aula}</p>}
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-black text-xs border border-indigo-100">
                                                {c.cupo_maximo}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => handleDelete(c.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'add' && (
                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-2xl mx-auto">
                    <h3 className="text-xl font-bold mb-8 text-slate-900 border-b pb-4">Registrar Comisión Individual</h3>
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Materia</label>
                            <input
                                type="text"
                                value={form.materia_nombre}
                                onChange={e => setForm({ ...form, materia_nombre: e.target.value })}
                                placeholder="Ej: Lenguaje Musical 1"
                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600 transition-all"
                                list="materias-list"
                                required
                            />
                            <datalist id="materias-list">
                                {MATERIAS_FOBAM.map(m => (
                                    <option key={m} value={m} />
                                ))}
                            </datalist>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Día</label>
                                <select
                                    value={form.dia}
                                    onChange={e => setForm({ ...form, dia: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600 transition-all"
                                >
                                    {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora</label>
                                <input
                                    type="text"
                                    value={form.hora}
                                    onChange={e => setForm({ ...form, hora: e.target.value })}
                                    placeholder="Ej: 18:30"
                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Docente Responsable</label>
                            <input
                                type="text"
                                value={form.docente_nombre}
                                onChange={e => setForm({ ...form, docente_nombre: e.target.value })}
                                placeholder="Nombre completo del profesor"
                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600 transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Aula (Opcional)</label>
                                <input
                                    type="text"
                                    value={form.aula}
                                    onChange={e => setForm({ ...form, aula: e.target.value })}
                                    placeholder="Ej: 14 / Auditorio"
                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cupo Máximo</label>
                                <input
                                    type="number"
                                    value={form.cupo_maximo}
                                    onChange={e => setForm({ ...form, cupo_maximo: parseInt(e.target.value) })}
                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Obs (Optativa/Ensamble)</label>
                            <input
                                type="text"
                                value={form.obs_optativa_ensamble}
                                onChange={e => setForm({ ...form, obs_optativa_ensamble: e.target.value })}
                                placeholder="Ej: Proyecto Rock / Niños"
                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 uppercase tracking-widest text-[10px]"
                        >
                            {loading ? 'Guardando...' : 'Crear Comisión'}
                        </button>
                    </form>
                </div>
            )}

            {view === 'bulk' && (
                <div className="bg-slate-900 p-12 rounded-[3rem] shadow-2xl text-white max-w-2xl mx-auto border border-slate-700">
                    <div className="text-center space-y-4 mb-10">
                        <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-indigo-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold">Carga Masiva de Comisiones</h3>
                        <p className="text-slate-400 text-sm">Sube un archivo CSV con el listado de comisiones para este año.</p>
                    </div>

                    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Instrucciones del Formato</h4>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                El archivo debe ser un **CSV** separado por **punto y coma (;)** con el siguiente orden:<br/>
                                <code className="bg-black/40 px-2 py-1 rounded inline-block mt-2 text-indigo-300">materia;dia;hora;docente;aula;cupo;observaciones</code>
                            </p>
                        </div>

                        <div className="flex flex-col items-center gap-6 pt-4">
                            <label className="w-full">
                                <span className="sr-only">Seleccionar archivo</span>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleBulkUpload}
                                    className="block w-full text-sm text-slate-400
                                        file:mr-4 file:py-4 file:px-8
                                        file:rounded-2xl file:border-0
                                        file:text-xs file:font-black file:uppercase file:tracking-widest
                                        file:bg-indigo-600 file:text-white
                                        hover:file:bg-indigo-700
                                        cursor-pointer transition-all"
                                />
                            </label>
                            {loading && (
                                <div className="flex items-center gap-3 text-indigo-400">
                                    <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Procesando...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
