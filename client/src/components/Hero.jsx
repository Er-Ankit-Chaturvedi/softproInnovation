import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import bannerImg from "../assets/banner1Img.jpeg";
import banner2Img from "../assets/banner2Img.jpeg";
import banner3Img from "../assets/banner3Img.jpeg";

const slides = [
  {
    id: 0,
    badge: "ARDUINO CORNER",
    title: (
      <>
        Arduino Boards<br />
        For Every <span className="hero-accent-text">Maker</span>
      </>
    ),
    text: "UNO, Mega, Nano, Leonardo and the all-new R4 series. Pick your perfect development platform.",
    btn1Text: "Browse Arduino",
    btn1Link: "/Product?category=microcontrollers",
    btn2Text: "Project Ideas",
    btn2Link: "/Product",
    bgImg: bannerImg,
  },
  {
    id: 1,
    badge: "ROBOTICS & AUTOMATION",
    title: (
      <>
        Build Amazing Robots<br />
        With <span className="hero-accent-text">Advanced</span> Motors
      </>
    ),
    text: "DC Motors, Servo Motors, Stepper Motors and Motor Drivers. Everything you need for your robotics projects.",
    btn1Text: "Shop Motors",
    btn1Link: "/Product?category=motors",
    btn2Text: "Guides",
    btn2Link: "/Product",
    bgImg: banner2Img,
  },
  {
    id: 2,
    badge: "ESSENTIAL SENSORS & MODULES",
    title: (
      <>
        Smart Sensors<br />
        <span className="hero-accent-text">For IoT</span> Inventions
      </>
    ),
    text: "From ultrasonic to LiDAR, climate, and motion sensors for robotics, automation, and AI.",
    btn1Text: "Explore Sensors",
    btn1Link: "/Product?category=sensors",
    btn2Text: "Tutorials",
    btn2Link: "/Product",
    bgImg: banner3Img,
  },
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 45;

  // Auto-play interval for smooth slide transition
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
  };

  return (
    <div
      id="heroCarousel"
      className="carousel slide carousel-fade position-relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="carousel-inner position-relative">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`carousel-item ${index === currentSlide ? 'active' : ''}`}
            style={{
              display: index === currentSlide ? 'block' : 'none',
              transition: 'opacity 0.6s ease-in-out',
            }}
          >
            <div
              className="hero-slide d-flex align-items-center"
              style={{ backgroundImage: `url(${slide.bgImg})` }}
            >
              <div className="hero-overlay"></div>
              <div className="container position-relative py-4 py-md-5 hero-content-container">
                <div className="row justify-content-center justify-content-lg-start">
                  <div className="col-12 col-md-10 col-lg-7">
                    <div className="hero-content text-center text-lg-start">
                      <span className="badge-new">{slide.badge}</span>
                      <h1 className="hero-heading text-white fw-bold">
                        {slide.title}
                      </h1>
                      <p className="hero-text mx-auto mx-lg-0">{slide.text}</p>
                      <div className="hero-btn-group d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start">
                        <Link to={slide.btn1Link || "/Product"} className="btn btn-hero-primary">
                          {slide.btn1Text}
                          <i className="bi bi-arrow-right ms-2"></i>
                        </Link>
                        <Link to={slide.btn2Link || "/Product"} className="btn btn-hero-secondary">
                          {slide.btn2Text}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Bottom Controls Bar (Centered on Mobile) */}
        <div className="hero-bottom-controls">
          <div className="hero-controls-inner d-flex align-items-center justify-content-center gap-2 gap-sm-3">
            <button
              type="button"
              className="hero-mobile-arrow-btn d-flex d-md-none"
              onClick={handlePrev}
              aria-label="Previous Slide"
            >
              <i className="bi bi-chevron-left"></i>
            </button>

            <div className="carousel-indicators">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`hero-indicator-pill ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Slide ${index + 1}`}
                ></button>
              ))}
            </div>

            <button
              type="button"
              className="hero-mobile-arrow-btn d-flex d-md-none"
              onClick={handleNext}
              aria-label="Next Slide"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Prev Navigation Arrow (Hidden on Mobile < 768px so it never overlaps text) */}
      <button
        className="carousel-control-prev d-none d-md-flex"
        type="button"
        onClick={handlePrev}
        aria-label="Previous Slide"
      >
        <span className="hero-arrow">
          <i className="bi bi-chevron-left"></i>
        </span>
      </button>

      {/* Desktop Next Navigation Arrow (Hidden on Mobile < 768px so it never overlaps text) */}
      <button
        className="carousel-control-next d-none d-md-flex"
        type="button"
        onClick={handleNext}
        aria-label="Next Slide"
      >
        <span className="hero-arrow">
          <i className="bi bi-chevron-right"></i>
        </span>
      </button>

      {/* Bottom Stats Bar */}
      <div
        className="stats-bar position-relative"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg width=\\'20\\' height=\\'20\\' viewBox=\\'0 0 20 20\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cpath d=\\'M9 9H5V11H9V15H11V11H15V9H11V5H9V9Z\\' fill=\\'rgba(255, 255, 255, 0.05)\\' /%3E%3C/svg%3E')",
        }}
      >
        <div className="row text-center g-0">
          <div className="col-6 col-md-3 stat-item border-end border-white border-opacity-25 py-2">
            <h2>5,000+</h2>
            <p>Products in Stock</p>
          </div>
          <div className="col-6 col-md-3 stat-item border-end border-white border-opacity-25 py-2">
            <h2>98%</h2>
            <p>Customer Satisfaction</p>
          </div>
          <div className="col-6 col-md-3 stat-item border-end border-white border-opacity-25 py-2">
            <h2>24hr</h2>
            <p>Dispatch Guarantee</p>
          </div>
          <div className="col-6 col-md-3 stat-item py-2">
            <h2>50,000+</h2>
            <p>Orders Delivered</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;