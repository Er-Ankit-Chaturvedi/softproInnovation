import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { formatImg } from '../../utils/imageUrl';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  // Modal State for Quick View
  const [viewProduct, setViewProduct] = useState(null);
  const [activeModalImgIdx, setActiveModalImgIdx] = useState(0);

  // In-App Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '' });
  const [deletingId, setDeletingId] = useState(null);

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: '', message: '' });
    }, 4000);
  };

  const fetchProductsAndCategories = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/product/show`),
        axios.get(`${API_BASE_URL}/api/category/show`)
      ]);

      if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value.data)) {
        setProducts(prodRes.value.data);
      } else {
        setProducts([]);
      }

      if (catRes.status === 'fulfilled' && Array.isArray(catRes.value.data)) {
        setCategories(catRes.value.data);
      }
    } catch {
      showAlert('danger', 'Failed to load products from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const openDeleteModal = (prod) => {
    setDeleteModal({
      show: true,
      id: prod._id,
      name: prod.name || 'Product'
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    const targetId = deleteModal.id;
    const targetName = deleteModal.name;
    setDeletingId(targetId);

    // Optimistically remove
    setProducts(prev => prev.filter(p => p._id !== targetId));

    try {
      const res = await axios.delete(`${API_BASE_URL}/api/product/delete/${targetId}`);
      showAlert('success', res.data?.message || `Product "${targetName}" deleted successfully!`);
      setDeleteModal({ show: false, id: null, name: '' });
      fetchProductsAndCategories();
    } catch {
      try {
        const fallbackRes = await axios.post(`${API_BASE_URL}/api/product/delete/${targetId}`);
        showAlert('success', fallbackRes.data?.message || `Product "${targetName}" deleted successfully!`);
        setDeleteModal({ show: false, id: null, name: '' });
        fetchProductsAndCategories();
      } catch (fallbackErr) {
        const errMsg = fallbackErr.response?.data?.message || 'Failed to delete product.';
        showAlert('danger', errMsg);
        fetchProductsAndCategories(); // rollback
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (product) => {
    const nextStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await axios.patch(`${API_BASE_URL}/api/product/patch/${product._id}`, {
        status: nextStatus
      });
      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, status: nextStatus } : p));
      showAlert('success', `Product set to ${nextStatus}.`);
    } catch {
      showAlert('danger', 'Failed to update product status.');
    }
  };

  const handleToggleFeature = async (product) => {
    const nextFeature = !product.is_feature;
    try {
      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, is_feature: nextFeature } : p));
      await axios.patch(`${API_BASE_URL}/api/product/patch/${product._id}`, {
        is_feature: nextFeature
      });
      showAlert('success', `Product "${product.name}" ${nextFeature ? 'added to' : 'removed from'} Featured items.`);
    } catch {
      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, is_feature: !nextFeature } : p));
      showAlert('danger', 'Failed to update featured status.');
    }
  };

  // Filter Logic
  const filteredProducts = products.filter(item => {
    const nameMatch = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const shortDescMatch = (item.shortdescription || '').toLowerCase().includes(searchTerm.toLowerCase());
    const tagMatch = Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSearch = nameMatch || shortDescMatch || tagMatch;

    const catId = item.category_id?._id || item.category_id;
    const matchesCategory = selectedCategory === 'all' || catId === selectedCategory;

    const matchesStock = selectedStockStatus === 'all' || (item.stockstatus || '').toLowerCase() === selectedStockStatus.toLowerCase();

    const matchesStatus = selectedStatus === 'all'
      ? true
      : selectedStatus === 'featured'
      ? Boolean(item.is_feature)
      : (item.status || 'active').toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesCategory && matchesStock && matchesStatus;
  });

  // Summary Metrics
  const totalCount = products.length;
  const inStockCount = products.filter(p => (p.stockstatus || '').toLowerCase() === 'in stock').length;
  const outOfStockCount = products.filter(p => (p.stockstatus || '').toLowerCase() === 'out of stock' || (p.stockquantity || 0) === 0).length;
  const featuredCount = products.filter(p => p.is_feature).length;

  // Reset page to 1 whenever search/filters or itemsPerPage change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStockStatus, selectedStatus, itemsPerPage]);

  // Pagination Calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

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
      const tableElem = document.querySelector('.prod-table-container');
      if (tableElem) {
        tableElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 prod-page-header">
        <div>
          <div className="prod-header-badge">
            <i className="bi bi-boxes"></i> Inventory Catalog
          </div>
          <h1 className="prod-title mb-1">
            Manage <span className="prod-title-highlight">Products</span>
          </h1>
          <p className="prod-subtitle mb-0">
            Real-time management of store inventory, pricing, categories and live customer visibility
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-white border d-inline-flex align-items-center gap-2 px-3.5 py-2 shadow-xs fw-semibold"
            style={{ borderRadius: '0px', backgroundColor: '#ffffff', color: '#334155', fontSize: '13px', borderColor: '#e2e8f0' }}
            onClick={fetchProductsAndCategories}
            title="Refresh product list"
          >
            <i className="bi bi-arrow-clockwise text-primary"></i> Refresh
          </button>
          <Link
            to="/dashboard/products/add"
            className="btn d-inline-flex align-items-center gap-2 px-4 py-2 text-white shadow-sm fw-semibold"
            style={{
              backgroundColor: '#1e3a8a',
              border: 'none',
              borderRadius: '0px',
              fontSize: '13px'
            }}
          >
            <i className="bi bi-plus-lg"></i> Add New Product
          </Link>
        </div>
      </div>

      {/* Alert Notification */}
      {alert.show && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show mb-4 shadow-sm`} role="alert" style={{ borderRadius: '0px' }}>
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
                <span className="prod-metric-label">Total Products</span>
                <div className="prod-metric-val">{totalCount}</div>
              </div>
              <div className="prod-metric-icon prod-icon-blue">
                <i className="bi bi-box-seam-fill"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="prod-metric-card prod-metric-instock">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="prod-metric-label">In Stock</span>
                <div className="prod-metric-val text-success">{inStockCount}</div>
              </div>
              <div className="prod-metric-icon prod-icon-green">
                <i className="bi bi-check-circle-fill"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="prod-metric-card prod-metric-outstock">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="prod-metric-label">Out / Low Stock</span>
                <div className="prod-metric-val text-danger">{outOfStockCount}</div>
              </div>
              <div className="prod-metric-icon prod-icon-red">
                <i className="bi bi-exclamation-octagon-fill"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div
            className={`prod-metric-card prod-metric-featured ${selectedStatus === 'featured' ? 'border-warning shadow-sm' : ''}`}
            style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
            onClick={() => setSelectedStatus(prev => prev === 'featured' ? 'all' : 'featured')}
            title="Click to view featured products"
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="prod-metric-label">
                  Featured Items {selectedStatus === 'featured' && '✓'}
                </span>
                <div className="prod-metric-val" style={{ color: '#d97706' }}>{featuredCount}</div>
              </div>
              <div className="prod-metric-icon prod-icon-amber">
                <i className="bi bi-star-fill"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="prod-filter-card">
        <div className="row g-2.5 align-items-center">
          {/* Search Bar */}
          <div className="col-12 col-md-5">
            <div className="prod-search-wrap">
              <i className="bi bi-search prod-search-icon"></i>
              <input
                type="text"
                className="prod-search-input"
                placeholder="Search products by title, tags, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="prod-search-clear"
                  type="button"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="col-6 col-md-3">
            <select
              className="prod-select w-100"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">📁 All Categories</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.category || c.name}</option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="col-6 col-md-2">
            <select
              className="prod-select w-100"
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
            >
              <option value="all">📦 Stock Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Pre-Order">Pre-Order</option>
            </select>
          </div>

          {/* Store Visibility Filter */}
          <div className="col-12 col-md-2">
            <select
              className="prod-select w-100"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">🌐 All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="featured">⭐ Featured Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table Container */}
      <div className="prod-table-container">
        <div className="table-responsive">
          <table className="prod-table align-middle">
            <thead>
              <tr>
                <th style={{ width: '44px' }} className="text-center">#</th>
                <th style={{ width: '64px' }} className="text-center">Item</th>
                <th style={{ minWidth: '260px' }}>Product Details</th>
                <th style={{ width: '13%' }}>Category</th>
                <th style={{ width: '13%' }}>Price (₹)</th>
                <th style={{ width: '13%' }}>Stock</th>
                <th style={{ width: '11%' }}>Status</th>
                <th style={{ width: '12%' }} className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    <span className="fw-semibold">Loading product catalog...</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <div className="p-3 bg-light d-inline-flex mb-3 border" style={{ borderRadius: '0px' }}>
                      <i className="bi bi-box-seam fs-2 text-secondary opacity-50"></i>
                    </div>
                    <h6 className="fw-bold text-dark mb-1">No products found</h6>
                    <p className="text-muted small mb-3">
                      {searchTerm || selectedCategory !== 'all' || selectedStockStatus !== 'all' || selectedStatus !== 'all'
                        ? 'Try adjusting your search query or reset filter options.'
                        : 'Your inventory catalog is currently empty.'}
                    </p>
                    <Link
                      to="/dashboard/products/add"
                      className="btn btn-sm btn-primary px-3 py-1.5 fw-semibold"
                      style={{ backgroundColor: '#1e3a8a', border: 'none', borderRadius: '0px' }}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Add First Product
                    </Link>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((prod, index) => {
                  const thumbUrl = formatImg(prod.thumbnail, null);
                  const catName = prod.category_id?.category || prod.category_id?.name || 'General';
                  const isActive = prod.status === 'active';
                  const stockLower = (prod.stockstatus || '').toLowerCase();
                  const isStock = stockLower === 'in stock';
                  const isLow = stockLower === 'low stock';

                  return (
                    <tr key={prod._id || index}>
                      {/* S.No */}
                      <td className="text-center">
                        <span className="prod-sno-num">{startIndex + index + 1}</span>
                      </td>

                      {/* Thumbnail */}
                      <td className="text-center">
                        <div className="prod-thumb-box">
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt={prod.name}
                              className="prod-thumb-img"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/100x100?text=No+Img';
                              }}
                            />
                          ) : (
                            <i className="bi bi-cpu text-secondary opacity-50 fs-5"></i>
                          )}
                        </div>
                      </td>

                      {/* Product Details */}
                      <td>
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                            <span className="prod-name">
                              {prod.name}
                            </span>
                            {prod.is_feature ? (
                              <span className="prod-badge-featured" title="Featured item">
                                <i className="bi bi-star-fill text-warning me-1"></i>
                                Featured
                              </span>
                            ) : null}
                          </div>
                          <p className="prod-desc-text">
                            {prod.shortdescription || 'No summary provided for this item'}
                          </p>
                          <div className="d-flex flex-wrap gap-1">
                            {prod.isfreedelivery && (
                              <span className="prod-tag-pill prod-tag-delivery">
                                <i className="bi bi-truck me-1"></i>Free Delivery
                              </span>
                            )}
                            {prod.iscouponavailable && (
                              <span className="prod-tag-pill prod-tag-coupon">
                                <i className="bi bi-tag-fill me-1"></i>Coupon
                              </span>
                            )}
                            {Array.isArray(prod.tags) &&
                              prod.tags.slice(0, 2).map((tag, tIdx) => (
                                <span key={tIdx} className="prod-tag-pill prod-tag-hash">
                                  #{tag}
                                </span>
                              ))}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <div className="prod-cat-text">
                          <i className="bi bi-folder2 text-secondary opacity-75 me-1.5"></i>
                          <span>{catName}</span>
                        </div>
                        {prod.height && prod.width ? (
                          <div className="prod-dim-text">
                            <i className="bi bi-rulers me-1"></i>
                            <span>{prod.height} × {prod.width} mm</span>
                          </div>
                        ) : null}
                      </td>

                      {/* Price Details */}
                      <td>
                        <div className="prod-price-cell">
                          <div className="d-flex align-items-baseline gap-1.5 text-nowrap">
                            <span className="prod-price-current">
                              ₹{Number(prod.price || 0).toLocaleString('en-IN')}
                            </span>
                            {prod.compareprice && Number(prod.compareprice) > Number(prod.price) ? (
                              <span className="prod-price-compare">
                                ₹{Number(prod.compareprice).toLocaleString('en-IN')}
                              </span>
                            ) : null}
                          </div>
                          {prod.costprice ? (
                            <div className="prod-price-cost text-nowrap">
                              Cost: ₹{Number(prod.costprice).toLocaleString('en-IN')}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Stock Status */}
                      <td>
                        <div className="prod-stock-cell">
                          <div className={`prod-stock-badge ${isStock ? 'prod-stock-in' : isLow ? 'prod-stock-low' : 'prod-stock-out'}`}>
                            <span className="prod-stock-dot"></span>
                            <span>{prod.stockstatus || (isStock ? 'In Stock' : 'Out of Stock')}</span>
                          </div>
                          <div className="prod-stock-qty">
                            Qty: <strong className="text-dark">{prod.stockquantity ?? 0}</strong>
                          </div>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(prod)}
                          className={`prod-status-toggle ${isActive ? 'prod-status-active' : 'prod-status-inactive'}`}
                          title={`Click to mark as ${isActive ? 'Inactive' : 'Active'}`}
                        >
                          <i className={`bi ${isActive ? 'bi-check2-circle' : 'bi-dash-circle'} me-1`}></i>
                          <span>{isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="text-end">
                        <div className="d-inline-flex gap-1">
                          {/* Quick Feature Toggle Button */}
                          <button
                            type="button"
                            className={`prod-action-btn prod-action-feature ${prod.is_feature ? 'is-active' : ''}`}
                            title={prod.is_feature ? "Remove from Featured" : "Mark as Featured"}
                            onClick={() => handleToggleFeature(prod)}
                          >
                            <i className={`bi ${prod.is_feature ? 'bi-star-fill text-warning' : 'bi-star'}`}></i>
                          </button>
                          {/* Quick View Button */}
                          <button
                            type="button"
                            className="prod-action-btn prod-action-view"
                            title="Quick View Details"
                            onClick={() => {
                              setViewProduct(prod);
                              setActiveModalImgIdx(0);
                            }}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          {/* Edit Button */}
                          <Link
                            to={`/dashboard/products/edit/${prod._id}`}
                            className="prod-action-btn prod-action-edit"
                            title="Edit Product"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          {/* Delete Button */}
                          <button
                            type="button"
                            className="prod-action-btn prod-action-delete"
                            title="Delete Product"
                            onClick={() => openDeleteModal(prod)}
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Premium Pagination */}
        {!loading && totalItems > 0 && (
          <div className="prod-table-footer">
            {/* Left Section: Info & Rows Per Page */}
            <div className="prod-footer-left">
              <div className="prod-showing-pill">
                <i className="bi bi-layers-half text-primary"></i>
                <span>
                  Showing <strong className="text-dark">{startIndex + 1}&ndash;{endIndex}</strong> of{' '}
                  <strong className="text-dark">{totalItems}</strong> items
                </span>
                {totalItems !== totalCount && (
                  <span className="prod-filtered-badge">Filtered</span>
                )}
              </div>

              <div className="prod-rows-selector">
                <span className="prod-rows-label">Per page</span>
                <div className="prod-custom-select-wrap">
                  <select
                    id="itemsPerPageSelect"
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
                  <span className="prod-chip-indicator bg-success"></span>
                  {inStockCount} In Stock
                </span>
                <span className="prod-chip prod-chip-featured">
                  <i className="bi bi-star-fill text-warning"></i>
                  {featuredCount} Featured
                </span>
              </div>
            </div>

            {/* Right Section: Pagination Nav Controls */}
            <div className="prod-footer-right">
              <div className="prod-page-counter-badge d-none d-sm-inline-flex">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </div>

              {totalPages > 1 && (
                <nav className="prod-pagination-cluster" aria-label="Product table pagination">
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

      {/* QUICK VIEW MODAL */}
      {viewProduct && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '0px', overflow: 'hidden' }}>
              
              {/* Modal Header */}
              <div className="modal-header bg-light border-bottom p-3.5">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary px-2.5 py-1" style={{ borderRadius: '0px', fontSize: '12px' }}>
                    {viewProduct.category_id?.category || viewProduct.category_id?.name || 'Category'}
                  </span>
                  <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '17px' }}>
                    {viewProduct.name}
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewProduct(null)}
                ></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4">
                <div className="row g-4">
                  {/* Gallery & Images Slider */}
                  <div className="col-12 col-md-5">
                    {(() => {
                      const allImgs = [];
                      if (viewProduct.thumbnail) {
                        allImgs.push(viewProduct.thumbnail);
                      }
                      if (Array.isArray(viewProduct.images)) {
                        viewProduct.images.forEach((img) => {
                          if (img && !allImgs.includes(img)) allImgs.push(img);
                        });
                      }
                      const safeIdx = Math.min(activeModalImgIdx, Math.max(0, allImgs.length - 1));
                      const currentImg = allImgs[safeIdx] || '';
                      const currentSrc = formatImg(currentImg, 'https://placehold.co/400x400?text=No+Image');

                      const handlePrev = () => {
                        setActiveModalImgIdx((prev) => (prev - 1 + allImgs.length) % allImgs.length);
                      };

                      const handleNext = () => {
                        setActiveModalImgIdx((prev) => (prev + 1) % allImgs.length);
                      };

                      return (
                        <div>
                          {/* Main Image Slide Container */}
                          <div
                            className="position-relative border p-3 bg-white mb-3 text-center d-flex align-items-center justify-content-center shadow-xs overflow-hidden"
                            style={{ height: '260px', backgroundColor: '#f8fafc', borderRadius: '0px' }}
                          >
                            <img
                              src={currentSrc}
                              alt={`${viewProduct.name} - slide ${safeIdx + 1}`}
                              className="img-fluid"
                              style={{
                                maxHeight: '220px',
                                maxWidth: '100%',
                                objectFit: 'contain',
                                transition: 'opacity 0.3s ease, transform 0.3s ease',
                              }}
                            />

                            {/* Slide navigation controls */}
                            {allImgs.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  className="product-modal-arrow-btn prev"
                                  style={{ borderRadius: '0px' }}
                                  onClick={handlePrev}
                                  title="Previous Image"
                                  aria-label="Previous Image"
                                >
                                  <i className="bi bi-chevron-left"></i>
                                </button>

                                <button
                                  type="button"
                                  className="product-modal-arrow-btn next"
                                  style={{ borderRadius: '0px' }}
                                  onClick={handleNext}
                                  title="Next Image"
                                  aria-label="Next Image"
                                >
                                  <i className="bi bi-chevron-right"></i>
                                </button>

                                {/* Counter badge */}
                                <span
                                  className="position-absolute bottom-0 end-0 mb-2 me-2 badge bg-dark bg-opacity-75 text-white px-2 py-1"
                                  style={{ fontSize: '11px', borderRadius: '0px' }}
                                >
                                  {safeIdx + 1} / {allImgs.length}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Thumbnail Selector Strip */}
                          {allImgs.length > 1 && (
                            <div>
                              <div className="d-flex align-items-center justify-content-between mb-1.5">
                                <small className="text-muted fw-semibold" style={{ fontSize: '12px' }}>
                                  All Product Images ({allImgs.length})
                                </small>
                                <small className="text-primary" style={{ fontSize: '11px' }}>
                                  Click to slide
                                </small>
                              </div>
                              <div className="d-flex gap-2 flex-wrap">
                                {allImgs.map((img, idx) => {
                                  const isSelected = idx === safeIdx;
                                  const src = formatImg(img);
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      className="btn p-1 border bg-white"
                                      style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '0px',
                                        borderColor: isSelected ? '#3945E0' : '#e2e8f0',
                                        borderWidth: isSelected ? '2px' : '1px',
                                        boxShadow: isSelected
                                          ? '0 0 0 3px rgba(57, 69, 224, 0.18)'
                                          : 'none',
                                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                        transition: 'all 0.2s ease',
                                      }}
                                      onClick={() => setActiveModalImgIdx(idx)}
                                      title={`Slide ${idx + 1}`}
                                    >
                                      <img
                                        src={src}
                                        alt={`thumb-${idx}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Information Details */}
                  <div className="col-12 col-md-7">
                    <h6 className="text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Short Description</h6>
                    <p className="text-dark mb-3" style={{ fontSize: '14px' }}>
                      {viewProduct.shortdescription}
                    </p>

                    <h6 className="text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Pricing & Dimensions</h6>
                    <div className="row g-2 mb-3">
                      <div className="col-4">
                        <div className="p-2 bg-light border" style={{ borderRadius: '0px' }}>
                          <small className="text-muted d-block" style={{ fontSize: '11px' }}>Selling Price</small>
                          <strong className="text-dark fs-6">₹ {viewProduct.price}</strong>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 bg-light border" style={{ borderRadius: '0px' }}>
                          <small className="text-muted d-block" style={{ fontSize: '11px' }}>Compare Price</small>
                          <strong className="text-dark fs-6">₹ {viewProduct.compareprice}</strong>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 bg-light border" style={{ borderRadius: '0px' }}>
                          <small className="text-muted d-block" style={{ fontSize: '11px' }}>Cost Price</small>
                          <strong className="text-dark fs-6">₹ {viewProduct.costprice}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="p-2 bg-light border" style={{ borderRadius: '0px' }}>
                          <small className="text-muted d-block" style={{ fontSize: '11px' }}>Dimensions (H × W)</small>
                          <strong className="text-dark">{viewProduct.height} × {viewProduct.width} mm</strong>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 bg-light border" style={{ borderRadius: '0px' }}>
                          <small className="text-muted d-block" style={{ fontSize: '11px' }}>Stock & Status</small>
                          <strong className="text-dark">{viewProduct.stockquantity} units ({viewProduct.stockstatus})</strong>
                        </div>
                      </div>
                    </div>

                    <h6 className="text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Policies & Warranty</h6>
                    <ul className="list-unstyled mb-3" style={{ fontSize: '13px' }}>
                      <li className="mb-1"><i className="bi bi-shield-check text-primary me-1.5"></i><strong>Policy:</strong> {viewProduct.refundpolicy} ({viewProduct.refund_days} Days)</li>
                      <li className="mb-1"><i className="bi bi-truck text-success me-1.5"></i><strong>Free Delivery:</strong> {viewProduct.isfreedelivery ? 'Yes' : 'No'}</li>
                      <li className="mb-1"><i className="bi bi-ticket text-info me-1.5"></i><strong>Coupon Applicable:</strong> {viewProduct.iscouponavailable ? 'Yes' : 'No'}</li>
                      <li className="mb-1"><i className="bi bi-arrow-repeat text-warning me-1.5"></i><strong>Replaceable:</strong> {viewProduct.isreplaceable ? 'Yes' : 'No'}</li>
                    </ul>

                    {viewProduct.tags && viewProduct.tags.length > 0 && (
                      <div className="mb-3">
                        <small className="text-muted fw-semibold d-block mb-1">Tags</small>
                        <div className="d-flex flex-wrap gap-1">
                          {viewProduct.tags.map((t, idx) => (
                            <span key={idx} className="badge bg-secondary-subtle text-secondary border" style={{ borderRadius: '0px', fontSize: '11px' }}>
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {viewProduct.description && (
                      <div>
                        <small className="text-muted fw-semibold d-block mb-1">Full Description</small>
                        <p className="text-secondary mb-0" style={{ fontSize: '13px', maxHeight: '120px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                          {viewProduct.description}
                        </p>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer bg-light p-3">
                <Link
                  to={`/dashboard/products/edit/${viewProduct._id}`}
                  className="btn btn-primary btn-sm px-3"
                  style={{ backgroundColor: '#1e3a8a', border: 'none', borderRadius: '0px' }}
                >
                  <i className="bi bi-pencil me-1"></i> Edit Product
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm px-3"
                  style={{ borderRadius: '0px' }}
                  onClick={() => setViewProduct(null)}
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {deleteModal.show && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
            <div className="modal-content border-0 shadow-lg text-start" style={{ borderRadius: '0px', overflow: 'hidden' }}>
              <div className="modal-body p-4 text-center">
                <div 
                  className="bg-danger bg-opacity-10 text-danger d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '56px', height: '56px', borderRadius: '0px' }}
                >
                  <i className="bi bi-trash3-fill fs-2"></i>
                </div>
                <h5 className="modal-title fw-bold text-dark mb-2">Delete Product?</h5>
                <p className="text-muted small mb-3">
                  Are you sure you want to permanently delete <strong className="text-dark">"{deleteModal.name}"</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer border-0 bg-light p-3 px-4 d-flex justify-content-end gap-2">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary px-3.5 py-2 fw-medium"
                  style={{ borderRadius: '0px' }}
                  disabled={Boolean(deletingId)}
                  onClick={() => setDeleteModal({ show: false, id: null, name: '' })}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
                  style={{ borderRadius: '0px' }}
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
                      <span>Yes, Delete Product</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Products;
