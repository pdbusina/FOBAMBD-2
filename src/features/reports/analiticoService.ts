import { getTranscriptData, Materia, Nota } from '../grades/gradesService';

export interface ProcessedMateria extends Materia {
    materiaNombre: string;
    notaData: Nota | null;
}

export type TranscriptYears = Record<string, ProcessedMateria[]>;

export async function processStudentTranscript(dni: string, planEstudios: string): Promise<TranscriptYears> {
    const rawData = await getTranscriptData(dni, planEstudios);
    
    // 1. Process each subject, searching for a valid passing grade
    const materiasProcesadas: ProcessedMateria[] = rawData.materias.map(m => {
        // Helper function to remove plan numbers and prefixes like "530 Piano - " from strings to get the pure subject name
        const cleanSubjectName = (name: string) => {
            if (!name) return '';
            // Remove leading plan numbers like "530 ", "532 ", then any instrument name and dash "Piano - "
            // The regex matches 3 digits optionally followed by any characters until a dash, or just 3 digits and a space
            return name.replace(/^\d{3}(.*?-\s*|\s+)/, '').trim().toLowerCase();
        };

        const normalPlanName = cleanSubjectName(m.nombre_materia);

        // Find the best grade that meets approval criteria
        const notaValida = rawData.notas.find(n => {
            const normalNotaName = cleanSubjectName(n.nombre_materia);
            if (normalNotaName !== normalPlanName) return false;

            const califNumber = parseFloat(n.nota);
            const isNumeric = !isNaN(califNumber);
            const condicionNormal = n.condicion?.trim().toLowerCase();

            // Official approval criteria
            if (condicionNormal === 'promoción') return isNumeric && califNumber >= 7;
            if (condicionNormal === 'examen' || condicionNormal === 'equivalencia') return isNumeric && califNumber >= 4;

            // Approving explicit strings (A = Aprobado, P = Promovido, E = Equivalencia)
            const notaString = n.nota?.trim().toUpperCase();
            if (['A', 'P', 'E'].includes(notaString)) return true;

            return false;
        });

        // Detail for Optativas/Ensambles/Espacios
        let nombreVisible = m.nombre_materia;
        const esMateriaEspecial = /ensamble|optativa|espacio/i.test(m.nombre_materia);
        if (esMateriaEspecial && notaValida?.obs_optativa_ensamble) {
            nombreVisible += ` (${notaValida.obs_optativa_ensamble})`;
        }

        return {
            ...m,
            materiaNombre: nombreVisible,
            notaData: notaValida || null
        };
    });

    let resultadoFinal = materiasProcesadas;

    // 2. Specific Logic for Plan 530 (Mutually exclusive subjects in 1st year)
    if (planEstudios && planEstudios.includes('530')) {
        const materias1Anio = materiasProcesadas.filter(m => Number(m.anio) === 1);

        const findMat = (regex: RegExp) => materias1Anio.find(m =>
            regex.test(m.nombre_materia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
        );

        const matEC = findMat(/expresion corporal/);
        const matDF = findMat(/danzas folkloricas/);

        if (matEC?.notaData) {
            // If passed Expresión Corporal, hide Danzas Folklóricas
            resultadoFinal = resultadoFinal.filter(m => m.id !== matDF?.id);
        } else if (matDF?.notaData) {
            // If passed Danzas Folklóricas, hide Expresión Corporal
            resultadoFinal = resultadoFinal.filter(m => m.id !== matEC?.id);
        }
    }

    // 3. Group by year
    return resultadoFinal.reduce((acc, m) => {
        const anioKey = m.anio ? m.anio.toString() : 'N/A';
        if (!acc[anioKey]) acc[anioKey] = [];
        acc[anioKey].push(m);
        return acc;
    }, {} as TranscriptYears);
}
