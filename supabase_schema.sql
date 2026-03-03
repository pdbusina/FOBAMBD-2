-- 1. Crear la tabla con todos los campos necesarios (Simplificada)
CREATE TABLE public.perfiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  dni text UNIQUE NOT NULL,
  apellido text NOT NULL,
  nombre text NOT NULL,
  email text UNIQUE,
  rol text NOT NULL CHECK (rol IN ('admin', 'preceptor', 'estudiante')),
  
  -- Datos de contacto y personales
  direccion text,
  ciudad text,
  telefono text,
  telefono_urgencias text,
  nacionalidad text DEFAULT 'Argentina',
  fecha_nacimiento date,
  genero text,
  
  -- Datos médicos simplificados
  observaciones_medicas text,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar Seguridad (RLS)
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acceso (Redefinibles en el futuro)

-- Los Admins y Preceptores pueden ver TODOS los perfiles
CREATE POLICY "Staff puede ver todos los perfiles"
  ON public.perfiles FOR SELECT
  USING ( 
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol in ('admin', 'preceptor')
    )
  );

-- Los Estudiantes SOLO pueden ver su propio perfil
CREATE POLICY "Estudiantes ven su propio perfil"
  ON public.perfiles FOR SELECT
  USING ( auth.uid() = id );

-- Solo los Admins pueden gestionar (Insert/Update/Delete) todos los perfiles
CREATE POLICY "Solo admins gestionan perfiles"
  ON public.perfiles FOR ALL
  USING (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );
