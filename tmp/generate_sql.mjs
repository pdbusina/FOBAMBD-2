import fs from 'fs';
import path from 'path';

const csvPath = 'materias_fobam.csv';
const sqlPath = 'src/features/grades/import_materias.sql';

try {
    const csvData = fs.readFileSync(csvPath, 'latin1');
    const lines = csvData.split(/\r?\n/);

    // Skip header: plan;anio;nombre
    const sqlLines = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(';');
        if (parts.length < 3) continue;

        const plan = parts[0].replace(/'/g, "''");
        const anio = parseInt(parts[1]) || 'NULL';
        const nombre = parts[2].replace(/'/g, "''");

        sqlLines.push(`INSERT INTO public.materias (plan_estudios, anio, nombre_materia) VALUES ('${plan}', ${anio}, '${nombre}') ON CONFLICT (nombre_materia, plan_estudios) DO NOTHING;`);
    }

    fs.writeFileSync(sqlPath, sqlLines.join('\n'));
    console.log(`Successfully generated ${sqlLines.length} INSERT statements in ${sqlPath}`);
} catch (err) {
    console.error('Error generating SQL:', err.message);
    process.exit(1);
}
