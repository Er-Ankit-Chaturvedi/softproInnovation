import { useLocation, Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { formatImg } from '../../utils/imageUrl';

const OrderSuccess = () => {
  const location = useLocation();

  const {
    orderId,
    razorpayPaymentId,
    razorpayOrderId,
    totalAmount,
    paymentMethod = 'razorpay',
    items = [],
    address,
  } = location.state || {};

  const isCOD = paymentMethod === 'cod';

  return (
    <>
      <Header />
      <main className="order-success-page py-5" style={{ minHeight: '75vh', backgroundColor: '#f8fafc' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-10 col-lg-8">
              {/* Success Card */}
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white text-center p-4 p-md-5">
                {/* Success Icon */}
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm"
                  style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#dcfce7',
                    color: '#16a34a',
                  }}
                >
                  <i className="bi bi-check2-circle fs-1"></i>
                </div>

                <span className={`badge ${isCOD ? 'bg-warning bg-opacity-10 text-dark border border-warning-subtle' : 'bg-success bg-opacity-10 text-success'} fw-semibold px-3 py-1.5 rounded-pill align-self-center mb-2`} style={{ fontSize: '13px' }}>
                  {isCOD ? 'Cash on Delivery Confirmed' : 'Payment Verified'}
                </span>

                <h2 className="fw-bold text-dark mb-2">Order Confirmed!</h2>
                <p className="text-muted mb-4" style={{ fontSize: '15px' }}>
                  {isCOD
                    ? 'Thank you for choosing SoftPro Innovation. Your order has been placed. Please keep cash or UPI ready upon delivery.'
                    : 'Thank you for choosing SoftPro Innovation. Your order has been placed and is now being processed.'}
                </p>

                {/* Key Order Details Box */}
                <div className="bg-light rounded-3 p-3 p-md-4 mb-4 text-start border">
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '11px' }}>
                        Order ID
                      </small>
                      <strong className="text-dark fs-6 text-break">
                        {orderId || razorpayOrderId || 'ORD-COMPLETED'}
                      </strong>
                    </div>

                    <div className="col-12 col-sm-6">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '11px' }}>
                        {isCOD ? 'Payment Terms' : 'Razorpay Payment ID'}
                      </small>
                      <strong className="text-dark fs-6 text-break">
                        {isCOD ? 'Pay Cash / UPI upon Delivery' : (razorpayPaymentId || 'Completed Online')}
                      </strong>
                    </div>

                    {totalAmount !== undefined && (
                      <div className="col-12 col-sm-6">
                        <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '11px' }}>
                          {isCOD ? 'Amount Due on Delivery' : 'Amount Paid'}
                        </small>
                        <strong className="text-success fs-5">
                          ₹{Number(totalAmount).toLocaleString('en-IN')}
                        </strong>
                      </div>
                    )}

                    <div className="col-12 col-sm-6">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '11px' }}>
                        Payment Method
                      </small>
                      <span className={`badge ${isCOD ? 'bg-warning bg-opacity-10 text-dark border' : 'bg-primary bg-opacity-10 text-primary'} fw-semibold px-2.5 py-1 rounded-2`}>
                        {isCOD ? 'Cash on Delivery (COD)' : 'Razorpay (Online)'}
                      </span>
                    </div>
                  </div>

                  {address && (
                    <div className="mt-3 pt-3 border-top">
                      <small className="text-muted d-block text-uppercase fw-semibold mb-1" style={{ fontSize: '11px' }}>
                        Delivery Address
                      </small>
                      <div className="small text-dark fw-medium">
                        <strong>{address.name}</strong> • {address.mobile}
                      </div>
                      <div className="small text-muted">
                        {address.address || address.Address}
                        {address.locality ? `, ${address.locality}` : ''}, {address.city}, {address.state} - {address.pincode}
                      </div>
                    </div>
                  )}
                </div>

                {/* Ordered Items Preview */}
                {items && items.length > 0 && (
                  <div className="text-start mb-4">
                    <h6 className="fw-bold text-dark mb-3">Items in this order ({items.length})</h6>
                    <div className="d-flex flex-column gap-2">
                      {items.map((item, idx) => (
                        <div
                          key={item._id || item.id || idx}
                          className="d-flex align-items-center justify-content-between p-2 rounded-2 border bg-white"
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="rounded border p-1 d-flex align-items-center justify-content-center bg-light flex-shrink-0"
                              style={{ width: '48px', height: '48px' }}
                            >
                              <img
                                src={formatImg(item.thumbnail)}
                                alt={item.name}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                              />
                            </div>
                            <div>
                              <div className="fw-semibold text-dark small" style={{ maxWidth: '300px' }}>
                                {item.name}
                              </div>
                              <small className="text-muted">Qty: {item.quantity || 1}</small>
                            </div>
                          </div>
                          <div className="fw-bold text-dark small">
                            ₹{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-3 pt-2">
                  <Link
                    to="/profile?tab=orders"
                    className="btn btn-primary px-4 py-2.5 rounded-pill fw-semibold shadow-sm w-100 w-sm-auto text-decoration-none"
                    style={{ minWidth: '180px' }}
                  >
                    <i className="bi bi-box-seam me-2"></i> View My Orders
                  </Link>

                  <Link
                    to="/Product"
                    className="btn btn-outline-secondary px-4 py-2.5 rounded-pill fw-semibold w-100 w-sm-auto text-decoration-none"
                    style={{ minWidth: '180px' }}
                  >
                    <i className="bi bi-shop me-2"></i> Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default OrderSuccess;
