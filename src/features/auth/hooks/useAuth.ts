"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile, getUserProfile } from '@/features/auth/authService';

export function useAuth() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    setUser(session.user);
                    const userProfile = await getUserProfile(session.user.id, session.user.user_metadata);
                    setProfile(userProfile);
                }
            } catch (err) {
                console.error('Auth check failed:', err);
            } finally {
                setLoading(false);
            }
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                setUser(session.user);
                const userProfile = await getUserProfile(session.user.id, session.user.user_metadata);
                setProfile(userProfile);
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    return { user, profile, loading };
}
