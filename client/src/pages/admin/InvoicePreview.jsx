import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/logo.png';
import { API_BASE_URL } from '../../config/api';
import { numberToWords } from '../../utils/currency';
import './InvoicePreview.css';

// Default Realistic Enterprise GST Invoice Data
const DEFAULT_INVOICE_DATA = {
  invoiceNumber: 'INV-2026-00125',
  invoiceDate: '11 September 2026',
  dueDate: '18 September 2026',
  poNumber: 'PO-984210',
  paymentStatus: 'paid', // 'paid' | 'pending' | 'partially_paid'
  paymentMethod: 'Bank Transfer (NEFT / RTGS)',
  transactionId: 'TXN-HDFC9842109823',
  paymentDate: '11 September 2026, 02:45 PM',

  company: {
    name: 'SOFTPRO INNOVATION PVT. LTD.',
    tagline: 'Electronics, IoT Kits & Embedded Solutions',
    address: '123 Tech Hub, Phase 2, Innovation Park, Lucknow, UP – 226028',
    phone: '+91 92192 35951',
    email: 'billing@softproinnovation.com',
    website: 'www.softproinnovation.com',
    gstin: '09AAACS1429B1ZX',
    pan: 'AAACS1429B',
    stateCode: '09 (Uttar Pradesh)',
  },

  billTo: {
    customerName: 'Rahul Sharma',
    companyName: 'Sharma Enterprises',
    address: 'Plot No. 42, Gomti Nagar Commercial Complex',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226010',
    phone: '+91 98765 43210',
    email: 'rahul.sharma@sharmaenterprises.in',
    gstin: '09ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    stateCode: '09 (Uttar Pradesh)',
  },

  shipTo: {
    shippingName: 'Sharma Enterprises - Warehouse Dept.',
    shippingAddress: 'Building B-4, Industrial Area, Sector 5',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226010',
    phone: '+91 98765 43210',
  },

  items: [
    {
      id: 1,
      name: 'Arduino Mega 2560 Pro Microcontroller Board',
      description: 'ATmega2560 embedded microcontroller with USB CH340G, 54 I/O pins, 16MHz',
      hsn: '85423100',
      qty: 5,
      unitPrice: 1250.00,
      discount: 250.00,
      taxRate: 18,
    },
    {
      id: 2,
      name: 'DHT22 / AM2302 High-Precision Digital Sensor Module',
      description: 'Calibrated digital temperature & humidity sensor with factory wire harness',
      hsn: '90318000',
      qty: 10,
      unitPrice: 380.00,
      discount: 0.00,
      taxRate: 18,
    },
    {
      id: 3,
      name: 'HC-05 Wireless Bluetooth 2.0 Serial Transceiver',
      description: 'Master/Slave 6-pin wireless UART communication module with integrated antenna',
      hsn: '85176290',
      qty: 8,
      unitPrice: 295.00,
      discount: 80.00,
      taxRate: 18,
    },
    {
      id: 4,
      name: '0.96 inch I2C OLED Display Module (128x64)',
      description: 'High contrast graphic display module with SSD1306 driver, 3.3V-5V compatible',
      hsn: '85285900',
      qty: 12,
      unitPrice: 240.00,
      discount: 120.00,
      taxRate: 18,
    },
    {
      id: 5,
      name: '12V DC High-Torque Metal Gear Motor (300 RPM)',
      description: 'Heavy duty reduction gearbox DC motor for robotics, drives and automation',
      hsn: '85011019',
      qty: 4,
      unitPrice: 650.00,
      discount: 100.00,
      taxRate: 18,
    }
  ],

  shippingCharges: 0,
  notes: 'Thank you for ordering with SoftPro Innovation! All electronic components are batch tested and ESD protected. Please verify serial packaging upon receipt.',
  bankDetails: {
    bankName: 'HDFC Bank Ltd.',
    accountName: 'SoftPro Innovation Private Limited',
    accountNumber: '50200084920194',
    ifscCode: 'HDFC0001248',
    branch: 'Hazratganj, Lucknow',
    upiId: 'softpro@hdfcbank',
  },
  terms: [
    'Goods covered under 7-Day Replacement Guarantee against manufacturing defects.',
    'Damage due to electrical surge, reverse polarity, or physical misuse is excluded.',
    'Interest @18% per annum will be charged on delayed payments after the due date.',
    'All legal disputes are strictly subject to Lucknow jurisdiction only.',
  ]
};

