import { useState, type FormEvent } from "react";
import { supabase } from "../services/supabase.ts";
import { useNavigate, Link } from "react-router-dom";
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
                background: "var(--bg)", /* pristine light gray */
            }}
        >
            {/* Card */}
            <div
                className="surface fade-in"
                style={{
                    width: "100%",
                    maxWidth: "400px",
                    padding: "2.5rem",
                }}
            >
                {/* Back link */}
                <button
                    onClick={() => navigate("/")}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        background: "none",
                        border: "none",
                        color: "var(--fg-muted)",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        fontFamily: "var(--font)",
                        cursor: "pointer",
                        padding: "0",
                        marginBottom: "2rem",
                        transition: "color 0.15s",
                    }}
                    onMouseOver={e => (e.currentTarget.style.color = "var(--fg)")}
                    onMouseOut={e => (e.currentTarget.style.color = "var(--fg-muted)")}
                >
                    <ArrowLeft size={14} />
                    Back to Calendar
                </button>

                {/* Header */}
                <div style={{ marginBottom: "2rem" }}>
                    <div
                        style={{
                            width: "40px",
                            height: "40px",
                            background: "var(--primary)",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            marginBottom: "1rem",
                        }}
                    >
                        <CalendarDays size={20} />
                    </div>
                    <h1
                        style={{
                            fontSize: "1.25rem",
                            fontWeight: 600,
                            letterSpacing: "-0.01em",
                            marginBottom: "0.25rem",
                        }}
                    >
                        Sign in to Schedulix
                    </h1>
                    <p style={{ color: "var(--fg-muted)", fontSize: "0.875rem" }}>
                        Admin access required
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div
                        style={{
                            background: "#fef2f2", /* subtle red */
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

                {/* Form */}
                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {/* Email */}
                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: "0.8125rem",
                                fontWeight: 500,
                                color: "var(--fg)",
                                marginBottom: "0.4rem",
                            }}
                        >
                            Email address
                        </label>
                        <div style={{ position: "relative" }}>
                            <Mail
                                size={16}
                                strokeWidth={1.5}
                                style={{
                                    position: "absolute",
                                    left: "0.75rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--fg-subtle)",
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
                                    padding: "0.5rem 0.75rem 0.5rem 2.25rem",
                                }}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: "0.8125rem",
                                fontWeight: 500,
                                color: "var(--fg)",
                                marginBottom: "0.4rem",
                            }}
                        >
                            Password
                        </label>
                        <div style={{ position: "relative" }}>
                            <Lock
                                size={16}
                                strokeWidth={1.5}
                                style={{
                                    position: "absolute",
                                    left: "0.75rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--fg-subtle)",
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
                                    padding: "0.5rem 0.75rem 0.5rem 2.25rem",
                                }}
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: "100%", marginTop: "0.5rem", height: "40px" }}
                    >
                        {loading ? <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} /> : (
                            <>
                                Sign in
                                <LogIn size={14} />
                            </>
                        )}
                    </button>

                    <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--fg-muted)", marginTop: "0.5rem" }}>
                        Don't have an account? <Link to="/signup" style={{ color: "var(--primary)", fontWeight: 500 }}>Sign up</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};
