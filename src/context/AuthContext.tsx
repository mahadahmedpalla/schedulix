import { createContext, useContext, useEffect, useState, type ReactNode, useCallback, useRef } from "react";
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

    // Safety Loading: Start as true unless we are POSITIVE we have a cached role.
    const [loading, setLoading] = useState(true);
    const isFetchingRole = useRef(false);
    const initStarted = useRef(false);

    const fetchRole = useCallback(async (userId: string) => {
        if (isFetchingRole.current) return;
        isFetchingRole.current = true;

        try {
            const { data, error } = await supabase
                .from("user_roles")
                .select("role")
                .eq("id", userId)
                .single();

            if (!error && data) {
                const userRole = data.role as "admin" | "student";
                setRole(userRole);
                localStorage.setItem(STORAGE_KEY, userRole);
            } else {
                setRole("student");
                localStorage.setItem(STORAGE_KEY, "student");
            }
        } catch (err) {
            console.error("Auth Exception:", err);
            setRole("student");
        } finally {
            setLoading(false);
            isFetchingRole.current = false;
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        if (initStarted.current) return;
        initStarted.current = true;

        const initialize = async () => {
            try {
                // 1. Force a session check immediately
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
            } catch (err) {
                console.error("Critical Auth Init Failure:", err);
                if (mounted) setLoading(false);
            }
        };

        initialize();

        // 2. Continuous listener for state changes (Login, Logout, Token Refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            const e = event as any;

            if (e === 'SIGNED_OUT') {
                setUser(null);
                setRole(null);
                localStorage.removeItem(STORAGE_KEY);
                setLoading(false);
            } else if (e === 'SIGNED_IN' || e === 'TOKEN_REFRESHED' || e === 'USER_UPDATED') {
                if (session?.user) {
                    setUser(session.user);
                    fetchRole(session.user.id);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchRole]);

    return (
        <AuthContext.Provider value={{ user, role, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
