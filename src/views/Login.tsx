import { useState, type FormEvent } from "react";
import { supabase } from "../services/supabase.ts";
import { useNavigate } from "react-router-dom";
import { LogIn, Lock, Mail, CalendarDays, ArrowLeft } from "lucide-react";

export const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            navigate("/admin");
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
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Ambient glow orbs */}
            <div
                style={{
                    position: "absolute",
                    width: "600px",
                    height: "600px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 70%)",
                    top: "-100px",
                    left: "-200px",
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    width: "500px",
                    height: "500px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 70%)",
                    bottom: "-100px",
                    right: "-150px",
                    pointerEvents: "none",
                }}
            />

            {/* Card */}
            <div
                className="premium-glass fade-up"
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    borderRadius: "var(--radius-lg)",
                    padding: "2.5rem",
                    border: "1px solid var(--border-strong)",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {/* Back link */}
                <button
                    onClick={() => navigate("/")}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        background: "none",
                        border: "none",
                        color: "var(--fg-muted)",
                        fontSize: "0.8rem",
                        fontFamily: "var(--font)",
                        cursor: "pointer",
                        padding: "0",
                        marginBottom: "2rem",
                        transition: "color 0.2s",
                    }}
                    onMouseOver={e => (e.currentTarget.style.color = "var(--fg)")}
                    onMouseOut={e => (e.currentTarget.style.color = "var(--fg-muted)")}
                >
                    <ArrowLeft size={14} />
                    Back to Calendar
                </button>

                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div
                        style={{
                            width: "52px",
                            height: "52px",
                            background: "linear-gradient(135deg, var(--primary), #0d9488)",
                            borderRadius: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#080d1a",
                            margin: "0 auto 1rem",
                            boxShadow: "var(--glow-lg)",
                        }}
                    >
                        <CalendarDays size={24} strokeWidth={2.5} />
                    </div>
                    <h1
                        style={{
                            fontSize: "1.5rem",
                            fontWeight: 800,
                            letterSpacing: "-0.03em",
                            marginBottom: "0.35rem",
                        }}
                    >
                        Admin Login
                    </h1>
                    <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem" }}>
                        Sign in to manage subjects and events
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div
                        style={{
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.3)",
                            color: "#f87171",
                            borderRadius: "var(--radius-sm)",
                            padding: "0.75rem 1rem",
                            fontSize: "0.85rem",
                            marginBottom: "1.5rem",
                            fontWeight: 500,
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                    {/* Email */}
                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                color: "var(--fg-muted)",
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                                marginBottom: "0.5rem",
                            }}
                        >
                            Email
                        </label>
                        <div style={{ position: "relative" }}>
                            <Mail
                                size={15}
                                style={{
                                    position: "absolute",
                                    left: "0.875rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--fg-muted)",
                                    pointerEvents: "none",
                                }}
                            />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem 1rem 0.75rem 2.5rem",
                                    borderRadius: "var(--radius-sm)",
                                }}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                color: "var(--fg-muted)",
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                                marginBottom: "0.5rem",
                            }}
                        >
                            Password
                        </label>
                        <div style={{ position: "relative" }}>
                            <Lock
                                size={15}
                                style={{
                                    position: "absolute",
                                    left: "0.875rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--fg-muted)",
                                    pointerEvents: "none",
                                }}
                            />
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem 1rem 0.75rem 2.5rem",
                                    borderRadius: "var(--radius-sm)",
                                }}
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: "100%", padding: "0.875rem", marginTop: "0.5rem", fontSize: "0.9rem" }}
                    >
                        {loading ? "Signing in…" : (
                            <>
                                Sign In
                                <LogIn size={16} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
