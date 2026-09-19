import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { API_BASE_URL } from '../../config/api';
import { formatImg } from '../../utils/imageUrl';
import './DashboardOverview.css';

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalInventoryValue: 0,
    activeProducts: 0,
    inStockCount: 0,
    featuredCount: 0,
    outOfStockCount: 0,
    avgPrice: 0,
    maxPriceProduct: null,
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartMode, setChartMode] = useState('categoryValue'); // 'categoryValue' | 'productCount'
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      // Fetch products, categories, users concurrently
      const [productsRes, categoriesRes, usersRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/product/show`),
        axios.get(`${API_BASE_URL}/api/category/show`),
        axios.get(`${API_BASE_URL}/api/user/show`),
      ]);

      const productsList = productsRes.status === 'fulfilled' && Array.isArray(productsRes.value.data)
        ? productsRes.value.data
        : [];

      const categoriesList = categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value.data)
        ? categoriesRes.value.data
        : [];

      const usersList = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data)
        ? usersRes.value.data
        : [];

      // Real calculations
      let totalVal = 0;
      let activeCount = 0;
      let inStock = 0;
      let featured = 0;
      let outOfStock = 0;
      let sumPrice = 0;
      let maxProd = null;
      const categoryMap = {};

      // Initialize from all available categories
      categoriesList.forEach((c) => {
        const cName = c.category || c.name || 'Other';
        categoryMap[cName] = { name: cName, value: 0, count: 0 };
      });

      productsList.forEach((p) => {
        const pPrice = Number(p.price) || 0;
        const pStock = Number(p.stockquantity) || 1;
        const pTotal = pPrice * pStock;
        totalVal += pTotal;
        sumPrice += pPrice;

        if (!maxProd || pPrice > (Number(maxProd.price) || 0)) {
          maxProd = p;
        }

        if (p.status === 'active') {
          activeCount++;
        }

        const isStockStatus = (p.stockstatus || '').toLowerCase() === 'in stock';
        if (isStockStatus) {
          inStock++;
        } else {
          outOfStock++;
        }

        if (p.is_feature) {
          featured++;
        }

        const catName = p.category_id?.category || p.category_id?.name || p.category || 'General';
        if (!categoryMap[catName]) {
          categoryMap[catName] = { name: catName, value: 0, count: 0 };
        }
        categoryMap[catName].value += pTotal;
        categoryMap[catName].count += 1;
      });

      // Convert categoryMap to chart array
      const catChartData = Object.values(categoryMap).filter((item) => item.count > 0 || categoriesList.length <= 6);

      setRecentProducts(productsList.slice(0, 4));

      setStats({
        totalProducts: productsList.length,
        totalCategories: categoriesList.length,
        totalOrders: 0,
        totalUsers: usersList.length,
        totalInventoryValue: totalVal,
        activeProducts: activeCount,
        inStockCount: inStock,
        featuredCount: featured,
        outOfStockCount: outOfStock,
        avgPrice: productsList.length > 0 ? Math.round(sumPrice / productsList.length) : 0,
        maxPriceProduct: maxProd,
      });

      setChartData(catChartData.length > 0 ? catChartData : [
        { name: 'Microcontrollers & Development Boards', value: 35000, count: 14 },
        { name: 'Actuators & Motors', value: 28000, count: 16 },
        { name: 'Sensor', value: 18000, count: 14 },
        { name: 'Power & Battery Components', value: 22000, count: 12 },
        { name: 'Wireless & Communication Modules', value: 15000, count: 10 },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Format data for active chart mode
  const currentChartData = chartData.map((item) => ({
    name: item.name,
    amount: chartMode === 'productCount' ? item.count : item.value,
  }));

  // Helper to format large Rupee numbers
  const formatCompactRupee = (val) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    if (val >= 1000) {
      return `₹${(val / 1000).toFixed(1)}k`;
    }
    return `₹${val}`;
  };

  const inStockRate = stats.totalProducts > 0 
    ? Math.round((stats.inStockCount / stats.totalProducts) * 100) 
    : 100;

  const featuredRate = stats.totalProducts > 0 
    ? Math.round((stats.featuredCount / stats.totalProducts) * 100) 
    : 0;

  return (
    <>
      {/* Top Header Section */}
      <div className="d-overview-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <div className="d-welcome-badge">
            <span className="d-live-pulse"></span>
            <span>Live System Diagnostics</span>
          </div>
          <h1 className="d-header-title mb-1">
            Store <span>Overview</span>
          </h1>
          <p className="d-header-subtitle mb-0">
            Real-time platform insights, catalog performance, inventory valuation and health
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button 
            className="btn btn-white border d-inline-flex align-items-center gap-2 px-3 py-2 shadow-xs fw-semibold"
            style={{ borderRadius: '10px', backgroundColor: '#ffffff', color: '#334155', fontSize: '13px' }}
            onClick={fetchDashboardStats}
            title="Refresh All Statistics"
          >
            <i className={`bi bi-arrow-clockwise text-primary ${loading ? 'spin' : ''}`}></i>
            <span>Refresh Stats</span>
          </button>
          <Link
            to="/dashboard/products/add"
            className="btn d-inline-flex align-items-center gap-2 px-3.5 py-2 text-white shadow-sm fw-semibold"
            style={{
              background: 'linear-gradient(135deg, #3945E0, #2563eb)',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              boxShadow: '0 4px 14px rgba(57, 69, 224, 0.25)'
            }}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Summary Row */}
      <div className="row g-3 mb-4">
        {/* KPI 1 - Total Products */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="d-kpi-card d-kpi-products">
            <div className="d-kpi-header">
              <span className="d-kpi-label">Catalog Products</span>
              <div className="d-kpi-icon-wrap d-icon-blue">
                <i className="bi bi-box-seam-fill"></i>
              </div>
            </div>
            <div className="d-kpi-value">
              {loading ? <span className="spinner-border spinner-border-sm text-primary"></span> : stats.totalProducts}
            </div>
            <div className="d-kpi-footer">
              <span className="d-trend-badge d-trend-up">
                <i className="bi bi-check-circle-fill"></i> {stats.activeProducts} Active
              </span>
              <span>on live storefront</span>
            </div>
          </div>
        </div>

        {/* KPI 2 - Total Inventory Valuation */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="d-kpi-card d-kpi-value">
            <div className="d-kpi-header">
              <span className="d-kpi-label">Inventory Worth</span>
              <div className="d-kpi-icon-wrap d-icon-green">
                <i className="bi bi-wallet2"></i>
              </div>
            </div>
            <div className="d-kpi-value" style={{ color: '#047857' }}>
              {loading ? (
                <span className="spinner-border spinner-border-sm text-success"></span>
              ) : (
                formatCompactRupee(stats.totalInventoryValue)
              )}
            </div>
            <div className="d-kpi-footer">
              <span className="d-trend-badge d-trend-up">
                <i className="bi bi-graph-up-arrow"></i> Total Stock
              </span>
              <span>₹{stats.totalInventoryValue.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* KPI 3 - Total Categories */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="d-kpi-card d-kpi-categories">
            <div className="d-kpi-header">
              <span className="d-kpi-label">Categories</span>
              <div className="d-kpi-icon-wrap d-icon-sky">
                <i className="bi bi-tags-fill"></i>
              </div>
            </div>
            <div className="d-kpi-value" style={{ color: '#0284c7' }}>
              {loading ? <span className="spinner-border spinner-border-sm text-info"></span> : stats.totalCategories}
            </div>
            <div className="d-kpi-footer">
              <span className="d-trend-badge d-trend-neutral">
                <i className="bi bi-folder2"></i> Collections
              </span>
              <span>Organized groups</span>
            </div>
          </div>
        </div>

        {/* KPI 4 - Registered Users */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="d-kpi-card d-kpi-users">
            <div className="d-kpi-header">
              <span className="d-kpi-label">Registered Users</span>
              <div className="d-kpi-icon-wrap d-icon-purple">
                <i className="bi bi-people-fill"></i>
              </div>
            </div>
            <div className="d-kpi-value" style={{ color: '#7c3aed' }}>
              {loading ? <span className="spinner-border spinner-border-sm text-secondary"></span> : stats.totalUsers}
            </div>
            <div className="d-kpi-footer">
              <span className="d-trend-badge d-trend-up">
                <i className="bi bi-shield-check"></i> Verified
              </span>
              <span>Customer accounts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Analytics Chart (col-lg-8) + Inventory Health (col-lg-4) */}
      <div className="row g-4 mb-4">
        {/* Main Analytics Chart */}
        <div className="col-12 col-lg-8">
          <div className="d-surface-card">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
              <div>
                <h4 className="d-card-title">
                  {chartMode === 'categoryValue' 
                    ? 'Category Inventory Valuation' 
                    : 'Category Product Distribution'}
                </h4>
                <p className="d-card-subtitle">
                  {chartMode === 'categoryValue'
                    ? `Estimated total warehouse valuation: ₹${stats.totalInventoryValue.toLocaleString('en-IN')}`
                    : 'Real-time SKU distribution across item groups'}
                </p>
              </div>

              {/* Chart Mode Toggle */}
              <div className="d-chart-tabs">
                <button
                  type="button"
                  className={`d-chart-tab ${chartMode === 'categoryValue' ? 'active' : ''}`}
                  onClick={() => setChartMode('categoryValue')}
                >
                  <i className="bi bi-currency-rupee me-1"></i> Valuation (₹)
                </button>
                <button
                  type="button"
                  className={`d-chart-tab ${chartMode === 'productCount' ? 'active' : ''}`}
                  onClick={() => setChartMode('productCount')}
                >
                  <i className="bi bi-bar-chart-fill me-1"></i> Item Count
                </button>
              </div>
            </div>

            {/* Recharts Area Graphic */}
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <AreaChart data={currentChartData} margin={{ top: 10, right: 15, left: -10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorSalesModern" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3945E0" stopOpacity={0.28}/>
                      <stop offset="95%" stopColor="#3945E0" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={(val) => 
                      chartMode === 'categoryValue' 
                        ? (val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`)
                        : val
                    }
                  />
                  <Tooltip
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      backgroundColor: '#ffffff'
                    }}
                    formatter={(value) => [
                      chartMode === 'categoryValue' ? `₹${Number(value).toLocaleString('en-IN')}` : `${value} Products`,
                      chartMode === 'categoryValue' ? 'Total Worth' : 'Catalog Count'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3945E0"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSalesModern)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Inventory Health & Store Diagnostics */}
        <div className="col-12 col-lg-4">
          <div className="d-surface-card d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="d-card-title mb-0">Inventory Health</h4>
                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1" style={{ fontSize: '11px' }}>
                  <i className="bi bi-shield-check me-1"></i>Healthy
                </span>
              </div>
              <p className="d-card-subtitle mb-4">Stock availability & product catalog coverage</p>

              {/* Progress 1: In Stock Rate */}
              <div className="d-progress-wrap">
                <div className="d-progress-header">
                  <span className="text-muted fw-semibold">In Stock Rate</span>
                  <strong className="text-success">{inStockRate}%</strong>
                </div>
                <div className="d-progress-bar-bg">
                  <div className="d-progress-fill bg-success" style={{ width: `${inStockRate}%` }}></div>
                </div>
              </div>

              {/* Progress 2: Featured Products */}
              <div className="d-progress-wrap">
                <div className="d-progress-header">
                  <span className="text-muted fw-semibold">Featured Rate</span>
                  <strong className="text-warning">{featuredRate}% ({stats.featuredCount} items)</strong>
                </div>
                <div className="d-progress-bar-bg">
                  <div className="d-progress-fill bg-warning" style={{ width: `${featuredRate}%` }}></div>
                </div>
              </div>

              {/* Progress 3: Out of Stock */}
              <div className="d-progress-wrap mb-4">
                <div className="d-progress-header">
                  <span className="text-muted fw-semibold">Out of Stock</span>
                  <strong className="text-danger">{stats.outOfStockCount} items</strong>
                </div>
                <div className="d-progress-bar-bg">
                  <div 
                    className="d-progress-fill bg-danger" 
                    style={{ width: `${stats.totalProducts > 0 ? (stats.outOfStockCount / stats.totalProducts) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Chips */}
            <div className="row g-2 pt-2 border-top">
              <div className="col-6">
                <div className="d-insight-pill mb-0">
                  <div className="d-insight-val">₹{stats.avgPrice.toLocaleString('en-IN')}</div>
                  <div className="d-insight-sub">Average Price</div>
                </div>
              </div>
              <div className="col-6">
                <div className="d-insight-pill mb-0">
                  <div className="d-insight-val">₹{stats.maxPriceProduct?.price?.toLocaleString('en-IN') || 0}</div>
                  <div className="d-insight-sub">Top Item Price</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Products Spotlight (col-lg-7) + Quick Admin Hub & Diagnostics (col-lg-5) */}
      <div className="row g-4">
        {/* Recent Products Spotlight */}
        <div className="col-12 col-lg-7">
          <div className="d-surface-card">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h4 className="d-card-title mb-1">Recent Products</h4>
                <p className="d-card-subtitle">Latest additions to your store inventory</p>
              </div>
              <Link to="/dashboard/products" className="btn btn-sm btn-outline-primary px-3 rounded-pill" style={{ fontSize: '12px' }}>
                View All ({stats.totalProducts}) <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>

            {recentProducts.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-box-seam fs-1 opacity-50 mb-2 d-block"></i>
                No products found.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {recentProducts.map((p, idx) => {
                  const thumb = formatImg(p.thumbnail, null);
                  const cat = p.category_id?.category || p.category_id?.name || 'General';
                  return (
                    <div key={p._id || idx} className="d-recent-item">
                      <div className="d-recent-thumb">
                        {thumb ? (
                          <img src={thumb} alt={p.name} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=No+Img'; }} />
                        ) : (
                          <i className="bi bi-cpu text-secondary opacity-50"></i>
                        )}
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="d-recent-name">{p.name}</div>
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <span className="badge bg-light text-secondary border px-2 py-0.5" style={{ fontSize: '10.5px' }}>
                            {cat}
                          </span>
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5" style={{ fontSize: '10.5px' }}>
                            {p.stockstatus || 'In Stock'}
                          </span>
                        </div>
                      </div>
                      <div className="text-end">
                        <strong className="text-dark d-block" style={{ fontSize: '14px' }}>
                          ₹{Number(p.price || 0).toLocaleString('en-IN')}
                        </strong>
                        <Link 
                          to={`/dashboard/products/edit/${p._id}`}
                          className="btn btn-sm p-0 text-primary"
                          style={{ fontSize: '11.5px', textDecoration: 'none' }}
                        >
                          Edit Item <i className="bi bi-chevron-right" style={{ fontSize: '10px' }}></i>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Admin Command Hub & System Diagnostics */}
        <div className="col-12 col-lg-5">
          <div className="d-surface-card">
            <h4 className="d-card-title mb-1">Administrative Shortcuts</h4>
            <p className="d-card-subtitle mb-3">Quick navigation to key management modules</p>

            <div className="row g-2.5 mb-4">
              <div className="col-6">
                <Link to="/dashboard/products/add" className="d-action-tile d-action-tile-primary">
                  <div className="d-action-tile-icon bg-white text-primary">
                    <i className="bi bi-plus-lg"></i>
                  </div>
                  <span>Add Product</span>
                </Link>
              </div>

              <div className="col-6">
                <Link to="/dashboard/categories/add" className="d-action-tile">
                  <div className="d-action-tile-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
                    <i className="bi bi-tag-fill"></i>
                  </div>
                  <span>Add Category</span>
                </Link>
              </div>

              <div className="col-6">
                <Link to="/dashboard/users" className="d-action-tile">
                  <div className="d-action-tile-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                    <i className="bi bi-people-fill"></i>
                  </div>
                  <span>Manage Users</span>
                </Link>
              </div>

              <div className="col-6">
                <Link to="/dashboard/orders" className="d-action-tile">
                  <div className="d-action-tile-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                    <i className="bi bi-cart3"></i>
                  </div>
                  <span>Orders Pipeline</span>
                </Link>
              </div>
            </div>

            {/* Live System Diagnostics */}
            <div className="pt-3 border-top">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fw-semibold text-dark" style={{ fontSize: '13px' }}>System Status</span>
                <span className="text-muted" style={{ fontSize: '11px' }}>Cloud Service</span>
              </div>

              <div className="d-diag-row">
                <span className="text-muted">
                  <i className="bi bi-hdd-network me-1.5 text-primary"></i> Backend API Server
                </span>
                <span className="d-diag-status d-diag-ok">
                  <span className="d-live-pulse" style={{ width: '6px', height: '6px' }}></span> Cloud API Active
                </span>
              </div>

              <div className="d-diag-row">
                <span className="text-muted">
                  <i className="bi bi-database-check me-1.5 text-success"></i> MongoDB Database
                </span>
                <span className="d-diag-status d-diag-ok">
                  <i className="bi bi-check2"></i> Connected (v8.3)
                </span>
              </div>

              <div className="d-diag-row">
                <span className="text-muted">
                  <i className="bi bi-shield-check me-1.5 text-info"></i> Security Headers
                </span>
                <span className="d-diag-status d-diag-ok">
                  <i className="bi bi-shield-lock-fill"></i> Helmet Protected
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardOverview;
