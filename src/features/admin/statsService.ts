import { supabase } from '@/lib/supabase';

export interface AgeCategoryStats {
    [key: string]: number;
}

export interface YearMatrixRow {
    total: number;
    masculinos: number;
    ages: AgeCategoryStats;
}

export interface StatsData {
    totalEstudiantesActivos: number;
    totalMatriculacionesInstrumento: number;
    totalInscripcionesMaterias: number;
    totalInstrumentos: number;
    porInstrumento: any[];
    porMateria: any[];
    porEdadGeneral: any[];
    porGenero: any[];
    porNacionalidad: any[];
    ageMatrix: { [anio: number]: YearMatrixRow };
}

const calculateAge = (birthDateString: string | null) => {
    if (!birthDateString) return null;
    try {
        const today = new Date();
        const birthDate = new Date(birthDateString.includes('T') ? birthDateString : `${birthDateString}T00:00:00`);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    } catch (e) {
        return null;
    }
};

const getMatrixAgeCategory = (age: number | null) => {
    if (age === null) return 'N/D';
    if (age < 12) return '<12';
    if (age >= 12 && age <= 19) return age.toString();
    if (age >= 20 && age <= 24) return '20-24';
    if (age >= 25) return '+25';
    return 'N/D';
};

const getGeneralAgeRange = (age: number | null) => {
    if (age === null) return 'Sin datos';
    if (age < 12) return "Niños (<12)";
    else if (age < 18) return "Adolescentes (12-17)";
    else if (age < 30) return "Jóvenes (18-29)";
    else if (age < 50) return "Adultos (30-49)";
    else return "Mayores (50+)";
};

const extractYearFromSubject = (materia: string) => {
    const mat = materia.toLowerCase();
    const esTroncal = mat.includes("instrumento") || mat.includes("canto");
    const esLenguaje = mat.includes("lenguaje musical");

    if (esTroncal || esLenguaje) {
        const match = materia.match(/(\d+)(?!.*\d)/);
        if (match) return parseInt(match[0]);
    }
    return null;
};

