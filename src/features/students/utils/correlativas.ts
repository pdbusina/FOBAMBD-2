export const INSTRUMENTOS_530 = [
    "Arpa", "Bajo Eléctrico", "Bandoneon", "Batería", "Clarinete", 
    "Contrabajo", "Corno", "Flauta Dulce", "Flauta Traversa", 
    "Guitarra Clásica", "Guitarra Eléctrica", "Guitarra Popular", 
    "Oboe", "Percusión Académica", "Percusión Folklórica", 
    "Piano", "Saxo", "Sikus-Quena", "Trombón", "Trompeta", 
    "Violín", "Viola", "Violoncello"
];

const CORRELATIVAS_FIJAS: Record<string, string[]> = {
    // --- PLAN 532 CANTO ---
    "Canto 2": ["Canto 1", "Lenguaje Musical 1"],
    "Dicción Italiana 2": ["Dicción Italiana 1"],
    "Canto 3": ["Canto 2", "Lenguaje Musical 2", "Ensamble 1"],
    "Entrenamiento Escénico": ["Expresión Corporal", "Lenguaje Musical 2"],
    "Canto 4": ["Canto 3", "Lenguaje Musical 3", "Ensamble 2", "Apreciación Musical 1", "Entrenamiento Escénico", "Dicción Alemana 1", "Educación Vocal"],
    "Dicción Alemana 2": ["Canto 3", "Lenguaje Musical 3", "Ensamble 2", "Apreciación Musical 1", "Entrenamiento Escénico", "Dicción Alemana 1", "Educación Vocal"],
    "Canto 5": ["Canto 4", "Lenguaje Musical 4", "Ensamble 3"],

    // --- PLAN 533 CANTO POPULAR ---
    "Canto Popular 2": ["Canto Popular 1", "Lenguaje Musical 1"],
    "Dicción Portuguesa 2": ["Dicción Portuguesa 1"],
    "Canto Popular 3": ["Canto Popular 2", "Lenguaje Musical 2", "Ensamble 1"],
    "Danzas Folklóricas": ["Expresión Corporal"], 
    "Canto Popular 4": ["Canto Popular 3", "Lenguaje Musical 3", "Ensamble 2", "Apreciación Musical 1", "Danzas Folklóricas", "Dicción Inglesa 1", "Educación Vocal"],
    "Dicción Inglesa 2": ["Canto Popular 3", "Lenguaje Musical 3", "Ensamble 2", "Apreciación Musical 1", "Danzas Folklóricas", "Dicción Inglesa 1", "Educación Vocal"],
    "Canto Popular 5": ["Canto Popular 4", "Lenguaje Musical 4", "Ensamble 3"]
};

// Normalizar texto para comparaciones sin tildes ni mayúsculas
export const normalizarTexto = (texto: string) => {
    return texto.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/-/g, " ");
};

export interface ReglasPlan {
    reglas: Record<string, string[]>;
    esPlan530: boolean;
}

