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
    // We only start with loading: false if we ALREADY have a role AND a session is likely to be there.
    // To be safe, we'll keep loading as true initially on fresh mount unless we have role.
    const [loading, setLoading] = useState(true);

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

        const initializeAuth = async () => {
            try {
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
                console.error("Initialization error:", err);
                if (mounted) setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            const e = event as any;

            if (e === 'SIGNED_OUT' || e === 'USER_DELETED') {
                setUser(null);
                setRole(null);
                localStorage.removeItem(STORAGE_KEY);
                setLoading(false);
            } else if (e === 'SIGNED_IN' || e === 'TOKEN_REFRESHED' || e === 'USER_UPDATED') {
                if (session?.user) {
                    // Start loading ONLY if we are actually fetching a new role
                    // or if the role is currently missing
                    const isNewUser = session.user.id !== user?.id;
                    if (isNewUser || !role) {
                        setLoading(true);
                        setUser(session.user);
                        await fetchRole(session.user.id);
                    } else {
                        setUser(session.user);
                    }
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchRole, user?.id, role]);

    return (
        <AuthContext.Provider value={{ user, role, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
