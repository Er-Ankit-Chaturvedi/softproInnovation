import { useState, useMemo, useEffect, useRef } from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../../context/CartContext'
import QuickViewModal from '../../components/QuickViewModal'
import { API_BASE_URL } from '../../config/api'
import { formatImg } from '../../utils/imageUrl'
import './Product.css'

const Product = () => {
  const navigate = useNavigate()
  const { addToCart, buyNow, toggleWishlist, isInWishlist } = useCart()
  const [searchParams] = useSearchParams()
  const categoryFromUrl = searchParams.get('category')
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || 'All')
  const [prevCategoryFromUrl, setPrevCategoryFromUrl] = useState(categoryFromUrl)
  if (categoryFromUrl !== prevCategoryFromUrl) {
    setPrevCategoryFromUrl(categoryFromUrl)
    setSelectedCategory(categoryFromUrl || 'All')
  }

  const [categoryList, setCategoryList] = useState(['All'])
  const [allProductsList, setallProductsList] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('Featured')
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const [cardImgMap, setCardImgMap] = useState({})

  // Category navigation state & scroll reference
  const categoryScrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Smart matching icons for electronic & hardware component categories
  const getCategoryIcon = (name) => {
    const n = (name || '').toLowerCase().trim()
    if (n === 'all') return 'bi-grid-fill'
    if (n.includes('microcontroller') || n.includes('development board') || n.includes('mcu')) return 'bi-cpu-fill'
    if (n.includes('sensor')) return 'bi-broadcast-pin'
    if (n.includes('display') || n.includes('indicator') || n.includes('screen') || n.includes('lcd') || n.includes('oled')) return 'bi-display'
    if (n.includes('motor') || n.includes('actuator')) return 'bi-gear-wide-connected'
    if (n.includes('battery') || n.includes('power') || n.includes('supply')) return 'bi-battery-charging'
    if (n.includes('wireless') || n.includes('communication') || n.includes('bluetooth') || n.includes('wifi') || n.includes('rf')) return 'bi-wifi'
    if (n.includes('iot') || n.includes('kit') || n.includes('robot')) return 'bi-box-seam-fill'
    if (n.includes('raspberry') || n.includes('pi')) return 'bi-motherboard-fill'
    if (n.includes('arduino')) return 'bi-terminal-split'
    if (n.includes('esp8266') || n.includes('esp32') || n.includes('esp')) return 'bi-router-fill'
    return 'bi-tag-fill'
  }

  // Pre-calculate count of products per category
  const categoryCounts = useMemo(() => {
    const counts = {}
    categoryList.forEach((cat) => {
      if (cat === 'All') {
        counts[cat] = allProductsList.length
      } else {
        const catLower = cat.toLowerCase().trim()
        counts[cat] = allProductsList.filter((item) => {
          const itemCat = (item.category_id?.category || item.category || '').toLowerCase().trim()
          return itemCat === catLower || itemCat.includes(catLower) || catLower.includes(itemCat)
        }).length
      }
    })
    return counts
  }, [allProductsList, categoryList])

  const checkCategoryScroll = () => {
    if (!categoryScrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current
    setCanScrollLeft(scrollLeft > 5)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)
  }

  useEffect(() => {
    const el = categoryScrollRef.current
    if (!el) return
    checkCategoryScroll()
    el.addEventListener('scroll', checkCategoryScroll, { passive: true })
    window.addEventListener('resize', checkCategoryScroll)
    return () => {
      el.removeEventListener('scroll', checkCategoryScroll)
      window.removeEventListener('resize', checkCategoryScroll)
    }
  }, [categoryList])

  const scrollCategories = (direction) => {
    if (!categoryScrollRef.current) return
    const scrollAmount = 280
    categoryScrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  const handleCategoryClick = (cat, e) => {
    setSelectedCategory(cat)
    if (e && e.currentTarget) {
      e.currentTarget.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }
  }

  const getProductImageList = (item) => {
    if (!item) return []
    const all = []
    if (item.thumbnail) all.push(formatImg(item.thumbnail))
    if (Array.isArray(item.images)) {
      item.images.forEach((img) => {
        const formatted = formatImg(img)
        if (formatted && !all.includes(formatted)) {
          all.push(formatted)
        }
      })
    }
    return all.length > 0 ? all : ['https://placehold.co/400x400?text=No+Image']
  }

  const openQuickView = (product) => {
    const prodId = product._id || product.id
    if (prodId) {
      navigate(`/product/${prodId}`)
    }
  }

  const closeQuickView = () => {
    setQuickViewProduct(null)
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeQuickView()
    }
    if (quickViewProduct) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [quickViewProduct])


  useEffect(() => {
    let isMounted = true
    const fetchCategories = async () => {
      try {
        const [catRes, prodRes] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/api/category/show?status=active`),
          axios.get(`${API_BASE_URL}/api/product/show`)
        ])

        if (!isMounted) return

        if (catRes.status === 'fulfilled' && Array.isArray(catRes.value.data)) {
          const names = catRes.value.data.map(c => c.category || c.name).filter(Boolean)
          setCategoryList(['All', ...new Set(names)])
        }

        if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value.data)) {
          setallProductsList(prodRes.value.data)
        }
      } catch {
        // fallback handles errors gracefully
      }
    }
    fetchCategories()
    return () => {
      isMounted = false
    }
  }, [])

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return allProductsList
      .filter((item) => {
        const catName = item?.category_id?.category || item?.category || ''
        const productName = item?.name || item?.title || ''

        const matchesCategory =
          selectedCategory === 'All' ||
          catName.toLowerCase().trim() === selectedCategory.toLowerCase().trim() ||
          catName.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          selectedCategory.toLowerCase().includes(catName.toLowerCase())

        const matchesSearch =
          productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          catName.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesCategory && matchesSearch
      })
      .sort((a, b) => {
        if (sortBy === 'Price: Low to High') return (a.price || 0) - (b.price || 0)
        if (sortBy === 'Price: High to Low') return (b.price || 0) - (a.price || 0)
        if (sortBy === 'Name: A-Z') return (a.name || a.title || '').localeCompare(b.name || b.title || '')
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
      })
  }, [allProductsList, selectedCategory, searchTerm, sortBy])

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(8)

  // Reset page when filters, sorting or itemsPerPage change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, sortBy, itemsPerPage])

  // Pagination Calculations
  const totalItems = filteredProducts.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  const getPageNumbers = () => {
    const pages = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page)
      const catalogEl = document.getElementById('productCatalogGrid') || document.querySelector('.product-catalog-section')
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  return (
    <>
      <Header />

      {/* Products Page Hero Banner - Colorful, Vibrant & Professional */}
      <section className="product-hero-section">
        <div className="container-fluid px-3 px-xl-5">
          <div className="row align-items-center g-4">
            {/* Left Content Column */}
            <div className="col-lg-7 text-start">
              {/* Breadcrumb Navigation Pill */}
              <div>
                <div className="pro-hero-breadcrumb-pill">
                  <i className="bi bi-house-door-fill text-primary"></i>
                  <Link to="/">Home</Link>
                  <span className="separator">/</span>
                  <span className="text-dark fw-semibold">Products Catalog</span>
                </div>
              </div>

              {/* Colorful Live Inventory Badge */}
              <div className="d-flex align-items-center gap-2">
                <div className="pro-hero-badge">
                  <span className="pro-hero-pulse-dot"></span>
                  <span>Verified Electronics & Robotics Catalog</span>
                </div>
              </div>

              {/* Title with Vibrant Multi-Color Gradient */}
              <h1 className="product-hero-title mb-2">
                All <span className="pro-hero-gradient-text">Hardware Products</span>
              </h1>

              {/* Subtitle */}
              <p className="product-hero-subtitle mb-3">
                Explore {allProductsList.length} industrial-grade microcontrollers, intelligent sensor telemetry, and turnkey IoT innovation kits tested for engineers & makers.
              </p>

              {/* Colorful Quick Category Shortcut Chips */}
              <div className="pro-hero-tag-chips">
                <button
                  type="button"
                  className={`pro-tag-chip blue ${selectedCategory === 'Microcontrollers' ? 'active shadow-sm' : ''}`}
                  onClick={() => setSelectedCategory('Microcontrollers')}
                >
                  <i className="bi bi-cpu-fill"></i>
                  <span>Microcontrollers</span>
                </button>
                <button
                  type="button"
                  className={`pro-tag-chip emerald ${selectedCategory === 'IoT KIT' ? 'active shadow-sm' : ''}`}
                  onClick={() => setSelectedCategory('IoT KIT')}
                >
                  <i className="bi bi-box-seam-fill"></i>
                  <span>IoT KITs</span>
                </button>
                <button
                  type="button"
                  className={`pro-tag-chip purple ${selectedCategory === 'Sensors' ? 'active shadow-sm' : ''}`}
                  onClick={() => setSelectedCategory('Sensors')}
                >
                  <i className="bi bi-broadcast-pin"></i>
                  <span>Sensors</span>
                </button>
                <button
                  type="button"
                  className={`pro-tag-chip amber ${selectedCategory.toLowerCase().includes('motor') ? 'active shadow-sm' : ''}`}
                  onClick={() => {
                    const motorCat = categoryList.find(c => c.toLowerCase().includes('motor')) || 'Actuators & Motors';
                    setSelectedCategory(motorCat);
                  }}
                >
                  <i className="bi bi-gear-wide-connected"></i>
                  <span>Motors</span>
                </button>
                <button
                  type="button"
                  className={`pro-tag-chip rose ${selectedCategory.toLowerCase().includes('display') ? 'active shadow-sm' : ''}`}
                  onClick={() => {
                    const dispCat = categoryList.find(c => c.toLowerCase().includes('display')) || 'Displays & Indicators';
                    setSelectedCategory(dispCat);
                  }}
                >
                  <i className="bi bi-display"></i>
                  <span>Displays</span>
                </button>
              </div>
            </div>

            {/* Right Metric Cards Column */}
            <div className="col-lg-5">
              <div className="pro-metric-cards-grid">
                <div className="pro-metric-card">
                  <div className="pro-metric-icon-box blue">
                    <i className="bi bi-box-seam"></i>
                  </div>
                  <div className="pro-metric-content">
                    <span className="pro-metric-title">{allProductsList.length}+ Components</span>
                    <span className="pro-metric-desc">Live In Stock Inventory</span>
                  </div>
                </div>

                <div className="pro-metric-card">
                  <div className="pro-metric-icon-box emerald">
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <div className="pro-metric-content">
                    <span className="pro-metric-title">100% Genuine</span>
                    <span className="pro-metric-desc">Pre-Tested Hardware</span>
                  </div>
                </div>

                <div className="pro-metric-card">
                  <div className="pro-metric-icon-box amber">
                    <i className="bi bi-lightning-charge"></i>
                  </div>
                  <div className="pro-metric-content">
                    <span className="pro-metric-title">Fast Dispatch</span>
                    <span className="pro-metric-desc">Ships Within 24 Hours</span>
                  </div>
                </div>

                <div className="pro-metric-card">
                  <div className="pro-metric-icon-box purple">
                    <i className="bi bi-mortarboard"></i>
                  </div>
                  <div className="pro-metric-content">
                    <span className="pro-metric-title">Lab & DIY Ready</span>
                    <span className="pro-metric-desc">Colleges & Creators</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Catalog Grid Section */}
      <section id="productCatalogGrid" className="product-catalog-section py-5">
        <div className="container-fluid px-3 px-xl-5">
          {/* Top Search, Per Page & Sort Control Bar */}
          <div className="product-toolbar-row mb-3 mb-md-4">
            {/* Search Input Box */}
            <div className="product-search-box">
              <i className="bi bi-search product-search-icon"></i>
              <input
                type="text"
                className="form-control product-search-input"
                placeholder="Search products by name, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="product-search-clear-btn"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>

            {/* Controls: Per Page & Sort */}
            <div className="product-controls-wrapper">
              <div className="product-control-pill">
                <i className="bi bi-grid text-muted fs-6"></i>
                <select
                  className="form-select product-sort-select"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  aria-label="Items per page"
                >
                  <option value={8}>8 / page</option>
                  <option value={12}>12 / page</option>
                  <option value={24}>24 / page</option>
                  <option value={48}>48 / page</option>
                </select>
              </div>

              <div className="product-control-pill">
                <i className="bi bi-sort-down text-muted fs-6"></i>
                <select
                  className="form-select product-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort products by"
                >
                  <option value="Featured">Featured</option>
                  <option value="Price: Low to High">Price: Low to High</option>
                  <option value="Price: High to Low">Price: High to Low</option>
                  <option value="Name: A-Z">Name: A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Minimalist Seamless Category Pills Stream */}
          <div className="product-category-stream-wrapper mb-3 mb-md-4 position-relative">
            {/* Left Scroll Chevron Arrow (Desktop only) */}
            {canScrollLeft && (
              <button
                type="button"
                className="category-stream-arrow-btn left d-none d-md-flex"
                onClick={() => scrollCategories('left')}
                title="Scroll categories left"
                aria-label="Scroll categories left"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
            )}

            {/* Left Fade Gradient Mask */}
            {canScrollLeft && <div className="category-stream-fade-left d-none d-md-block"></div>}

            {/* Scrollable Category Pills Row */}
            <div
              ref={categoryScrollRef}
              className="category-stream-track"
            >
              {/* Reset Filter Pill */}
              {selectedCategory !== 'All' && (
                <button
                  type="button"
                  className="btn category-stream-pill clear-pill"
                  onClick={() => setSelectedCategory('All')}
                  title="Clear category filter"
                >
                  <i className="bi bi-x-circle-fill text-danger"></i>
                  <span>Clear</span>
                </button>
              )}

              {categoryList.map((cat) => {
                const isActive = selectedCategory.toLowerCase() === cat.toLowerCase()
                const count = categoryCounts[cat]
                const iconClass = getCategoryIcon(cat)

                return (
                  <button
                    key={cat}
                    type="button"
                    className={`btn category-stream-pill ${isActive ? 'active' : ''}`}
                    onClick={(e) => handleCategoryClick(cat, e)}
                    title={`Filter by ${cat}`}
                  >
                    <i className={`bi ${iconClass} category-pill-icon`}></i>
                    <span className="category-pill-name">{cat}</span>
                    {count !== undefined && (
                      <span className={`category-pill-badge ${isActive ? 'active-badge' : ''}`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Right Fade Gradient Mask */}
            {canScrollRight && <div className="category-stream-fade-right d-none d-md-block"></div>}

            {/* Right Scroll Chevron Arrow (Desktop only) */}
            {canScrollRight && (
              <button
                type="button"
                className="category-stream-arrow-btn right d-none d-md-flex"
                onClick={() => scrollCategories('right')}
                title="Scroll categories right"
                aria-label="Scroll categories right"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            )}
          </div>

          {/* Showing Count & Current Page Status */}
          <div className="product-status-bar mb-3 mb-md-4">
            <div className="product-status-left">
              {totalItems > 0 ? (
                <>
                  <span className="text-muted">Showing </span>
                  <strong className="text-dark">{startIndex + 1}&ndash;{endIndex}</strong>
                  <span className="text-muted"> of </span>
                  <strong className="text-dark">{totalItems}</strong>
                  <span className="text-muted"> products</span>
                  {selectedCategory !== 'All' && (
                    <span className="badge category-indicator-chip ms-1">
                      {selectedCategory}
                    </span>
                  )}
                  {searchTerm && (
                    <span className="badge bg-light text-secondary border ms-1">
                      &ldquo;{searchTerm}&rdquo;
                    </span>
                  )}
                </>
              ) : (
                <span>No products found</span>
              )}
            </div>

            {totalItems > 0 && totalPages > 1 && (
              <div className="text-muted small">
                Page <strong className="text-dark">{currentPage}</strong> / <strong className="text-dark">{totalPages}</strong>
              </div>
            )}
          </div>

          {/* Empty State when no products match filters */}
          {totalItems === 0 ? (
            <div className="product-empty-state text-center py-5 my-4 px-3">
              <div className="mb-3">
                <i className="bi bi-search fs-1 text-muted"></i>
              </div>
              <h5 className="fw-bold text-dark mb-2">No Products Found</h5>
              <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '420px', fontSize: '14px' }}>
                We couldn&apos;t find any products matching your current search or category filter. Try clearing filters or searching for something else.
              </p>
              <button
                type="button"
                className="btn btn-primary rounded-pill px-4 py-2"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('All')
                }}
              >
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                Reset All Filters
              </button>
            </div>
          ) : (
            /* Modern Responsive Grid: 2 Columns on Mobile, 3 on Tablet, 4 on Desktop */
            <div className="row g-2 g-sm-3 g-md-4">
              {paginatedProducts.map((item) => {
              const pId = item._id || item.id
              const isFav = isInWishlist(pId)
              const pImg = formatImg(item.thumbnail)
              const catName = item.category_id?.category || item.category || 'Electronics'
              const pPrice = Number(item.price) || 0
              const pComparePrice = Number(item.compareprice) || 0
              const discountPercent = pComparePrice > pPrice ? Math.round(((pComparePrice - pPrice) / pComparePrice) * 100) : 0

              const allImages = getProductImageList(item)
              const currentIdx = cardImgMap[pId] ?? 0
              const safeIdx = allImages.length > 0 ? currentIdx % allImages.length : 0
              const currentActiveImg = allImages[safeIdx] || pImg

              const slidePrev = (e) => {
                e.stopPropagation()
                e.preventDefault()
                setCardImgMap((prev) => ({
                  ...prev,
                  [pId]: (currentIdx - 1 + allImages.length) % allImages.length,
                }))
              }

              const slideNext = (e) => {
                e.stopPropagation()
                e.preventDefault()
                setCardImgMap((prev) => ({
                  ...prev,
                  [pId]: (currentIdx + 1) % allImages.length,
                }))
              }

              return (
                <div key={pId} className="col-6 col-md-4 col-lg-3">
                  <div className="card pro-card-modern h-100 overflow-hidden shadow-sm position-relative border-0 rounded-3">
                    {/* Badges */}
                    <div className="pro-card-badges position-absolute top-0 start-0 z-3 d-flex flex-column gap-1">
                      {discountPercent > 0 && (
                        <span className="badge bg-warning text-dark pro-badge-discount fw-bold shadow-sm">
                          {discountPercent}% OFF
                        </span>
                      )}
                      {item.badge && (
                        <span className={`badge ${item.badge === 'New' ? 'bg-success' : 'bg-primary'} pro-badge-pill shadow-sm fw-semibold`}>
                          {item.badge}
                        </span>
                      )}
                      {item.featured && !item.badge && discountPercent === 0 && (
                        <span className="badge bg-info text-dark pro-badge-pill shadow-sm fw-semibold">
                          Featured
                        </span>
                      )}
                    </div>

                    {/* Wishlist Button (Always visible on top right) */}
                    <button
                      type="button"
                      className={`btn pro-card-wishlist-btn rounded-circle position-absolute top-0 end-0 shadow-sm d-flex align-items-center justify-content-center p-0 border ${isFav ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleWishlist(item)
                      }}
                      title={isFav ? "Remove from Wishlist" : "Add to Wishlist"}
                      aria-label="Wishlist"
                    >
                      <i className={`bi ${isFav ? 'bi-heart-fill text-danger' : 'bi-heart text-secondary'}`}></i>
                    </button>

                    {/* Image Section */}
                    <div className="product-img-box d-flex align-items-center justify-content-center position-relative overflow-hidden bg-white">
                      <Link to={`/product/${pId}`} className="d-flex align-items-center justify-content-center w-100 h-100 text-decoration-none">
                        <img
                          src={currentActiveImg}
                          alt={item.name}
                          className="img-fluid pro-card-img"
                          loading="lazy"
                        />
                      </Link>

                      {/* Card Image Slide Arrows (Desktop/Tablet) */}
                      {allImages.length > 1 && (
                        <div className="d-none d-sm-block">
                          <button
                            type="button"
                            className="product-card-arrow-btn prev"
                            onClick={slidePrev}
                            title="Previous image"
                            aria-label="Previous image"
                          >
                            <i className="bi bi-chevron-left"></i>
                          </button>
                          <button
                            type="button"
                            className="product-card-arrow-btn next"
                            onClick={slideNext}
                            title="Next image"
                            aria-label="Next image"
                          >
                            <i className="bi bi-chevron-right"></i>
                          </button>
                        </div>
                      )}
                      
                      {/* Quick View on Hover (Desktop only) */}
                      <div
                        className="product-quickview-overlay d-none d-md-flex"
                        onClick={() => openQuickView(item)}
                        title="Click to Quick View"
                      >
                        <button
                          type="button"
                          className="product-quickview-pill-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openQuickView(item);
                          }}
                        >
                          <i className="bi bi-eye"></i> Quick View
                        </button>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="product-card-details d-flex flex-column text-start">
                      {/* Top Meta: Category Pill + Stock Status */}
                      <div className="d-flex align-items-center justify-content-between gap-1 mb-1 mb-sm-2">
                        <span className="product-cat-pill text-truncate" title={catName}>
                          {catName}
                        </span>
                        <div className="stock-status-wrap flex-shrink-0">
                          {item.stockstatus === 'In Stock' || item.stockstatus === 'active' || item.inStock !== false ? (
                            <>
                              <span className="stock-dot in-stock"></span>
                              <span className="text-success d-none d-sm-inline">In Stock</span>
                            </>
                          ) : (
                            <>
                              <span className="stock-dot out-of-stock"></span>
                              <span className="text-danger d-none d-sm-inline">{item.stockstatus || 'Out'}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Product Title */}
                      <h6
                        className="product-title-heading"
                        title={item.name}
                      >
                        <Link to={`/product/${pId}`} className="text-decoration-none text-dark">
                          {item.name}
                        </Link>
                      </h6>

                      {/* Pricing & Action Buttons */}
                      <div className="mt-auto">
                        <div className="product-pricing-bar">
                          <span className="product-price-current">
                            ₹{pPrice.toLocaleString('en-IN')}
                          </span>
                          {pComparePrice > pPrice && (
                            <span className="product-price-compare">
                              ₹{pComparePrice.toLocaleString('en-IN')}
                            </span>
                          )}
                          {discountPercent > 0 && (
                            <span className="product-discount-pill d-none d-sm-inline-block">
                              {discountPercent}% OFF
                            </span>
                          )}
                        </div>

                        {/* Action Buttons: Add to Cart & Buy Now */}
                        <div className="pro-card-actions d-flex gap-1 gap-sm-2 w-100 mt-2">
                          <button
                            type="button"
                            className="btn product-btn-cart flex-fill"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              const added = addToCart(item, 1, navigate)
                              if (added) navigate('/cart')
                            }}
                            disabled={item.stockstatus === 'Out of Stock'}
                            title="Add to Cart"
                          >
                            <i className="bi bi-cart-plus"></i>
                            <span className="d-none d-sm-inline ms-1">Add to Cart</span>
                            <span className="d-inline d-sm-none ms-1">Cart</span>
                          </button>
                          <button
                            type="button"
                            className="btn product-btn-buy flex-fill"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              buyNow(item, 1, navigate)
                            }}
                            disabled={item.stockstatus === 'Out of Stock'}
                            title="Buy Now"
                          >
                            <i className="bi bi-lightning-charge-fill"></i>
                            <span className="d-none d-sm-inline ms-1">Buy Now</span>
                            <span className="d-inline d-sm-none ms-1">Buy</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
          )}

          {/* Pagination Navigation Footer */}
          {totalPages > 1 && (
            <div className="product-pagination-wrapper mt-5 pt-4">
              <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 w-100">
                {/* Left Side: Showing Counter Info */}
                <div className="text-muted small text-center text-md-start">
                  Showing <strong className="text-dark">{startIndex + 1}&ndash;{endIndex}</strong> of{' '}
                  <strong className="text-dark">{totalItems}</strong> products &bull; Page{' '}
                  <strong className="text-dark">{currentPage}</strong> of{' '}
                  <strong className="text-dark">{totalPages}</strong>
                </div>

                {/* Center / Right: Pagination Nav Controls */}
                <nav className="product-pagination-nav d-flex align-items-center gap-1 gap-sm-2" aria-label="Product catalog pagination">
                  {/* First Page Button */}
                  {totalPages > 4 && (
                    <button
                      type="button"
                      className="product-page-nav-icon-btn"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(1)}
                      title="First Page"
                      aria-label="First Page"
                    >
                      <i className="bi bi-chevron-bar-left"></i>
                    </button>
                  )}

                  {/* Previous Page Button */}
                  <button
                    type="button"
                    className="product-page-nav-btn"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    title="Previous Page"
                    aria-label="Previous Page"
                  >
                    <i className="bi bi-chevron-left"></i>
                    <span className="d-none d-sm-inline">Prev</span>
                  </button>

                  {/* Page Numbers with Ellipsis */}
                  <div className="d-flex align-items-center gap-1">
                    {getPageNumbers().map((page, idx) => {
                      if (page === '...') {
                        return (
                          <span key={`dots-${idx}`} className="product-page-dots">
                            &hellip;
                          </span>
                        )
                      }
                      return (
                        <button
                          key={page}
                          type="button"
                          className={`product-page-num-btn ${currentPage === page ? 'active' : ''}`}
                          onClick={() => handlePageChange(page)}
                          aria-current={currentPage === page ? 'page' : undefined}
                          aria-label={`Page ${page}`}
                        >
                          {page}
                        </button>
                      )
                    })}
                  </div>

                  {/* Next Page Button */}
                  <button
                    type="button"
                    className="product-page-nav-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    title="Next Page"
                    aria-label="Next Page"
                  >
                    <span className="d-none d-sm-inline">Next</span>
                    <i className="bi bi-chevron-right"></i>
                  </button>

                  {/* Last Page Button */}
                  {totalPages > 4 && (
                    <button
                      type="button"
                      className="product-page-nav-icon-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(totalPages)}
                      title="Last Page"
                      aria-label="Last Page"
                    >
                      <i className="bi bi-chevron-bar-right"></i>
                    </button>
                  )}
                </nav>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* LUXURY PROFESSIONAL QUICK VIEW MODAL */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={closeQuickView}
        />
      )}

      <Footer />
    </>
  )
}

export default Product