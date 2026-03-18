import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 1. Inicializar cliente Supabase seguro (sólo backend)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, payload } = body;

        if (action === 'approve_request') {
            const { solicitud_id, dni, email, old_perfil_id } = payload;

            // 1. Crear el Auth User
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: dni, // DNI como contraseña inicial
                email_confirm: true
            });

            if (authError) throw new Error(`Error Auth: ${authError.message}`);

            const newAuthId = authData.user.id;

            // 2. Ejecutar la función SQL de traspaso de perfil
            const { error: rpcError } = await supabaseAdmin.rpc('vincular_usuario_auth', {
                old_perfil_id: old_perfil_id,
                new_auth_id: newAuthId,
                user_email: email
            });

            if (rpcError) throw new Error(`Error vinculando IDs: ${rpcError.message}`);

            // 3. Marcar solicitud como aprobada
            await supabaseAdmin.from('solicitudes_acceso').update({ estado: 'aprobada' }).eq('id', solicitud_id);

            return NextResponse.json({ success: true, message: 'Estudiante dado de alta y vinculado.' });
        }

        if (action === 'create_manual') {
            const { dni, email, nombre, apellido, rol } = payload;

            // 1. Validar que el DNI no exista ya en perfiles
            const { data: existingPerfiles } = await supabaseAdmin.from('perfiles').select('id').eq('dni', dni);
            if (existingPerfiles && existingPerfiles.length > 0) {
                return NextResponse.json({ error: 'El DNI ya se encuentra registrado en el sistema.' }, { status: 400 });
            }

            // 2. Crear Auth User
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: dni,
                email_confirm: true
            });

            if (authError) throw new Error(`Error Auth: ${authError.message}`);

            const newAuthId = authData.user.id;

            // 3. Insertar nuevo perfil vacío base
            const { error: perfilError } = await supabaseAdmin.from('perfiles').insert([{
                id: newAuthId,
                dni,
                email,
                nombre,
                apellido,
                rol
            }]);

            if (perfilError) throw new Error(`Error insertando perfil: ${perfilError.message}`);

            return NextResponse.json({ success: true, message: 'Usuario creado exitosamente.' });
        }

        if (action === 'reject_request') {
            const { solicitud_id } = payload;
            await supabaseAdmin.from('solicitudes_acceso').update({ estado: 'rechazada' }).eq('id', solicitud_id);
            return NextResponse.json({ success: true, message: 'Solicitud rechazada.' });
        }

        if (action === 'delete_user') {
            const { user_id } = payload;
            // Al borrar el usuario de Auth, el ON DELETE CASCADE borrará todo su rastro si la BD está configurada.
            // Primero intentamos borrar de perfiles para asegurar cascada en BD, luego auth.
            // En Supabase, borrar el Auth elimina el perfil.
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
            if (authError) throw new Error(`Error eliminando Auth: ${authError.message}`);

            return NextResponse.json({ success: true, message: 'Usuario eliminado del sistema.' });
        }

        return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });

    } catch (error: any) {
        console.error("API Error admin/users:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
