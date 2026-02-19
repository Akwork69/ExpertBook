import { Link, useLocation } from "react-router-dom";
import { Users, BookOpen } from "lucide-react";

const navItems = [
  { to: "/", label: "Experts", icon: Users },
  { to: "/bookings", label: "My Bookings", icon: BookOpen },
];

export default function Header() {
  const location = useLocation();
  const logoSrc = `${import.meta.env.BASE_URL}logo.svg`;

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
          <img src={logoSrc} alt="ExpertBook" className="h-6 w-6" />
          ExpertBook
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                location.pathname === to
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
