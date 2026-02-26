import { useState, type FormEvent } from "react";
import { supabase } from "../services/supabase.ts";
import { Link } from "react-router-dom";
import { ShieldAlert, Lock, Mail, KeyRound } from "lucide-react";

export const AdminAuth = ({ mode }: { mode: "login" | "signup" }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [adminKey, setAdminKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleAuth = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (mode === "signup") {
            // Step 1: Create the account
            const { error: authError } = await supabase.auth.signUp({ email, password });

            if (authError) {
                // Handle the case where the user already exists
                if (!authError.message.includes("already registered")) {
                    setError(authError.message);
                    setLoading(false);
                    return;
                }
            }

            // Step 2: Sign in immediately to create an active session
            // (Supabase may not create a session automatically after signUp if email confirmation is on)
            const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

            if (loginError) {
                setError("Account created but could not sign in automatically: " + loginError.message + ". Please use the Login page instead.");
                setLoading(false);
                return;
            }

            // Step 3: Now we have an active session — call the RPC to grant admin role
            const { data: isSuccess, error: rpcError } = await supabase.rpc("make_admin_via_secret", {
                secret_key: adminKey,
            });

            if (rpcError) {
                setError("Signed in, but failed to assign admin role. Have you run the admin_rpc_setup.sql in Supabase? Error: " + rpcError.message);
                setLoading(false);
            } else if (!isSuccess) {
                setError("Invalid Registration Key. Please check the key and try again.");
                setLoading(false);
            } else {
                // Success! Redirect to admin dashboard
                window.location.href = "/admin";
            }
        } else {
            // Login mode — straightforward
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setError(error.message);
                setLoading(false);
            } else {
                window.location.href = "/admin";
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
                    overflow: "hidden"
                }}
            >
                {/* Top accent line exclusively for the admin portal */}
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

                {success ? (
                    <div
                        style={{
                            background: "#18181b",
                            color: "#ffffff",
                            borderRadius: "var(--radius-sm)",
                            padding: "1rem",
                            fontSize: "0.875rem",
                            marginBottom: "1.5rem",
                            fontWeight: 500,
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem"
                        }}
                    >
                        <span>Admin privileges granted successfully.</span>
                        <span style={{ fontSize: "0.8125rem", color: "#a1a1aa" }}>
                            Your account is now initialized. You may log in to access the dashboard.
                        </span>
                        <Link to="/sec/admin/login" style={{ color: "#ffffff", fontWeight: 600, marginTop: "0.5rem" }}>
                            Proceed to login →
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "var(--fg)", marginBottom: "0.4rem" }}>
                                Admin Email
                            </label>
                            <div style={{ position: "relative" }}>
                                <Mail size={16} strokeWidth={1.5} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)", pointerEvents: "none" }} />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: "100%", padding: "0.5rem 0.75rem 0.5rem 2.25rem" }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "var(--fg)", marginBottom: "0.4rem" }}>
                                Password
                            </label>
                            <div style={{ position: "relative" }}>
                                <Lock size={16} strokeWidth={1.5} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)", pointerEvents: "none" }} />
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={{ width: "100%", padding: "0.5rem 0.75rem 0.5rem 2.25rem" }} />
                            </div>
                        </div>

                        {mode === "signup" && (
                            <div>
                                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--fg)", marginBottom: "0.4rem" }}>
                                    Registration Key
                                </label>
                                <div style={{ position: "relative" }}>
                                    <KeyRound size={16} strokeWidth={1.5} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)", pointerEvents: "none" }} />
                                    <input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)} required style={{ width: "100%", padding: "0.5rem 0.75rem 0.5rem 2.25rem", borderColor: "var(--fg)" }} placeholder="Enter the secret key..." />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: "100%", marginTop: "0.5rem", height: "40px", background: "var(--fg)", color: "var(--bg)" }}
                        >
                            {loading ? <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderColor: "var(--bg)", borderRightColor: "transparent" }} /> : (
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
                )}
            </div>
        </div>
    );
};
