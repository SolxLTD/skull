import {
  LayoutDashboard,
  Users,
  UserRoundCog,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  CreditCard,
  Megaphone,
  Settings,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const navigation = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    label: "Student Records",
    icon: Users,
    path: "/records",
  },
  {
    label: "Staff Records",
    icon: UserRoundCog,
    path: "/staff",
  },
  {
    label: "Classes & Subjects",
    icon: BookOpen,
    path: "/classes",
  },
  {
    label: "Attendance",
    icon: ClipboardCheck,
    path: "/attendance",
  },
  {
    label: "Results & Performance",
    icon: GraduationCap,
    path: "/results",
  },
  {
    label: "Fees & Payments",
    icon: CreditCard,
    path: "/fees",
  },
  {
    label: "Announcements",
    icon: Megaphone,
    path: "/announcements",
  },
];

function AdminLayout({ children, title, breadcrumb }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <LayoutDashboard size={23} />
          </div>

          <div>
            <h2>SKUL</h2>
            <span>School Intelligence</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">MAIN</div>

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                className={`nav-item ${
                  isActive(item.path) ? "active" : ""
                }`}
                onClick={() => navigate(item.path)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="nav-section-title settings-title">
            SYSTEM
          </div>

          <button
            className={`nav-item ${
              isActive("/settings") ? "active" : ""
            }`}
            onClick={() => navigate("/settings")}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <span>SKUL Intelligence</span>
          <small>School Management System</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="breadcrumb">
              {breadcrumb || `SKUL / ${title}`}
            </div>

            <h1>{title}</h1>
          </div>

          <div className="admin-profile">
            <div className="admin-avatar">A</div>

            <div>
              <strong>School Admin</strong>
              <small>Administrator</small>
            </div>
          </div>
        </header>

        <section className="dashboard-content">
          {children}
        </section>
      </main>
    </div>
  );
}

export default AdminLayout;