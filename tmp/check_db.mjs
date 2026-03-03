import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdkhctalqkrlkemokpal.supabase.co';
const supabaseAnonKey = 'sb_publishable_zh0gwnDw3KWAIvzcr7BvAA_cCp4ZROr';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStudents() {
    console.log('--- Listado de Estudiantes en la Base de Datos ---');
    const { data, error } = await supabase
        .from('perfiles')
        .select('dni, apellido, nombre, rol')
        .eq('rol', 'estudiante')
        .order('apellido', { ascending: true });

    if (error) {
        console.error('Error al consultar:', error.message);
    } else {
        if (data && data.length > 0) {
            console.table(data);
        } else {
            console.log('No hay estudiantes registrados.');
        }
        console.log(`Total: ${data?.length || 0} estudiantes.`);
    }
}

checkStudents();
