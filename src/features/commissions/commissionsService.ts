import { supabase } from '@/lib/supabase';

export interface Commission {
    id: string;
    materia_nombre: string;
    dia: string;
    hora: string;
    docente_nombre: string;
    aula?: string;
    cupo_maximo: number;
    anio_lectivo: number;
    creado_en: string;
}

export interface CommissionInsert {
    materia_nombre: string;
    dia: string;
    hora: string;
    docente_nombre: string;
    aula?: string;
    cupo_maximo?: number;
    anio_lectivo?: number;
}

export const commissionsService = {
    async getAll(anio?: number) {
        const currentYear = anio || new Date().getFullYear();
        const { data, error } = await supabase
            .from('comisiones')
            .select('*')
            .eq('anio_lectivo', currentYear)
            .order('materia_nombre', { ascending: true });

        if (error) throw error;
        return data as Commission[];
    },

    async create(commission: CommissionInsert) {
        const { data, error } = await supabase
            .from('comisiones')
            .insert([commission])
            .select()
            .single();

        if (error) throw error;
        return data as Commission;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('comisiones')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async bulkUpload(commissions: CommissionInsert[]) {
        const { data, error } = await supabase
            .from('comisiones')
            .insert(commissions)
            .select();

        if (error) throw error;
        return data;
    },

    /**
     * Procesa un CSV de comisiones
     * Formato esperado: materia;dia;hora;docente;aula;cupo
     */
    parseCommissionsCSV(csvText: string): CommissionInsert[] {
        const lines = csvText.split('\n');
        const results: CommissionInsert[] = [];
        const currentYear = new Date().getFullYear();

        // Saltar cabecera si existe
        const startLine = (lines[0].toLowerCase().includes('materia') || lines[0].toLowerCase().includes('docente')) ? 1 : 0;

        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const [materia, dia, hora, docente, aula, cupo] = line.split(';');

            if (materia && dia && hora && docente) {
                results.push({
                    materia_nombre: materia.trim(),
                    dia: dia.trim(),
                    hora: hora.trim(),
                    docente_nombre: docente.trim(),
                    aula: aula ? aula.trim() : '',
                    cupo_maximo: cupo ? parseInt(cupo.trim()) : 30,
                    anio_lectivo: currentYear
                });
            }
        }
        return results;
    }
};
