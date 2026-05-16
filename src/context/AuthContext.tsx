import { createContext, useContext, useEffect, useState, type ReactNode, useCallback, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase.ts";

interface AuthState {
    user: User | null;
    role: "super_admin" | "admin" | "student" | null;
    batch_id: string | null;
    batch_code: string | null;
    loading: boolean;
    setGuestBatch: (id: string, code: string) => void;
}

const STORAGE_KEY = 'schedulix_auth_role';
const BATCH_STORAGE_KEY = 'schedulix_auth_batch_id';
const BATCH_CODE_KEY = 'schedulix_auth_batch_code';

const AuthContext = createContext<AuthState>({
    user: null,
    role: null,
    batch_id: null,
    batch_code: null,
    loading: true,
    setGuestBatch: () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<"super_admin" | "admin" | "student" | null>(() => {
        return localStorage.getItem(STORAGE_KEY) as any;
    });
    const [batchId, setBatchId] = useState<string | null>(() => {
        return localStorage.getItem(BATCH_STORAGE_KEY);
    });
    const [batchCode, setBatchCode] = useState<string | null>(() => {
        return localStorage.getItem(BATCH_CODE_KEY);
    });

    const [loading, setLoading] = useState(true);
    const isFetchingRole = useRef(false);

    const setGuestBatch = useCallback((id: string, code: string) => {
        if (user) return; // Don't override if logged in
        setBatchId(id);
        setBatchCode(code);
        localStorage.setItem(BATCH_STORAGE_KEY, id);
        localStorage.setItem(BATCH_CODE_KEY, code);
    }, [user]);

    const fetchRole = useCallback(async (userId: string) => {
        if (isFetchingRole.current) return;
        isFetchingRole.current = true;

        try {
            const { data, error } = await supabase
                .from("user_roles")
                .select(`
                    role, 
                    batch_id,
                    batches (batch_code)
                `)
                .eq("id", userId)
                .maybeSingle(); // Use maybeSingle to avoid 406 errors

            if (!error && data) {
                const userRole = data.role as any;
                const code = (data.batches as any)?.batch_code || null;
                
                setRole(userRole);
                setBatchId(data.batch_id);
                setBatchCode(code);
                
                localStorage.setItem(STORAGE_KEY, userRole);
                if (data.batch_id) {
                    localStorage.setItem(BATCH_STORAGE_KEY, data.batch_id);
                    localStorage.setItem(BATCH_CODE_KEY, code || '');
                }
            } else {
                // If logged in but no role record found, they are a student
                // but we keep the guest batch if it exists, or set to null
                setRole("student");
                localStorage.setItem(STORAGE_KEY, "student");
            }
        } catch (err) {
            console.error("Auth Exception:", err);
        } finally {
            setLoading(false);
            isFetchingRole.current = false;
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        const initialize = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted) return;

                if (session?.user) {
                    setUser(session.user);
                    await fetchRole(session.user.id);
                } else {
                    setUser(null);
                    setRole(null);
                    // Keep guest batch info in state/localstorage
                    setLoading(false);
                }
            } catch (err) {
                console.error("Critical Auth Init Failure:", err);
                if (mounted) setLoading(false);
            }
        };

        initialize();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            if (event === 'SIGNED_OUT') {
                setUser(null);
                setRole(null);
                // Clear everything on logout including guest batch to ensure fresh state
                setBatchId(null);
                setBatchCode(null);
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(BATCH_STORAGE_KEY);
                localStorage.removeItem(BATCH_CODE_KEY);
                setLoading(false);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
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
    }, [fetchRole]);

    return (
        <AuthContext.Provider value={{ user, role, batch_id: batchId, batch_code: batchCode, loading, setGuestBatch }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
