import React, { useState } from 'react';
import { Menu, X, Home, Plus, Users, Wrench, LogOut, Bell, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'My Tickets', href: '/tickets', icon: Home },
    { label: 'Create Ticket', href: '/tickets/create', icon: Plus },
    { label: 'Admin', href: '/admin/tickets', icon: Users },
    { label: 'Technician', href: '/technician-dashboard', icon: Wrench },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full'
      } bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl`}>
        {/* Logo & Brand */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-bold text-white">
              SC
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Smart Campus
              </h1>
              <p className="text-xs text-slate-400">Operations Hub</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-l-4 border-cyan-400 shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700/30 hover:text-white'
                }`}
              >
                <Icon size={20} className={`transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="font-medium text-sm">{item.label}</span>
                {active && <span className="ml-auto w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>}
              </a>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 mb-3">
            <img 
              src="https://i.pravatar.cc/40?u=smartcampus" 
              alt="avatar" 
              className="w-10 h-10 rounded-full ring-2 ring-cyan-400" 
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">John Doe</p>
              <p className="text-xs text-slate-400">Admin</p>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/40 transition-colors text-sm font-medium">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Left Side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-700"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="h-8 w-px bg-slate-200"></div>
              <h2 className="text-lg font-semibold text-slate-800">
                {navItems.find(item => isActive(item.href))?.label || 'Dashboard'}
              </h2>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors group">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-4 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                  <p className="text-sm font-semibold text-slate-800 mb-3">Notifications</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs font-medium text-blue-900">New ticket assigned</p>
                      <p className="text-xs text-blue-700">Broken projector - Lab 3</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs font-medium text-green-900">Ticket resolved</p>
                      <p className="text-xs text-green-700">WiFi Setup - Complete</p>
                    </div>
                  </div>
                </div>
              </button>

              {/* Settings */}
              <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <Settings size={20} />
              </button>

              {/* Profile */}
              <div className="h-8 w-px bg-slate-200"></div>
              <img 
                src="https://i.pravatar.cc/40?u=smartcampus" 
                alt="avatar" 
                className="w-9 h-9 rounded-full ring-2 ring-cyan-500 cursor-pointer hover:ring-cyan-400 transition-all" 
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
