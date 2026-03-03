-- 1. Tabla de Instrumentos y Planes de Estudio
-- Basada en los datos proporcionados: id (nombre corto), nombre (descripción con código), plan (código del plan)
CREATE TABLE public.instrumentos_planes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  instrumento_id text NOT NULL,        -- Ej: 'Sikus - Quena'
  nombre_completo text NOT NULL,        -- Ej: '530 Sikus - Quena'
  plan_estudios text NOT NULL,          -- Ej: '530'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(instrumento_id, plan_estudios)
);

-- 2. Tabla de Matriculaciones (Sin Turno)
CREATE TABLE public.matriculaciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil_id uuid REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
  instrumento_plan_id uuid REFERENCES public.instrumentos_planes(id) NOT NULL,
  anio_lectivo integer NOT NULL DEFAULT extract(year from now()),
  fecha_inscripcion timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Restricción: No se puede matricular al mismo alumno en el mismo instrumento+plan el mismo año
  UNIQUE(perfil_id, instrumento_plan_id, anio_lectivo)
);

-- 3. Habilitar RLS
ALTER TABLE public.instrumentos_planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculaciones ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para Staff
CREATE POLICY "Staff ve instrumentos" ON public.instrumentos_planes FOR SELECT 
USING (exists (select 1 from public.perfiles where id = auth.uid() and rol in ('admin', 'preceptor')));

CREATE POLICY "Staff gestiona matriculaciones" ON public.matriculaciones FOR ALL 
USING (exists (select 1 from public.perfiles where id = auth.uid() and rol in ('admin', 'preceptor')));

-- 5. CARGA INICIAL (Ordenada Alfabéticamente)
INSERT INTO public.instrumentos_planes (plan_estudios, instrumento_id, nombre_completo) VALUES
('530', 'Arpa', '530 Arpa'),
('530', 'Bajo Eléctrico', '530 Bajo Eléctrico'),
('530', 'Bandoneón', '530 Bandoneón'),
('530', 'Batería', '530 Batería'),
('532', 'Canto', '532 Canto'),
('533', 'Canto Popular', '533 Canto Popular'),
('530', 'Clarinete', '530 Clarinete'),
('530', 'Contrabajo', '530 Contrabajo'),
('530', 'Corno', '530 Corno'),
('530', 'Flauta Dulce', '530 Flauta Dulce'),
('530', 'Flauta Traversa', '530 Flauta Traversa'),
('530', 'Guitarra Clásica', '530 Guitarra Clásica'),
('530', 'Guitarra Eléctrica', '530 Guitarra Eléctrica'),
('530', 'Guitarra Popular', '530 Guitarra Popular'),
('535', 'Módulo Pedagógico', '535 Módulo Pedagógico'),
('530', 'Oboe', '530 Oboe'),
('530', 'Percusión Académica', '530 Percusión Académica'),
('530', 'Percusión Folklórica', '530 Percusión Folklórica'),
('530', 'Piano', '530 Piano'),
('530', 'Saxo', '530 Saxo'),
('530', 'Sikus - Quena', '530 Sikus - Quena'),
('530', 'Trombón', '530 Trombón'),
('530', 'Trompeta', '530 Trompeta'),
('530', 'Viola', '530 Viola'),
('530', 'Violín', '530 Violín'),
('530', 'Violoncello', '530 Violoncello');
