import { supabase } from '@/lib/supabase';

export interface InstrumentoPlan {
    id: string;
    instrumento_id: string;
    nombre_completo: string;
    plan_estudios: string;
}

export interface Matriculacion {
    id?: string;
    perfil_id: string;
    instrumento_plan_id: string;
    anio_lectivo: number;
    fecha_inscripcion?: string;
}

export async function getInstrumentosPlanes(): Promise<InstrumentoPlan[]> {
    const { data, error } = await supabase
        .from('instrumentos_planes')
        .select('*')
        .order('instrumento_id', { ascending: true });

    if (error) {
        console.error('Error fetching instruments:', error);
        return [];
    }
    return data;
}

export async function enrollStudent(matriculacion: Matriculacion) {
    // 1. Verificar si ya existe la matriculación para evitar duplicados
    const { data: existing } = await supabase
        .from('matriculaciones')
        .select('id')
        .eq('perfil_id', matriculacion.perfil_id)
        .eq('instrumento_plan_id', matriculacion.instrumento_plan_id)
        .eq('anio_lectivo', matriculacion.anio_lectivo)
        .maybeSingle();

    if (existing) {
        throw new Error('El estudiante ya se encuentra matriculado en este instrumento y plan de estudios para el año actual.');
    }

    // 2. Insertar nueva matriculación
    const { data, error } = await supabase
        .from('matriculaciones')
        .insert(matriculacion)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getStudentEnrollments(perfilId: string) {
    const { data, error } = await supabase
        .from('matriculaciones')
        .select(`
            id,
            anio_lectivo,
            instrumentos_planes (
                instrumento_id,
                nombre_completo,
                plan_estudios
            )
        `)
        .eq('perfil_id', perfilId);

    if (error) {
        console.error('Error fetching enrollments:', error);
        return [];
    }
    return data;
}

export async function getAllEnrollments(anio: number) {
    const { data, error } = await supabase
        .from('matriculaciones')
        .select(`
            id,
            anio_lectivo,
            fecha_inscripcion,
            perfil:perfiles (
                dni,
                nombre,
                apellido
            ),
            instrumento:instrumentos_planes (
                nombre_completo,
                plan_estudios
            )
        `)
        .eq('anio_lectivo', anio)
    if (error) {
        console.error('Error fetching all enrollments:', error);
        return [];
    }

    // Ordenar en memoria por apellido, nombre y dni para asegurar consistencia
    // dado que el ordenamiento por tablas relacionadas en PostgREST puede ser limitado.
    return (data || []).sort((a: any, b: any) => {
        const apellidoA = (a.perfil?.apellido || '').toUpperCase();
        const apellidoB = (b.perfil?.apellido || '').toUpperCase();
        if (apellidoA !== apellidoB) return apellidoA.localeCompare(apellidoB);

        const nombreA = (a.perfil?.nombre || '').toUpperCase();
        const nombreB = (b.perfil?.nombre || '').toUpperCase();
        if (nombreA !== nombreB) return nombreA.localeCompare(nombreB);

        const dniA = (a.perfil?.dni || '');
        const dniB = (b.perfil?.dni || '');
        return dniA.localeCompare(dniB);
    });
}
