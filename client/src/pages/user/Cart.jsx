import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useCart } from '../../context/CartContext';
import { formatImg } from '../../utils/imageUrl';
import { API_BASE_URL } from '../../config/api';
import { loadRazorpayScript } from '../../config/loadRazorpay';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount, toggleWishlist } = useCart();
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1 = Cart, 2 = Order Summary, 3 = Payment
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' (UPI, Cards, Netbanking) or 'cod' (Cash on Delivery)
  const [isPaying, setIsPaying] = useState(false);
  const [showItemsInPaymentStep, setShowItemsInPaymentStep] = useState(false);

  const showOrderSummary = checkoutStep >= 2;

  const subtotal = getCartTotal();
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 70;
  const grandTotal = subtotal + shipping;
  const totalMrp = cartItems.reduce((total, item) => total + (Number(item.compareprice) || Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  const savings = Math.max(totalMrp - subtotal, 0);

  const handleSaveForLater = (item) => {
    if (toggleWishlist) {
      toggleWishlist(item);
    }
    removeFromCart(item._id || item.id);
  };

  useEffect(() => {
    const loadDeliveryAddress = async () => {
      const token = localStorage.getItem('token');
      let storedUser;
      try {
        storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      } catch {
        storedUser = null;
      }

      let userId = storedUser?._id || storedUser?.id;
      if (!userId && token) {
        try {
          const currentUser = await axios.get(`${API_BASE_URL}/api/user/current-user`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          userId = currentUser.data?.user?._id;
        } catch {
          userId = null;
        }
      }
      if (!userId) return;

      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/address/user/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setDeliveryAddress(data?.addresses?.find((item) => item.isdefault === 'yes') || data?.addresses?.[0] || data?.[0] || null);
      } catch (error) {
        console.error('Failed to load cart delivery address:', error.response?.data || error.message);
        setDeliveryAddress(null);
      }
    };

    loadDeliveryAddress();
  }, []);

  // Handle Cash on Delivery (COD) order placement
  const handleCODOrder = async () => {
    if (grandTotal <= 0 || isPaying) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to continue.');
      navigate('/login');
      return;
    }

    if (!deliveryAddress) {
      alert('Please select a delivery address before placing your order.');
      navigate('/addresses', { state: { openForm: true } });
      return;
    }

    let storedUser;
    try {
      storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      storedUser = null;
    }

    let userId = storedUser?._id || storedUser?.id;
    if (!userId && token) {
      try {
        const currentUser = await axios.get(`${API_BASE_URL}/api/user/current-user`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        userId = currentUser.data?.user?._id;
      } catch {
        userId = null;
      }
    }

    if (!userId) {
      alert('Please sign in to place your order.');
      navigate('/login');
      return;
    }

    setIsPaying(true);
    try {
      const orderPayload = {
        user_id: userId,
        items: cartItems.map((item) => ({
          _id: item._id || item.id,
          name: item.name,
          thumbnail: item.thumbnail,
          category: item.category,
          price: Number(item.price) || 0,
          quantity: Math.max(Number(item.quantity) || 1, 1),
        })),
        address: {
          name: deliveryAddress.name,
          mobile: String(deliveryAddress.mobile),
          pincode: String(deliveryAddress.pincode),
          locality: deliveryAddress.locality || deliveryAddress.localiy || '',
          address: deliveryAddress.address || deliveryAddress.Address,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          landmark: deliveryAddress.landmark || '',
          addressType: deliveryAddress.addressType || 'Home',
        },
        subtotal,
        fee: shipping,
        discount: savings,
        totalAmount: grandTotal,
        paymentMethod: 'cod',
      };

      const res = await axios.post(`${API_BASE_URL}/api/order/create`, orderPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success && res.data?.order) {
        const orderData = res.data.order;
        clearCart();
        navigate('/order-success', {
          state: {
            orderId: orderData.orderId || `#ORD-${orderData._id?.slice(-6).toUpperCase()}`,
            totalAmount: grandTotal,
            paymentMethod: 'cod',
            items: cartItems,
            address: deliveryAddress,
          },
        });
      } else {
        throw new Error(res.data?.message || 'Failed to place COD order');
      }
    } catch (err) {
      console.error('COD Order error:', err.response?.data || err.message);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Could not place COD order. Please try again.';
      alert(errMsg);
    } finally {
      setIsPaying(false);
    }
  };

  const handlePayment = async () => {
    // Guard: don't fire on an empty total or while a payment is already in progress
    if (grandTotal <= 0 || isPaying) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to continue.');
      navigate('/login');
      return;
    }

    let storedUser;
    try {
      storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      storedUser = null;
    }

    setIsPaying(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Razorpay SDK failed to load. Check your internet connection.');
        return;
      }

      // 1. Create order on backend with complete cart, address, and user details
      const { data } = await axios.post(
        `${API_BASE_URL}/api/payment/create-order`,
        {
          amount: grandTotal,
          totalAmount: grandTotal,
          subtotal,
          fee: shipping,
          discount: savings,
          items: cartItems,
          address: deliveryAddress,
          addressId: deliveryAddress?._id,
          user_id: storedUser?._id || storedUser?.id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Open Razorpay Checkout
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'Softpro Innovation',
        description: `Order for ${getCartCount()} item(s)`,
        order_id: data.orderId,
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay via UPI / QR',
                instruments: [
                  {
                    method: 'upi',
                    flows: ['qr', 'intent'],
                    apps: ['google_pay', 'phonepe', 'paytm', 'bhim'],
                  },
                ],
              },
              other: {
                name: 'Other Payment Methods',
                instruments: [
                  {
                    method: 'card',
                  },
                  {
                    method: 'netbanking',
                  },
                  {
                    method: 'wallet',
                  },
                ],
              },
            },
            sequence: ['block.upi', 'block.other'],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        handler: async function (response) {
          try {
            // 3. Verify payment on backend
            const verifyRes = await axios.post(
              `${API_BASE_URL}/api/payment/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              const completedOrderId =
                data.dbOrderId ||
                verifyRes.data.order?.orderId ||
                response.razorpay_order_id;

              clearCart();
              navigate('/order-success', {
                state: {
                  orderId: completedOrderId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  totalAmount: grandTotal,
                  paymentMethod: 'razorpay',
                  items: cartItems,
                  address: deliveryAddress,
                },
              });
            } else {
              alert(
                'Payment verification failed. If money was deducted, it will be refunded automatically.'
              );
            }
          } catch (err) {
            console.error('Verification error:', err.response?.data || err.message);
            alert(
              'Could not verify payment. Please contact support with your payment ID: ' +
                response.razorpay_payment_id
            );
          }
        },
        modal: {
          ondismiss: function () {
            setIsPaying(false);
          },
        },
        prefill: {
          name: storedUser?.name || deliveryAddress?.name || '',
          email: storedUser?.email || '',
          contact:
            storedUser?.mobile ||
            storedUser?.phone ||
            deliveryAddress?.mobile ||
            '',
        },
        notes: {
          address: deliveryAddress
            ? `${deliveryAddress.address || deliveryAddress.Address}, ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}`
            : 'No address selected',
        },
        theme: { color: '#2563eb' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert(
          'Payment failed: ' +
            (response.error?.description || 'Transaction was declined')
        );
        setIsPaying(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Order creation error:', err.response?.data || err.message);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Could not start payment. Please try again.';
      alert(errMsg);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <>
      <Header />

      {/* Cart Breadcrumb & Header Banner */}
      <section className="cart-hero-section">
        <div className="container">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <div className="cart-breadcrumbs">
                <Link to="/">Home</Link>
                <span>&rsaquo;</span>
                <Link to="/Product">Products</Link>
                <span>&rsaquo;</span>
                <span className="active">Shopping Cart</span>
              </div>
              <h1 className="cart-title-text mb-0">
                Shopping <span className="cart-title-accent">Cart</span>
              </h1>
            </div>

            <div className="cart-count-chip align-self-start align-self-md-auto">
              <i className="bi bi-bag-check-fill text-primary"></i>
              <span>{getCartCount()} {getCartCount() === 1 ? 'Item' : 'Items'} in cart</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Cart Content */}
      <section className="cart-page py-4" style={{ minHeight: '60vh', background: '#f8fafc' }}>
        <div className="container">
          {!localStorage.getItem('token') ? (
            /* Unauthenticated View */
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center mx-auto" style={{ maxWidth: '560px', backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
                style={{ width: '84px', height: '84px', backgroundColor: '#eff6ff', color: '#2563eb' }}
              >
                <i className="bi bi-person-lock fs-1"></i>
              </div>
              <h4 className="fw-bold text-dark mb-2">Please Log In</h4>
              <p className="text-muted mb-4" style={{ fontSize: '14.5px' }}>
                Please log in to your account to view and manage your shopping cart items, apply discounts, and proceed to checkout.
              </p>
              <Link
                to="/login"
                className="cart-cta-button align-self-center text-decoration-none px-4 py-2.5"
                style={{ maxWidth: '240px' }}
              >
                <i className="bi bi-box-arrow-in-right"></i>
                <span>Log In to Account</span>
              </Link>
            </div>
          ) : cartItems.length === 0 ? (
            /* Empty Cart View */
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center mx-auto" style={{ maxWidth: '560px', backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
                style={{ width: '84px', height: '84px', backgroundColor: '#eff6ff', color: '#2563eb' }}
              >
                <i className="bi bi-cart-x fs-1"></i>
              </div>
              <h4 className="fw-bold text-dark mb-2">Your Cart is Empty</h4>
              <p className="text-muted mb-4" style={{ fontSize: '14.5px' }}>
                Looks like you haven't added any electronic components, boards, or sensors to your cart yet.
              </p>
              <Link
                to="/Product"
                className="cart-cta-button align-self-center text-decoration-none px-4 py-2.5"
                style={{ maxWidth: '240px' }}
              >
                <i className="bi bi-bag-plus"></i>
                <span>Start Shopping</span>
              </Link>
            </div>
          ) : (
            /* Filled Cart View */
            <>
              {/* Checkout Stepper Progress Bar */}
              <div className="cart-stepper-card">
                <div className="cart-stepper-wrapper">
                  {/* Step 1: Cart Items */}
                  <div
                    className={`cart-step-item ${checkoutStep === 1 ? 'active' : 'completed'}`}
                    style={{ cursor: checkoutStep > 1 ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (checkoutStep > 1) {
                        setCheckoutStep(1);
                        window.scrollTo({ top: 100, behavior: 'smooth' });
                      }
                    }}
                    title="Cart Items"
                  >
                    <div className="cart-step-circle">
                      {checkoutStep > 1 ? <i className="bi bi-check-lg"></i> : '1'}
                    </div>
                    <span className="cart-step-label">Cart Items</span>
                  </div>

                  <div className={`cart-step-connector ${checkoutStep >= 2 ? 'filled' : ''}`}></div>

                  {/* Step 2: Order Summary */}
                  <div
                    className={`cart-step-item ${
                      checkoutStep === 2 ? 'active' : checkoutStep > 2 ? 'completed' : ''
                    }`}
                    style={{ cursor: checkoutStep > 2 ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (checkoutStep > 2) {
                        setCheckoutStep(2);
                        window.scrollTo({ top: 100, behavior: 'smooth' });
                      }
                    }}
                    title="Order Summary"
                  >
                    <div className="cart-step-circle">
                      {checkoutStep > 2 ? <i className="bi bi-check-lg"></i> : '2'}
                    </div>
                    <span className="cart-step-label">Order Summary</span>
                  </div>

                  <div className={`cart-step-connector ${checkoutStep === 3 ? 'filled' : ''}`}></div>

                  {/* Step 3: Payment */}
                  <div className={`cart-step-item ${checkoutStep === 3 ? 'active' : ''}`}>
                    <div className="cart-step-circle">3</div>
                    <span className="cart-step-label">Payment</span>
                  </div>
                </div>
              </div>

              {/* 2-Column Checkout Layout */}
              <div className="row g-4">
                {/* Left Column: Delivery Address & Cart Items / Payment Options */}
                <div className="col-12 col-lg-8">
                  {/* Delivery Address Banner */}
                  {deliveryAddress ? (
                    <div className="cart-address-box">
                      <div className="cart-address-top-row">
                        <div className="cart-address-recipient">
                          <div className="cart-address-icon-badge">
                            <i className="bi bi-geo-alt-fill"></i>
                          </div>
                          <span className="small text-muted fw-semibold">Deliver to:</span>
                          <strong className="text-dark fs-6">{deliveryAddress.name}</strong>
                          <span className={`cart-address-tag ${String(deliveryAddress.addressType || '').toLowerCase() === 'home' ? 'home' : ''}`}>
                            {deliveryAddress.addressType || 'HOME'}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="cart-address-btn-change"
                          onClick={() => navigate('/addresses')}
                        >
                          <i className="bi bi-pencil-square"></i>
                          <span>Change</span>
                        </button>
                      </div>
                      <div className="cart-address-text">
                        {deliveryAddress.address || deliveryAddress.Address}, {deliveryAddress.locality || deliveryAddress.localiy || ''} {deliveryAddress.city}, {deliveryAddress.state} - <strong>{deliveryAddress.pincode}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="cart-address-box">
                      <div className="cart-address-top-row">
                        <div className="cart-address-recipient">
                          <div className="cart-address-icon-badge">
                            <i className="bi bi-geo-alt"></i>
                          </div>
                          <div>
                            <strong className="d-block text-dark">Add a Delivery Address</strong>
                            <span className="small text-muted">Please provide an address so we can calculate delivery options.</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="cart-address-btn-change"
                          onClick={() => navigate('/addresses', { state: { openForm: true } })}
                        >
                          <i className="bi bi-plus-lg"></i>
                          <span>Add Address</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Steps 1 & 2: Show Full Cart / Order Summary Items List */}
                  {checkoutStep <= 2 && (
                    <div className="cart-items-container">
                      <div className="cart-items-header">
                        <h5 className="cart-items-heading">
                          <i className="bi bi-cart3 text-primary"></i>
                          <span>{checkoutStep === 2 ? `Order Summary (${getCartCount()} items)` : `Your Cart (${getCartCount()})`}</span>
                        </h5>

                        {checkoutStep === 1 ? (
                          <button
                            type="button"
                            className="cart-clear-btn"
                            onClick={clearCart}
                            title="Clear all items from cart"
                          >
                            <i className="bi bi-trash3"></i>
                            <span>Clear Cart</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="cart-address-btn-change"
                            onClick={() => {
                              setCheckoutStep(1);
                              window.scrollTo({ top: 100, behavior: 'smooth' });
                            }}
                          >
                            <i className="bi bi-pencil"></i>
                            <span>Edit Cart</span>
                          </button>
                        )}
                      </div>

                      <div className="cart-items-list">
                        {cartItems.map((item) => {
                          const pId = item._id || item.id;
                          const itemPrice = Number(item.price) || 0;
                          const itemQty = Number(item.quantity) || 1;
                          const lineTotal = itemPrice * itemQty;
                          const mrp = Number(item.compareprice) || itemPrice;
                          const discount = mrp > itemPrice ? Math.round(((mrp - itemPrice) / mrp) * 100) : 0;

                          return (
                            <div key={pId} className="cart-item-card">
                              <div className="cart-item-left">
                                <Link to={`/product/${pId}`} className="cart-item-img-wrapper text-decoration-none">
                                  <img src={formatImg(item.thumbnail)} alt={item.name} loading="lazy" />
                                </Link>

                                <div className="cart-item-info">
                                  <Link to={`/product/${pId}`} className="cart-item-name">
                                    {item.name}
                                  </Link>

                                  <div className="cart-item-meta">
                                    <span className="cart-item-category-chip">{item.category || 'Electronics'}</span>
                                    <span className="cart-item-badge-assured">
                                      <i className="bi bi-patch-check-fill"></i> Assured quality
                                    </span>
                                  </div>

                                  <div className="cart-item-price-block">
                                    <span className="cart-item-current-price">₹{itemPrice.toLocaleString('en-IN')}</span>
                                    {mrp > itemPrice && (
                                      <span className="cart-item-original-price">₹{mrp.toLocaleString('en-IN')}</span>
                                    )}
                                    {discount > 0 && (
                                      <span className="cart-item-discount-chip">{discount}% OFF</span>
                                    )}
                                  </div>

                                  {checkoutStep === 1 && (
                                    <div className="cart-item-footer-actions">
                                      <button
                                        type="button"
                                        className="cart-footer-link"
                                        onClick={() => handleSaveForLater(item)}
                                        title="Move to Wishlist"
                                      >
                                        <i className="bi bi-bookmark-heart"></i> Save for later
                                      </button>
                                      <span className="text-muted" style={{ fontSize: '11px' }}>•</span>
                                      <button
                                        type="button"
                                        className="cart-footer-link danger"
                                        onClick={() => removeFromCart(pId)}
                                        title="Remove from Cart"
                                      >
                                        <i className="bi bi-trash3"></i> Remove
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="cart-item-actions-cluster">
                                {checkoutStep === 1 ? (
                                  <div className="cart-stepper-control">
                                    <button
                                      type="button"
                                      className={`cart-stepper-btn ${itemQty <= 1 ? 'danger' : ''}`}
                                      onClick={() => updateQuantity(pId, itemQty - 1)}
                                      title={itemQty <= 1 ? "Remove item" : "Decrease quantity"}
                                    >
                                      <i className={`bi ${itemQty <= 1 ? 'bi-trash' : 'bi-dash'}`}></i>
                                    </button>
                                    <span className="cart-stepper-value">{itemQty}</span>
                                    <button
                                      type="button"
                                      className="cart-stepper-btn"
                                      onClick={() => updateQuantity(pId, itemQty + 1)}
                                      title="Increase quantity"
                                    >
                                      <i className="bi bi-plus"></i>
                                    </button>
                                  </div>
                                ) : (
                                  <span className="badge bg-light text-dark border px-3 py-2 fw-bold" style={{ fontSize: '13px' }}>
                                    Qty: {itemQty}
                                  </span>
                                )}

                                <div className="cart-item-total-col">
                                  <div className="cart-item-total-label">Subtotal</div>
                                  <div className="cart-item-total-value">₹{lineTotal.toLocaleString('en-IN')}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Payment Section (Only visible when checkoutStep === 3) */}
                  {checkoutStep === 3 && (
                    <>
                      {/* Compact Order Items Accordion */}
                      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-3" style={{ border: '1px solid #e2e8f0' }}>
                        <div
                          className="card-header bg-white py-3 px-4 d-flex align-items-center justify-content-between"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setShowItemsInPaymentStep(!showItemsInPaymentStep)}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: 28, height: 28, fontSize: '13px' }}>
                              <i className="bi bi-bag-check-fill"></i>
                            </span>
                            <span className="fw-bold text-dark">Order Items ({getCartCount()})</span>
                            <span className="text-muted small">• Total ₹{grandTotal.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="d-flex align-items-center gap-2 text-primary small fw-semibold">
                            <span>{showItemsInPaymentStep ? 'Hide Items' : 'Review Items'}</span>
                            <i className={`bi bi-chevron-${showItemsInPaymentStep ? 'up' : 'down'}`}></i>
                          </div>
                        </div>

                        {showItemsInPaymentStep && (
                          <div className="card-body p-0 border-top">
                            <div className="table-responsive">
                              <table className="table align-middle mb-0">
                                <thead className="bg-light text-muted small">
                                  <tr>
                                    <th className="py-2.5 px-4">Item</th>
                                    <th className="py-2.5 text-center">Qty</th>
                                    <th className="py-2.5 text-end px-4">Price</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cartItems.map((item) => (
                                    <tr key={item._id || item.id} className="border-bottom">
                                      <td className="py-2.5 px-4">
                                        <div className="d-flex align-items-center gap-2.5">
                                          <img
                                            src={formatImg(item.thumbnail)}
                                            alt={item.name}
                                            style={{ width: 44, height: 44, objectFit: 'contain' }}
                                            className="rounded border p-1 bg-white flex-shrink-0"
                                          />
                                          <div>
                                            <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '280px', fontSize: '13px' }}>
                                              {item.name}
                                            </div>
                                            <small className="text-muted">₹{(Number(item.price) || 0).toLocaleString('en-IN')} each</small>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-2.5 text-center fw-semibold text-dark small">{item.quantity || 1}</td>
                                      <td className="py-2.5 text-end px-4 fw-bold text-dark small">
                                        ₹{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Step 3: Payment Options Selection Card */}
                      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-3" style={{ border: '1px solid #e2e8f0' }}>
                        <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 24, height: 24, fontSize: '12px' }}>3</span>
                            <h5 className="fw-bold mb-0 text-dark">Select Payment Method</h5>
                          </div>
                          <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle fw-semibold px-2.5 py-1">
                            <i className="bi bi-shield-check me-1"></i> 100% Safe &amp; Secure
                          </span>
                        </div>

                        <div className="card-body p-3 p-md-4">
                          {/* Option 1: Razorpay UPI & Online Payment */}
                          <div
                            className={`cart-payment-option ${paymentMethod === 'razorpay' ? 'selected' : ''}`}
                            onClick={() => setPaymentMethod('razorpay')}
                          >
                            <div className="d-flex align-items-start gap-3">
                              <input
                                type="radio"
                                name="checkoutPaymentOption"
                                id="opt-razorpay"
                                className="form-check-input mt-1 cursor-pointer"
                                checked={paymentMethod === 'razorpay'}
                                onChange={() => setPaymentMethod('razorpay')}
                              />
                              <div className="flex-grow-1">
                                <div className="payment-method-header">
                                  <label htmlFor="opt-razorpay" className="payment-method-title mb-0 cursor-pointer">
                                    <span>UPI &amp; Online Payment</span>
                                    <span className="badge bg-primary text-white payment-badge-pill">Fastest Checkout</span>
                                  </label>
                                  <div className="d-flex align-items-center gap-1 text-primary small fw-semibold">
                                    <i className="bi bi-lightning-charge-fill text-warning"></i> Instant Confirmation
                                  </div>
                                </div>

                                <p className="payment-method-desc">
                                  Pay securely using any UPI App (Google Pay, PhonePe, Paytm, BHIM), QR Code, Debit / Credit Cards (Visa, MasterCard, RuPay), or NetBanking via Razorpay.
                                </p>

                                <div className="d-flex flex-wrap align-items-center gap-2">
                                  <span className="badge bg-white border text-dark fw-normal py-1 px-2.5 shadow-xs" style={{ fontSize: '11.5px' }}>
                                    <i className="bi bi-qr-code-scan text-primary me-1.5"></i>Google Pay / PhonePe / Paytm
                                  </span>
                                  <span className="badge bg-white border text-dark fw-normal py-1 px-2.5 shadow-xs" style={{ fontSize: '11.5px' }}>
                                    <i className="bi bi-credit-card-2-front text-success me-1.5"></i>Debit &amp; Credit Cards
                                  </span>
                                  <span className="badge bg-white border text-dark fw-normal py-1 px-2.5 shadow-xs" style={{ fontSize: '11.5px' }}>
                                    <i className="bi bi-bank text-info me-1.5"></i>All Major Indian Banks
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Option 2: Cash on Delivery (COD) */}
                          <div
                            className={`cart-payment-option cod ${paymentMethod === 'cod' ? 'selected' : ''}`}
                            onClick={() => setPaymentMethod('cod')}
                          >
                            <div className="d-flex align-items-start gap-3">
                              <input
                                type="radio"
                                name="checkoutPaymentOption"
                                id="opt-cod"
                                className="form-check-input mt-1 cursor-pointer"
                                checked={paymentMethod === 'cod'}
                                onChange={() => setPaymentMethod('cod')}
                              />
                              <div className="flex-grow-1">
                                <div className="payment-method-header">
                                  <label htmlFor="opt-cod" className="payment-method-title mb-0 cursor-pointer">
                                    <span>Cash on Delivery (COD)</span>
                                    <span className="badge bg-warning text-dark payment-badge-pill">Pay at Doorstep</span>
                                  </label>
                                  <span className="badge bg-light text-secondary border" style={{ fontSize: '11px' }}>Cash / UPI on Delivery</span>
                                </div>

                                <p className="payment-method-desc mb-0">
                                  Pay with cash or scan courier delivery partner's QR code when your electronics &amp; robotics components arrive at your address.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Right Column: Order Summary Card */}
                <div className="col-12 col-lg-4">
                  <div className="cart-summary-card">
                    <div className="cart-summary-header">
                      <h5 className="cart-summary-title">
                        <i className="bi bi-receipt-cutoff text-primary"></i>
                        <span>Price details</span>
                      </h5>
                      <span className="badge bg-light text-muted border">{getCartCount()} Items</span>
                    </div>

                    {/* Free Delivery Tracker */}
                    <div className="cart-delivery-tracker">
                      <div className="cart-delivery-tracker-text">
                        {shipping === 0 ? (
                          <span className="text-success fw-bold">
                            <i className="bi bi-check-circle-fill me-1"></i> You unlocked <strong>FREE Delivery</strong>!
                          </span>
                        ) : (
                          <span>
                            Add <strong>₹{(1000 - subtotal).toLocaleString('en-IN')}</strong> more for <strong>FREE Delivery</strong>!
                          </span>
                        )}
                        <span className="text-muted small">
                          {Math.round(Math.min((subtotal / 1000) * 100, 100))}%
                        </span>
                      </div>
                      <div className="cart-delivery-progress">
                        <div
                          className="cart-delivery-progress-bar"
                          style={{ width: `${Math.min((subtotal / 1000) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Breakdown rows */}
                    <div className="cart-summary-row">
                      <span>MRP (incl. of all taxes)</span>
                      <span className="fw-semibold text-dark">₹{totalMrp.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="cart-summary-row">
                      <span>Fees &amp; delivery</span>
                      <span>
                        {shipping === 0 ? (
                          <span className="cart-free-tag">FREE</span>
                        ) : (
                          <span className="fw-semibold text-dark">₹{shipping}</span>
                        )}
                      </span>
                    </div>

                    <div className="cart-summary-row">
                      <span>Discounts</span>
                      <span className="cart-discount-value">-₹{savings.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Grand Total */}
                    <div className="cart-summary-row total">
                      <span>Total Amount</span>
                      <span className="text-primary">₹{grandTotal.toLocaleString('en-IN')}</span>
                    </div>

                    {savings > 0 && (
                      <div className="cart-savings-banner">
                        <i className="bi bi-stars"></i>
                        <span>You will save ₹{savings.toLocaleString('en-IN')} on this order</span>
                      </div>
                    )}

                    <button
                      type="button"
                      className={`cart-cta-button ${checkoutStep === 3 && paymentMethod === 'cod' ? 'cod' : ''}`}
                      disabled={isPaying || (checkoutStep > 1 && !deliveryAddress)}
                      onClick={() => {
                        if (checkoutStep === 1) {
                          if (!deliveryAddress) {
                            alert('Please select or add a delivery address to continue.');
                            navigate('/addresses', { state: { openForm: true } });
                            return;
                          }
                          setCheckoutStep(2);
                          window.scrollTo({ top: 100, behavior: 'smooth' });
                          return;
                        }

                        if (checkoutStep === 2) {
                          if (!deliveryAddress) {
                            alert('Please select or add a delivery address to continue.');
                            navigate('/addresses', { state: { openForm: true } });
                            return;
                          }
                          setCheckoutStep(3);
                          window.scrollTo({ top: 100, behavior: 'smooth' });
                          return;
                        }

                        if (checkoutStep === 3) {
                          if (!deliveryAddress) {
                            alert('Please add a delivery address before paying.');
                            navigate('/addresses', { state: { openForm: true } });
                            return;
                          }
                          if (paymentMethod === 'cod') {
                            handleCODOrder();
                          } else {
                            handlePayment();
                          }
                        }
                      }}
                    >
                      {isPaying ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          <span>{paymentMethod === 'cod' ? 'Placing Order…' : 'Opening Payment Gateway…'}</span>
                        </>
                      ) : checkoutStep === 1 ? (
                        <>
                          <span>Proceed to Order Summary</span>
                          <i className="bi bi-arrow-right"></i>
                        </>
                      ) : checkoutStep === 2 ? (
                        <>
                          <span>Proceed to Payment</span>
                          <i className="bi bi-arrow-right"></i>
                        </>
                      ) : paymentMethod === 'cod' ? (
                        <>
                          <i className="bi bi-box-seam-fill"></i>
                          <span>Place Cash on Delivery Order (₹{grandTotal.toLocaleString('en-IN')})</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-shield-lock-fill"></i>
                          <span>Pay ₹{grandTotal.toLocaleString('en-IN')} via UPI / Online</span>
                        </>
                      )}
                    </button>

                    {checkoutStep === 2 && (
                      <button
                        type="button"
                        className="cart-secondary-btn"
                        onClick={() => {
                          setCheckoutStep(1);
                          window.scrollTo({ top: 100, behavior: 'smooth' });
                        }}
                        disabled={isPaying}
                      >
                        <i className="bi bi-arrow-left"></i> Edit Cart Items
                      </button>
                    )}

                    {checkoutStep === 3 && (
                      <button
                        type="button"
                        className="cart-secondary-btn"
                        onClick={() => {
                          setCheckoutStep(2);
                          window.scrollTo({ top: 100, behavior: 'smooth' });
                        }}
                        disabled={isPaying}
                      >
                        <i className="bi bi-arrow-left"></i> Back to Order Summary
                      </button>
                    )}

                    <div className="cart-trust-container">
                      <div className="cart-trust-item">
                        <i className="bi bi-shield-check text-success"></i>
                        <span>Safe &amp; Secure 256-Bit SSL Checkout</span>
                      </div>
                      <div className="cart-trust-item">
                        <i className="bi bi-truck text-primary"></i>
                        <span>Fast Shipping Across India</span>
                      </div>
                      <div className="cart-trust-item">
                        <i className="bi bi-patch-check text-warning"></i>
                        <span>100% Genuine Electronic Components</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Cart;