export const statsService = {
    async getDashboardStats(anio?: number): Promise<StatsData> {
        const currentYear = anio || new Date().getFullYear();

        // 1. Fetch data from Supabase
        const { data: matriculaciones } = await supabase
            .from('matriculaciones')
            .select(`
                *,
                perfiles (*),
                instrumentos_planes (instrumento_id)
            `)
            .eq('anio_lectivo', currentYear);

        const { data: estudiantesDB } = await supabase
            .from('perfiles')
            .select('*');

        const { data: inscripcionesMaterias } = await supabase
            .from('inscripciones_cursada')
            .select(`
                *,
                perfiles (dni, genero, fecha_nacimiento),
                comisiones (materia_nombre)
            `)
            .eq('anio_lectivo', currentYear);

        if (!matriculaciones || !estudiantesDB || !inscripcionesMaterias) {
            throw new Error("Error cargando datos para estadísticas");
        }

        // --- PROCESSING ---

        // Map para acceso rápido a estudiantes
        const mapEstudiantes: { [dni: string]: any } = {};
        estudiantesDB.forEach(s => mapEstudiantes[s.dni] = s);

        // Identificar estudiantes activos (matriculados en plan/instrumento este año)
        const dnisActivos = new Set(matriculaciones.map(m => m.perfiles?.dni));
        const estudiantesActivosLista = estudiantesDB.filter(s => dnisActivos.has(s.dni));

        // Contadores
        const countInstrumento: { [k: string]: number } = {};
        matriculaciones.forEach(m => {
            const inst = m.instrumentos_planes?.instrumento_id || 'Sin definir';
            countInstrumento[inst] = (countInstrumento[inst] || 0) + 1;
        });

        const countNac: { [k: string]: number } = {};
        const countGen: { [k: string]: number } = {};
        const countEdadGeneral: { [k: string]: number } = {};

        estudiantesActivosLista.forEach(s => {
            const nac = s.nacionalidad || 'No especificada';
            countNac[nac] = (countNac[nac] || 0) + 1;
            const gen = s.genero || 'No especificado';
            countGen[gen] = (countGen[gen] || 0) + 1;
            const edad = calculateAge(s.fecha_nacimiento);
            const rango = getGeneralAgeRange(edad);
            countEdadGeneral[rango] = (countEdadGeneral[rango] || 0) + 1;
        });

        const countMateria: { [k: string]: number } = {};
        inscripcionesMaterias.forEach(c => {
            const matNombre = c.comisiones?.materia_nombre || 'Desconocida';
            countMateria[matNombre] = (countMateria[matNombre] || 0) + 1;
        });

        const toArray = (obj: any, keyName: string = "nombre"): any[] => Object.entries(obj)
            .map(([k, v]) => ({ [keyName]: k, count: v as number }))
            .sort((a, b) => b.count - a.count);

        // --- EDAD MATRIX ---
        const matrix: { [anio: number]: YearMatrixRow } = {};
        for (let i = 1; i <= 5; i++) {
            matrix[i] = {
                total: 0,
                masculinos: 0,
                ages: {
                    '<12': 0, '12': 0, '13': 0, '14': 0, '15': 0,
                    '16': 0, '17': 0, '18': 0, '19': 0, '20-24': 0, '+25': 0, 'N/D': 0
                }
            };
        }

        // Agrupar materias por alumno (DNI)
        const mapCursadasPorDNI: { [dni: string]: string[] } = {};
        inscripcionesMaterias.forEach(c => {
            const dni = c.perfiles?.dni;
            if (!dni) return;
            const matNombre = c.comisiones?.materia_nombre || '';
            if (!mapCursadasPorDNI[dni]) mapCursadasPorDNI[dni] = [];
            mapCursadasPorDNI[dni].push(matNombre);
        });

        Object.keys(mapCursadasPorDNI).forEach(dni => {
            const studentInfo = mapEstudiantes[dni];
            const materiasAlumno = mapCursadasPorDNI[dni] || [];
            if (!studentInfo) return;

            let anioAsignado = null;
            // Primero buscar instrumento fundamental para determinar el año del alumno
            for (let materia of materiasAlumno) {
                if (materia.toLowerCase().includes("instrumento") || materia.toLowerCase().includes("canto")) {
                    const y = extractYearFromSubject(materia);
                    if (y && y >= 1 && y <= 5) {
                        if (!anioAsignado || y > anioAsignado) anioAsignado = y;
                    }
                }
            }
            // Si no tiene instrumento, buscar lenguaje musical
            if (!anioAsignado) {
                for (let materia of materiasAlumno) {
                    if (materia.toLowerCase().includes("lenguaje musical")) {
                        const y = extractYearFromSubject(materia);
                        if (y && y >= 1 && y <= 5) {
                            if (!anioAsignado || y > anioAsignado) anioAsignado = y;
                        }
                    }
                }
            }

            if (anioAsignado) {
                const row = matrix[anioAsignado];
                row.total++;
                if (studentInfo.genero === 'Masculino') row.masculinos++;
                const edad = calculateAge(studentInfo.fecha_nacimiento);
                const cat = getMatrixAgeCategory(edad);
                if (row.ages[cat] !== undefined) row.ages[cat]++;
            }
        });

        return {
            totalEstudiantesActivos: estudiantesActivosLista.length,
            totalMatriculacionesInstrumento: matriculaciones.length,
            totalInscripcionesMaterias: inscripcionesMaterias.length,
            totalInstrumentos: Object.keys(countInstrumento).length,
            porInstrumento: toArray(countInstrumento, "instrumento"),
            porMateria: toArray(countMateria, "materia").slice(0, 20),
            porEdadGeneral: toArray(countEdadGeneral, "rango"),
            porGenero: toArray(countGen, "genero"),
            porNacionalidad: toArray(countNac, "nacionalidad"),
            ageMatrix: matrix
        };
    }
};
