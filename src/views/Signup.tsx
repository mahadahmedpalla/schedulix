import { useState, type FormEvent } from "react";
import { supabase } from "../services/supabase.ts";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, CalendarDays, ArrowLeft, UserPlus } from "lucide-react";

export const Signup = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin
            }
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
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
                }}
            >
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
                        Create an account
                    </h1>
                    <p style={{ color: "var(--fg-muted)", fontSize: "0.875rem" }}>
                        Add your own personal events to Schedulix
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
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            color: "#15803d",
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
                        <span>Successfully signed up!</span>
                        <span style={{ fontSize: "0.8125rem", color: "#166534" }}>
                            Depending on your Supabase settings, you may need to confirm your email.
                            If auto-confirm is enabled, you can log in now.
                        </span>
                        <Link to="/login" style={{ color: "#15803d", fontWeight: 600, marginTop: "0.5rem" }}>
                            Go to sign in →
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
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
                                    placeholder="student@example.com"
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem 0.75rem 0.5rem 2.25rem",
                                    }}
                                />
                            </div>
                        </div>

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
                                    minLength={6}
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem 0.75rem 0.5rem 2.25rem",
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: "100%", marginTop: "0.5rem", height: "40px" }}
                        >
                            {loading ? <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} /> : (
                                <>
                                    Sign up
                                    <UserPlus size={14} />
                                </>
                            )}
                        </button>
                        <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--fg-muted)", marginTop: "0.5rem" }}>
                            Already have an account? <Link to="/login" style={{ color: "var(--primary)", fontWeight: 500 }}>Sign in</Link>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
};
