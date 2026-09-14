import logo from '../assets/logo.png';
import { numberToWords } from '../utils/currency';
import './InvoiceBill.css';

const InvoiceBill = ({ order, id = 'tax-invoice-bill' }) => {
  if (!order) return null;

  const orderId = order.orderId || (order._id ? `#ORD-${order._id.slice(-6).toUpperCase()}` : '#ORD');
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const orderStatus = (order.status || 'pending').toLowerCase();
  const paymentStatus = (order.paymentStatus || 'pending').toLowerCase();
  const paymentMethod = (order.paymentMethod || 'COD').toUpperCase();

  const user = order.user_id || {};
  const customerName = order.customerName || user.name || order.address?.name || 'Valued Customer';
  const customerEmail = order.customerEmail || user.email || 'N/A';
  const customerMobile = order.customerMobile || order.address?.mobile || user.mobile || 'N/A';

  const subtotal = Number(order.subtotal || order.totalAmount || 0);
  const fee = Number(order.fee || 0);
  const discount = Number(order.discount || 0);
  const grandTotal = Number(order.totalAmount || 0);

  return (
    <div id={id} className="tax-invoice-bill-container">
      {/* 1. Header: Brand Info & Invoice Meta */}
      <div className="tib-header-row">
        <div className="tib-brand-col">
          <div className="tib-brand-box">
            <img src={logo} alt="SoftPro Innovation Logo" className="tib-logo-img" />
            <div>
              <h1 className="tib-company-name">SOFTPRO INNOVATION</h1>
              <p className="tib-company-tagline">Electronics, IoT Kits & Embedded Solutions</p>
            </div>
          </div>
          <div className="tib-company-details">
            <p>123 Tech Hub, Innovation Park, Lucknow, UP – 226028</p>
            <p>Email: support@softproinnovation.com • Web: www.softproinnovation.com</p>
            <p>Helpline: +91 92192 35951 • GSTIN: 09AAACS1429B1ZX</p>
          </div>
        </div>

        <div className="tib-meta-col">
          <div className="tib-tax-badge">TAX INVOICE</div>
          <table className="tib-meta-table">
            <tbody>
              <tr>
                <td className="tib-meta-lbl">Invoice / Order ID:</td>
                <td className="tib-meta-val">{orderId}</td>
              </tr>
              <tr>
                <td className="tib-meta-lbl">Order Date:</td>
                <td className="tib-meta-val">{orderDate}</td>
              </tr>
              <tr>
                <td className="tib-meta-lbl">Payment Mode:</td>
                <td className="tib-meta-val text-uppercase">{paymentMethod}</td>
              </tr>
              <tr>
                <td className="tib-meta-lbl">Payment Status:</td>
                <td
                  className="tib-meta-val text-uppercase"
                  style={{ color: paymentStatus === 'paid' ? '#16a34a' : '#d97706', fontWeight: 700 }}
                >
                  {paymentStatus}
                </td>
              </tr>
              <tr>
                <td className="tib-meta-lbl">Fulfillment:</td>
                <td
                  className="tib-meta-val text-uppercase"
                  style={{ color: '#2563eb', fontWeight: 700 }}
                >
                  {orderStatus}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="tib-rule"></div>

      {/* 2. Customer & Shipping Addresses */}
      <div className="tib-addresses-row">
        <div className="tib-address-card">
          <div className="tib-address-tag">BILLED TO (CUSTOMER DETAILS)</div>
          <div className="tib-address-name">{customerName}</div>
          <div className="tib-address-lines">
            <div><strong>Mobile:</strong> {customerMobile}</div>
            <div><strong>Email:</strong> {customerEmail}</div>
          </div>
        </div>

        <div className="tib-address-card">
          <div className="tib-address-tag">SHIPPED &amp; DELIVERED TO</div>
          <div className="tib-address-name">{order.address?.name || customerName}</div>
          <div className="tib-address-lines">
            <div><strong>Contact:</strong> {order.address?.mobile || customerMobile}</div>
            <div>
              {order.address?.address}
              {order.address?.locality ? `, ${order.address.locality}` : ''}
              {order.address?.landmark ? `, Near ${order.address.landmark}` : ''}
            </div>
            <div>
              <strong>{order.address?.city}</strong>, {order.address?.state} – <strong>{order.address?.pincode}</strong>
            </div>
            <div className="tib-destination-type">
              Destination Type: {order.address?.addressType || 'Home / Work'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Items Table */}
      <table className="tib-products-table">
        <thead>
          <tr>
            <th style={{ width: '6%' }} className="text-center">#</th>
            <th style={{ width: '52%' }}>Description of Components / Goods</th>
            <th style={{ width: '15%' }} className="text-center">Rate (₹)</th>
            <th style={{ width: '11%' }} className="text-center">Qty</th>
            <th style={{ width: '16%' }} className="text-end">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {(order.items || []).map((item, idx) => {
            const unitPrice = Number(item.price || 0);
            const qty = Number(item.quantity || 1);
            const lineTotal = Number(item.total || unitPrice * qty);
            return (
              <tr key={idx}>
                <td className="text-center">{idx + 1}</td>
                <td>
                  <div className="tib-item-name">{item.name}</div>
                  {item.category && <span className="tib-item-category">{item.category}</span>}
                </td>
                <td className="text-center">₹{unitPrice.toLocaleString('en-IN')}</td>
                <td className="text-center font-bold">{qty}</td>
                <td className="text-end font-bold">₹{lineTotal.toLocaleString('en-IN')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 4. Calculations & Words */}
      <div className="tib-calc-row">
        <div className="tib-words-card">
          <div className="tib-words-title">Invoice Value in Words:</div>
          <div className="tib-words-text">{numberToWords(grandTotal)}</div>

          <div className="tib-terms-box">
            <div className="tib-terms-title">Standard Terms &amp; Warranty:</div>
            <ol className="tib-terms-list">
              <li>Goods covered under 7-Day Replacement Guarantee against manufacturing defects.</li>
              <li>Damage due to electrical surge, reverse voltage, or physical misuse is excluded.</li>
              <li>All legal matters subject to Lucknow jurisdiction only.</li>
            </ol>
          </div>
        </div>

        <div className="tib-totals-card">
          <table className="tib-totals-table">
            <tbody>
              <tr>
                <td className="tib-tot-lbl">Items Subtotal:</td>
                <td className="tib-tot-num">₹{subtotal.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td className="tib-tot-lbl">Shipping &amp; Delivery:</td>
                <td className="tib-tot-num">
                  {fee > 0 ? `₹${fee.toLocaleString('en-IN')}` : 'FREE'}
                </td>
              </tr>
              {discount > 0 && (
                <tr>
                  <td className="tib-tot-lbl text-danger">Discount Voucher:</td>
                  <td className="tib-tot-num text-danger">- ₹{discount.toLocaleString('en-IN')}</td>
                </tr>
              )}
              <tr className="tib-grand-total-row">
                <td>Grand Total:</td>
                <td className="tib-tot-num">₹{grandTotal.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Signatory & Official Verification */}
      <div className="tib-footer-row">
        <div className="tib-footer-notice">
          This is an electronically generated official Tax Invoice from SoftPro Innovation. No physical signature or rubber stamp is required.
        </div>
        <div className="tib-signature-block">
          <div className="tib-seal-badge">
            <i className="bi bi-patch-check-fill me-1"></i> VERIFIED &amp; AUTHENTIC
          </div>
          <div className="tib-sign-org">For SoftPro Innovation</div>
          <div className="tib-sign-role">Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceBill;
