import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { formatImg } from '../../utils/imageUrl';
import './Dashboard.css';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminName, setAdminName] = useState(localStorage.getItem('name') || 'Administrator');
  const [adminPicture, setAdminPicture] = useState(localStorage.getItem('picture') || '');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const avatarInitials = adminName.slice(0, 2).toUpperCase();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const syncAdmin = () => {
      setAdminName(localStorage.getItem('name') || 'Administrator');
      setAdminPicture(localStorage.getItem('picture') || '');
    };
    window.addEventListener('userSessionChange', syncAdmin);
    window.addEventListener('storage', syncAdmin);
    return () => {
      window.removeEventListener('userSessionChange', syncAdmin);
      window.removeEventListener('storage', syncAdmin);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('picture');
    localStorage.removeItem('adminId');
    navigate('/admin/login');
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Top Header (Screens < 992px) */}
      <header className="dashboard-mobile-header d-lg-none d-flex align-items-center justify-content-between px-3 py-2 text-white border-bottom shadow-xs">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-light btn-sm border-0 p-1.5 d-flex align-items-center justify-content-center"
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Toggle Navigation Menu"
            title="Toggle Menu"
          >
            <i className={`bi ${sidebarOpen ? 'bi-x-lg' : 'bi-list'} fs-4 text-white`}></i>
          </button>
          <Link to="/" className="d-flex align-items-center text-white text-decoration-none">
            <img src={logo} alt="Softpro Innovation" width="24" height="24" className="me-1.5" style={{ objectFit: 'contain' }} />
            <span className="fw-bold" style={{ fontSize: '14px' }}>
              Softpro<span style={{ color: '#38bdf8' }}>Innovation</span>
            </span>
          </Link>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-white bg-opacity-20 text-white" style={{ fontSize: '11px' }}>Admin</span>
          <div
            className="sidebar-avatar-fallback rounded-circle"
            style={{ width: 28, height: 28, fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}
          >
            {avatarInitials}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div 
          className="dashboard-sidebar-backdrop d-lg-none" 
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand-header text-center py-3 px-2 border-bottom border-secondary border-opacity-25 mb-3">
          <Link to="/" className="d-flex align-items-center justify-content-center text-white text-decoration-none">
            <img src={logo} alt="Softpro Innovation" width="28" height="28" className="me-2" style={{ objectFit: 'contain' }} />
            <span className="fw-bold" style={{ fontSize: '15px' }}>
              Softpro<span className="ms-1" style={{ color: '#38bdf8' }}>Innovation</span>
            </span>
          </Link>
        </div>

        <div className="sidebar-profile-card text-center">
          <div className="sidebar-avatar-container mx-auto mb-2">
            {adminPicture ? (
              <img
                src={formatImg(adminPicture)}
                alt={adminName}
                className="sidebar-avatar-img"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.sidebar-avatar-fallback');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="sidebar-avatar-fallback"
              style={{ display: adminPicture ? 'none' : 'flex' }}
            >
              {avatarInitials}
            </div>
            <span className="sidebar-avatar-status" title="Active Session"></span>
          </div>

          <h6 className="sidebar-admin-name text-capitalize text-truncate mb-0" title={adminName}>
            {adminName}
          </h6>
          
          <div className="sidebar-admin-badge-wrap">
            <span className="sidebar-admin-badge">Admin</span>
          </div>
        </div>
        
        <div className="sidebar-nav-title text-uppercase">Admin Controls</div>
        
        <ul className="sidebar-nav">
          <li>
            <NavLink to="/dashboard" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-grid"></i> Overview
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/categories" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-tags"></i> Categories
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/products" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-box"></i> Products
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/orders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-cart"></i> Orders
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/invoice-preview" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-file-earmark-text"></i> Invoices
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-people"></i> Users List
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/inventory" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-list-check"></i> Inventory
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/addresses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-geo-alt"></i> Addresses
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/complaints" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-chat-left-text"></i> Complaints
            </NavLink>
          </li>
        </ul>

        <div className="sidebar-footer border-top border-secondary border-opacity-25">
          <button 
            type="button" 
            onClick={handleLogout} 
            className="logout-link w-100 border-0"
          >
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
