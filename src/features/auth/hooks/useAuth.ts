"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile, getUserProfile } from '@/features/auth/authService';

export function useAuth() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        // Fallback de seguridad: si después de 5 segundos sigue cargando, forzamos salida
        const timeoutId = setTimeout(() => {
            if (mounted) {
                console.warn("Auth timeout reached. Forcing load to finish.");
                setLoading(false);
            }
        }, 5000);

        const getSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;
                if (session && mounted) {
                    setUser(session.user);
                    const userProfile = await getUserProfile(session.user.id, session.user.user_metadata);
                    if (mounted) setProfile(userProfile);
                } else if (!session && mounted) {
                    // Si no hay sesión, asegurar limpieza
                    setUser(null);
                    setProfile(null);
                }
            } catch (err) {
                console.error('Auth check failed:', err);
                // Limpiar todo si falló (ej: sesión expirada o corrupta)
                await supabase.auth.signOut().catch(() => {});
                if (mounted) {
                    setUser(null);
                    setProfile(null);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            try {
                if (session) {
                    if (mounted) setUser(session.user);
                    const userProfile = await getUserProfile(session.user.id, session.user.user_metadata);
                    if (mounted) setProfile(userProfile);
                } else {
                    if (mounted) {
                        setUser(null);
                        setProfile(null);
                    }
                }
            } catch (err) {
                console.error("Auth state change error:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    return { user, profile, loading };
}

