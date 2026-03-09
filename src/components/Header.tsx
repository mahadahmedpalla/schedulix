import type { FC } from "react";
import { useAuth } from "../context/AuthContext.tsx";
import "./Header.css";

export const Header: FC = () => {
    const { role } = useAuth();

    return (
        <header className="dashboard-header">
            {/* Search */}
            <div className="header-search-container">
                <div className="search-input-wrapper">
                    <span className="material-symbols-outlined search-icon">search</span>
                    <input
                        type="text"
                        placeholder="Search events, subjects, tasks..."
                        className="header-search-input"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="header-actions">
                <button className="icon-btn" title="Notifications">
                    <span className="material-symbols-outlined">notifications</span>
                </button>

                <div className="user-profile-dropdown">
                    <div className="user-avatar-small">
                        <span className="material-symbols-outlined">person</span>
                    </div>
                    <span className="material-symbols-outlined dropdown-icon">expand_more</span>

                    {/* Tooltip-style info for role */}
                    {role === "admin" && (
                        <div className="header-admin-tag">Admin</div>
                    )}
                </div>
            </div>
        </header>
    );
};
