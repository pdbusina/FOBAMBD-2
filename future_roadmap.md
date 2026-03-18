# Hoja de Ruta: Próximos Módulos y Operación

## 1. Gestión de Cursadas y Comisiones
Este módulo transformará el sistema de un registro de notas a una herramienta de gestión diaria de clases.

### Componentes:
- **Estructura de Datos:** Tablas para `comisiones`, `aulas`, `horarios` y `docentes`.
- **Inscripción a Cursada:** Interfaz para asignar alumnos a comisiones específicas.
- **Asistencia Digital:**
    - Generación de PDF de planillas de asistencia (tradicional).
    - Interfaz móvil para que el preceptor/docente marque presente/ausente.
- **Calificaciones por Proceso:** Carga de notas parciales y finales vinculadas a la comisión.

## 2. Automatización y Cargas Masivas
- **ETL (Extract, Transform, Load):** Implementar un módulo en el Admin para subir archivos CSV/Excel que pueblen automáticamente las tablas sin intervención manual, usando la lógica de validación que ya creamos.

## 3. Estrategia de Backup (Supabase)
Como usamos Supabase en la nube, el backup se puede manejar de dos formas:
- **Backup Automático (Supabase):** En el plan gratuito es manual, pero podemos crear un **Script de GitHub Action** que una vez por semana use `supabase db dump` para descargar un archivo `.sql` con toda la estructura y datos, y lo guarde en tu repositorio de forma privada.
- **Backup Local:** Un script en tu PC que use la herramienta de línea de comandos de Supabase para clonar la base de datos a un archivo local periódicamente.

## 4. Hosting en NAS Casero (Estrategia)
Para hacer subsistir el sistema en un servidor propio (Synology, QNAP o PC con Docker):

### Opciones:
1. **Docker (Recomendado):** Podemos empaquetar la App de Next.js en un contenedor Docker. 
    - **Ventaja:** Funciona en casi cualquier NAS moderno.
    - **Base de Datos:** Puedes seguir usando Supabase Cloud (gratis) para la base de datos, mientras que la "cara visible" (la web) corre en tu casa. Esto garantiza que si tu internet se corta, los datos no se pierden porque están en la nube.
2. **Self-Hosted Supabase:** Es posible correr "todo Supabase" en un NAS (usando Docker Compose).
    - **Desafío:** Requiere un NAS potente (mínimo 8GB de RAM) y conocimientos técnicos avanzados para el mantenimiento.
    - **Recomendación:** Mantener la DB en Supabase Cloud y solo hostear la Web en el NAS si quieres ahorrar en costos de Vercel (aunque Vercel es gratis para este tráfico).

### Siguiente paso sugerido:
Empezar con el **Diseño de la Base de Datos para Comisiones**, definiendo qué datos exactos necesitas de los docentes y cómo se dividen las aulas.
