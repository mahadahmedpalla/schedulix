import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase.ts";

interface AuthState {
    user: User | null;
    role: "admin" | "student" | null;
    loading: boolean;
}

const AuthContext = createContext<AuthState>({
    user: null,
    role: null,
    loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<"admin" | "student" | null>(null);
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
            return userRole;
        } catch (err) {
            console.error("Auth Exception:", err);
            setRole("student");
            return "student";
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
                }
            } catch (err) {
                console.error("Initialization error:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
                setUser(null);
                setRole(null);
                setLoading(false);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                if (session?.user) {
                    const isNewUser = session.user.id !== user?.id;
                    setUser(session.user);

                    // If it's a new user or we don't have a role yet, fetch it
                    if (isNewUser || role === null) {
                        setLoading(true);
                        await fetchRole(session.user.id);
                        if (mounted) setLoading(false);
                    }
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchRole]); // Only fetchRole as dependency (stabilized by useCallback)

    return (
        <AuthContext.Provider value={{ user, role, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
