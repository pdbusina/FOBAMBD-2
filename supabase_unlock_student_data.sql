-- 1. Permitir que los estudiantes vean el catálogo de instrumentos
-- Esto es necesario para que puedan unir sus matriculaciones con el nombre del plan
DROP POLICY IF EXISTS "Estudiantes ven instrumentos" ON public.instrumentos_planes;
CREATE POLICY "Estudiantes ven instrumentos" ON public.instrumentos_planes FOR SELECT 
USING (true);

-- 2. Permitir que los estudiantes vean sus PROPIAS matriculaciones
DROP POLICY IF EXISTS "Estudiantes ven su propia matriculacion" ON public.matriculaciones;
CREATE POLICY "Estudiantes ven su propia matriculacion" ON public.matriculaciones FOR SELECT 
USING (auth.uid() = perfil_id);

-- 3. Permitir que los estudiantes vean el catálogo de materias
-- Esto es necesario para el módulo de Cursados (Correlatividades)
DROP POLICY IF EXISTS "Estudiantes ven materias" ON public.materias;
CREATE POLICY "Estudiantes ven materias" ON public.materias FOR SELECT 
USING (true);

-- Nota: Las políticas para Staff (Admin/Preceptor) ya existen y se mantienen.
-- La tabla 'notas' ya tiene su política de estudiantes configurada correctamente.
