import { supabase } from '@/lib/supabase';

export interface StudentReportData {
    nombre: string;
    apellido: string;
    dni: string;
    plan: string;
    instrumento: string;
    anio_lectivo: number;
}

export async function verifyEnrollmentByDni(dni: string): Promise<StudentReportData | null> {
    const currentYear = new Date().getFullYear();

    // 1. Get student profile by DNI
    const { data: profile, error: profileError } = await supabase
        .from('perfiles')
        .select('id, nombre, apellido, dni')
        .eq('dni', dni)
        .single();

    if (profileError || !profile) {
        console.error('Error fetching profile or student not found:', profileError);
        return null;
    }

    // 2. Get active enrollment for current year
    const { data: enrollment, error: enrollmentError } = await supabase
        .from('matriculaciones')
        .select(`
            anio_lectivo,
            instrumento:instrumentos_planes (
                nombre_completo,
                plan_estudios
            )
        `)
        .eq('perfil_id', profile.id)
        .eq('anio_lectivo', currentYear)
        .maybeSingle();

    if (enrollmentError || !enrollment) {
        console.error('Error fetching enrollment or student not enrolled for current year:', enrollmentError);
        return null;
    }

    const ins = enrollment.instrumento as any;

    return {
        nombre: profile.nombre,
        apellido: profile.apellido,
        dni: profile.dni,
        plan: ins.plan_estudios,
        instrumento: ins.nombre_completo,
        anio_lectivo: enrollment.anio_lectivo
    };
}
