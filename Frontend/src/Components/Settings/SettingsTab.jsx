import { NavLink, Outlet } from "react-router-dom";
import "./SettingsTab.css";

const Settings = () => {
  return (
    <div className="layout-wrapper">
      <div className="layout-container">
        {/* Left Sidebar */}
        <aside className="layout-sidebar">
          <div className="layout-menu">
            <NavLink
              to="/settings/profile"
              className={({ isActive }) =>
                isActive ? "layout-item active" : "layout-item"
              }
            >
              <span>👤</span> Profile
            </NavLink>
            <NavLink
              to="/settings/security"
              className={({ isActive }) =>
                isActive ? "layout-item active" : "layout-item"
              }
            >
              <span>🔒</span> Security
            </NavLink>
            <NavLink
              to="/settings/questions"
              className={({ isActive }) =>
                isActive ? "layout-item active" : "layout-item"
              }
            >
              <span>💬</span> My Questions
            </NavLink>
            <NavLink
              to="/settings/shared-questions"
              className={({ isActive }) =>
                isActive ? "layout-item active" : "layout-item"
              }
            >
              <span>🔗</span> Shared With Me
            </NavLink>
            <NavLink
              to="/settings/sessions"
              className={({ isActive }) =>
                isActive ? "layout-item active" : "layout-item"
              }
            >
              <span>⏱️</span> Session History
            </NavLink>
          </div>

          <div className="layout-footer">Settings v1.0 | CodeSync</div>
        </aside>

        {/* Right Content Area */}
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Settings;
