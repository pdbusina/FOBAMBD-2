-- 1. Tabla de Solicitudes de Acceso (Para Estudiantes Nuevos)
CREATE TABLE IF NOT EXISTS public.solicitudes_acceso (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dni text NOT NULL,
  email text NOT NULL,
  nombre text NOT NULL,
  apellido text NOT NULL,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en la tabla de solicitudes
ALTER TABLE public.solicitudes_acceso ENABLE ROW LEVEL SECURITY;

-- Política de inserción abierta para solicitudes (anon o auth)
CREATE POLICY "Permitir crear solicitudes libremente" 
  ON public.solicitudes_acceso FOR INSERT 
  WITH CHECK (true);

-- Política de lectura y gestión sólo para Staff
CREATE POLICY "Staff gestiona solicitudes" 
  ON public.solicitudes_acceso FOR ALL 
  USING (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol in ('admin', 'preceptor')
    )
  );

-- 2. Función SEGURA de Traspaso de ID (vincular auth user con datos pre-cargados)
-- Resuelve el problema de Foreing Keys y de Restricción UNIQUE de DNI
CREATE OR REPLACE FUNCTION vincular_usuario_auth(old_perfil_id UUID, new_auth_id UUID, user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_dni TEXT;
BEGIN
  -- 1. Guardar el DNI original y liberar la restricción UNIQUE temporalmente cambiándole el nombre al viejo
  SELECT dni INTO v_old_dni FROM public.perfiles WHERE id = old_perfil_id;
  UPDATE public.perfiles SET dni = v_old_dni || '_TEMP' WHERE id = old_perfil_id;

  -- 2. Crear el nuevo perfil con la nueva ID genuina (y el DNI original restaurado)
  INSERT INTO public.perfiles (id, dni, apellido, nombre, rol, email, direccion, ciudad, telefono, fecha_nacimiento, genero)
  SELECT new_auth_id, v_old_dni, apellido, nombre, rol, user_email, direccion, ciudad, telefono, fecha_nacimiento, genero
  FROM public.perfiles 
  WHERE id = old_perfil_id;
  
  -- 3. Traspasar las referencias (Matriculaciones y Notas) al nuevo ID
  UPDATE public.matriculaciones SET perfil_id = new_auth_id WHERE perfil_id = old_perfil_id;
  UPDATE public.notas SET perfil_id = new_auth_id WHERE perfil_id = old_perfil_id;
  
  -- 4. Borrar el perfil viejo huérfano
  DELETE FROM public.perfiles WHERE id = old_perfil_id;
END;
$$;
