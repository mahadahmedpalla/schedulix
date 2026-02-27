import { useState, type FormEvent } from "react";
import { supabase } from "../services/supabase.ts";
import { useNavigate, Link } from "react-router-dom";
import { ShieldAlert, Lock, Mail, KeyRound } from "lucide-react";

export const AdminAuth = ({ mode }: { mode: "login" | "signup" }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [adminKey, setAdminKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleAuth = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (mode === "signup") {
            // Step 1: Create the account
            const { error: authError } = await supabase.auth.signUp({ email, password });

            if (authError) {
                // Allow proceeding even if "already registered" — we'll just sign in next
                if (!authError.message.toLowerCase().includes("already registered")) {
                    setError(authError.message);
                    setLoading(false);
                    return;
                }
            }

            // Step 2: Sign in to create an active session
            const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

            if (loginError) {
                setError("Could not sign in: " + loginError.message);
                setLoading(false);
                return;
            }

            // Step 3: Activate admin role via the secure RPC
            const { data: isSuccess, error: rpcError } = await supabase.rpc("make_admin_via_secret", {
                secret_key: adminKey,
            });

            if (rpcError) {
                setError("Signed in, but could not assign admin role. Have you run admin_rpc_setup.sql in Supabase? Error: " + rpcError.message);
                setLoading(false);
            } else if (!isSuccess) {
                setError("Invalid Registration Key. Please check the key and try again.");
                setLoading(false);
            } else {
                // Success: AuthProvider will pick up the change and navigate will trigger
                setLoading(false);
                navigate("/admin");
            }
        } else {
            // Login mode
            const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
            if (loginError) {
                setError(loginError.message);
                setLoading(false);
            } else {
                // Success
                setLoading(false);
                navigate("/admin");
            }
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
                background: "var(--bg)",
            }}
        >
            <div
                className="surface fade-in"
                style={{
                    width: "100%",
                    maxWidth: "400px",
                    padding: "2.5rem",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Top accent line */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "var(--fg)" }} />

                <div style={{ marginBottom: "2rem" }}>
                    <div
                        style={{
                            width: "40px",
                            height: "40px",
                            background: "var(--fg)",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            marginBottom: "1rem",
                        }}
                    >
                        <ShieldAlert size={20} />
                    </div>
                    <h1
                        style={{
                            fontSize: "1.25rem",
                            fontWeight: 600,
                            letterSpacing: "-0.01em",
                            marginBottom: "0.25rem",
                        }}
                    >
                        {mode === "login" ? "Admin Portal Login" : "Initialize Admin Account"}
                    </h1>
                    <p style={{ color: "var(--fg-muted)", fontSize: "0.875rem" }}>
                        Restricted access. Authorized personnel only.
                    </p>
                </div>

                {error && (
                    <div
                        style={{
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#b91c1c",
                            borderRadius: "var(--radius-sm)",
                            padding: "0.75rem",
                            fontSize: "0.8125rem",
                            marginBottom: "1.5rem",
                            fontWeight: 500,
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "var(--fg)", marginBottom: "0.4rem" }}>
                            Admin Email
                        </label>
                        <div style={{ position: "relative" }}>
                            <Mail size={16} strokeWidth={1.5} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)", pointerEvents: "none" }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                required
                                style={{ width: "100%", padding: "0.5rem 0.75rem 0.5rem 2.25rem" }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "var(--fg)", marginBottom: "0.4rem" }}>
                            Password
                        </label>
                        <div style={{ position: "relative" }}>
                            <Lock size={16} strokeWidth={1.5} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)", pointerEvents: "none" }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                style={{ width: "100%", padding: "0.5rem 0.75rem 0.5rem 2.25rem" }}
                            />
                        </div>
                    </div>

                    {mode === "signup" && (
                        <div>
                            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--fg)", marginBottom: "0.4rem" }}>
                                Registration Key
                            </label>
                            <div style={{ position: "relative" }}>
                                <KeyRound size={16} strokeWidth={1.5} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)", pointerEvents: "none" }} />
                                <input
                                    type="password"
                                    value={adminKey}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminKey(e.target.value)}
                                    required
                                    placeholder="Enter the secret key..."
                                    style={{ width: "100%", padding: "0.5rem 0.75rem 0.5rem 2.25rem", borderColor: "var(--fg)" }}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: "100%", marginTop: "0.5rem", height: "40px", background: "var(--fg)", color: "var(--bg)" }}
                    >
                        {loading ? (
                            <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderColor: "var(--bg)", borderRightColor: "transparent" }} />
                        ) : (
                            <>{mode === "login" ? "Authenticate" : "Initialize Account"}</>
                        )}
                    </button>

                    <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--fg-muted)", marginTop: "0.5rem" }}>
                        {mode === "login" ? (
                            <>Need an admin account? <Link to="/sec/admin/signup" style={{ color: "var(--fg)", fontWeight: 500 }}>Setup</Link></>
                        ) : (
                            <>Already an admin? <Link to="/sec/admin/login" style={{ color: "var(--fg)", fontWeight: 500 }}>Login</Link></>
                        )}
                    </p>
                </form>
            </div>
        </div>
    );
};
