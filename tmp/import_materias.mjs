import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // I need the service role key for bulk inserts if RLS is tight, or just hope staff policy works

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importMaterias() {
    const csvData = fs.readFileSync('materias_fobam.csv', 'utf-8');
    const lines = csvData.split('\n');

    // Skip header: plan;anio;nombre
    const materias = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [plan, anio, nombre] = line.split(';');
        if (plan && nombre) {
            materias.push({
                plan_estudios: plan,
                anio: parseInt(anio) || null,
                nombre_materia: nombre
            });
        }
    }

    console.log(`Leídas ${materias.length} materias. Iniciando inserción...`);

    // Insert in chunks of 100 to avoid issues
    const chunkSize = 100;
    for (let i = 0; i < materias.length; i += chunkSize) {
        const chunk = materias.slice(i, i + chunkSize);
        const { error } = await supabase
            .from('materias')
            .upsert(chunk, { onConflict: 'nombre_materia, plan_estudios' });

        if (error) {
            console.error(`Error en chunk ${i / chunkSize}:`, error.message);
        } else {
            console.log(`Insertado chunk ${i / chunkSize + 1}`);
        }
    }

    console.log('Importación finalizada.');
}

importMaterias();
