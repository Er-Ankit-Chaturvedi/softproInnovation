import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useCart } from '../context/CartContext';
import { formatImg } from '../utils/imageUrl';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getWishlistCount, getCartCount } = useCart();
  const [userName, setUserName] = useState('');
  const [userPicture, setUserPicture] = useState('');
  const [userRole, setUserRole] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const syncUserSession = () => {
      const token = localStorage.getItem('token');
      const name = localStorage.getItem('name');
      const role = localStorage.getItem('role');
      const picture = localStorage.getItem('picture');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (token && name) {
        setUserName(name);
        setUserRole(role);
        setUserPicture(user.picture || picture || '');
      } else {
        setUserName('');
        setUserRole('');
        setUserPicture('');
      }
    };

    syncUserSession();

    window.addEventListener('userSessionChange', syncUserSession);
    window.addEventListener('storage', syncUserSession);

    return () => {
      window.removeEventListener('userSessionChange', syncUserSession);
      window.removeEventListener('storage', syncUserSession);
    };
  }, []);

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('picture');
    localStorage.removeItem('adminId');
    localStorage.removeItem('softpro_cart');
    localStorage.removeItem('softpro_wishlist');
    setUserName('');
    setUserPicture('');
    setUserRole('');
    setShowDropdown(false);
    setMobileMenuOpen(false);

    // Notify app of user session change (resets cart & wishlist)
    window.dispatchEvent(new Event('userSessionChange'));

    navigate('/login');
  };

  const isUserLoggedIn = Boolean(userName && localStorage.getItem('token'));
  const wishlistCount = isUserLoggedIn && getWishlistCount ? getWishlistCount() : 0;
  const cartCount = isUserLoggedIn && getCartCount ? getCartCount() : 0;

  return (
    <div className="container-fluid p-0 sticky-top shadow-sm" style={{ zIndex: 1040 }}>
      <nav className="navbar navbar-expand-lg navbar-dark py-2 px-2 px-sm-3 px-lg-4" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', minHeight: '56px' }}>
        <div className="container-fluid d-flex align-items-center justify-content-between flex-nowrap">
          {/* Brand Logo */}
          <Link className="navbar-brand d-flex align-items-center text-white my-0 text-nowrap" to="/">
            <img src={logo} alt="Softpro" width="30" height="30" className="navbar-logo-img me-2" style={{ objectFit: 'contain' }} />
            <span className="navbar-brand-text"><span>Softpro</span><span className="ms-1" style={{ color: '#38bdf8' }}>Innovation</span></span>
          </Link>

          {/* Mobile Top Bar Controls (Visible only on phone/mobile < 992px) */}
          <div className="mobile-top-bar-controls d-flex d-lg-none align-items-center">
            {/* Quick Wishlist */}
            <Link
              to={isUserLoggedIn ? "/wishlist" : "/login"}
              className="mobile-header-icon-btn"
              title={isUserLoggedIn ? "Wishlist" : "Login to view Wishlist"}
              aria-label="Wishlist"
            >
              <i className="bi bi-heart fs-6"></i>
              {isUserLoggedIn && wishlistCount > 0 && (
                <span className="mobile-icon-badge">{wishlistCount}</span>
              )}
            </Link>

            {/* Quick Cart */}
            <Link
              to={isUserLoggedIn ? "/cart" : "/login"}
              className="mobile-header-icon-btn"
              title={isUserLoggedIn ? "Shopping Cart" : "Login to view Cart"}
              aria-label="Shopping Cart"
            >
              <i className="bi bi-cart3 fs-6"></i>
              {isUserLoggedIn && cartCount > 0 && (
                <span className="mobile-icon-badge">{cartCount}</span>
              )}
            </Link>

            {/* Mobile Hamburger Toggle Button */}
            <button
              className={`mobile-nav-toggle-btn ${mobileMenuOpen ? 'active' : ''}`}
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
          </div>

          {/* Desktop Navigation (Visible only on >= 992px) */}
          <div className="collapse navbar-collapse d-none d-lg-flex" id="navbarSupportedContent">
            <ul className="navbar-nav mx-auto mb-0 gap-1 gap-lg-2 fw-medium">
              <li className="nav-item">
                <NavLink className="nav-link px-3 py-1.5" to="/">Home</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link px-3 py-1.5" to="/about">About</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link px-3 py-1.5" to="/Product">Products</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link px-3 py-1.5" to="/Contact">Contact Us</NavLink>
              </li>
            </ul>
            <div className="d-flex gap-2 align-items-center mt-2 mt-lg-0">
              {/* Wishlist Button */}
              <Link
                to={isUserLoggedIn ? "/wishlist" : "/login"}
                className="btn btn-outline-light btn-sm position-relative d-flex align-items-center justify-content-center p-2 rounded-circle border-0"
                title={isUserLoggedIn ? "Wishlist" : "Login to view Wishlist"}
                style={{ width: '36px', height: '36px', backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <i className="bi bi-heart fs-6"></i>
                {isUserLoggedIn && wishlistCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Shopping Cart Button */}
              <Link
                to={isUserLoggedIn ? "/cart" : "/login"}
                className="btn btn-outline-light btn-sm position-relative d-flex align-items-center justify-content-center p-2 rounded-circle border-0"
                title={isUserLoggedIn ? "Shopping Cart" : "Login to view Cart"}
                style={{ width: '36px', height: '36px', backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <i className="bi bi-cart3 fs-6"></i>
                {isUserLoggedIn && cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
                    {cartCount}
                  </span>
                )}
              </Link>

              {userName ? (
                <div className="position-relative" ref={dropdownRef}>
                  <button
                    className="navbar-btn-user dropdown-toggle"
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    {userPicture ? (
                      <img src={formatImg(userPicture)} alt="Profile" className="rounded-circle me-1" width="24" height="24" style={{ objectFit: 'cover' }} />
                    ) : (
                      <i className="bi bi-person-circle fs-6"></i>
                    )} {userName}
                  </button>
                  {showDropdown && (
                    <div className="user-dropdown-menu">
                      <div className="user-dropdown-header">
                        Your Account
                      </div>
                      <div className="user-dropdown-list">
                        {userRole === 'admin' && (
                          <Link className="user-dropdown-item text-primary fw-semibold" to="/dashboard" onClick={() => setShowDropdown(false)}>
                            <i className="bi bi-speedometer2 text-primary"></i>
                            <span>Admin Dashboard</span>
                          </Link>
                        )}
                        <Link className="user-dropdown-item" to="/profile" onClick={() => setShowDropdown(false)}>
                          <i className="bi bi-person-circle"></i>
                          <span>My Profile</span>
                        </Link>
                        <Link className="user-dropdown-item" to="/profile?tab=orders" onClick={() => setShowDropdown(false)}>
                          <i className="bi bi-box-seam"></i>
                          <span>Orders</span>
                        </Link>
                        <Link className="user-dropdown-item" to="/profile?tab=addresses" onClick={() => setShowDropdown(false)}>
                          <i className="bi bi-geo-alt"></i>
                          <span>Saved Addresses</span>
                        </Link>
                        <Link className="user-dropdown-item" to="/wishlist" onClick={() => setShowDropdown(false)}>
                          <i className="bi bi-heart"></i>
                          <span>Wishlist</span>
                        </Link>
                        <div className="user-dropdown-divider"></div>
                        <button
                          className="user-dropdown-item logout-item"
                          onClick={handleLogout}
                        >
                          <i className="bi bi-box-arrow-right"></i>
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="d-flex gap-2 ms-1">
                  <Link to="/login" className="navbar-btn-login">Login</Link>
                  <Link to="/register" className="navbar-btn-register">Register</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ===================================================
          Mobile Drawer & Overlay (Only renders on mobile)
          =================================================== */}
      <div
        className={`mobile-drawer-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <aside className={`mobile-drawer-panel ${mobileMenuOpen ? 'open' : ''}`} aria-label="Mobile Navigation">
        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <Link
            to="/"
            className="d-flex align-items-center text-white text-decoration-none"
            onClick={() => setMobileMenuOpen(false)}
          >
            <img src={logo} alt="Softpro" width="28" height="28" className="me-2" style={{ objectFit: 'contain' }} />
            <span className="fw-bold fs-6">Softpro</span>
            <span className="ms-1 fw-bold fs-6" style={{ color: '#38bdf8' }}>Innovation</span>
          </Link>
          <button
            type="button"
            className="mobile-drawer-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="mobile-drawer-body">
          {/* User Account / Auth Card */}
          {isUserLoggedIn ? (
            <div className="mobile-user-card">
              <div className="d-flex align-items-center gap-3">
                {userPicture ? (
                  <img src={formatImg(userPicture)} alt="Profile" className="mobile-user-avatar" />
                ) : (
                  <div className="mobile-user-avatar-placeholder">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="flex-grow-1 overflow-hidden">
                  <div className="mobile-user-greeting">Signed in as</div>
                  <div className="mobile-user-name text-truncate">{userName}</div>
                  <span className={`mobile-user-badge ${userRole === 'admin' ? 'admin' : 'customer'}`}>
                    <i className={`bi ${userRole === 'admin' ? 'bi-shield-check' : 'bi-person-check'} me-1`}></i>
                    {userRole === 'admin' ? 'Administrator' : 'Customer'}
                  </span>
                </div>
              </div>

              <div className="mobile-user-quick-grid">
                {userRole === 'admin' && (
                  <Link to="/dashboard" className="mobile-user-quick-btn admin" onClick={() => setMobileMenuOpen(false)}>
                    <i className="bi bi-speedometer2"></i>
                    <span>Admin Dashboard</span>
                  </Link>
                )}
                <Link to="/profile" className="mobile-user-quick-btn" onClick={() => setMobileMenuOpen(false)}>
                  <i className="bi bi-person-circle"></i>
                  <span>Profile</span>
                </Link>
                <Link to="/profile?tab=orders" className="mobile-user-quick-btn" onClick={() => setMobileMenuOpen(false)}>
                  <i className="bi bi-box-seam"></i>
                  <span>Orders</span>
                </Link>
                <Link to="/profile?tab=addresses" className="mobile-user-quick-btn" onClick={() => setMobileMenuOpen(false)}>
                  <i className="bi bi-geo-alt"></i>
                  <span>Addresses</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="mobile-auth-card">
              <div className="mobile-auth-title">Welcome to Softpro</div>
              <p className="mobile-auth-subtitle">Sign in or register to explore robotics kits, components, and manage your orders.</p>
              <div className="d-flex gap-2 mt-3">
                <Link to="/login" className="mobile-auth-btn-login flex-fill" onClick={() => setMobileMenuOpen(false)}>
                  <i className="bi bi-box-arrow-in-right me-1.5"></i>
                  Login
                </Link>
                <Link to="/register" className="mobile-auth-btn-register flex-fill" onClick={() => setMobileMenuOpen(false)}>
                  <i className="bi bi-person-plus me-1.5"></i>
                  Register
                </Link>
              </div>
            </div>
          )}

          {/* Quick Tiles (Wishlist & Cart) */}
          <div className="mobile-quick-tiles">
            <Link
              to={isUserLoggedIn ? "/wishlist" : "/login"}
              className="mobile-tile-card"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="mobile-tile-icon wishlist">
                <i className="bi bi-heart-fill"></i>
              </div>
              <div className="mobile-tile-info">
                <span className="mobile-tile-label">Wishlist</span>
                <span className="mobile-tile-value">{isUserLoggedIn ? `${wishlistCount} saved` : 'Save items'}</span>
              </div>
              {wishlistCount > 0 && <span className="mobile-tile-badge">{wishlistCount}</span>}
            </Link>

            <Link
              to={isUserLoggedIn ? "/cart" : "/login"}
              className="mobile-tile-card"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="mobile-tile-icon cart">
                <i className="bi bi-cart3"></i>
              </div>
              <div className="mobile-tile-info">
                <span className="mobile-tile-label">My Cart</span>
                <span className="mobile-tile-value">{isUserLoggedIn ? `${cartCount} items` : 'View cart'}</span>
              </div>
              {cartCount > 0 && <span className="mobile-tile-badge cart-badge">{cartCount}</span>}
            </Link>
          </div>

          {/* Navigation Section */}
          <div className="mobile-nav-section">
            <div className="mobile-section-heading">EXPLORE</div>
            <div className="mobile-nav-list">
              <NavLink to="/" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <div className="d-flex align-items-center">
                  <span className="mobile-nav-icon"><i className="bi bi-house-door-fill"></i></span>
                  <span className="mobile-nav-text">Home</span>
                </div>
                <i className="bi bi-chevron-right mobile-nav-arrow"></i>
              </NavLink>

              <NavLink to="/Product" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <div className="d-flex align-items-center">
                  <span className="mobile-nav-icon"><i className="bi bi-cpu-fill"></i></span>
                  <span className="mobile-nav-text">Products</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="mobile-nav-pill">Catalog</span>
                  <i className="bi bi-chevron-right mobile-nav-arrow"></i>
                </div>
              </NavLink>

              <NavLink to="/about" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <div className="d-flex align-items-center">
                  <span className="mobile-nav-icon"><i className="bi bi-info-circle-fill"></i></span>
                  <span className="mobile-nav-text">About Us</span>
                </div>
                <i className="bi bi-chevron-right mobile-nav-arrow"></i>
              </NavLink>

              <NavLink to="/Contact" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <div className="d-flex align-items-center">
                  <span className="mobile-nav-icon"><i className="bi bi-headset"></i></span>
                  <span className="mobile-nav-text">Contact Us</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="mobile-nav-pill support">Support</span>
                  <i className="bi bi-chevron-right mobile-nav-arrow"></i>
                </div>
              </NavLink>
            </div>
          </div>

          {/* Quick Support Card */}
          <div className="mobile-support-card">
            <div className="d-flex align-items-center gap-2 mb-1">
              <i className="bi bi-telephone-inbound text-primary"></i>
              <span className="fw-semibold text-light" style={{ fontSize: '13px' }}>Need assistance?</span>
            </div>
            <a href="tel:+919219235951" className="mobile-support-contact">
              +91 92192 35951
            </a>
            <div className="mobile-support-hours">Mon - Sat: 9:00 AM - 7:00 PM</div>
          </div>
        </div>

        {/* Drawer Footer (Logout) */}
        {isUserLoggedIn && (
          <div className="mobile-drawer-footer">
            <button
              type="button"
              className="mobile-logout-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Log Out
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};

export default Header;