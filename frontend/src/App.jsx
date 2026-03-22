import { BrowserRouter, Routes, Route, Link, useLocation, Outlet } from 'react-router-dom';
import MyTicketsPage from './pages/member3/MyTicketsPage';
import CreateTicketPage from './pages/member3/CreateTicketPage';
import TicketDetailPage from './pages/member3/TicketDetailPage';
import AdminTicketsPage from './pages/member3/AdminTicketsPage';
import TechnicianDashboard from './pages/member3/TechnicianDashboard';
import LoginPage from './pages/member4/LoginPage';

function Sidebar() {
  const loc = useLocation();
  const links = [
    { to: '/tickets', label: '🎫 My Tickets' },
    { to: '/tickets/create', label: '➕ New Ticket' },
    { to: '/admin/tickets', label: '🛠 Admin View' },
    { to: '/technician', label: '👷 Technician' },
  ];
  return (
    <div className="w-56 min-h-screen bg-[#1E3A5F] text-white flex flex-col py-6 px-4 fixed left-0 top-0">
      <div className="text-xl font-bold mb-8 px-2">🏫 Smart Campus</div>
      <nav className="space-y-1">
        {links.map(l => (
          <Link key={l.to} to={l.to}
            className={`block px-3 py-2 rounded-lg text-sm transition-colors
              ${loc.pathname === l.to
                ? 'bg-[#2563EB] text-white font-medium'
                : 'text-blue-100 hover:bg-blue-800'}`}>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto px-2 text-xs text-blue-300">Member 3 — Tickets Module</div>
    </div>
  );
}

function AppShell() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-56 flex-1 min-h-screen bg-[#F8FAFC]">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<MyTicketsPage />} />
          <Route path="/tickets" element={<MyTicketsPage />} />
          <Route path="/tickets/create" element={<CreateTicketPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/admin/tickets" element={<AdminTicketsPage />} />
          <Route path="/technician" element={<TechnicianDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}