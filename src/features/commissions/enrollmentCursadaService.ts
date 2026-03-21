import { supabase } from '@/lib/supabase';

export interface EnrollmentCursada {
    id: string;
    perfil_id: string;
    comision_id: string;
    anio_lectivo: number;
    fecha_inscripcion: string;
    estado: 'inscripto' | 'regular' | 'libre' | 'baja';
    // Joined data
    perfiles?: {
        nombre: string;
        apellido: string;
        dni: string;
    };
    comisiones?: {
        materia_nombre: string;
        dia: string;
        hora: string;
        docente_nombre: string;
        aula?: string;
    };
}

export const enrollmentCursadaService = {
    async enrollStudent(perfilId: string, comisionId: string) {
        const currentYear = new Date().getFullYear();

        // 1. Verificar cupo (OPCIONAL: Podemos hacerlo más estricto con una función RPC en el futuro)
        const { data: comision, error: errorCom } = await supabase
            .from('comisiones')
            .select('cupo_maximo, materia_nombre')
            .eq('id', comisionId)
            .single();

        if (errorCom) throw errorCom;

        const { count, error: errorCount } = await supabase
            .from('inscripciones_cursada')
            .select('*', { count: 'exact', head: true })
            .eq('comision_id', comisionId);

        if (errorCount) throw errorCount;

        if (count !== null && count >= comision.cupo_maximo) {
            throw new Error(`La comisión de ${comision.materia_nombre} ya ha alcanzado su cupo máximo (${comision.cupo_maximo}).`);
        }

        // 2. Insertar inscripción
        const { data, error } = await supabase
            .from('inscripciones_cursada')
            .insert([{
                perfil_id: perfilId,
                comision_id: comisionId,
                anio_lectivo: currentYear
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error('El alumno ya se encuentra inscripto en esta comisión para el año actual.');
            }
            throw error;
        }

        return data;
    },

    async getByStudent(perfilId: string, anio?: number) {
        const currentYear = anio || new Date().getFullYear();
        const { data, error } = await supabase
            .from('inscripciones_cursada')
            .select(`
                *,
                comisiones (*)
            `)
            .eq('perfil_id', perfilId)
            .eq('anio_lectivo', currentYear);

        if (error) throw error;
        return data as EnrollmentCursada[];
    },

    async getAll(anio?: number) {
        const currentYear = anio || new Date().getFullYear();
        const { data, error } = await supabase
            .from('inscripciones_cursada')
            .select(`
                *,
                perfiles (nombre, apellido, dni),
                comisiones (*)
            `)
            .eq('anio_lectivo', currentYear)
            .order('fecha_inscripcion', { ascending: false });

        if (error) throw error;
        return data as EnrollmentCursada[];
    },

    async unenroll(id: string) {
        const { error } = await supabase
            .from('inscripciones_cursada')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
