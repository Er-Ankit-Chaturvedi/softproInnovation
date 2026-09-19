import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Footer.css';

const Footer = () => {
  // Mobile accordion state for links (collapsible on phone, always open on desktop via CSS)
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (sec) => {
    setOpenSection((prev) => (prev === sec ? null : sec));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="ft-section">
      <div className="container ft-container">
        {/* 1. Top Trust Features Strip */}
        <div className="ft-trust-wrapper">
          <div className="ft-trust-grid">
            <div className="ft-trust-item">
              <div className="ft-trust-icon blue">
                <i className="bi bi-truck"></i>
              </div>
              <div className="ft-trust-text">
                <span className="ft-trust-title">Fast Pan-India Delivery</span>
                <span className="ft-trust-desc">Dispatched in 24–48 Hours</span>
              </div>
            </div>

            <div className="ft-trust-item">
              <div className="ft-trust-icon green">
                <i className="bi bi-shield-check"></i>
              </div>
              <div className="ft-trust-text">
                <span className="ft-trust-title">100% Genuine Tech</span>
                <span className="ft-trust-desc">Verified Makers &amp; Brands</span>
              </div>
            </div>

            <div className="ft-trust-item">
              <div className="ft-trust-icon purple">
                <i className="bi bi-lock-fill"></i>
              </div>
              <div className="ft-trust-text">
                <span className="ft-trust-title">256-Bit SSL Checkout</span>
                <span className="ft-trust-desc">Secure UPI, Cards &amp; COD</span>
              </div>
            </div>

            <div className="ft-trust-item">
              <div className="ft-trust-icon amber">
                <i className="bi bi-tools"></i>
              </div>
              <div className="ft-trust-text">
                <span className="ft-trust-title">Expert Tech Support</span>
                <span className="ft-trust-desc">College &amp; Lab Inquiries</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Main Footer Body */}
        <div className="ft-main-body">
          <div className="row g-4 g-lg-5">
            {/* Col 1: Brand Info & Socials */}
            <div className="col-12 col-lg-4">
              <Link to="/" className="ft-brand-logo" onClick={scrollToTop}>
                <img src={logo} alt="Softpro Innovation Logo" className="ft-logo-img" />
                <span className="ft-logo-text">
                  Softpro<span className="ft-logo-accent">Innovation</span>
                </span>
              </Link>
              <p className="ft-brand-desc">
                Your premier source for robotics, single board computers, intelligent telemetry sensors, and turnkey IoT innovation labs in India.
              </p>

              {/* Social Media Pill Buttons */}
              <div className="ft-social-row">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="ft-social-btn fb"
                  aria-label="Facebook"
                  title="Follow us on Facebook"
                >
                  <i className="bi bi-facebook"></i>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="ft-social-btn tw"
                  aria-label="Twitter X"
                  title="Follow us on Twitter X"
                >
                  <i className="bi bi-twitter-x"></i>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="ft-social-btn ig"
                  aria-label="Instagram"
                  title="Follow us on Instagram"
                >
                  <i className="bi bi-instagram"></i>
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="ft-social-btn yt"
                  aria-label="YouTube"
                  title="Watch our tutorials on YouTube"
                >
                  <i className="bi bi-youtube"></i>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="ft-social-btn li"
                  aria-label="LinkedIn"
                  title="Connect with us on LinkedIn"
                >
                  <i className="bi bi-linkedin"></i>
                </a>
              </div>
            </div>

            {/* Col 2: Quick Links (Accordion on phone, always open on desktop) */}
            <div className="col-12 col-md-4 col-lg-2 ft-col-block">
              <button
                type="button"
                className={`ft-accordion-header ${openSection === 'quick' ? 'active' : ''}`}
                onClick={() => toggleSection('quick')}
              >
                <span>Quick Links</span>
                <i className="bi bi-chevron-down ft-accordion-arrow"></i>
              </button>
              <div className={`ft-accordion-content ${openSection === 'quick' ? 'expanded' : 'collapsed'}`}>
                <ul className="ft-links-list">
                  <li>
                    <Link to="/" className="ft-link" onClick={scrollToTop}>
                      <i className="bi bi-chevron-right small text-muted"></i>
                      <span>Home</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="ft-link" onClick={scrollToTop}>
                      <i className="bi bi-chevron-right small text-muted"></i>
                      <span>About Us</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/Product" className="ft-link" onClick={scrollToTop}>
                      <i className="bi bi-chevron-right small text-muted"></i>
                      <span>All Products</span>
                      <span className="ft-link-badge">New</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="ft-link" onClick={scrollToTop}>
                      <i className="bi bi-chevron-right small text-muted"></i>
                      <span>Contact Us</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/cart" className="ft-link" onClick={scrollToTop}>
                      <i className="bi bi-chevron-right small text-muted"></i>
                      <span>Shopping Cart</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Col 3: Hardware Categories */}
            <div className="col-12 col-md-4 col-lg-2 ft-col-block">
              <button
                type="button"
                className={`ft-accordion-header ${openSection === 'cat' ? 'active' : ''}`}
                onClick={() => toggleSection('cat')}
              >
                <span>Categories</span>
                <i className="bi bi-chevron-down ft-accordion-arrow"></i>
              </button>
              <div className={`ft-accordion-content ${openSection === 'cat' ? 'expanded' : 'collapsed'}`}>
                <ul className="ft-links-list">
                  <li>
                    <Link to="/Product?category=Raspberry+Pi" className="ft-link" onClick={scrollToTop}>
                      <i className="bi bi-chevron-right small text-muted"></i>
                      <span>Raspberry Pi</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/Product?category=Microcontrollers" className="ft-link" onClick={scrollToTop}>
                      <i className="bi bi-chevron-right small text-muted"></i>
                      <span>Microcontrollers</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/Product?category=Sensors" className="ft-link" onClick={scrollToTop}>
                      <i className="bi bi-chevron-right small text-muted"></i>
                      <span>Sensors &amp; Telemetry</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/Product?category=IoT+KIT" className="ft-link" onClick={scrollToTop}>
                      <i className="bi bi-chevron-right small text-muted"></i>
                      <span>Turnkey IoT KITs</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/Product?category=Displays+%26+Indicators" className="ft-link" onClick={scrollToTop}>
                      <i className="bi bi-chevron-right small text-muted"></i>
                      <span>Displays &amp; Screen</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/Product?category=Actuators+%26+Motors" className="ft-link" onClick={scrollToTop}>
                      <i className="bi bi-chevron-right small text-muted"></i>
                      <span>Motors &amp; Actuators</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Col 4: Support & Policies */}
            <div className="col-12 col-md-4 col-lg-2 ft-col-block">
              <button
                type="button"
                className={`ft-accordion-header ${openSection === 'support' ? 'active' : ''}`}
                onClick={() => toggleSection('support')}
              >
                <span>Support &amp; Trust</span>
                <i className="bi bi-chevron-down ft-accordion-arrow"></i>
              </button>
              <div className={`ft-accordion-content ${openSection === 'support' ? 'expanded' : 'collapsed'}`}>
                <ul className="ft-links-list">
                  <li>
                    <Link to="/profile" className="ft-link" onClick={scrollToTop}>
                      <i className="bi bi-chevron-right small text-muted"></i>
                      <span>My Account / Orders</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/addresses" className="ft-link" onClick={scrollToTop}>
                      <i className="bi bi-chevron-right small text-muted"></i>
                      <span>Delivery Addresses</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="ft-link" onClick={scrollToTop}>
                      <i className="bi bi-chevron-right small text-muted"></i>
                      <span>Help &amp; Support</span>
                    </Link>
                  </li>
                  <li>
                    <a href="#privacy" className="ft-link" onClick={(e) => e.preventDefault()}>
                      <i className="bi bi-chevron-right small text-muted"></i>
                      <span>Privacy Policy</span>
                    </a>
                  </li>
                  <li>
                    <a href="#terms" className="ft-link" onClick={(e) => e.preventDefault()}>
                      <i className="bi bi-chevron-right small text-muted"></i>
                      <span>Terms &amp; Conditions</span>
                    </a>
                  </li>
                  <li>
                    <a href="#return" className="ft-link" onClick={(e) => e.preventDefault()}>
                      <i className="bi bi-chevron-right small text-muted"></i>
                      <span>Returns &amp; Refunds</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Col 5: Get In Touch (Direct Touch Actions on Phone) */}
            <div className="col-12 col-lg-2 ft-col-block">
              <button
                type="button"
                className={`ft-accordion-header ${openSection === 'contact' ? 'active' : ''}`}
                onClick={() => toggleSection('contact')}
              >
                <span>Get In Touch</span>
                <i className="bi bi-chevron-down ft-accordion-arrow"></i>
              </button>
              <div className={`ft-accordion-content ${openSection === 'contact' ? 'expanded' : 'collapsed'}`}>
                <div className="ft-contact-card">
                  {/* Quick Action Touch Buttons on Phone */}
                  <div className="ft-quick-touch-row">
                    <a href="tel:+917830198385" className="ft-touch-btn" title="Call Customer Care">
                      <i className="bi bi-telephone-fill"></i>
                      <span>Call Now</span>
                    </a>
                    <a
                      href="https://wa.me/917830198385"
                      target="_blank"
                      rel="noreferrer"
                      className="ft-touch-btn wa"
                      title="Chat on WhatsApp"
                    >
                      <i className="bi bi-whatsapp"></i>
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  {/* Contact Info List */}
                  <ul className="ft-contact-info-list">
                    <li className="ft-contact-item">
                      <i className="bi bi-geo-alt-fill text-primary"></i>
                      <div>
                        <strong className="text-white d-block">Softpro House</strong>
                        <span>3/213, Sec-J, Jankipuram, Lucknow - 226021</span>
                      </div>
                    </li>
                    <li className="ft-contact-item">
                      <i className="bi bi-envelope-fill text-primary"></i>
                      <a href="mailto:pushkar.softpro@gmail.com" className="ft-contact-link text-break">
                        pushkar.softpro@gmail.com
                      </a>
                    </li>
                    <li className="ft-contact-item">
                      <i className="bi bi-clock-fill text-primary"></i>
                      <span>Mon – Sat: 10:00 AM – 7:00 PM</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Bar: Payments & Copyright */}
        <div className="ft-bottom-bar">
          <p className="ft-copyright-text">
            &copy; {new Date().getFullYear()} <strong>SoftproInnovation</strong>. All rights reserved. &bull; Designed by Softpro India
          </p>

          {/* Payment Badges Strip */}
          <div className="ft-payment-strip">
            <span className="ft-pay-badge highlight">UPI</span>
            <span className="ft-pay-badge">RuPay</span>
            <span className="ft-pay-badge">VISA</span>
            <span className="ft-pay-badge">Mastercard</span>
            <span className="ft-pay-badge">NetBanking</span>
            <span className="ft-pay-badge">COD</span>
          </div>

          <button type="button" className="ft-back-to-top" onClick={scrollToTop} title="Back to top">
            <i className="bi bi-arrow-up"></i>
            <span>Top</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