export const getReglasPorPlan = (nombrePlan: string): ReglasPlan => {
    let reglas = { ...CORRELATIVAS_FIJAS }; 
    let esPlan530 = false;

    const nombrePlanNorm = normalizarTexto(nombrePlan || "");
    const instrumentoEncontrado = INSTRUMENTOS_530.find(inst => 
        nombrePlanNorm.includes(normalizarTexto(inst))
    );

    let main1, main2, main3, main4, main5;

    if (instrumentoEncontrado) {
        esPlan530 = true;
        
        // Mantener el nombre exacto del instrumento para armar el string
        const instrumento = INSTRUMENTOS_530.find(i => normalizarTexto(i) === normalizarTexto(instrumentoEncontrado))!;

        main1 = `Instrumento Fundamental 1: ${instrumento}`;
        main2 = `Instrumento Fundamental 2: ${instrumento}`;
        main3 = `Instrumento Fundamental 3: ${instrumento}`;
        main4 = `Instrumento Fundamental 4: ${instrumento}`;
        main5 = `Instrumento Fundamental 5: ${instrumento}`;
    } else if (nombrePlanNorm.includes("canto popular")) {
        main1 = "Canto Popular 1";
        main2 = "Canto Popular 2";
        main3 = "Canto Popular 3";
        main4 = "Canto Popular 4";
        main5 = "Canto Popular 5";
    } else if (nombrePlanNorm.includes("canto")) {
        main1 = "Canto 1";
        main2 = "Canto 2";
        main3 = "Canto 3";
        main4 = "Canto 4";
        main5 = "Canto 5";
    }

    if (main1 && main2 && main3 && main4 && main5) {
        // AÑO 2
        const reqAno2 = [main1, "Lenguaje Musical 1"];
        if (!reglas[main2]) reglas[main2] = reqAno2;
        if (!reglas["Lenguaje Musical 2"]) reglas["Lenguaje Musical 2"] = reqAno2;
        if (!reglas["Ensamble 1"]) reglas["Ensamble 1"] = reqAno2;
        if (!reglas["Coro 2"]) reglas["Coro 2"] = ["Coro 1"];

        // AÑO 3
        const reqAno3 = [main2, "Lenguaje Musical 2", "Ensamble 1"];
        if (!reglas[main3]) reglas[main3] = reqAno3;
        if (!reglas["Lenguaje Musical 3"]) reglas["Lenguaje Musical 3"] = reqAno3;
        if (!reglas["Ensamble 2"]) reglas["Ensamble 2"] = reqAno3;
        if (!reglas["Apreciación Musical 1"]) reglas["Apreciación Musical 1"] = [main1, "Lenguaje Musical 2"];

        // AÑO 4
        // En plan 530, se pide Expresión Corporal o Danzas Folklóricas (conmutables).
        // En otros planes, las materias obligatorias específicas varían, así que usamos el arreglo estándar 
        // y la lógica de conmutación de analyzeCorrelativas evaluará esPlan530.
        const reqAno4 = [
            main3, "Lenguaje Musical 3", "Ensamble 2", 
            "Apreciación Musical 1", "Expresión Corporal", "Danzas Folklóricas"
        ];
        if (!reglas[main4]) reglas[main4] = reqAno4;
        if (!reglas["Lenguaje Musical 4"]) reglas["Lenguaje Musical 4"] = reqAno4;
        if (!reglas["Ensamble 3"]) reglas["Ensamble 3"] = reqAno4;
        if (!reglas["Apreciación Musical 2"]) reglas["Apreciación Musical 2"] = reqAno4;
        if (!reglas["Optativa 1"]) reglas["Optativa 1"] = reqAno4;

        // AÑO 5
        const reqAno5 = [main4, "Lenguaje Musical 4", "Ensamble 3"];
        if (!reglas[main5]) reglas[main5] = reqAno5;
        if (!reglas["Seminario Armonía"]) reglas["Seminario Armonía"] = reqAno5;
        if (!reglas["Seminario Ritmo"]) reglas["Seminario Ritmo"] = reqAno5;
        if (!reglas["Ensamble 4"]) reglas["Ensamble 4"] = reqAno5;
        if (!reglas["Optativa 2"]) reglas["Optativa 2"] = ["Optativa 1"];
    }

    return { reglas, esPlan530 };
};

export interface MateriaAnalisis {
    nombre: string;
    motivo?: string;
    faltan?: string[];
}

export interface ReporteCorrelativas {
    aprobadas: string[];
    disponibles: MateriaAnalisis[];
    bloqueadas: MateriaAnalisis[];
}

export const analyzeCorrelativas = (
    planTarget: string,
    todasLasMateriasDelPlan: string[],
    materiasAprobadas: string[]
): ReporteCorrelativas => {
    const { reglas, esPlan530 } = getReglasPorPlan(planTarget);
    
    const aprobadas = new Set(materiasAprobadas);

    // LÓGICA DE MOVIMIENTO (PLAN 530)
    // Si el plan es 530, tener aprobada UNA de las dos ya cuenta como tener "crédito de movimiento"
    // y excluye a la otra de ser cursada.
    const tieneMovimiento = esPlan530 && (aprobadas.has("Expresión Corporal") || aprobadas.has("Danzas Folklóricas"));

    const reporte: ReporteCorrelativas = {
        aprobadas: Array.from(aprobadas),
        disponibles: [],
        bloqueadas: []
    };

    const materiasOrdenadas = [...todasLasMateriasDelPlan].sort();

    materiasOrdenadas.forEach(materia => {
        if (aprobadas.has(materia)) return; // Ya está aprobada, no se muestra ni disponible ni bloqueada.

        // FILTRO VISUAL DE DISPONIBILIDAD (MUTUAMENTE EXCLUYENTES)
        // Si ya tiene una aprobada, no mostrar la otra como para cursar.
        if (esPlan530 && tieneMovimiento && (materia === "Expresión Corporal" || materia === "Danzas Folklóricas")) {
            return;
        }

        const requisitos = reglas[materia] || [];
        
        if (requisitos.length === 0) {
            reporte.disponibles.push({ nombre: materia, motivo: "Sin correlativas previas" });
        } else {
            const faltantes = requisitos.filter(req => {
                // VALIDACIÓN ESPECIAL: Si piden Corporal o Danzas, y tiene crédito de movimiento, el requisito está cumplido.
                if (esPlan530 && (req === "Expresión Corporal" || req === "Danzas Folklóricas")) {
                    if (tieneMovimiento) return false; // No falta
                }
                
                return !aprobadas.has(req);
            });
            
            if (faltantes.length === 0) {
                reporte.disponibles.push({ nombre: materia, motivo: "Correlativas completas" });
            } else {
                reporte.bloqueadas.push({ nombre: materia, faltan: faltantes });
            }
        }
    });

    return reporte;
};
