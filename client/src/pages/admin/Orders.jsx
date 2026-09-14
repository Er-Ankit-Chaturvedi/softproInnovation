import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './Products.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [updatingId, setUpdatingId] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: '', message: '' });
    }, 4000);
  };

  const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/order/show`).catch(() => ({ data: [] }));
        if (Array.isArray(res.data)) {
          setOrders(res.data);
        } else {
          setOrders([]);
        }
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (order, status) => {
    const orderDisplayId = order.orderId || (order._id ? `#ORD-${order._id.slice(-6).toUpperCase()}` : 'Order');
    setUpdatingId(order._id);
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/order/${order._id || order.orderId}/status`, { status });
      if (res.data?.success) {
        setOrders((current) => current.map((item) => item._id === order._id ? { ...item, status } : item));
        showAlert('success', `${orderDisplayId} status successfully updated to ${status.toUpperCase()}.`);
      } else {
        throw new Error(res.data?.message || 'Failed to update order status');
      }
    } catch (err) {
      showAlert('danger', err.response?.data?.message || err.message || 'Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase().trim();
    const orderId = (order._id || order.orderId || '').toLowerCase();
    const customer = (order.customerName || order.user?.name || '').toLowerCase();
    const customerEmail = (order.customerEmail || order.user?.email || '').toLowerCase();
    const customerMobile = (order.customerMobile || order.address?.mobile || '').toLowerCase();

    const matchesSearch = !term || orderId.includes(term) || customer.includes(term) || customerEmail.includes(term) || customerMobile.includes(term);
    const matchesStatus = statusFilter === 'all' || (order.status || '').toLowerCase() === statusFilter.toLowerCase();
    const matchesPayment = paymentFilter === 'all' || (order.paymentMethod || '').toLowerCase() === paymentFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Reset page to 1 whenever search, status filter, payment filter, or itemsPerPage change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter, itemsPerPage]);

  // Pagination Calculations
  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      const sectionElem = document.querySelector('.prod-table-container') || document.querySelector('.dashboard-section');
      if (sectionElem) {
        sectionElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const pendingCount = orders.filter((o) => (o.status || '').toLowerCase() === 'pending').length;
  const deliveredCount = orders.filter((o) => (o.status || '').toLowerCase() === 'delivered').length;
  const inTransitCount = orders.filter((o) => {
    const s = (o.status || '').toLowerCase();
    return s === 'processing' || s === 'shipped';
  }).length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || o.total || 0), 0);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
  };

  return (
    <>
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <div className="prod-header-badge">
            <i className="bi bi-box2-heart"></i> STORE LOGISTICS & SALES
          </div>
          <h1 className="prod-title mb-1">
            Customer <span className="prod-title-highlight">Orders</span>
          </h1>
          <p className="prod-subtitle mb-0">
            Track customer transactions, update live shipping milestones, and manage order fulfillment
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-white border d-inline-flex align-items-center gap-2 px-3.5 py-2 shadow-xs fw-semibold"
            style={{ borderRadius: '10px', backgroundColor: '#ffffff', color: '#334155', fontSize: '13.5px' }}
            onClick={fetchOrders}
            disabled={loading}
            title="Refresh orders list"
          >
            <i className={`bi bi-arrow-clockwise text-primary ${loading ? 'spin' : ''}`}></i> Refresh
          </button>
        </div>
      </div>

      {/* Alert Notification Toast */}
      {alert.show && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show mb-4 shadow-sm`} role="alert" style={{ borderRadius: '12px' }}>
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger'} me-2 fs-5 align-middle`}></i>
          <span>{alert.message}</span>
          <button type="button" className="btn-close shadow-none" onClick={() => setAlert({ show: false, type: '', message: '' })}></button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="prod-metric-card prod-metric-total">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="prod-metric-label">Total Orders</span>
                <div className="prod-metric-val">{orders.length}</div>
              </div>
              <div className="prod-metric-icon prod-icon-blue">
                <i className="bi bi-bag-check-fill"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="prod-metric-card prod-metric-instock">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="prod-metric-label">Delivered</span>
                <div className="prod-metric-val text-success">{deliveredCount}</div>
              </div>
              <div className="prod-metric-icon prod-icon-green">
                <i className="bi bi-check-circle-fill"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="prod-metric-card prod-metric-featured">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="prod-metric-label">In Transit / Pending</span>
                <div className="prod-metric-val" style={{ color: '#d97706' }}>{pendingCount + inTransitCount}</div>
              </div>
              <div className="prod-metric-icon prod-icon-amber">
                <i className="bi bi-truck"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="prod-metric-card prod-metric-outstock" style={{ borderColor: '#cffafe' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="prod-metric-label">Gross Revenue</span>
                <div className="prod-metric-val" style={{ color: '#0284c7', fontSize: '20px' }}>
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="prod-metric-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                <i className="bi bi-cash-stack"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="prod-filter-card">
        <div className="row g-2.5 align-items-center">
          {/* Search Bar */}
          <div className="col-12 col-md-5">
            <div className="prod-search-wrap">
              <i className="bi bi-search prod-search-icon"></i>
              <input
                type="text"
                className="prod-search-input"
                placeholder="Search by Order ID, customer name, mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="prod-search-clear"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select prod-select w-100"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses ({orders.length})</option>
              <option value="pending">Pending ({pendingCount})</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered ({deliveredCount})</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select prod-select w-100"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="all">All Payments</option>
              <option value="razorpay">Razorpay</option>
              <option value="cod">Cash on Delivery</option>
              <option value="payu">PayU</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="col-12 col-md-2 d-flex justify-content-md-end">
            {(searchTerm || statusFilter !== 'all' || paymentFilter !== 'all') ? (
              <button
                type="button"
                className="btn btn-light border btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-1 py-2 text-secondary fw-semibold"
                style={{ borderRadius: '10px' }}
                onClick={handleResetFilters}
              >
                <i className="bi bi-arrow-counterclockwise"></i> Reset
              </button>
            ) : (
              <div className="text-muted small text-md-end w-100 pe-1">
                <span className="fw-semibold text-dark">{filteredOrders.length}</span> orders
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="prod-table-container mb-4">
        {/* Orders Table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '6%' }} className="text-center">S.No</th>
                <th style={{ width: '18%' }}>Order ID</th>
                <th style={{ width: '20%' }}>Customer</th>
                <th style={{ width: '16%' }}>Date</th>
                <th style={{ width: '14%' }}>Total (₹)</th>
                <th style={{ width: '14%' }}>Status</th>
                <th style={{ width: '12%' }} className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <div className="py-4">
                      <i className="bi bi-cart-x fs-1 d-block mb-3 text-secondary opacity-50"></i>
                      <h5 className="text-dark fw-bold mb-1">No Orders Placed Yet</h5>
                      <p className="text-muted small mb-0">
                        {searchTerm || statusFilter !== 'all'
                          ? 'No orders match your active filter search.'
                          : 'When customers place orders from the store, they will appear here in real-time.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, index) => {
                  const orderId = order.orderId || (order._id ? `#ORD-${order._id.slice(-6).toUpperCase()}` : `#ORD-${startIndex + index + 1}`);
                  const customerName = order.customerName || order.user?.name || 'Customer';
                  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today';
                  const totalAmt = Number(order.totalAmount || order.total || 0).toLocaleString('en-IN');
                  const status = order.status || 'Pending';

                  return (
                    <tr key={order._id || index}>
                      <td className="text-center text-muted fw-semibold" style={{ fontSize: '13px' }}>
                        {startIndex + index + 1}
                      </td>
                      <td>
                        <strong className="text-dark d-block" style={{ maxWidth: '180px', overflowWrap: 'anywhere' }}>{orderId}</strong>
                        <small className="text-muted">{order.items?.length || 0} item(s)</small>
                      </td>
                      <td>
                        <span className="text-dark fw-medium d-block">{customerName}</span>
                        <small className="text-muted">{order.customerMobile || order.user_id?.mobile || ''}</small>
                      </td>
                      <td>
                        <span className="text-muted small">{orderDate}</span>
                      </td>
                      <td>
                        <strong className="text-dark">₹ {totalAmt}</strong>
                      </td>
                      <td>
                        <select
                          className={`form-select form-select-sm ${
                          status.toLowerCase() === 'delivered' ? 'bg-success-subtle text-success border border-success-subtle' :
                          status.toLowerCase() === 'shipped' ? 'bg-primary-subtle text-primary border border-primary-subtle' :
                          status.toLowerCase() === 'processing' ? 'bg-info-subtle text-info-emphasis border border-info-subtle' :
                          status.toLowerCase() === 'cancelled' ? 'bg-danger-subtle text-danger border border-danger-subtle' :
                          'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                          }`}
                          value={status.toLowerCase()}
                          disabled={updatingId === order._id}
                          onChange={(event) => updateOrderStatus(order, event.target.value)}
                          style={{ minWidth: '112px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="text-end">
                        <Link
                          to={`/dashboard/orders/${order._id || order.orderId}`}
                          className="btn btn-sm btn-primary px-3 rounded-2 fw-semibold d-inline-flex align-items-center gap-1"
                          style={{ backgroundColor: '#3945E0', border: 'none', fontSize: '12.5px' }}
                          title="Open full order details"
                        >
                          <span>View</span>
                          <i className="bi bi-arrow-up-right" style={{ fontSize: '11px' }}></i>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Premium SaaS Pagination */}
        {!loading && totalItems > 0 && (
          <div className="prod-table-footer">
            {/* Left Section: Info & Rows Per Page */}
            <div className="prod-footer-left">
              <div className="prod-showing-pill">
                <i className="bi bi-layers-half text-primary"></i>
                <span>
                  Showing <strong className="text-dark">{startIndex + 1}&ndash;{endIndex}</strong> of{' '}
                  <strong className="text-dark">{totalItems}</strong> orders
                </span>
                {totalItems !== orders.length && (
                  <span className="prod-filtered-badge">Filtered</span>
                )}
              </div>

              <div className="prod-rows-selector">
                <span className="prod-rows-label">Per page</span>
                <div className="prod-custom-select-wrap">
                  <select
                    id="ordersPerPageSelect"
                    className="prod-rows-select"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <i className="bi bi-chevron-down prod-select-arrow"></i>
                </div>
              </div>

              <div className="prod-stat-chips-wrap d-none d-xl-flex">
                <span className="prod-chip prod-chip-instock">
                  <span className="prod-chip-indicator bg-warning"></span>
                  {pendingCount} Pending
                </span>
                <span className="prod-chip prod-chip-featured">
                  <span className="prod-chip-indicator bg-success"></span>
                  {deliveredCount} Delivered
                </span>
              </div>
            </div>

            {/* Right Section: Pagination Nav Controls */}
            <div className="prod-footer-right">
              <div className="prod-page-counter-badge d-none d-sm-inline-flex">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </div>

              {totalPages > 1 && (
                <nav className="prod-pagination-cluster" aria-label="Orders table pagination">
                  {/* First Page Button */}
                  {totalPages > 4 && (
                    <button
                      type="button"
                      className="prod-nav-icon-btn"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(1)}
                      title="First page"
                    >
                      <i className="bi bi-chevron-bar-left"></i>
                    </button>
                  )}

                  {/* Previous Page Button */}
                  <button
                    type="button"
                    className="prod-nav-arrow-btn"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    title="Previous page"
                  >
                    <i className="bi bi-chevron-left"></i>
                    <span className="d-none d-md-inline">Prev</span>
                  </button>

                  {/* Segmented Numbers Group */}
                  <div className="prod-numbers-container">
                    {getPageNumbers().map((p, idx) =>
                      p === '...' ? (
                        <span key={`ellipsis-${idx}`} className="prod-ellipsis-span">
                          &bull;&bull;&bull;
                        </span>
                      ) : (
                        <button
                          key={`page-${p}`}
                          type="button"
                          className={`prod-num-btn ${currentPage === p ? 'active' : ''}`}
                          onClick={() => handlePageChange(p)}
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>

                  {/* Next Page Button */}
                  <button
                    type="button"
                    className="prod-nav-arrow-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    title="Next page"
                  >
                    <span className="d-none d-md-inline">Next</span>
                    <i className="bi bi-chevron-right"></i>
                  </button>

                  {/* Last Page Button */}
                  {totalPages > 4 && (
                    <button
                      type="button"
                      className="prod-nav-icon-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(totalPages)}
                      title="Last page"
                    >
                      <i className="bi bi-chevron-bar-right"></i>
                    </button>
                  )}
                </nav>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Orders;
