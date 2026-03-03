import { supabase } from '@/lib/supabase';

export interface UserProfile {
    id: string;
    dni: string;
    nombre: string;
    apellido: string;
    email: string | null;
    rol: 'admin' | 'preceptor' | 'estudiante';
    direccion?: string | null;
    ciudad?: string | null;
    telefono?: string | null;
    telefono_urgencias?: string | null;
    nacionalidad?: string | null;
    fecha_nacimiento?: string | null;
    genero?: string | null;
    observaciones_medicas: string | null;
    status?: 'activo' | 'egresado' | 'baja';
}

export async function getUserProfile(userId: string, userMetadata?: any): Promise<UserProfile | null> {
    // 1. Intentar buscar por ID (vínculo directo)
    const { data: profileById, error: idError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (profileById) return profileById as UserProfile;

    // 2. Si no hay por ID, probar por DNI (para vincular cuentas pre-cargadas)
    const userDni = userMetadata?.dni;
    if (userDni) {
        const { data: profileByDni } = await supabase
            .from('perfiles')
            .select('*')
            .eq('dni', userDni)
            .maybeSingle();

        if (profileByDni) {
            // VINCULACIÓN: Actualizamos el ID del perfil con el ID de Auth
            const { data: updatedProfile, error: updateError } = await supabase
                .from('perfiles')
                .update({ id: userId })
                .eq('dni', userDni)
                .select()
                .single();

            if (!updateError) {
                console.log('Perfil vinculado exitosamente por DNI');
                return updatedProfile as UserProfile;
            }
            console.error('Error al vincular perfil:', updateError);
        }
    }

    if (idError && idError.code !== 'PGRST116') {
        console.error('Error fetching profile:', idError);
    }

    return null;
}