const InvoicePreview = () => {
  const { id } = useParams();
  const moreActionsRef = useRef(null);

  const [invoice, setInvoice] = useState(DEFAULT_INVOICE_DATA);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [sendModal, setSendModal] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [sending, setSending] = useState(false);

  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3800);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreActionsRef.current && !moreActionsRef.current.contains(e.target)) {
        setShowMoreActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch live order details if route has an order id
  useEffect(() => {
    if (!id || id === 'sample') {
      setInvoice(DEFAULT_INVOICE_DATA);
      setSendEmail(DEFAULT_INVOICE_DATA.billTo.email);
      return;
    }

    const fetchLiveOrder = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/order/${id}`);
        if (res.data?.success && res.data?.order) {
          const ord = res.data.order;
          const user = ord.user_id || {};
          const addr = ord.address || {};

          const mappedItems = (ord.items || []).map((it, idx) => {
            const unit = Number(it.price || 0);
            const q = Number(it.quantity || 1);
            return {
              id: idx + 1,
              name: it.name || 'Component Item',
              description: it.category ? `Curated ${it.category} hardware component` : 'Standard electronics component',
              hsn: '85423100',
              qty: q,
              unitPrice: unit,
              discount: 0,
              taxRate: 18,
            };
          });

          const createdDate = ord.createdAt
            ? new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
            : '11 September 2026';

          const dueDateObj = ord.createdAt ? new Date(new Date(ord.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000) : new Date();
          const dueDateStr = dueDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

          const liveData = {
            ...DEFAULT_INVOICE_DATA,
            invoiceNumber: ord.orderId || `INV-2026-${ord._id.slice(-5).toUpperCase()}`,
            invoiceDate: createdDate,
            dueDate: dueDateStr,
            paymentStatus: (ord.paymentStatus || 'pending').toLowerCase(),
            paymentMethod: (ord.paymentMethod || 'COD').toUpperCase(),
            transactionId: ord.paymentTransactionId || `TXN-${(ord._id || '').slice(-10).toUpperCase()}`,
            paymentDate: `${createdDate}, 03:30 PM`,

            billTo: {
              customerName: ord.customerName || user.name || addr.name || 'Valued Customer',
              companyName: user.companyName || 'Enterprise Partner',
              address: addr.address || 'Commercial Suite, Innovation Park',
              city: addr.city || 'Lucknow',
              state: addr.state || 'Uttar Pradesh',
              pincode: addr.pincode || '226028',
              phone: ord.customerMobile || user.mobile || addr.mobile || '+91 92192 35951',
              email: ord.customerEmail || user.email || 'customer@softproinnovation.com',
              gstin: user.gstin || '09ABCDE1234F1Z5',
              pan: 'ABCDE1234F',
              stateCode: '09 (Uttar Pradesh)',
            },

            shipTo: {
              shippingName: addr.name || ord.customerName || 'Receiving Dept.',
              shippingAddress: `${addr.address || ''}${addr.locality ? `, ${addr.locality}` : ''}${addr.landmark ? `, Near ${addr.landmark}` : ''}`,
              city: addr.city || 'Lucknow',
              state: addr.state || 'Uttar Pradesh',
              pincode: addr.pincode || '226028',
              phone: addr.mobile || ord.customerMobile || '+91 92192 35951',
            },

            items: mappedItems.length > 0 ? mappedItems : DEFAULT_INVOICE_DATA.items,
            shippingCharges: Number(ord.fee || 0),
          };

          setInvoice(liveData);
          setSendEmail(liveData.billTo.email);
        }
      } catch (err) {
        console.error('Failed to load order invoice:', err);
        showNotification('Could not load specific order; showing enterprise sample invoice.', 'warning');
      } finally {
        setLoading(false);
      }
    };

    fetchLiveOrder();
  }, [id]);

  // Calculations
  const calculations = (() => {
    let subtotal = 0;
    let totalDiscount = 0;

    invoice.items.forEach((item) => {
      const lineGross = item.qty * item.unitPrice;
      const lineDisc = item.discount || 0;
      subtotal += lineGross;
      totalDiscount += lineDisc;
    });

    const taxableAmount = Math.max(0, subtotal - totalDiscount);
    // 18% GST (9% CGST + 9% SGST for intra-state)
    const cgst = taxableAmount * 0.09;
    const sgst = taxableAmount * 0.09;
    const igst = 0;
    const totalTax = cgst + sgst + igst;
    const shipping = Number(invoice.shippingCharges || 0);
    const grandTotal = Math.round(taxableAmount + totalTax + shipping);

    return {
      subtotal,
      totalDiscount,
      taxableAmount,
      cgst,
      sgst,
      igst,
      totalTax,
      shipping,
      grandTotal,
      words: numberToWords(grandTotal),
    };
  })();

  const handlePrint = () => {
    window.print();
  };

  const handleSendInvoice = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSendModal(false);
      showNotification(`Tax Invoice ${invoice.invoiceNumber} successfully dispatched to ${sendEmail}!`);
    }, 900);
  };

  const handleStatusChange = (newStatus) => {
    setInvoice((prev) => ({ ...prev, paymentStatus: newStatus }));
    showNotification(`Invoice status updated to ${newStatus.toUpperCase()}`);
    setShowMoreActions(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showNotification('Invoice preview link copied to clipboard!');
    setShowMoreActions(false);
  };

  return (
    <div className="aip-page-wrapper">
      {/* Toast Alert */}
      {toast.show && (
        <div className={`aip-toast aip-toast-${toast.type} shadow-lg`}>
          <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
          <span>{toast.message}</span>
          <button type="button" className="btn-close btn-close-white ms-auto" onClick={() => setToast({ show: false, message: '', type: 'success' })}></button>
        </div>
      )}

      {/* Admin Action Bar (Hidden during Print) */}
      <header className="aip-action-bar no-print">
        <div className="aip-action-container">
          <div className="aip-left-group">
            <Link to="/dashboard/orders" className="aip-back-btn">
              <i className="bi bi-arrow-left"></i>
              <span>Back to Invoices</span>
            </Link>
            <div className="aip-badge-group">
              <span className="aip-inv-id-tag">{invoice.invoiceNumber}</span>
              <span className={`aip-status-badge aip-status-${invoice.paymentStatus}`}>
                {invoice.paymentStatus === 'paid' && <i className="bi bi-check2-circle me-1"></i>}
                {invoice.paymentStatus === 'pending' && <i className="bi bi-hourglass-split me-1"></i>}
                {invoice.paymentStatus === 'partially_paid' && <i className="bi bi-pie-chart me-1"></i>}
                {invoice.paymentStatus.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          <div className="aip-right-group">
            {/* Edit Invoice Button */}
            <button
              type="button"
              className="aip-btn aip-btn-secondary"
              onClick={() => showNotification('Invoice edit panel is ready in your accounting suite.')}
              title="Edit invoice items or recipient details"
            >
              <i className="bi bi-pencil-square"></i>
              <span>Edit Invoice</span>
            </button>

            {/* Download PDF */}
            <button
              type="button"
              className="aip-btn aip-btn-secondary"
              onClick={handlePrint}
              title="Download or save as clean PDF"
            >
              <i className="bi bi-download"></i>
              <span>Download PDF</span>
            </button>

            {/* Print Invoice */}
            <button
              type="button"
              className="aip-btn aip-btn-primary"
              onClick={handlePrint}
              title="Print official tax invoice (A4 format)"
              id="aip-print-invoice-btn"
            >
              <i className="bi bi-printer"></i>
              <span>Print Invoice</span>
            </button>

            {/* Send Invoice */}
            <button
              type="button"
              className="aip-btn aip-btn-accent"
              onClick={() => setSendModal(true)}
              title="Email invoice to customer"
            >
              <i className="bi bi-send-fill"></i>
              <span>Send Invoice</span>
            </button>

            {/* More Actions Dropdown */}
            <div className="aip-dropdown-wrapper" ref={moreActionsRef}>
              <button
                type="button"
                className="aip-btn aip-btn-icon"
                onClick={() => setShowMoreActions((prev) => !prev)}
                title="More Actions"
              >
                <i className="bi bi-three-dots-vertical"></i>
              </button>

              {showMoreActions && (
                <div className="aip-dropdown-menu shadow-lg">
                  <div className="aip-dropdown-header">Invoice Actions</div>
                  <button type="button" className="aip-dropdown-item" onClick={() => handleStatusChange('paid')}>
                    <i className="bi bi-check-circle text-success"></i> Mark as Paid
                  </button>
                  <button type="button" className="aip-dropdown-item" onClick={() => handleStatusChange('pending')}>
                    <i className="bi bi-clock-history text-warning"></i> Mark as Pending
                  </button>
                  <button type="button" className="aip-dropdown-item" onClick={() => handleStatusChange('partially_paid')}>
                    <i className="bi bi-percent text-info"></i> Mark Partially Paid
                  </button>
                  <div className="aip-dropdown-divider"></div>
                  <button type="button" className="aip-dropdown-item" onClick={handleCopyLink}>
                    <i className="bi bi-link-45deg text-primary"></i> Copy Invoice Link
                  </button>
                  <button
                    type="button"
                    className="aip-dropdown-item"
                    onClick={() => {
                      showNotification('Invoice duplicated as a fresh draft.');
                      setShowMoreActions(false);
                    }}
                  >
                    <i className="bi bi-copy text-secondary"></i> Duplicate Invoice
                  </button>
                  <button
                    type="button"
                    className="aip-dropdown-item text-danger"
                    onClick={() => {
                      showNotification('Invoice flagged as VOID.', 'warning');
                      setShowMoreActions(false);
                    }}
                  >
                    <i className="bi bi-slash-circle"></i> Void / Cancel Invoice
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Preview Container */}
      <main className="aip-preview-viewport">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3 text-secondary fw-semibold">Loading official Tax Invoice details...</p>
          </div>
        ) : (
          <div className="aip-preview-content-wrapper w-100">
            {/* On-screen Print Guidance Tip (Hidden during Print) */}
            <div className="aip-print-banner no-print d-flex align-items-center justify-content-between flex-wrap gap-2 px-3 py-2 bg-white rounded-3 border mb-3 mx-auto" style={{ maxWidth: '860px' }}>
              <div className="d-flex align-items-center gap-2 text-secondary small">
                <i className="bi bi-printer text-primary fs-5"></i>
                <span>
                  <strong>A4 Print Ready:</strong> Clicking Print isolates the tax invoice. Sidebar, navigation, and admin buttons are excluded.
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5 fw-semibold px-3"
                onClick={handlePrint}
              >
                <i className="bi bi-printer"></i>
                <span>Print Invoice</span>
              </button>
            </div>

            {/* THE OFFICIAL TAX INVOICE CARD (Target of @media print) */}
            <div id="admin-invoice-paper" className="aip-paper-sheet shadow-sm">
            {/* 1. CENTERED HEADER SECTION */}
            <div className="aip-header-block text-center">
              <div className="aip-company-brand text-center mx-auto">
                {/* Logo & Company Name Centered */}
                <div className="aip-logo-row">
                  <img src={logo} alt="SoftPro Innovation Logo" className="aip-company-logo" />
                  <div className="aip-company-title-wrap">
                    <h1 className="aip-company-title">{invoice.company.name}</h1>
                    <p className="aip-company-sub">{invoice.company.tagline}</p>
                  </div>
                </div>

                {/* Centered Address & Contact Details */}
                <div className="aip-company-address-box text-center">
                  <p className="aip-address-line">{invoice.company.address}</p>
                  <p className="aip-contact-line">
                    <span><strong>Phone:</strong> {invoice.company.phone}</span>
                    <span className="aip-dot-sep">•</span>
                    <span><strong>Email:</strong> {invoice.company.email}</span>
                  </p>
                  <p className="aip-contact-line">
                    <span><strong>Web:</strong> {invoice.company.website}</span>
                    <span className="aip-dot-sep">•</span>
                    <span><strong>State Code:</strong> {invoice.company.stateCode}</span>
                  </p>
                  <div className="aip-gst-highlight mt-1">
                    <span><strong>GSTIN:</strong> <code>{invoice.company.gstin}</code></span>
                    <span className="aip-dot-sep">•</span>
                    <span><strong>PAN:</strong> {invoice.company.pan}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TAX INVOICE BAR & META RIBBON */}
            <div className="aip-tax-invoice-bar">
              <div className="aip-tax-invoice-heading">TAX INVOICE</div>
              <div className="aip-invoice-meta-ribbon">
                <div className="aip-ribbon-item">
                  <span className="aip-ribbon-lbl">Invoice No:</span>
                  <strong className="aip-ribbon-val">{invoice.invoiceNumber}</strong>
                </div>
                <div className="aip-ribbon-item">
                  <span className="aip-ribbon-lbl">Invoice Date:</span>
                  <span className="aip-ribbon-val">{invoice.invoiceDate}</span>
                </div>
                <div className="aip-ribbon-item">
                  <span className="aip-ribbon-lbl">Due Date:</span>
                  <span className="aip-ribbon-val aip-due-date">{invoice.dueDate}</span>
                </div>
                <div className="aip-ribbon-item">
                  <span className="aip-ribbon-lbl">P.O. No:</span>
                  <span className="aip-ribbon-val">{invoice.poNumber}</span>
                </div>
                <div className="aip-ribbon-item">
                  <span className="aip-ribbon-lbl">Place of Supply:</span>
                  <span className="aip-ribbon-val">Uttar Pradesh (09)</span>
                </div>
              </div>
            </div>

            {/* 2. BILL TO & SHIP TO SECTION */}
            <div className="aip-parties-grid">
              {/* Bill To */}
              <div className="aip-party-card">
                <div className="aip-party-header">
                  <i className="bi bi-person-lines-fill me-1.5 text-primary"></i>
                  <span>BILL TO (BUYER DETAILS)</span>
                </div>
                <div className="aip-party-body">
                  <div className="aip-party-primary-name">{invoice.billTo.customerName}</div>
                  <div className="aip-party-org">{invoice.billTo.companyName}</div>
                  <div className="aip-party-street">{invoice.billTo.address}</div>
                  <div className="aip-party-loc">
                    {invoice.billTo.city}, {invoice.billTo.state} – <strong>{invoice.billTo.pincode}</strong>
                  </div>
                  <div className="aip-party-contact">
                    <div><strong>Phone:</strong> {invoice.billTo.phone}</div>
                    <div><strong>Email:</strong> {invoice.billTo.email}</div>
                  </div>
                  <div className="aip-party-tax-badge">
                    <strong>GSTIN:</strong> <code>{invoice.billTo.gstin}</code>
                  </div>
                </div>
              </div>

              {/* Ship To */}
              <div className="aip-party-card">
                <div className="aip-party-header">
                  <i className="bi bi-truck me-1.5 text-primary"></i>
                  <span>SHIP TO (DISPATCH DESTINATION)</span>
                </div>
                <div className="aip-party-body">
                  <div className="aip-party-primary-name">{invoice.shipTo.shippingName}</div>
                  <div className="aip-party-street">{invoice.shipTo.shippingAddress}</div>
                  <div className="aip-party-loc">
                    {invoice.shipTo.city}, {invoice.shipTo.state} – <strong>{invoice.shipTo.pincode}</strong>
                  </div>
                  <div className="aip-party-contact">
                    <div><strong>Contact Person Phone:</strong> {invoice.shipTo.phone}</div>
                    <div><strong>Shipping Mode:</strong> Expedited Surface Courier</div>
                  </div>
                  <div className="aip-destination-pill">
                    <i className="bi bi-geo-alt-fill me-1"></i> Verified Commercial Delivery Address
                  </div>
                </div>
              </div>
            </div>

            {/* 3. PRODUCT / ITEM TABLE */}
            <div className="aip-table-wrapper">
              <table className="aip-items-table">
                <thead>
                  <tr>
                    <th className="text-center" style={{ width: '4%' }}>S.No.</th>
                    <th style={{ width: '38%' }}>Product / Service Description</th>
                    <th className="text-center" style={{ width: '11%' }}>HSN/SAC</th>
                    <th className="text-center" style={{ width: '7%' }}>Qty</th>
                    <th className="text-end" style={{ width: '13%' }}>Unit Price (₹)</th>
                    <th className="text-end" style={{ width: '9%' }}>Disc. (₹)</th>
                    <th className="text-center" style={{ width: '6%' }}>Tax</th>
                    <th className="text-end" style={{ width: '12%' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => {
                    const lineGross = item.qty * item.unitPrice;
                    const lineDisc = item.discount || 0;
                    const lineTaxable = lineGross - lineDisc;
                    const lineTax = lineTaxable * (item.taxRate / 100);
                    const lineTotal = lineTaxable + lineTax;

                    return (
                      <tr key={item.id || index}>
                        <td className="text-center aip-sno">{index + 1}</td>
                        <td>
                          <div className="aip-item-name">{item.name}</div>
                          <div className="aip-item-desc">{item.description}</div>
                        </td>
                        <td className="text-center aip-hsn">
                          <code>{item.hsn}</code>
                        </td>
                        <td className="text-center aip-qty">{item.qty}</td>
                        <td className="text-end aip-num">₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="text-end aip-num aip-disc">
                          {lineDisc > 0 ? `-₹${lineDisc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '&mdash;'}
                        </td>
                        <td className="text-center aip-tax-rate">{item.taxRate}%</td>
                        <td className="text-end aip-num aip-bold">₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 4 & 5. PRICE SUMMARY & PAYMENT DETAILS (SPLIT GRID) */}
            <div className="aip-bottom-grid">
              {/* Left Column: Payment Details & Bank Transfer Information */}
              <div className="aip-bottom-left">
                {/* 5. Payment Information */}
                <div className="aip-info-box mb-3">
                  <div className="aip-info-title">
                    <i className="bi bi-credit-card-2-front text-primary me-1.5"></i>
                    PAYMENT INFORMATION
                  </div>
                  <div className="aip-payment-meta-grid">
                    <div>
                      <span className="aip-meta-lbl">Payment Status:</span>
                      <span className={`aip-status-badge aip-status-${invoice.paymentStatus} d-inline-block ms-1`}>
                        {invoice.paymentStatus === 'paid' && '✓ PAID IN FULL'}
                        {invoice.paymentStatus === 'pending' && '⏳ PAYMENT PENDING'}
                        {invoice.paymentStatus === 'partially_paid' && 'PARTIALLY PAID'}
                      </span>
                    </div>
                    <div>
                      <span className="aip-meta-lbl">Payment Method:</span>
                      <strong className="text-dark ms-1">{invoice.paymentMethod}</strong>
                    </div>
                    <div>
                      <span className="aip-meta-lbl">Transaction Ref / UTR:</span>
                      <code className="text-dark ms-1">{invoice.transactionId}</code>
                    </div>
                    <div>
                      <span className="aip-meta-lbl">Receipt Date:</span>
                      <span className="text-dark ms-1">{invoice.paymentDate}</span>
                    </div>
                  </div>
                </div>

                {/* 6. Bank Details & UPI */}
                <div className="aip-info-box">
                  <div className="aip-info-title">
                    <i className="bi bi-bank text-primary me-1.5"></i>
                    BANK &amp; REMITTANCE DETAILS
                  </div>
                  <div className="aip-bank-grid">
                    <div>
                      <span className="aip-meta-lbl">Bank Name:</span>
                      <strong className="text-dark">{invoice.bankDetails.bankName}</strong>
                    </div>
                    <div>
                      <span className="aip-meta-lbl">A/C Name:</span>
                      <span className="text-dark">{invoice.bankDetails.accountName}</span>
                    </div>
                    <div>
                      <span className="aip-meta-lbl">A/C Number:</span>
                      <code className="aip-bold text-dark">{invoice.bankDetails.accountNumber}</code>
                    </div>
                    <div>
                      <span className="aip-meta-lbl">IFSC Code:</span>
                      <code className="aip-bold text-primary">{invoice.bankDetails.ifscCode}</code>
                    </div>
                    <div>
                      <span className="aip-meta-lbl">Branch:</span>
                      <span className="text-dark">{invoice.bankDetails.branch}</span>
                    </div>
                    <div>
                      <span className="aip-meta-lbl">UPI ID:</span>
                      <code className="text-dark">{invoice.bankDetails.upiId}</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: 4. Price Summary */}
              <div className="aip-bottom-right">
                <div className="aip-price-summary-card">
                  <div className="aip-summary-heading">PRICE BREAKDOWN</div>
                  <table className="aip-summary-table">
                    <tbody>
                      <tr>
                        <td className="aip-sum-lbl">Subtotal (Gross):</td>
                        <td className="aip-sum-val">₹{calculations.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      {calculations.totalDiscount > 0 && (
                        <tr>
                          <td className="aip-sum-lbl text-danger">Special Trade Discount:</td>
                          <td className="aip-sum-val text-danger">-₹{calculations.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      )}
                      <tr className="aip-sum-taxable-row">
                        <td className="aip-sum-lbl">Taxable Amount:</td>
                        <td className="aip-sum-val">₹{calculations.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td className="aip-sum-lbl">Central GST (CGST @ 9%):</td>
                        <td className="aip-sum-val">₹{calculations.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td className="aip-sum-lbl">State GST (SGST @ 9%):</td>
                        <td className="aip-sum-val">₹{calculations.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      {calculations.igst > 0 && (
                        <tr>
                          <td className="aip-sum-lbl">Integrated GST (IGST):</td>
                          <td className="aip-sum-val">₹{calculations.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="aip-sum-lbl">Shipping &amp; Logistics:</td>
                        <td className="aip-sum-val">
                          {calculations.shipping > 0 ? `₹${calculations.shipping.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'FREE'}
                        </td>
                      </tr>
                      <tr className="aip-grand-total-row">
                        <td className="aip-gt-lbl">GRAND TOTAL:</td>
                        <td className="aip-gt-val">₹{calculations.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Total in words */}
                  <div className="aip-words-box">
                    <span className="aip-words-lbl">Amount Chargeable in Words:</span>
                    <div className="aip-words-txt">{calculations.words}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. ADDITIONAL INFORMATION (NOTES & TERMS) */}
            <div className="aip-notes-terms-grid">
              <div className="aip-note-card">
                <div className="aip-note-title">Customer Notes &amp; Dispatch Instructions</div>
                <p className="aip-note-text">{invoice.notes}</p>
              </div>

              <div className="aip-terms-card">
                <div className="aip-note-title">Terms &amp; Conditions</div>
                <ol className="aip-terms-list">
                  {invoice.terms.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ol>
              </div>
            </div>

            {/* 7. FOOTER & AUTHORIZED SIGNATORY */}
            <div className="aip-footer-block">
              <div className="aip-footer-left">
                <h4 className="aip-thank-you">Thank you for your business!</h4>
                <p className="aip-footer-sub">
                  For order tracking, component datasheets or developer support, contact us at <strong>support@softproinnovation.com</strong> or call <strong>+91 92192 35951</strong>.
                </p>
                <div className="aip-computer-gen-tag">
                  <i className="bi bi-shield-check text-success me-1"></i>
                  This is an authenticated, computer-generated Tax Invoice. No physical signature or rubber seal is mandatory under GST rule 46.
                </div>
              </div>

              <div className="aip-footer-right">
                <div className="aip-sign-container">
                  <div className="aip-seal-badge">
                    <i className="bi bi-patch-check-fill me-1"></i> VERIFIED &amp; CERTIFIED
                  </div>
                  <div className="aip-corp-title">For {invoice.company.name}</div>
                  <div className="aip-sign-space"></div>
                  <div className="aip-sign-label">Authorized Signatory</div>
                </div>
              </div>
            </div>
          </div>

          {/* Screen-Only Quick Action Bar at Bottom */}
          <div className="aip-bottom-print-bar no-print text-center my-4">
            <button
              type="button"
              className="aip-btn aip-btn-primary shadow-sm px-4 py-2"
              onClick={handlePrint}
              title="Print official tax invoice"
            >
              <i className="bi bi-printer me-1.5 fs-5"></i>
              <span>Print Invoice</span>
            </button>
          </div>
        </div>
      )}
      </main>

      {/* Send Invoice Modal */}
      {sendModal && (
        <div className="aip-modal-backdrop no-print" onClick={() => setSendModal(false)}>
          <div className="aip-modal-card shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="aip-modal-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-envelope-paper-fill text-primary fs-5"></i>
                <h5 className="mb-0 fw-bold">Send Tax Invoice</h5>
              </div>
              <button type="button" className="btn-close" onClick={() => setSendModal(false)}></button>
            </div>
            <form onSubmit={handleSendInvoice}>
              <div className="aip-modal-body">
                <p className="text-secondary small mb-3">
                  Email this official Tax Invoice (<code>{invoice.invoiceNumber}</code>) along with PDF attachment and payment confirmation to the customer.
                </p>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Customer Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={sendEmail}
                    onChange={(e) => setSendEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label small fw-semibold">Subject</label>
                  <input
                    type="text"
                    className="form-control"
                    defaultValue={`Tax Invoice ${invoice.invoiceNumber} from SoftPro Innovation`}
                    readOnly
                  />
                </div>
              </div>
              <div className="aip-modal-footer">
                <button type="button" className="btn btn-light rounded-pill px-3" onClick={() => setSendModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary rounded-pill px-4 fw-semibold" disabled={sending}>
                  {sending ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-send-fill me-1.5"></i>}
                  {sending ? 'Sending...' : 'Send Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicePreview;
