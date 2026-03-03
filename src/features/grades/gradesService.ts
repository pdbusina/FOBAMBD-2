import { supabase } from '@/lib/supabase';

export interface Materia {
    id: string;
    nombre_materia: string;
    plan_estudios: string;
    anio: number | null;
}

export interface Nota {
    id?: string;
    perfil_id: string;
    dni: string;
    nombre_materia: string;
    materia_id: string;
    obs_optativa_ensamble?: string;
    nota: string;
    condicion: 'promoción' | 'examen' | 'equivalencia';
    libro_folio?: string;
    fecha?: string;
}

export async function getMateriasByPlan(planEstudios: string) {
    const { data, error } = await supabase
        .from('materias')
        .select('*')
        .eq('plan_estudios', planEstudios)
        .order('anio', { ascending: true })
        .order('nombre_materia', { ascending: true });

    if (error) throw error;
    return data as Materia[];
}

export async function getNotaExistente(dni: string, nombreMateria: string) {
    const { data, error } = await supabase
        .from('notas')
        .select('*')
        .eq('dni', dni)
        .eq('nombre_materia', nombreMateria)
        .maybeSingle();

    if (error) throw error;
    return data as Nota | null;
}

export async function upsertNota(nota: Nota) {
    const { data, error } = await supabase
        .from('notas')
        .upsert(nota, {
            onConflict: 'dni, nombre_materia'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getStudentEnrollments(dni: string) {
    // Buscar estudiante por DNI para obtener su perfil_id
    const { data: profile, error: profileError } = await supabase
        .from('perfiles')
        .select('id, nombre, apellido')
        .eq('dni', dni)
        .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) return null;

    // Buscar todas sus matriculaciones
    const { data: enrollments, error: enrollError } = await supabase
        .from('matriculaciones')
        .select(`
            id,
            anio_lectivo,
            instrumentos_planes (
                id,
                plan_estudios,
                nombre_completo
            )
        `)
        .eq('perfil_id', profile.id);

    if (enrollError) throw enrollError;

    return {
        profile,
        enrollments: enrollments.map((en: any) => ({
            id: en.id,
            anio_lectivo: en.anio_lectivo,
            plan_id: en.instrumentos_planes.id,
            plan_estudios: en.instrumentos_planes.plan_estudios,
            nombre_plan: en.instrumentos_planes.nombre_completo
        }))
    };
}
