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
    materia_id?: string;
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

export async function getUniqueMateriaNames() {
    const { data, error } = await supabase
        .from('materias')
        .select('nombre_materia')
        .order('nombre_materia', { ascending: true });

    if (error) throw error;

    // Devolver nombres únicos
    const names = Array.from(new Set(data.map(m => m.nombre_materia)));
    return names;
}

export async function getEnrolledStudentsList() {
    // Obtenemos perfiles que tienen al menos una matriculación
    // OPTIMIZACIÓN: Quitamos el .order('perfiles(dni)') que fuerza un sort complejo en la base de datos
    // y ralentiza masivamente la consulta. Ordenaremos en memoria local.
    const { data, error } = await supabase
        .from('matriculaciones')
        .select(`
            perfil_id,
            perfiles (
                dni,
                nombre,
                apellido
            )
        `);

    if (error) throw error;

    // Mapear y eliminar duplicados (un alumno puede estar matriculado en varios planes)
    const studentsMap = new Map();
    data.forEach((item: any) => {
        if (item.perfiles && !studentsMap.has(item.perfiles.dni)) {
            studentsMap.set(item.perfiles.dni, {
                id: item.perfil_id,
                dni: item.perfiles.dni,
                nombre: item.perfiles.nombre,
                apellido: item.perfiles.apellido
            });
        }
    });

    // Ordenamiento rápido en el cliente
    return Array.from(studentsMap.values()).sort((a, b) => a.dni.localeCompare(b.dni));
}

export async function upsertNotasBulk(notas: Nota[]) {
    const { data, error } = await supabase
        .from('notas')
        .upsert(notas, {
            onConflict: 'dni, nombre_materia'
        });

    if (error) throw error;
    return data;
}

export async function getNotasExistentesBulk(dnis: string[], nombreMateria: string) {
    if (dnis.length === 0 || !nombreMateria) return [];

    const { data, error } = await supabase
        .from('notas')
        .select('dni, nota, condicion, fecha')
        .in('dni', dnis)
        .eq('nombre_materia', nombreMateria);

    if (error) throw error;
    return data;
}

export async function getTranscriptData(dni: string, planEstudios: string) {
    // 1. Obtener todas las materias de ese plan
    const { data: materias, error: matError } = await supabase
        .from('materias')
        .select('*')
        .eq('plan_estudios', planEstudios)
        .order('anio', { ascending: true })
        .order('nombre_materia', { ascending: true });

    if (matError) throw matError;

    // 2. Obtener todas las notas del alumno (por DNI)
    const { data: notas, error: notasError } = await supabase
        .from('notas')
        .select('*')
        .eq('dni', dni);

    if (notasError) throw notasError;

    return {
        materias: materias as Materia[],
        notas: notas as Nota[]
    };
}
