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

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchRole(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            // CRITICAL: set loading=true FIRST so downstream components (AdminDashboard)
            // wait for the role to be fetched before making redirect decisions.
            setLoading(true);
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchRole(session.user.id);
            } else {
                setRole(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

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

            // If no role is found (e.g. newly registered user), they default to null/student logic
            // but ideally we default to 'student' if we want. For now, role from DB or null.
            setRole(data?.role ?? "student");
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, role, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
