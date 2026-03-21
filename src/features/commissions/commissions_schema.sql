-- 1. Tabla de Comisiones (Horarios)
-- Flexibilizada para vincular por nombre de materia
CREATE TABLE IF NOT EXISTS public.comisiones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  materia_nombre text NOT NULL,
  dia text NOT NULL, -- Lunes, Martes, Miércoles, Jueves, Viernes, Sábado
  hora text NOT NULL, -- Ej: '18:00'
  docente_nombre text NOT NULL,
  aula text,
  cupo_maximo integer DEFAULT 30,
  anio_lectivo integer NOT NULL DEFAULT extract(year from now()),
  creado_en timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Inscripciones a Cursada
CREATE TABLE IF NOT EXISTS public.inscripciones_cursada (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil_id uuid REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
  comision_id uuid REFERENCES public.comisiones(id) ON DELETE CASCADE NOT NULL,
  anio_lectivo integer NOT NULL DEFAULT extract(year from now()),
  fecha_inscripcion timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  estado text DEFAULT 'inscripto' CHECK (estado IN ('inscripto', 'regular', 'libre', 'baja')),
  
  -- Restricción: Un alumno no puede inscribirse a la misma comisión el mismo año
  UNIQUE(perfil_id, comision_id, anio_lectivo)
);

-- 3. Habilitar RLS
ALTER TABLE public.comisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscripciones_cursada ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para Comisiones
-- El Staff (Admin/Preceptor) tiene control total
CREATE POLICY "Staff gestiona comisiones" ON public.comisiones FOR ALL 
USING (exists (select 1 from public.perfiles where id = auth.uid() and rol in ('admin', 'preceptor')));

-- Todos los usuarios autenticados pueden ver las comisiones
CREATE POLICY "Todos ven comisiones" ON public.comisiones FOR SELECT 
USING (auth.role() = 'authenticated');

-- 5. Políticas para Inscripciones a Cursada
-- El Staff gestiona todas las inscripciones
CREATE POLICY "Staff gestiona inscripciones_cursada" ON public.inscripciones_cursada FOR ALL 
USING (exists (select 1 from public.perfiles where id = auth.uid() and rol in ('admin', 'preceptor')));

-- Los estudiantes ven sus propias inscripciones
CREATE POLICY "Estudiantes ven sus inscripciones_cursada" ON public.inscripciones_cursada FOR SELECT
USING (auth.uid() = perfil_id);
