import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { API_BASE_URL } from '../../config/api';
import { formatImg } from '../../utils/imageUrl';
import InvoiceBill from '../../components/InvoiceBill';

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  // User Profile State
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [picture, setPicture] = useState('');
  const [pictureFile, setPictureFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Address in Personal Details
  const [defaultAddressId, setDefaultAddressId] = useState(null);
  const [streetAddress, setStreetAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');

  // Saved Addresses Management State
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(2);
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('all');
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressSubmitLoading, setAddressSubmitLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '', address: '' });
  const [deletingId, setDeletingId] = useState(null);

  const [addressFormData, setAddressFormData] = useState({
    name: '',
    mobile: '',
    pincode: '',
    locality: '',
    address: '',
    city: '',
    state: '',
    landmark: '',
    addressType: 'Home',
    isdefault: 'no'
  });

  // Page active tab & status
  const tabParam = searchParams.get('tab');
  const validTab = tabParam && ['profile', 'orders', 'addresses', 'wishlist'].includes(tabParam) ? tabParam : null;
  const [activeTab, setActiveTab] = useState(validTab || 'profile');
  const [prevTabParam, setPrevTabParam] = useState(validTab);
  if (validTab !== prevTabParam) {
    setPrevTabParam(validTab);
    setActiveTab(validTab || 'profile');
  }

  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4500);
  };

  const fetchUserProfile = async (userId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/user/profile/${userId}`);
      if (res.data && res.data.user) {
        const u = res.data.user;
        setUser(u);
        setFullName(u.name || '');
        setEmail(u.email || '');
        setMobile(u.mobile || '');
        setPicture(u.picture || '');
      }
    } catch {
      // Ignore network errors on background refresh
    }
  };

  const fetchUserAddresses = async (userId) => {
    setAddressesLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/address/user/${userId}`);
      let list = [];
      if (res.data && res.data.addresses) {
        list = res.data.addresses;
      } else if (Array.isArray(res.data)) {
        list = res.data;
      }
      setAddresses(list);

      // Pre-fill primary address in personal details form
      const def = list.find((a) => a.isdefault === 'yes') || list[0];
      if (def) {
        setDefaultAddressId(def._id);
        setStreetAddress(def.address || def.Address || '');
        setLocality(def.locality || def.localiy || '');
        setCity(def.city || '');
        setStateName(def.state || '');
        setPincode(def.pincode || '');
      }
    } catch {
      // Handled gracefully in UI
    } finally {
      setAddressesLoading(false);
    }
  };

  const fetchUserOrders = async (userId) => {
    setOrdersLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/order/user/${userId}`);
      setOrders(res.data?.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };



  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    const storedName = localStorage.getItem('name');
    const storedAdminId = localStorage.getItem('adminId');
    const storedUser = localStorage.getItem('user');

    if (!storedToken && !storedName && !storedAdminId) {
      navigate('/login');
      return;
    }

    const initProfile = async () => {
      try {
        // Guarantee fetching the exact profile for the active session (Admin or User)
        const res = await axios.get(`${API_BASE_URL}/api/user/current-user`, {
          headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
          params: {
            adminId: storedAdminId || undefined,
            name: storedName || undefined,
            role: storedRole || undefined
          }
        });

        if (res.data && res.data.user) {
          const u = res.data.user;
          setUser(u);
          setFullName(u.name || '');
          setEmail(u.email || '');
          setMobile(u.mobile || '');
          setPicture(u.picture || '');

          // Update localStorage to stay cleanly synced across the whole app
          localStorage.setItem('user', JSON.stringify(u));
          localStorage.setItem('name', u.name);
          if (u.picture) {
            localStorage.setItem('picture', u.picture);
          } else {
            localStorage.removeItem('picture');
          }
          window.dispatchEvent(new Event('userSessionChange'));

          fetchUserAddresses(u._id);
          return;
        }
      } catch {
        // Fallback to local storage below
      }

      // Fallback to local storage if API call fails
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setFullName(parsedUser.name || '');
          setEmail(parsedUser.email || '');
          setMobile(parsedUser.mobile || '');
          setPicture(parsedUser.picture || '');

          const userId = parsedUser._id || parsedUser.id;
          if (userId) {
            fetchUserProfile(userId);
            fetchUserAddresses(userId);
          }
        } catch {
          // Ignore invalid JSON in storage
        }
      }
    };

    initProfile();
  }, [navigate]);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (activeTab === 'orders' && userId) fetchUserOrders(userId);
  }, [activeTab, user?._id, user?.id]);

  // Filter & Paginate User Orders
  const filteredUserOrders = orders.filter((order) => {
    const term = ordersSearch.toLowerCase().trim();
    const orderId = (order.orderId || order._id || '').toLowerCase();
    const itemNames = (order.items || []).map((i) => i.name || '').join(' ').toLowerCase();
    const matchesSearch = !term || orderId.includes(term) || itemNames.includes(term);
    const matchesStatus = ordersStatusFilter === 'all' || (order.status || '').toLowerCase() === ordersStatusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalUserOrders = filteredUserOrders.length;
  const totalUserOrderPages = Math.max(1, Math.ceil(totalUserOrders / ordersPerPage));
  const startUserOrderIndex = (ordersPage - 1) * ordersPerPage;
  const endUserOrderIndex = Math.min(startUserOrderIndex + ordersPerPage, totalUserOrders);
  const paginatedUserOrders = filteredUserOrders.slice(startUserOrderIndex, endUserOrderIndex);

  useEffect(() => {
    setOrdersPage(1);
  }, [ordersSearch, ordersStatusFilter, ordersPerPage]);

  const getUserOrderPageNumbers = () => {
    const pages = [];
    if (totalUserOrderPages <= 7) {
      for (let i = 1; i <= totalUserOrderPages; i++) pages.push(i);
    } else {
      if (ordersPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalUserOrderPages);
      } else if (ordersPage >= totalUserOrderPages - 3) {
        pages.push(1, '...', totalUserOrderPages - 4, totalUserOrderPages - 3, totalUserOrderPages - 2, totalUserOrderPages - 1, totalUserOrderPages);
      } else {
        pages.push(1, '...', ordersPage - 1, ordersPage, ordersPage + 1, '...', totalUserOrderPages);
      }
    }
    return pages;
  };

  const handleUserOrderPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalUserOrderPages && newPage !== ordersPage) {
      setOrdersPage(newPage);
      const elem = document.getElementById('userOrdersSection');
      if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showAlert('danger', 'Please choose a valid image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showAlert('danger', 'Image size should be less than 5MB.');
      return;
    }

    setPictureFile(file);
    const tempUrl = URL.createObjectURL(file);
    setPreviewUrl(tempUrl);

    // Auto-upload immediately to server so profile picture is saved permanently to MongoDB
    const userId = user?._id || user?.id || localStorage.getItem('adminId');
    if (!userId) {
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('picture', file);
      if (fullName) formData.append('name', fullName.trim());
      if (email) formData.append('email', email.trim());
      if (mobile) formData.append('mobile', mobile.trim());

      const res = await axios.put(`${API_BASE_URL}/api/user/profile/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.user) {
        const updatedUserData = res.data.user;
        setUser(updatedUserData);
        setPicture(updatedUserData.picture || '');
        setPictureFile(null);
        setPreviewUrl('');

        localStorage.setItem('user', JSON.stringify(updatedUserData));
        if (updatedUserData.name) localStorage.setItem('name', updatedUserData.name);
        if (updatedUserData.picture) {
          localStorage.setItem('picture', updatedUserData.picture);
        } else {
          localStorage.removeItem('picture');
        }
        window.dispatchEvent(new Event('userSessionChange'));

        showAlert('success', 'Profile picture uploaded and saved successfully!');
      }
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Failed to auto-upload image. Please click Save Profile below.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save Personal Details & Address
  const handleSubmitProfile = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showAlert('danger', 'Full Name is required.');
      return;
    }
    if (!email.trim()) {
      showAlert('danger', 'Email address is required.');
      return;
    }

    setSaving(true);
    const userId = user?._id || user?.id;

    try {
      let updatedUserData = null;

      if (pictureFile) {
        const formData = new FormData();
        formData.append('name', fullName.trim());
        formData.append('email', email.trim());
        formData.append('mobile', mobile.trim());
        formData.append('picture', pictureFile);

        const res = await axios.put(`${API_BASE_URL}/api/user/profile/${userId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        updatedUserData = res.data.user;
      } else {
        const res = await axios.put(`${API_BASE_URL}/api/user/profile/${userId}`, {
          name: fullName.trim(),
          email: email.trim(),
          mobile: mobile.trim()
        });
        updatedUserData = res.data.user;
      }

      if (updatedUserData) {
        setUser(updatedUserData);
        setFullName(updatedUserData.name || '');
        setEmail(updatedUserData.email || '');
        setMobile(updatedUserData.mobile || '');
        setPicture(updatedUserData.picture || '');
        setPictureFile(null);
        setPreviewUrl('');

        localStorage.setItem('user', JSON.stringify(updatedUserData));
        localStorage.setItem('name', updatedUserData.name);
        if (updatedUserData.picture) {
          localStorage.setItem('picture', updatedUserData.picture);
        } else {
          localStorage.removeItem('picture');
        }
        window.dispatchEvent(new Event('userSessionChange'));
      }

      // Handle Address saving if address fields are provided
      if (streetAddress.trim() || city.trim() || pincode.trim()) {
        const addressPayload = {
          name: fullName.trim(),
          mobile: mobile.trim() || '9999999999',
          address: streetAddress.trim() || 'Address Details',
          locality: locality.trim() || city.trim() || 'Locality',
          city: city.trim() || 'City',
          state: stateName.trim() || 'State',
          pincode: pincode.trim() || '000000',
          addressType: 'Home',
          isdefault: 'yes',
          user_id: userId
        };

        if (defaultAddressId) {
          await axios.put(`${API_BASE_URL}/api/address/update/${defaultAddressId}`, addressPayload);
        } else {
          const addRes = await axios.post(`${API_BASE_URL}/api/address/add`, addressPayload);
          if (addRes.data && addRes.data.address) {
            setDefaultAddressId(addRes.data.address._id);
          }
        }
        if (userId) fetchUserAddresses(userId);
      }

      showAlert('success', 'Profile and Address details saved successfully!');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update details.';
      showAlert('danger', errMsg);
    } finally {
      setSaving(false);
    }
  };

  // Address Modal Handlers
  const handleOpenAddModal = () => {
    setEditingAddressId(null);
    setAddressFormData({
      name: fullName || user?.name || '',
      mobile: mobile || user?.mobile || '',
      pincode: '',
      locality: '',
      address: '',
      city: '',
      state: '',
      landmark: '',
      addressType: 'Home',
      isdefault: addresses.length === 0 ? 'yes' : 'no'
    });
    setShowAddressModal(true);
  };

  const handleOpenEditModal = (addr) => {
    setEditingAddressId(addr._id);
    setAddressFormData({
      name: addr.name || '',
      mobile: addr.mobile || '',
      pincode: addr.pincode || '',
      locality: addr.locality || addr.localiy || '',
      address: addr.address || addr.Address || '',
      city: addr.city || '',
      state: addr.state || '',
      landmark: addr.landmark || '',
      addressType: addr.addressType || 'Home',
      isdefault: addr.isdefault || 'no'
    });
    setShowAddressModal(true);
  };

  const handleAddressInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setAddressFormData((prev) => ({ ...prev, [name]: checked ? 'yes' : 'no' }));
    } else {
      setAddressFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmitAddressForm = async (e) => {
    e.preventDefault();
    if (
      !addressFormData.name ||
      !addressFormData.mobile ||
      !addressFormData.pincode ||
      !addressFormData.locality ||
      !addressFormData.address ||
      !addressFormData.city ||
      !addressFormData.state
    ) {
      showAlert('danger', 'Please fill in all mandatory address fields.');
      return;
    }

    const userId = user?._id || user?.id;
    setAddressSubmitLoading(true);

    try {
      if (editingAddressId) {
        const res = await axios.put(`${API_BASE_URL}/api/address/update/${editingAddressId}`, {
          ...addressFormData,
          user_id: userId
        });
        if (res.data.success) {
          showAlert('success', 'Address updated successfully!');
          setShowAddressModal(false);
          fetchUserAddresses(userId);
        } else {
          showAlert('danger', res.data.message || 'Failed to update address');
        }
      } else {
        const res = await axios.post(`${API_BASE_URL}/api/address/add`, {
          ...addressFormData,
          user_id: userId
        });
        if (res.data.success) {
          showAlert('success', 'New address added successfully!');
          setShowAddressModal(false);
          fetchUserAddresses(userId);
        } else {
          showAlert('danger', res.data.message || 'Failed to add address');
        }
      }
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Error saving address.');
    } finally {
      setAddressSubmitLoading(false);
    }
  };

  const handleSetDefaultAddress = async (addrId) => {
    const userId = user?._id || user?.id;
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/address/default/${addrId}`, {
        user_id: userId
      });
      if (res.data.success) {
        showAlert('success', 'Default shipping address updated!');
        fetchUserAddresses(userId);
      }
    } catch {
      showAlert('danger', 'Failed to set default address.');
    }
  };

  const openDeleteModal = (addr) => {
    setDeleteModal({
      show: true,
      id: addr._id,
      name: addr.name || 'this address',
      address: `${addr.address || addr.Address || ''}, ${addr.city || ''}`
    });
  };

  const confirmDeleteAddress = async () => {
    if (!deleteModal.id) return;
    const targetId = deleteModal.id;
    const userId = user?._id || user?.id;
    setDeletingId(targetId);

    try {
      const res = await axios.delete(`${API_BASE_URL}/api/address/delete/${targetId}`);
      if (res.data?.success) {
        showAlert('success', 'Address removed successfully!');
        setDeleteModal({ show: false, id: null, name: '', address: '' });
        if (userId) fetchUserAddresses(userId);
      }
    } catch {
      try {
        const fallbackRes = await axios.post(`${API_BASE_URL}/api/address/delete/${targetId}`);
        showAlert('success', fallbackRes.data?.message || 'Address deleted successfully!');
        setDeleteModal({ show: false, id: null, name: '', address: '' });
        if (userId) fetchUserAddresses(userId);
      } catch {
        showAlert('danger', 'Failed to delete address.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const displayImageSrc = previewUrl || formatImg(picture, '');

  const changeTab = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  return (
    <div className="d-flex flex-column min-vh-100 profile-page-bg">
      <Header />

      <main className="container my-4 my-md-5 flex-grow-1">
        {/* Global Alert Notification */}
        {alert.show && (
          <div className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm border-0 mb-4`} role="alert">
            <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
            {alert.message}
            <button type="button" className="btn-close" onClick={() => setAlert({ show: false, type: '', message: '' })}></button>
          </div>
        )}

        <div className="row g-4 g-lg-5">
          {/* Left Column: Profile Sidebar */}
          <div className="col-12 col-md-4 col-lg-3">
            <div className="profile-sidebar-wrapper">
              {/* Avatar Circle */}
              <div className="profile-avatar-outer">
                <div className="profile-avatar-circle position-relative overflow-hidden">
                  {displayImageSrc ? (
                    <img src={displayImageSrc} alt={fullName || 'User'} className="profile-avatar-img" />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      <span className="fw-bold" style={{ fontSize: '14px', letterSpacing: '-0.3px' }}>
                        {fullName || 'User Profile'}
                      </span>
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center text-white"
                      style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(2px)' }}
                    >
                      <div className="spinner-border spinner-border-sm text-light mb-1" role="status">
                        <span className="visually-hidden">Uploading...</span>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 600 }}>Saving...</span>
                    </div>
                  )}
                </div>
                {/* Upload Button */}
                <button
                  type="button"
                  className="profile-avatar-upload-btn"
                  title="Upload profile picture"
                  disabled={uploadingAvatar}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  {uploadingAvatar ? (
                    <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }}></span>
                  ) : (
                    <i className="bi bi-camera-fill"></i>
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>

              {/* User Name & Email */}
              <h3 className="profile-user-name">{fullName || 'User'}</h3>
              <p className="profile-user-email">{email || 'No email provided'}</p>

              {/* Navigation Menu */}
              <nav className="profile-nav-menu">
                <button
                  type="button"
                  className={`profile-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => changeTab('profile')}
                >
                  <i className="bi bi-person-badge"></i>
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  className={`profile-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                  onClick={() => changeTab('orders')}
                >
                  <i className="bi bi-bag"></i>
                  <span>My Orders</span>
                </button>

                <button
                  type="button"
                  className={`profile-nav-item ${activeTab === 'addresses' ? 'active' : ''}`}
                  onClick={() => changeTab('addresses')}
                >
                  <i className="bi bi-geo-alt"></i>
                  <span>Saved Addresses</span>
                  {addresses.length > 0 && (
                    <span className="badge bg-dark rounded-pill ms-auto" style={{ fontSize: '10px' }}>
                      {addresses.length}
                    </span>
                  )}
                </button>


                <Link
                  to="/wishlist"
                  className="profile-nav-item"
                >
                  <i className="bi bi-heart"></i>
                  <span>My Wishlist</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Right Column: Content Area */}
          <div className="col-12 col-md-8 col-lg-9">
            {/* Top Heading Section */}
            <div className="mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <h1 className="profile-title-serif">Account Settings</h1>
                <p className="profile-subtitle mb-0">Manage your personal profile, addresses, and preferences.</p>
              </div>
              {activeTab === 'addresses' && (
                <button
                  className="btn btn-dark fw-bold px-3 py-2 rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
                  style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                  onClick={handleOpenAddModal}
                >
                  <i className="bi bi-plus-circle-fill"></i> Add New Address
                </button>
              )}
            </div>

            {/* TAB: Personal Details (My Profile) */}
            {activeTab === 'profile' && (
              <div className="profile-content-card">
                <h2 className="profile-card-title">Personal Details</h2>

                <form onSubmit={handleSubmitProfile}>
                  {/* Full Name */}
                  <div className="mb-4">
                    <label className="profile-field-label">FULL NAME *</label>
                    <input
                      type="text"
                      className="profile-field-input"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Email & Mobile Row */}
                  <div className="row g-3 g-md-4 mb-4">
                    <div className="col-12 col-md-6">
                      <label className="profile-field-label">EMAIL ADDRESS *</label>
                      <input
                        type="email"
                        className="profile-field-input"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="profile-field-label">MOBILE NUMBER</label>
                      <input
                        type="tel"
                        className="profile-field-input"
                        placeholder="Mobile number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Delivery Address Section directly in Personal Details */}
                  <div className="pt-3 pb-2 mb-3 border-top">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span className="profile-field-label mb-0" style={{ fontSize: '12px', color: '#111827' }}>
                        <i className="bi bi-geo-alt-fill me-1 text-danger"></i> DELIVERY ADDRESS DETAILS
                      </span>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-decoration-none p-0 text-primary fw-semibold"
                          onClick={() => changeTab('addresses')}
                        >
                          View all {addresses.length} saved addresses &rarr;
                        </button>
                      )}
                    </div>

                    {/* Street Address */}
                    <div className="mb-3">
                      <label className="profile-field-label">FLAT, HOUSE NO., BUILDING, STREET ADDRESS</label>
                      <input
                        type="text"
                        className="profile-field-input"
                        placeholder="e.g. Flat 402, Sunshine Apartments, Main Road"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                      />
                    </div>

                    {/* Locality & City */}
                    <div className="row g-3 mb-3">
                      <div className="col-12 col-md-6">
                        <label className="profile-field-label">LOCALITY / AREA</label>
                        <input
                          type="text"
                          className="profile-field-input"
                          placeholder="e.g. Indiranagar or Sector 62"
                          value={locality}
                          onChange={(e) => setLocality(e.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="profile-field-label">CITY / DISTRICT</label>
                        <input
                          type="text"
                          className="profile-field-input"
                          placeholder="e.g. Lucknow"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* State & Pincode */}
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="profile-field-label">STATE</label>
                        <input
                          type="text"
                          className="profile-field-input"
                          placeholder="e.g. Uttar Pradesh"
                          value={stateName}
                          onChange={(e) => setStateName(e.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="profile-field-label">PINCODE</label>
                        <input
                          type="text"
                          className="profile-field-input"
                          placeholder="6-digit pincode"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Profile Excellence Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      className="btn-save-excellence"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          SAVING...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-box-arrow-in-down fs-6"></i>
                          SAVE PROFILE EXCELLENCE
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: Saved Addresses Management right here */}
            {activeTab === 'addresses' && (
              <div className="profile-content-card">
                <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
                  <h2 className="profile-card-title mb-0 border-0 p-0">Saved Addresses</h2>
                  <button
                    className="btn btn-outline-dark btn-sm rounded-pill px-3 fw-semibold"
                    onClick={handleOpenAddModal}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Add Address
                  </button>
                </div>

                {addressesLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted small">Loading addresses...</p>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-5 bg-light rounded-3 p-4">
                    <i className="bi bi-geo-alt text-muted" style={{ fontSize: '3rem' }}></i>
                    <h5 className="fw-bold mt-2">No Saved Addresses</h5>
                    <p className="text-muted small mb-3">You don't have any saved shipping addresses yet.</p>
                    <button className="btn btn-dark rounded-pill px-4 py-2 fw-semibold" onClick={handleOpenAddModal}>
                      <i className="bi bi-plus-circle me-1"></i> Add Your Address Now
                    </button>
                  </div>
                ) : (
                  <div className="row g-3">
                    {addresses.map((addr) => {
                      const isDefault = addr.isdefault === 'yes';
                      const isHome = (addr.addressType || 'Home').toLowerCase() === 'home';
                      return (
                        <div key={addr._id} className="col-12 col-md-6">
                          <div
                            className={`p-3 rounded-3 border h-100 d-flex flex-column transition-all ${
                              isDefault ? 'bg-light border-dark' : 'bg-white'
                            }`}
                            style={{ borderLeft: isDefault ? '4px solid #000000' : '1px solid #e5e7eb' }}
                          >
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span
                                className={`badge ${isHome ? 'bg-secondary' : 'bg-dark'} rounded-pill px-2.5 py-1 text-uppercase`}
                                style={{ fontSize: '10px' }}
                              >
                                {addr.addressType || 'Home'}
                              </span>
                              {isDefault && (
                                <span className="badge bg-success rounded-pill px-2.5 py-1" style={{ fontSize: '10px' }}>
                                  <i className="bi bi-check2 me-1"></i> DEFAULT
                                </span>
                              )}
                            </div>

                            <h6 className="fw-bold text-dark mb-1">{addr.name}</h6>
                            <p className="text-muted small mb-2">
                              <i className="bi bi-telephone me-1"></i> {addr.mobile}
                            </p>

                            <p className="small text-secondary mb-1 flex-grow-1">
                              {addr.address || addr.Address}, {addr.locality || addr.localiy}
                              {addr.landmark ? `, ${addr.landmark}` : ''}
                              <br />
                              <strong className="text-dark">
                                {addr.city}, {addr.state} - {addr.pincode}
                              </strong>
                            </p>

                            <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-3">
                              {!isDefault ? (
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm text-decoration-none p-0 text-dark fw-bold"
                                  style={{ fontSize: '12px' }}
                                  onClick={() => handleSetDefaultAddress(addr._id)}
                                >
                                  Set as Default
                                </button>
                              ) : (
                                <span className="small text-success fw-semibold">
                                  <i className="bi bi-check-circle-fill me-1"></i> Primary Address
                                </span>
                              )}

                              <div className="d-flex gap-2 ms-auto">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary rounded-circle p-1 d-flex align-items-center justify-content-center"
                                  style={{ width: '28px', height: '28px' }}
                                  title="Edit"
                                  onClick={() => handleOpenEditModal(addr)}
                                >
                                  <i className="bi bi-pencil-fill" style={{ fontSize: '11px' }}></i>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger rounded-circle p-1 d-flex align-items-center justify-content-center"
                                  style={{ width: '28px', height: '28px' }}
                                  title="Delete"
                                  onClick={() => openDeleteModal(addr)}
                                >
                                  <i className="bi bi-trash-fill" style={{ fontSize: '11px' }}></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: My Orders */}
            {activeTab === 'orders' && (
              <div className="profile-content-card" id="userOrdersSection">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center pb-2 mb-3 border-bottom gap-2">
                  <h2 className="profile-card-title mb-0 border-0 p-0">My Orders</h2>
                  <span className="badge bg-primary-subtle text-primary fw-semibold px-3 py-1.5 rounded-pill" style={{ fontSize: '12px' }}>
                    {orders.length} Total Orders
                  </span>
                </div>

                {orders.length > 0 && (
                  <div className="row g-2 mb-3 align-items-center">
                    <div className="col-12 col-md-5">
                      <div className="position-relative">
                        <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ fontSize: '13px' }}></i>
                        <input
                          type="text"
                          className="form-control form-control-sm ps-5"
                          placeholder="Search orders by order ID or item..."
                          value={ordersSearch}
                          onChange={(e) => setOrdersSearch(e.target.value)}
                          style={{ borderRadius: '8px', fontSize: '13px', height: '36px' }}
                        />
                        {ordersSearch && (
                          <button
                            type="button"
                            className="btn btn-link btn-sm position-absolute top-50 end-0 translate-middle-y me-2 p-0 text-muted"
                            onClick={() => setOrdersSearch('')}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="col-6 col-md-4">
                      <select
                        className="form-select form-select-sm"
                        value={ordersStatusFilter}
                        onChange={(e) => setOrdersStatusFilter(e.target.value)}
                        style={{ borderRadius: '8px', fontSize: '13px', height: '36px' }}
                      >
                        <option value="all">All Orders ({orders.length})</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="col-6 col-md-3">
                      <select
                        className="form-select form-select-sm"
                        value={ordersPerPage}
                        onChange={(e) => setOrdersPerPage(Number(e.target.value))}
                        style={{ borderRadius: '8px', fontSize: '13px', height: '36px' }}
                        title="Orders per page"
                      >
                        <option value={1}>1 / page</option>
                        <option value={2}>2 / page</option>
                        <option value={5}>5 / page</option>
                        <option value={10}>10 / page</option>
                      </select>
                    </div>
                  </div>
                )}

                {ordersLoading ? (
                  <div className="text-center py-5"><span className="spinner-border text-primary"></span></div>
                ) : filteredUserOrders.length > 0 ? (
                  <>
                    <div className="d-flex flex-column gap-3">
                      {paginatedUserOrders.map((order) => {
                        const status = (order.status || 'pending').toLowerCase();
                        const paymentStatus = (order.paymentStatus || 'pending').toLowerCase();
                        const paymentMethod = (order.paymentMethod || 'COD').toUpperCase();
                        const milestoneSteps = ['pending', 'processing', 'shipped', 'delivered'];
                        const currentIndex = milestoneSteps.indexOf(status);
                        const isCancelled = status === 'cancelled';
                        const progressPercent = currentIndex >= 0 ? (currentIndex / 3) * 100 : 0;
                        const orderDate = new Date(order.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        const totalAmt = Number(order.totalAmount || 0).toLocaleString('en-IN');

                        let statusMessage = 'Your order has been placed and is awaiting confirmation.';
                        if (status === 'processing') statusMessage = 'Your order is confirmed and being carefully prepared & packed.';
                        if (status === 'shipped') statusMessage = `Your package is shipped and in transit to ${order.address?.city || 'your delivery address'}!`;
                        if (status === 'delivered') statusMessage = `Delivered successfully to ${order.address?.name || 'you'}. Thank you for shopping with us!`;
                        if (isCancelled) statusMessage = 'This order was cancelled.';

                        return (
                          <div key={order._id} className="user-order-card">
                            {/* Order Card Header */}
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom pb-3 mb-3">
                              <div>
                                <div className="d-flex align-items-center gap-2">
                                  <strong className="text-dark fs-6">
                                    Order {order.orderId || `#ORD-${order._id.slice(-6).toUpperCase()}`}
                                  </strong>
                                </div>
                                <div className="small text-muted mt-0.5">
                                  <i className="bi bi-clock me-1"></i> Placed on {orderDate}
                                </div>
                              </div>

                              <div className="d-flex flex-wrap align-items-center gap-2">
                                {/* Live Order Status Badge */}
                                <span className={`badge rounded-pill px-3 py-1.5 fw-semibold text-uppercase status-pill-${status}`} style={{ fontSize: '11.5px' }}>
                                  {status === 'pending' && <i className="bi bi-hourglass-split me-1"></i>}
                                  {status === 'processing' && <i className="bi bi-box-seam me-1"></i>}
                                  {status === 'shipped' && <i className="bi bi-truck me-1"></i>}
                                  {status === 'delivered' && <i className="bi bi-check-circle-fill me-1"></i>}
                                  {status === 'cancelled' && <i className="bi bi-x-circle-fill me-1"></i>}
                                  {status}
                                </span>

                                {/* Payment Status Badge */}
                                <span className={`badge rounded-pill px-2.5 py-1.5 fw-semibold text-uppercase status-pill-${paymentStatus === 'paid' ? 'paid' : 'pending'}`} style={{ fontSize: '11px' }}>
                                  <i className="bi bi-credit-card-2-front me-1"></i>
                                  {paymentStatus === 'paid' ? `Paid (${paymentMethod})` : `Payment ${paymentStatus} (${paymentMethod})`}
                                </span>

                                <strong className="text-dark fs-5 ms-1">₹{totalAmt}</strong>
                              </div>
                            </div>

                            {/* Live Visual Milestone Stepper */}
                            <div className="user-order-stepper-box">
                              {isCancelled ? (
                                <div className="text-center py-1 text-danger fw-semibold small">
                                  <i className="bi bi-x-circle me-1"></i> Order Cancelled
                                </div>
                              ) : (
                                <div className="user-stepper-track">
                                  <div className="user-stepper-line">
                                    <div className="user-stepper-line-fill" style={{ width: `${progressPercent}%` }}></div>
                                  </div>

                                  {[
                                    { key: 'pending', label: 'Placed', icon: 'bi-bag-check' },
                                    { key: 'processing', label: 'Processing', icon: 'bi-box-seam' },
                                    { key: 'shipped', label: 'Shipped', icon: 'bi-truck' },
                                    { key: 'delivered', label: 'Delivered', icon: 'bi-check-circle' }
                                  ].map((step, idx) => {
                                    const isDone = currentIndex > idx;
                                    const isCurrent = currentIndex === idx;
                                    const itemClass = isDone ? 'completed' : isCurrent ? 'active' : '';

                                    return (
                                      <div key={step.key} className={`user-step-item ${itemClass}`}>
                                        <div className="user-step-icon-circle">
                                          {isDone ? <i className="bi bi-check-lg"></i> : <i className={`bi ${step.icon}`}></i>}
                                        </div>
                                        <div className="user-step-title">{step.label}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Status explanation message banner */}
                              <div className={`user-order-status-banner banner-${status}`}>
                                <i className={`bi ${status === 'delivered' ? 'bi-check-circle-fill fs-5' : status === 'shipped' ? 'bi-truck fs-5' : status === 'cancelled' ? 'bi-x-circle-fill fs-5' : 'bi-info-circle-fill fs-5'}`}></i>
                                <span>{statusMessage}</span>
                              </div>
                            </div>

                            {/* Ordered Items List Preview */}
                            <div className="d-flex flex-column gap-2 mb-3">
                              {(order.items || []).map((item, itemIndex) => (
                                <div key={`${order._id}-${itemIndex}`} className="d-flex align-items-center gap-3 p-2 rounded-2 bg-light-subtle border">
                                  <div className="border rounded-2 d-flex align-items-center justify-content-center bg-white flex-shrink-0" style={{ width: 50, height: 50 }}>
                                    <img
                                      src={formatImg(item.thumbnail)}
                                      alt={item.name}
                                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                      onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Product'; }}
                                    />
                                  </div>
                                  <div className="flex-grow-1">
                                    <strong className="d-block text-dark small">{item.name}</strong>
                                    <div className="d-flex align-items-center gap-2 small text-muted">
                                      <span>Qty: <strong>{item.quantity}</strong></span>
                                      {item.category && <span>&bull; {item.category}</span>}
                                    </div>
                                  </div>
                                  <strong className="small text-dark">
                                    ₹{Number(item.total || (item.price * item.quantity) || 0).toLocaleString('en-IN')}
                                  </strong>
                                </div>
                              ))}
                            </div>

                            {/* Card Footer: Address info & Track Details Button */}
                            <div className="d-flex flex-wrap align-items-center justify-content-between pt-2 border-top gap-2">
                              <div className="small text-muted">
                                {order.address ? (
                                  <span>
                                    <i className="bi bi-geo-alt-fill text-primary me-1"></i>
                                    Deliver to: <strong className="text-dark">{order.address.name}</strong> ({order.address.city}, {order.address.state} - {order.address.pincode})
                                  </span>
                                ) : (
                                  <span>
                                    <i className="bi bi-box2 text-primary me-1"></i>
                                    {order.items?.length || 1} product(s) ordered
                                  </span>
                                )}
                              </div>

                              <div className="d-flex align-items-center gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5"
                                  onClick={() => {
                                    setTrackingOrder(order);
                                    setTimeout(() => window.print(), 120);
                                  }}
                                  title="Print Official Tax Invoice Bill"
                                >
                                  <i className="bi bi-printer text-primary"></i>
                                  <span>Invoice Bill</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary rounded-pill px-3.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5"
                                  style={{ backgroundColor: '#3945E0', border: 'none' }}
                                  onClick={() => setTrackingOrder(order)}
                                >
                                  <i className="bi bi-radar"></i>
                                  <span>Track & View Details</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination Footer */}
                    <div className="d-flex flex-wrap align-items-center justify-content-between pt-3 mt-4 border-top gap-3">
                      <div className="d-flex flex-wrap align-items-center gap-2 small text-muted">
                        <span>
                          Showing <strong>{startUserOrderIndex + 1}&ndash;{endUserOrderIndex}</strong> of <strong>{totalUserOrders}</strong> orders
                        </span>
                        <span className="text-secondary">&bull;</span>
                        <span>
                          Page <strong>{ordersPage}</strong> of <strong>{totalUserOrderPages}</strong>
                        </span>
                        <div className="d-inline-flex align-items-center gap-1 ms-sm-2">
                          <span className="text-muted">Per page:</span>
                          <select
                            className="form-select form-select-sm py-0 px-2 shadow-none"
                            style={{ width: 'auto', fontSize: '12px', height: '28px', borderRadius: '6px' }}
                            value={ordersPerPage}
                            onChange={(e) => setOrdersPerPage(Number(e.target.value))}
                          >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                          </select>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary px-2.5 py-1 rounded-2 fw-medium"
                          disabled={ordersPage === 1}
                          onClick={() => handleUserOrderPageChange(ordersPage - 1)}
                          style={{ fontSize: '12px' }}
                          title="Previous Page"
                        >
                          <i className="bi bi-chevron-left me-1"></i> Prev
                        </button>

                        {getUserOrderPageNumbers().map((p, idx) => {
                          if (p === '...') {
                            return (
                              <span key={`ellipsis-${idx}`} className="px-2 text-muted small user-select-none">
                                &hellip;
                              </span>
                            );
                          }
                          const isActive = ordersPage === p;
                          return (
                            <button
                              key={`user-order-page-${p}`}
                              type="button"
                              className={`btn btn-sm px-2.5 py-1 rounded-2 fw-semibold ${
                                isActive ? 'btn-primary text-white shadow-sm' : 'btn-outline-light text-dark border'
                              }`}
                              onClick={() => handleUserOrderPageChange(p)}
                              style={{
                                fontSize: '12px',
                                minWidth: '32px',
                                backgroundColor: isActive ? '#3945E0' : undefined,
                                borderColor: isActive ? '#3945E0' : undefined
                              }}
                            >
                              {p}
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary px-2.5 py-1 rounded-2 fw-medium"
                          disabled={ordersPage >= totalUserOrderPages}
                          onClick={() => handleUserOrderPageChange(ordersPage + 1)}
                          style={{ fontSize: '12px' }}
                          title="Next Page"
                        >
                          Next <i className="bi bi-chevron-right ms-1"></i>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <i className="bi bi-bag-x text-muted" style={{ fontSize: '3.5rem' }}></i>
                    </div>
                    <h5 className="fw-bold text-dark">{ordersSearch || ordersStatusFilter !== 'all' ? 'No matching orders found' : 'No orders found'}</h5>
                    <p className="text-muted mb-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
                      {ordersSearch || ordersStatusFilter !== 'all'
                        ? 'Try clearing your search or status filter to see all your orders.'
                        : "You haven't placed any orders yet. Explore our premier collection and find what you need!"}
                    </p>
                    {ordersSearch || ordersStatusFilter !== 'all' ? (
                      <button
                        type="button"
                        className="btn btn-outline-primary px-4 py-2 rounded-pill fw-semibold shadow-sm"
                        onClick={() => { setOrdersSearch(''); setOrdersStatusFilter('all'); }}
                      >
                        Clear Filters
                      </button>
                    ) : (
                      <Link to="/Product" className="btn btn-primary px-4 py-2 rounded-pill fw-semibold shadow-sm">
                        Browse Products
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Add / Edit Address Modal */}
      {showAddressModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header bg-dark text-white rounded-top-4 px-4 py-3">
                <h5 className="modal-title fw-bold">
                  <i className={`bi ${editingAddressId ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                  {editingAddressId ? 'Edit Address' : 'Add New Address'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddressModal(false)}></button>
              </div>
              <form onSubmit={handleSubmitAddressForm}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold text-dark small">Full Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        name="name"
                        placeholder="Recipient full name"
                        value={addressFormData.name}
                        onChange={handleAddressInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold text-dark small">Mobile Number <span className="text-danger">*</span></label>
                      <input
                        type="tel"
                        className="form-control rounded-3"
                        name="mobile"
                        placeholder="10-digit mobile"
                        value={addressFormData.mobile}
                        onChange={handleAddressInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold text-dark small">Pincode <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        name="pincode"
                        placeholder="6-digit pincode"
                        value={addressFormData.pincode}
                        onChange={handleAddressInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold text-dark small">Locality / Area <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        name="locality"
                        placeholder="e.g. Indiranagar"
                        value={addressFormData.locality}
                        onChange={handleAddressInputChange}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold text-dark small">Flat, House No., Building, Street <span className="text-danger">*</span></label>
                      <textarea
                        className="form-control rounded-3"
                        rows="2"
                        name="address"
                        placeholder="House no., apartment, street"
                        value={addressFormData.address}
                        onChange={handleAddressInputChange}
                        required
                      ></textarea>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold text-dark small">City / District <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        name="city"
                        placeholder="e.g. Lucknow"
                        value={addressFormData.city}
                        onChange={handleAddressInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold text-dark small">State <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        name="state"
                        placeholder="e.g. Uttar Pradesh"
                        value={addressFormData.state}
                        onChange={handleAddressInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold text-dark small">Address Type</label>
                      <select
                        className="form-select rounded-3"
                        name="addressType"
                        value={addressFormData.addressType}
                        onChange={handleAddressInputChange}
                      >
                        <option value="Home">Home (All day delivery)</option>
                        <option value="Work">Work (Delivery between 10 AM - 5 PM)</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6 d-flex align-items-center pt-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="isdefaultCheck"
                          name="isdefault"
                          checked={addressFormData.isdefault === 'yes'}
                          onChange={handleAddressInputChange}
                        />
                        <label className="form-check-label small fw-semibold" htmlFor="isdefaultCheck">
                          Make this my default shipping address
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light rounded-bottom-4 px-4 py-3">
                  <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowAddressModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-dark rounded-pill px-4 fw-bold" disabled={addressSubmitLoading}>
                    {addressSubmitLoading ? 'Saving...' : editingAddressId ? 'Update Address' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Address Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1070 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-body p-4 text-center">
                <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '3rem' }}></i>
                <h5 className="fw-bold mt-2">Delete Address?</h5>
                <p className="text-muted small mb-4">
                  Are you sure you want to delete this address ({deleteModal.address})? This action cannot be undone.
                </p>
                <div className="d-flex justify-content-center gap-2">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setDeleteModal({ show: false, id: null, name: '', address: '' })}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger rounded-pill px-4 fw-bold" disabled={deletingId !== null} onClick={confirmDeleteAddress}>
                    {deletingId !== null ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Order Tracking & Full Details Modal */}
      {trackingOrder && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1075 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              {/* Modal Header */}
              <div className="modal-header bg-primary text-white border-0 px-4 py-3">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="modal-title fw-bold mb-0">
                      Order {trackingOrder.orderId || `#ORD-${trackingOrder._id.slice(-6).toUpperCase()}`}
                    </h5>
                    <span className="badge bg-white text-primary rounded-pill px-2.5 py-1 text-uppercase fw-bold" style={{ fontSize: '11px' }}>
                      {trackingOrder.status || 'Pending'}
                    </span>
                  </div>
                  <small className="text-white-50">
                    Placed on {new Date(trackingOrder.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setTrackingOrder(null)} aria-label="Close"></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
                {/* 1. Large Milestone Stepper */}
                {trackingOrder.status === 'cancelled' ? (
                  <div className="alert alert-danger rounded-3 py-2.5 text-center mb-4">
                    <i className="bi bi-x-circle-fill me-2 fs-5"></i>
                    <strong>This order has been cancelled.</strong>
                  </div>
                ) : (
                  <div className="bg-light rounded-3 p-3 mb-4 border">
                    <div className="user-stepper-track py-2">
                      <div className="user-stepper-line">
                        <div
                          className="user-stepper-line-fill"
                          style={{
                            width: `${
                              ['pending', 'processing', 'shipped', 'delivered'].indexOf((trackingOrder.status || 'pending').toLowerCase()) >= 0
                                ? (['pending', 'processing', 'shipped', 'delivered'].indexOf((trackingOrder.status || 'pending').toLowerCase()) / 3) * 100
                                : 0
                            }%`
                          }}
                        ></div>
                      </div>

                      {[
                        { key: 'pending', label: 'Order Placed', icon: 'bi-bag-check' },
                        { key: 'processing', label: 'Processing', icon: 'bi-box-seam' },
                        { key: 'shipped', label: 'Shipped', icon: 'bi-truck' },
                        { key: 'delivered', label: 'Delivered', icon: 'bi-check-circle' }
                      ].map((st, idx) => {
                        const curIdx = ['pending', 'processing', 'shipped', 'delivered'].indexOf((trackingOrder.status || 'pending').toLowerCase());
                        const isDone = curIdx > idx;
                        const isCurrent = curIdx === idx;
                        const itemClass = isDone ? 'completed' : isCurrent ? 'active' : '';

                        return (
                          <div key={st.key} className={`user-step-item ${itemClass}`}>
                            <div className="user-step-icon-circle">
                              {isDone ? <i className="bi bi-check-lg"></i> : <i className={`bi ${st.icon}`}></i>}
                            </div>
                            <div className="user-step-title">{st.label}</div>
                          </div>
                        );
                      })}
                    </div>

                    <div className={`user-order-status-banner banner-${(trackingOrder.status || 'pending').toLowerCase()} mt-3`}>
                      <i className="bi bi-info-circle-fill fs-5"></i>
                      <span>
                        {(trackingOrder.status || 'pending').toLowerCase() === 'delivered'
                          ? 'Your package was safely delivered! We hope you love your purchase.'
                          : (trackingOrder.status || 'pending').toLowerCase() === 'shipped'
                          ? `Package is out with courier in transit to ${trackingOrder.address?.city || 'your address'}.`
                          : (trackingOrder.status || 'pending').toLowerCase() === 'processing'
                          ? 'Merchant is packing and preparing your electronic hardware for dispatch.'
                          : 'Your order was received and is awaiting merchant confirmation.'}
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Grid: Items & Breakdown + Shipping & Payment */}
                <div className="row g-4">
                  {/* Left Col: Items & Totals */}
                  <div className="col-12 col-md-7">
                    <h6 className="fw-bold text-dark mb-2.5">
                      <i className="bi bi-box-seam text-primary me-1.5"></i>
                      Ordered Products ({trackingOrder.items?.length || 0})
                    </h6>
                    <div className="table-responsive border rounded-3 mb-3">
                      <table className="table table-sm align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: '50px' }}>Item</th>
                            <th>Product</th>
                            <th className="text-center" style={{ width: '60px' }}>Qty</th>
                            <th className="text-end" style={{ width: '90px' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(trackingOrder.items || []).map((it, itIdx) => (
                            <tr key={itIdx}>
                              <td>
                                <img
                                  src={formatImg(it.thumbnail)}
                                  alt={it.name}
                                  style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                                  className="rounded border p-1 bg-white"
                                  onError={(e) => { e.target.src = 'https://placehold.co/80x80?text=Product'; }}
                                />
                              </td>
                              <td>
                                <strong className="text-dark d-block small">{it.name}</strong>
                                <small className="text-muted">₹{Number(it.price || 0).toLocaleString('en-IN')} each</small>
                              </td>
                              <td className="text-center fw-semibold text-muted">&times;{it.quantity}</td>
                              <td className="text-end fw-bold text-dark">
                                ₹{Number(it.total || (it.price * it.quantity) || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals Summary */}
                    <div className="bg-light p-3 rounded-3 border">
                      <div className="d-flex justify-content-between small text-muted mb-1.5">
                        <span>Subtotal</span>
                        <span className="fw-semibold text-dark">₹{Number(trackingOrder.subtotal || trackingOrder.totalAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="d-flex justify-content-between small text-muted mb-1.5">
                        <span>Delivery Charges</span>
                        {Number(trackingOrder.fee) > 0 ? (
                          <span className="fw-semibold text-dark">₹{Number(trackingOrder.fee).toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="badge bg-success-subtle text-success">FREE</span>
                        )}
                      </div>
                      {Number(trackingOrder.discount) > 0 && (
                        <div className="d-flex justify-content-between small text-danger mb-1.5">
                          <span>Discount Voucher</span>
                          <span className="fw-semibold">- ₹{Number(trackingOrder.discount).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between fs-6 fw-bold text-dark border-top pt-2 mt-2">
                        <span>Grand Total</span>
                        <span className="text-primary">₹{Number(trackingOrder.totalAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Col: Address & Payment */}
                  <div className="col-12 col-md-5">
                    {/* Delivery Address */}
                    <div className="border rounded-3 p-3 mb-3 bg-white">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <strong className="text-dark small text-uppercase fw-bold">
                          <i className="bi bi-geo-alt text-primary me-1"></i> Delivery Address
                        </strong>
                        <span className="badge bg-light text-dark border">
                          {trackingOrder.address?.addressType || 'Home'}
                        </span>
                      </div>
                      {trackingOrder.address ? (
                        <div className="small text-secondary lh-base">
                          <strong className="text-dark d-block mb-1">{trackingOrder.address.name}</strong>
                          <div>{trackingOrder.address.address}</div>
                          {trackingOrder.address.locality && <div>{trackingOrder.address.locality}</div>}
                          {trackingOrder.address.landmark && <div className="text-muted">Landmark: {trackingOrder.address.landmark}</div>}
                          <div className="fw-semibold text-dark mt-1">
                            {trackingOrder.address.city}, {trackingOrder.address.state} &ndash; {trackingOrder.address.pincode}
                          </div>
                          <div className="mt-2 text-dark">
                            <i className="bi bi-telephone text-primary me-1"></i>
                            <strong>{trackingOrder.address.mobile}</strong>
                          </div>
                        </div>
                      ) : (
                        <p className="small text-muted mb-0">No address recorded.</p>
                      )}
                    </div>

                    {/* Payment Info */}
                    <div className="border rounded-3 p-3 bg-white">
                      <strong className="text-dark small text-uppercase fw-bold d-block mb-2">
                        <i className="bi bi-credit-card text-primary me-1"></i> Payment Details
                      </strong>
                      <div className="d-flex justify-content-between align-items-center small mb-2">
                        <span className="text-muted">Method:</span>
                        <strong className="text-uppercase text-dark">{trackingOrder.paymentMethod || 'COD'}</strong>
                      </div>
                      <div className="d-flex justify-content-between align-items-center small mb-2">
                        <span className="text-muted">Payment Status:</span>
                        <span className={`badge rounded-pill text-uppercase px-2.5 py-1 ${
                          (trackingOrder.paymentStatus || 'pending').toLowerCase() === 'paid'
                            ? 'bg-success-subtle text-success border border-success-subtle'
                            : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                        }`}>
                          {trackingOrder.paymentStatus || 'pending'}
                        </span>
                      </div>
                      {trackingOrder.paymentTransactionId && (
                        <div className="small text-muted mt-2 pt-2 border-top">
                          <span>Transaction ID:</span>
                          <code className="d-block text-dark mt-0.5" style={{ wordBreak: 'break-all' }}>
                            {trackingOrder.paymentTransactionId}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-3.5 py-1.5 fw-semibold small d-inline-flex align-items-center gap-1.5"
                  onClick={() => window.print()}
                  title="Print Official Tax Invoice Bill"
                >
                  <i className="bi bi-printer"></i>
                  <span>Print Tax Invoice</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary rounded-pill px-4 py-1.5 fw-semibold small"
                  style={{ backgroundColor: '#3945E0', border: 'none' }}
                  onClick={() => setTrackingOrder(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Printable Invoice rendered exclusively for @media print */}
      {trackingOrder && (
        <div className="user-printable-bill-wrapper">
          <InvoiceBill order={trackingOrder} id="tax-invoice-bill" />
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Profile;
