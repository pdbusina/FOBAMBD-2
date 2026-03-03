-- 1. Tabla de Materias
CREATE TABLE IF NOT EXISTS public.materias (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_materia text NOT NULL,
  plan_estudios text NOT NULL, -- Ej: '530 Arpa', '532 Canto'
  anio integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(nombre_materia, plan_estudios)
);

-- 2. Tabla de Notas
CREATE TABLE IF NOT EXISTS public.notas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil_id uuid REFERENCES public.perfiles(id) ON DELETE CASCADE,
  dni text NOT NULL,
  nombre_materia text NOT NULL,
  materia_id uuid REFERENCES public.materias(id),
  obs_optativa_ensamble text,
  nota text NOT NULL,
  condicion text NOT NULL CHECK (condicion IN ('promoción', 'examen', 'equivalencia')),
  libro_folio text,
  fecha date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(dni, nombre_materia)
);

-- Habilitar RLS
ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;

-- Políticas para Staff
DROP POLICY IF EXISTS "Staff ve materias" ON public.materias;
CREATE POLICY "Staff ve materias" ON public.materias FOR SELECT 
USING (exists (select 1 from public.perfiles where id = auth.uid() and rol in ('admin', 'preceptor')));

DROP POLICY IF EXISTS "Staff gestiona notas" ON public.notas;
CREATE POLICY "Staff gestiona notas" ON public.notas FOR ALL 
USING (exists (select 1 from public.perfiles where id = auth.uid() and rol in ('admin', 'preceptor')));

-- Estudiantes ven sus propias notas
DROP POLICY IF EXISTS "Estudiantes ven sus notas" ON public.notas;
CREATE POLICY "Estudiantes ven sus notas" ON public.notas FOR SELECT
USING (auth.uid() = perfil_id);
