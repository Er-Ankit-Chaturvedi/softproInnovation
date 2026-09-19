import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import QuickViewModal from './QuickViewModal';
import { API_BASE_URL } from '../config/api';
import { formatImg } from '../utils/imageUrl';
import './FeaturedProducts.css';

const FeaturedProducts = () => {
  const navigate = useNavigate();
  const { addToCart, buyNow, toggleWishlist, isInWishlist } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cardImageIndexMap, setCardImageIndexMap] = useState({});
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    let isMounted = true;
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        setHasError(false);
        const res = await axios.get(`${API_BASE_URL}/api/product/show`);
        if (!isMounted) return;
        if (Array.isArray(res.data) && res.data.length > 0) {
          // Strictly show ONLY products where admin has enabled is_feature === true
          const featuredOnly = res.data.filter(
            (p) => Boolean(p.is_feature) === true && (p.status === 'active' || !p.status)
          );
          setProducts(featuredOnly);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching featured products:', err.message);
        if (isMounted) {
          setProducts([]);
          setHasError(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  const openQuickView = (product) => {
    const prodId = product._id || product.id;
    if (prodId) {
      navigate(`/product/${prodId}`);
    }
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
  };

  // Helper to extract all images for a product
  const getProductImageList = (item) => {
    const all = [];
    if (item.thumbnail) all.push(formatImg(item.thumbnail));
    if (Array.isArray(item.images)) {
      item.images.forEach((img) => {
        const formatted = formatImg(img);
        if (formatted && !all.includes(formatted)) {
          all.push(formatted);
        }
      });
    }
    return all.length > 0 ? all : ['https://placehold.co/400x400?text=No+Image'];
  };

  // If loading finished and no featured products enabled by admin, hide or show empty message
  if (!loading && products.length === 0) {
    if (hasError) {
      return (
        <section className="featured-products-section py-4">
          <div className="container text-center py-3">
            <p className="text-muted small mb-0">
              <i className="bi bi-exclamation-circle me-1 text-warning"></i>
              Unable to connect to server. Please ensure backend server is running on port 5000.
            </p>
          </div>
        </section>
      );
    }
    return null;
  }

  // Calculate pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = products.slice(startIndex, endIndex);

  return (
    <section className="featured-products-section">
      <div className="container-fluid px-3 px-xl-5 featured-container">
        {/* Section Header (Clean layout without category filter tabs) */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 pb-2">
          <div>
            <div className="featured-pill-tag">
              <span className="pill-pulse"></span>
              Curated Hardware & Innovations
            </div>
            <h2 className="featured-main-heading mb-2">
              Featured <span className="featured-gradient-text">Innovations</span>
            </h2>
            <p className="featured-subheading mb-0">
              High-performance development boards, intelligent sensors, and flagship trainer kits engineered for makers and engineers.
            </p>
          </div>

          <div className="mt-3 mt-md-0">
            <Link to="/product" className="featured-view-all-btn">
              <span>All Products</span>
              <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border text-primary me-3" role="status" style={{ width: '2.5rem', height: '2.5rem' }}></div>
            <span className="text-secondary fw-semibold">Loading featured products...</span>
          </div>
        ) : (
          /* Product Grid - Shows strictly admin-enabled featured products */
          <>
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
              {paginatedProducts.map((item, index) => {
              const id = item._id || item.id || index;
              const catName =
                item.category_id?.category || item.category_id?.name || item.category || 'Components';
              const title = item.name || item.title || 'Product';
              const price = item.price || 0;
              const comparePrice = item.compareprice || item.originalPrice || 0;
              const inStock =
                item.stockstatus === 'In Stock' ||
                item.inStock === true ||
                (item.stockquantity && item.stockquantity > 0);

              const allImages = getProductImageList(item);
              const currentIndex = cardImageIndexMap[id] || 0;
              const currentActiveImg = allImages[currentIndex % allImages.length];

              const discountPercent =
                comparePrice > price
                  ? Math.round(((comparePrice - price) / comparePrice) * 100)
                  : 0;

              const savingsAmount = comparePrice > price ? comparePrice - price : 0;
              const isFav = isInWishlist(id);

              const slidePrev = (e) => {
                e.stopPropagation();
                e.preventDefault();
                setCardImageIndexMap((prev) => ({
                  ...prev,
                  [id]: (currentIndex - 1 + allImages.length) % allImages.length,
                }));
              };

              const slideNext = (e) => {
                e.stopPropagation();
                e.preventDefault();
                setCardImageIndexMap((prev) => ({
                  ...prev,
                  [id]: (currentIndex + 1) % allImages.length,
                }));
              };

              return (
                <div key={id} className="col">
                  <div className="featured-card">
                    {/* Upper Canvas / Image Showcase */}
                    <div className="featured-image-stage">
                      {/* Floating Badges (Top-Left) */}
                      <div className="featured-badge-stack">
                        <span className="badge-featured-pro">
                          <i className="bi bi-patch-check-fill"></i>
                          Featured
                        </span>
                        {discountPercent > 0 && (
                          <span className="badge-discount-pro">
                            <i className="bi bi-tag-fill"></i>
                            {discountPercent}% OFF
                          </span>
                        )}
                      </div>

                      {/* Wishlist Button (Top-Right) */}
                      <button
                        type="button"
                        className={`featured-wishlist-btn ${isFav ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWishlist(item);
                        }}
                        title={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        aria-label="Wishlist"
                      >
                        <i className={`bi ${isFav ? 'bi-heart-fill text-danger' : 'bi-heart text-secondary'}`}></i>
                      </button>

                      {/* Main Product Image */}
                      <img
                        src={currentActiveImg}
                        alt={title}
                        className="featured-product-image"
                        loading="lazy"
                      />

                      {/* Ghost Slider Navigation Arrows (Fade in on hover) */}
                      {allImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="featured-arrow-btn prev"
                            onClick={slidePrev}
                            title="Previous image"
                            aria-label="Previous image"
                          >
                            <i className="bi bi-chevron-left"></i>
                          </button>
                          <button
                            type="button"
                            className="featured-arrow-btn next"
                            onClick={slideNext}
                            title="Next image"
                            aria-label="Next image"
                          >
                            <i className="bi bi-chevron-right"></i>
                          </button>
                        </>
                      )}

                      {/* Modern Dots Gallery Indicator */}
                      {allImages.length > 1 && (
                        <div className="featured-dots-indicator">
                          {allImages.slice(0, 5).map((_, imgIdx) => (
                            <button
                              key={imgIdx}
                              type="button"
                              className={`featured-dot-btn ${currentIndex === imgIdx ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCardImageIndexMap((prev) => ({ ...prev, [id]: imgIdx }));
                              }}
                              title={`Image ${imgIdx + 1}`}
                              aria-label={`View image ${imgIdx + 1}`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Slide-Up Quick View Pill */}
                      <button
                        type="button"
                        className="featured-quickview-pill"
                        onClick={(e) => {
                          e.stopPropagation();
                          openQuickView(item);
                        }}
                      >
                        <i className="bi bi-eye-fill"></i>
                        Quick View
                      </button>
                    </div>

                    {/* Card Body & Specs */}
                    <div className="featured-card-body">
                      {/* Meta Row: Category + Stock Status */}
                      <div className="featured-meta-row">
                        <span className="featured-category-badge" title={catName}>
                          {catName}
                        </span>

                        <div className={`featured-stock-status ${inStock ? '' : 'out'}`}>
                          <span className="featured-stock-dot"></span>
                          <span>{inStock ? 'In Stock' : 'Out of Stock'}</span>
                        </div>
                      </div>

                      {/* Product Title */}
                      <h3 className="featured-card-title" title={title}>
                        <Link to={`/product/${id}`}>{title}</Link>
                      </h3>

                      {/* Micro Trust & Tech Highlights */}
                      <div className="featured-tech-row">
                        <span className="featured-tech-rating">
                          <i className="bi bi-star-fill"></i> 4.9
                        </span>
                        <span>•</span>
                        <span className="featured-tech-chip">
                          <i className="bi bi-shield-check"></i> Genuine
                        </span>
                      </div>

                      {/* Pricing Bar */}
                      <div className="featured-pricing-bar">
                        <div className="featured-price-group">
                          <span className="featured-current-price">
                            ₹{price.toLocaleString('en-IN')}
                          </span>
                          {comparePrice > price && (
                            <span className="featured-compare-price">
                              ₹{comparePrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        {savingsAmount > 0 && (
                          <span className="featured-save-pill">
                            Save ₹{savingsAmount.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      {/* High-End Action Buttons */}
                      <div className="featured-actions-bar">
                        <button
                          type="button"
                          className="featured-btn-cart"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addToCart(item, 1);
                          }}
                          disabled={!inStock}
                          title="Add to Cart"
                        >
                          <i className="bi bi-cart-plus"></i>
                          <span>Add to Cart</span>
                        </button>

                        <button
                          type="button"
                          className="featured-btn-buy"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            buyNow(item, 1, navigate);
                          }}
                          disabled={!inStock}
                          title="Buy Now"
                        >
                          <i className="bi bi-lightning-charge-fill"></i>
                          <span>Buy Now</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav className="featured-pagination mt-5 pt-3" aria-label="Featured products pagination">
                <div className="d-flex justify-content-center align-items-center gap-2">
                  <button
                    className="featured-pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    title="Previous page"
                    aria-label="Previous page"
                  >
                    <i className="bi bi-chevron-left"></i>
                    <span className="d-none d-sm-inline ms-1">Previous</span>
                  </button>

                  <div className="featured-page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`featured-page-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                        title={`Go to page ${page}`}
                        aria-label={`Go to page ${page}`}
                        aria-current={currentPage === page ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    className="featured-pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    title="Next page"
                    aria-label="Next page"
                  >
                    <span className="d-none d-sm-inline me-1">Next</span>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>

                <div className="text-center mt-3">
                  <small className="text-muted">
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> • Showing <strong>{paginatedProducts.length}</strong> of <strong>{products.length}</strong> products
                  </small>
                </div>
              </nav>
            )}
          </>
        )}

        {/* Quick View Modal */}
        {quickViewProduct && (
          <QuickViewModal
            product={quickViewProduct}
            onClose={closeQuickView}
          />
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
