import { supabase } from '@/lib/supabase';
import { getTranscriptData, getStudentEnrollments } from '@/features/grades/gradesService';
import { analyzeCorrelativas } from '@/features/students/utils/correlativas';

export interface EnrollmentCursada {
    id: string;
    perfil_id: string;
    comision_id: string;
    anio_lectivo: number;
    fecha_inscripcion: string;
    estado: 'inscripto' | 'regular' | 'libre' | 'baja';
    es_excepcion: boolean;
    obs_optativa_ensamble?: string;
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
    async enrollStudent(perfilId: string, comisionId: string, esExcepcion: boolean = false, obsOptativaEnsamble: string = '') {
        const currentYear = new Date().getFullYear();

        // 1. Obtener datos del alumno (DNI y Matriculaciones)
        const { data: profile, error: profileError } = await supabase
            .from('perfiles')
            .select('dni')
            .eq('id', perfilId)
            .single();

        if (profileError) throw profileError;
        const studentDni = profile.dni;

        // 2. Obtener la comisión y materia
        const { data: comision, error: errorCom } = await supabase
            .from('comisiones')
            .select('cupo_maximo, materia_nombre')
            .eq('id', comisionId)
            .single();

        if (errorCom) throw errorCom;

        // 3. VALIDACIONES ACADÉMICAS (Sólo si NO es excepción)
        if (!esExcepcion) {
            const enrollData = await getStudentEnrollments(studentDni);
            if (!enrollData || enrollData.enrollments.length === 0) {
                throw new Error("El estudiante debe estar matriculado en al menos un plan para inscribirse a cursadas.");
            }

            // Verificar en todos los planes si ya la aprobó o si cumple correlativas
            let yaAprobada = false;
            let habilitada = false;
            let motivosBloqueo: string[] = [];

            for (const plan of enrollData.enrollments) {
                const { materias, notas } = await getTranscriptData(studentDni, plan.nombre_plan);
                
                // ¿Ya aprobó esta materia?
                const notaObj = notas.find(n => n.nombre_materia === comision.materia_nombre);
                if (notaObj) {
                    const valor = parseFloat(notaObj.nota);
                    if ((notaObj.condicion === 'promoción' && valor >= 7) || 
                        (['examen', 'equivalencia'].includes(notaObj.condicion) && valor >= 4)) {
                        yaAprobada = true;
                        break;
                    }
                }

                // Ver correlativas
                const nombresMaterias = materias.map(m => m.nombre_materia);
                const aprobadas = notas
                    .filter(n => {
                        const v = parseFloat(n.nota);
                        return (n.condicion === 'promoción' && v >= 7) || 
                               (['examen', 'equivalencia'].includes(n.condicion) && v >= 4);
                    })
                    .map(n => n.nombre_materia);

                const reporte = analyzeCorrelativas(plan.nombre_plan, nombresMaterias, aprobadas);
                const isDisp = reporte.disponibles.some(m => m.nombre === comision.materia_nombre);
                if (isDisp) {
                    habilitada = true;
                } else {
                   const bloq = reporte.bloqueadas.find(m => m.nombre === comision.materia_nombre);
                   if (bloq && bloq.faltan) motivosBloqueo.push(...bloq.faltan);
                }
            }

            if (yaAprobada) {
                throw new Error(`El estudiante ya tiene aprobada la materia ${comision.materia_nombre}.`);
            }

            if (!habilitada) {
                throw new Error(`Inscripción rechazada: Faltan correlativas (${motivosBloqueo.join(", ")}). Utilice la opción 'Inscripción por Excepción' si corresponde.`);
            }
        }

        // 4. Verificar cupo
        const { count, error: errorCount } = await supabase
            .from('inscripciones_cursada')
            .select('*', { count: 'exact', head: true })
            .eq('comision_id', comisionId);

        if (errorCount) throw errorCount;

        if (count !== null && count >= comision.cupo_maximo) {
            throw new Error(`La comisión de ${comision.materia_nombre} ya ha alcanzado su cupo máximo (${comision.cupo_maximo}).`);
        }

        // 5. Insertar inscripción
        const { data, error } = await supabase
            .from('inscripciones_cursada')
            .insert([{
                perfil_id: perfilId,
                comision_id: comisionId,
                anio_lectivo: currentYear,
                es_excepcion: esExcepcion,
                obs_optativa_ensamble: obsOptativaEnsamble
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
    },

    async getStudentsByCommission(comisionId: string) {
        const { data, error } = await supabase
            .from('inscripciones_cursada')
            .select(`
                perfil_id,
                obs_optativa_ensamble,
                perfiles (
                    dni,
                    nombre,
                    apellido
                )
            `)
            .eq('comision_id', comisionId)
            .order('perfiles(apellido)', { ascending: true });

        if (error) throw error;
        return data as any[];
    }
};
