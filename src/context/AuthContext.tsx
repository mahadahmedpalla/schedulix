import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

    const fetchRole = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("user_roles")
                .select("role")
                .eq("id", userId)
                .single();

            if (error && error.code !== "PGRST116") {
                console.error("Error fetching role:", error);
            }
            setRole(data?.role ?? "student");
        } catch (err) {
            console.error(err);
            setRole("student");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!mounted) return;

            if (session?.user) {
                setUser(session.user);
                await fetchRole(session.user.id);
            } else {
                setUser(null);
                setRole(null);
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            if (event === 'SIGNED_OUT') {
                setUser(null);
                setRole(null);
                setLoading(false);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                if (session?.user) {
                    // Only re-fetch if user ID changed or role isn't set yet
                    if (session.user.id !== user?.id || role === null) {
                        setLoading(true);
                        setUser(session.user);
                        await fetchRole(session.user.id);
                    }
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [user?.id, role]);

    return (
        <AuthContext.Provider value={{ user, role, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
