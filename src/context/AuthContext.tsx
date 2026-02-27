import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase.ts";

interface AuthState {
    user: User | null;
    role: "admin" | "student" | null;
    loading: boolean;
}

const STORAGE_KEY = 'schedulix_auth_role';

const AuthContext = createContext<AuthState>({
    user: null,
    role: null,
    loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<"admin" | "student" | null>(() => {
        return localStorage.getItem(STORAGE_KEY) as "admin" | "student" | null;
    });

    // We only start with loading: false if we have a cached role.
    const [loading, setLoading] = useState(!localStorage.getItem(STORAGE_KEY));

    const fetchRole = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("user_roles")
                .select("role")
                .eq("id", userId)
                .single();

            if (error && error.code !== "PGRST116") {
                console.error("Error fetching role:", error);
            }
            const userRole = data?.role ?? "student";
            setRole(userRole as "admin" | "student");
            localStorage.setItem(STORAGE_KEY, userRole);
            return userRole;
        } catch (err) {
            console.error("Auth Exception:", err);
            setRole("student");
            localStorage.setItem(STORAGE_KEY, "student");
            return "student";
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        // Consolidate: Fetch session and then listen for changes.
        const initialize = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!mounted) return;

            if (session?.user) {
                setUser(session.user);
                await fetchRole(session.user.id);
            } else {
                setUser(null);
                setRole(null);
                localStorage.removeItem(STORAGE_KEY);
                setLoading(false);
            }
        };

        initialize();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            const e = event as any;

            if (e === 'SIGNED_OUT' || e === 'USER_DELETED') {
                setUser(null);
                setRole(null);
                localStorage.removeItem(STORAGE_KEY);
                setLoading(false);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                if (session?.user) {
                    setUser(session.user);
                    // Ensure loading is set if role is unknown
                    if (!role || session.user.id !== user?.id) {
                        setLoading(true);
                    }
                    await fetchRole(session.user.id);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
        // Dependency array: stable fetchRole
    }, [fetchRole]);

    return (
        <AuthContext.Provider value={{ user, role, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
