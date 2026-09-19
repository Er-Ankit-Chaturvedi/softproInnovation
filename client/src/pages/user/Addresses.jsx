import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { API_BASE_URL } from '../../config/api';

const Addresses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const checkoutFormOpened = useRef(false);
  const [user] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '', address: '' });
  const [deletingId, setDeletingId] = useState(null);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
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

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
  };

  const fetchAddresses = async (userId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/address/user/${userId}`);
      if (res.data && res.data.addresses) {
        setAddresses(res.data.addresses);
      } else if (Array.isArray(res.data)) {
        setAddresses(res.data);
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
      showAlert('danger', 'Failed to load addresses from server.');
    } finally {
      setLoading(false);
    }
  };

  // Get current logged-in user
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        fetchAddresses(parsedUser._id || parsedUser.id);
      } catch (e) {
        console.error('Error parsing user data:', e);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      name: user?.name || '',
      mobile: user?.mobile || '',
      pincode: '',
      locality: '',
      address: '',
      city: '',
      state: '',
      landmark: '',
      addressType: 'Home',
      isdefault: addresses.length === 0 ? 'yes' : 'no'
    });
    setShowModal(true);
  };

  useEffect(() => {
    if (!loading && location.state?.openForm && !checkoutFormOpened.current) {
      checkoutFormOpened.current = true;
      handleOpenAddModal();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [loading, location.pathname, location.state, navigate]);

  const handleOpenEditModal = (addr) => {
    setEditingId(addr._id);
    setFormData({
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
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked ? 'yes' : 'no' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || !formData.pincode || !formData.locality || !formData.address || !formData.city || !formData.state) {
      showAlert('danger', 'Please fill in all mandatory fields.');
      return;
    }

    const userId = user._id || user.id;
    setSubmitLoading(true);

    try {
      if (editingId) {
        // Update existing address
        const res = await axios.put(`${API_BASE_URL}/api/address/update/${editingId}`, {
          ...formData,
          user_id: userId
        });
        if (res.data.success) {
          showAlert('success', 'Address updated successfully!');
          setShowModal(false);
          fetchAddresses(userId);
        } else {
          showAlert('danger', res.data.message || 'Failed to update address');
        }
      } else {
        // Add new address
        const res = await axios.post(`${API_BASE_URL}/api/address/add`, {
          ...formData,
          user_id: userId
        });
        if (res.data.success) {
          showAlert('success', 'New address added successfully!');
          setShowModal(false);
          fetchAddresses(userId);
        } else {
          showAlert('danger', res.data.message || 'Failed to add address');
        }
      }
    } catch (err) {
      console.error('Submit address error:', err);
      showAlert('danger', err.response?.data?.message || 'Server error occurred while saving address.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const userId = user._id || user.id;
      const res = await axios.put(`${API_BASE_URL}/api/address/set-default/${addressId}`);
      if (res.data.success) {
        showAlert('success', 'Default address updated!');
        fetchAddresses(userId);
      }
    } catch (err) {
      console.error('Error setting default address:', err);
      showAlert('danger', 'Failed to update default address.');
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

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    const targetId = deleteModal.id;
    const userId = user?._id || user?.id;
    setDeletingId(targetId);

    // Optimistic UI update
    setAddresses(prev => prev.filter(a => a._id !== targetId));

    try {
      const res = await axios.delete(`${API_BASE_URL}/api/address/delete/${targetId}`);
      if (res.data?.success) {
        showAlert('success', res.data?.message || 'Address deleted successfully!');
        setDeleteModal({ show: false, id: null, name: '', address: '' });
        if (userId) fetchAddresses(userId);
      }
    } catch {
      try {
        const fallbackRes = await axios.post(`${API_BASE_URL}/api/address/delete/${targetId}`);
        showAlert('success', fallbackRes.data?.message || 'Address deleted successfully!');
        setDeleteModal({ show: false, id: null, name: '', address: '' });
        if (userId) fetchAddresses(userId);
      } catch {
        showAlert('danger', 'Failed to delete address.');
        if (userId) fetchAddresses(userId); // Rollback
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header />

      {/* Hero / Header Section */}
      <section className="bg-primary text-white py-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}>
        <div className="container">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h2 className="fw-bold mb-1"><i className="bi bi-geo-alt-fill me-2"></i>My Address Book</h2>
              <p className="mb-0 text-white-50">Manage your saved shipping and billing addresses for quick checkout.</p>
            </div>
            <button className="btn btn-warning fw-bold px-4 py-2 shadow-sm rounded-pill d-flex align-items-center gap-2" onClick={handleOpenAddModal}>
              <i className="bi bi-plus-circle-fill"></i> Add New Address
            </button>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="container my-5 flex-grow-1">
        {/* Alert Notification */}
        {alert.show && (
          <div className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm border-0`} role="alert">
            <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
            {alert.message}
            <button type="button" className="btn-close" onClick={() => setAlert({ show: false, type: '', message: '' })}></button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading addresses...</span>
            </div>
            <p className="mt-3 text-muted fw-medium">Loading your address book...</p>
          </div>
        ) : addresses.length === 0 ? (
          /* Empty Address State */
          <div className="bg-white rounded-4 p-5 text-center shadow-sm border">
            <div className="display-1 text-muted mb-3"><i className="bi bi-geo"></i></div>
            <h4 className="fw-bold text-dark mb-2">No Saved Addresses Found</h4>
            <p className="text-secondary max-w-md mx-auto mb-4">You haven't added any shipping address yet. Add an address to make your checkout fast and seamless.</p>
            <button className="btn btn-primary btn-lg px-4 rounded-pill shadow-sm" onClick={handleOpenAddModal}>
              <i className="bi bi-plus-lg me-2"></i>Add Your First Address
            </button>
          </div>
        ) : (
          /* Address List Grid */
          <div className="row g-4">
            {addresses.map((addr) => {
              const isDefault = addr.isdefault === 'yes';
              const isHome = (addr.addressType || 'Home').toLowerCase() === 'home';
              return (
                <div key={addr._id} className="col-12 col-md-6 col-lg-4">
                  <div className={`card h-100 shadow-sm border-0 rounded-4 transition-all ${isDefault ? 'ring-2 ring-primary bg-primary bg-opacity-10 border-primary' : 'bg-white'}`} style={{ borderLeft: isDefault ? '5px solid #2563eb' : '1px solid #e5e7eb' }}>
                    <div className="card-body p-4 d-flex flex-column">
                      {/* Card Top Badges */}
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className={`badge ${isHome ? 'bg-info text-dark' : 'bg-secondary'} rounded-pill px-3 py-1.5 fw-bold text-uppercase`} style={{ fontSize: '11px' }}>
                          <i className={`bi ${isHome ? 'bi-house-door-fill' : 'bi-briefcase-fill'} me-1`}></i>
                          {addr.addressType || 'Home'}
                        </span>
                        {isDefault && (
                          <span className="badge bg-primary text-white rounded-pill px-3 py-1.5 fw-bold" style={{ fontSize: '11px' }}>
                            <i className="bi bi-check-circle-fill me-1"></i> DEFAULT ADDRESS
                          </span>
                        )}
                      </div>

                      {/* Recipient Details */}
                      <h5 className="fw-bold text-dark mb-1">{addr.name}</h5>
                      <p className="text-secondary small mb-3">
                        <i className="bi bi-telephone me-1 text-primary"></i> +91 {addr.mobile}
                      </p>

                      <hr className="my-2 border-secondary border-opacity-10" />

                      {/* Address Text */}
                      <div className="text-dark small flex-grow-1 mb-3 leading-relaxed">
                        <p className="mb-1 fw-medium">{addr.address || addr.Address}</p>
                        <p className="mb-1">{addr.locality || addr.localiy}{addr.landmark ? `, Landmark: ${addr.landmark}` : ''}</p>
                        <p className="mb-0 fw-semibold text-primary">
                          {addr.city}, {addr.state} - <span className="text-dark">{addr.pincode}</span>
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="d-flex align-items-center justify-content-between pt-3 border-top mt-auto gap-2">
                        {!isDefault && (
                          <button
                            className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-semibold"
                            onClick={() => handleSetDefault(addr._id)}
                            title="Set as primary address"
                          >
                            Set Default
                          </button>
                        )}
                        <div className="ms-auto d-flex gap-1">
                          <button
                            className="btn btn-sm btn-light text-primary border rounded-circle p-2 d-inline-flex align-items-center justify-content-center"
                            style={{ width: '34px', height: '34px' }}
                            onClick={() => handleOpenEditModal(addr)}
                            title="Edit Address"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-light text-danger border rounded-circle p-2 d-inline-flex align-items-center justify-content-center"
                            style={{ width: '34px', height: '34px' }}
                            onClick={() => openDeleteModal(addr)}
                            title="Delete Address"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add / Edit Address Modal */}
        {showModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 rounded-4 shadow-lg">
                <div className="modal-header bg-primary text-white rounded-top-4 px-4">
                  <h5 className="modal-title fw-bold">
                    <i className={`bi ${editingId ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                    {editingId ? 'Edit Address' : 'Add New Address'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4">
                    <div className="row g-3">
                      {/* Name */}
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold text-dark">Full Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          name="name"
                          placeholder="e.g. Rahul Sharma"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      {/* Mobile */}
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold text-dark">Mobile Number <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          name="mobile"
                          placeholder="10-digit mobile number"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      {/* Pincode */}
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold text-dark">Pincode <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          name="pincode"
                          placeholder="6-digit pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      {/* Locality */}
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold text-dark">Locality / Area / Sector <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          name="locality"
                          placeholder="e.g. Sector 62 or Indiranagar"
                          value={formData.locality}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      {/* Full Street Address */}
                      <div className="col-12">
                        <label className="form-label fw-semibold text-dark">Flat, House No., Building, Street Address <span className="text-danger">*</span></label>
                        <textarea
                          className="form-control rounded-3"
                          rows="2"
                          name="address"
                          placeholder="e.g. Flat No. 402, Sunshine Apartments, Main Road"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                        ></textarea>
                      </div>

                      {/* City */}
                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold text-dark">City / District <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          name="city"
                          placeholder="e.g. Lucknow"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      {/* State */}
                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold text-dark">State <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          name="state"
                          placeholder="e.g. Uttar Pradesh"
                          value={formData.state}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      {/* Landmark */}
                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold text-dark">Landmark (Optional)</label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          name="landmark"
                          placeholder="e.g. Near Metro Station"
                          value={formData.landmark}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* Address Type */}
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold text-dark d-block">Address Type</label>
                        <div className="btn-group w-100" role="group">
                          {['Home', 'Work', 'Other'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              className={`btn btn-outline-primary ${formData.addressType === type ? 'active fw-bold' : ''}`}
                              onClick={() => setFormData(prev => ({ ...prev, addressType: type }))}
                            >
                              <i className={`bi ${type === 'Home' ? 'bi-house-door' : type === 'Work' ? 'bi-briefcase' : 'bi-geo-alt'} me-1`}></i>
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Is Default Checkbox */}
                      <div className="col-12 col-md-6 d-flex align-items-center">
                        <div className="form-check mt-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="isdefaultCheck"
                            name="isdefault"
                            checked={formData.isdefault === 'yes'}
                            onChange={handleInputChange}
                          />
                          <label className="form-check-label fw-semibold text-dark" htmlFor="isdefaultCheck">
                            Make this my default shipping address
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer bg-light rounded-bottom-4 px-4">
                    <button type="button" className="btn btn-secondary px-4 rounded-pill" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary px-4 rounded-pill fw-bold" disabled={submitLoading}>
                      {submitLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span> Saving...
                        </>
                      ) : (
                        editingId ? 'Update Address' : 'Save Address'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.show && (
          <div 
            className="modal fade show d-block" 
            tabIndex="-1" 
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
            role="dialog"
          >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
              <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                <div className="modal-body p-4 text-center">
                  <div 
                    className="rounded-circle bg-danger bg-opacity-10 text-danger d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: '64px', height: '64px' }}
                  >
                    <i className="bi bi-trash3-fill fs-2"></i>
                  </div>
                  <h5 className="modal-title fw-bold text-dark mb-2">Delete Address?</h5>
                  <p className="text-muted small mb-3">
                    Are you sure you want to delete the address for <strong className="text-dark">"{deleteModal.name}"</strong>{deleteModal.address ? ` (${deleteModal.address})` : ''}?
                  </p>
                </div>
                <div className="modal-footer border-0 bg-light p-3 px-4 d-flex justify-content-end gap-2">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary px-3.5 py-2 fw-medium rounded-3"
                    disabled={Boolean(deletingId)}
                    onClick={() => setDeleteModal({ show: false, id: null, name: '', address: '' })}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger px-4 py-2 fw-semibold rounded-3 d-inline-flex align-items-center gap-2 shadow-sm"
                    disabled={Boolean(deletingId)}
                    onClick={confirmDelete}
                  >
                    {deletingId ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-trash3"></i>
                        <span>Yes, Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Addresses;
