import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Swiper as SwiperReact, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { API_BASE_URL } from '../config/api';
import { formatImg } from '../utils/imageUrl';
import './CategorySwiper.css';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';

// Pristine assets tailored to category families
import imgCommunication from '../assets/cat-communication.png';
import imgMotors from '../assets/cat-motors.png';
import imgIndicators from '../assets/cat-indicators.png';
import imgSensors from '../assets/cat-sensors.png';
import imgMicrocontrollers from '../assets/cat-microcontrollers.png';
import imgPower from '../assets/cat-power.png';
import imgIot from '../assets/cat-iot.png';

const categoryAssetMap = {
  communication: imgCommunication,
  wireless: imgCommunication,
  bluetooth: imgCommunication,
  wifi: imgCommunication,
  gsm: imgCommunication,
  motor: imgMotors,
  actuator: imgMotors,
  indicator: imgIndicators,
  display: imgIndicators,
  screen: imgIndicators,
  oled: imgIndicators,
  lcd: imgIndicators,
  sensor: imgSensors,
  sensors: imgSensors,
  microcontroller: imgMicrocontrollers,
  mcu: imgMicrocontrollers,
  board: imgMicrocontrollers,
  arduino: imgMicrocontrollers,
  raspberry: imgMicrocontrollers,
  power: imgPower,
  battery: imgPower,
  supply: imgPower,
  iot: imgIot,
  kit: imgIot,
};

const getMatchedAsset = (catName) => {
  const n = (catName || '').toLowerCase();
  for (const [key, img] of Object.entries(categoryAssetMap)) {
    if (n.includes(key)) return img;
  }
  return imgMicrocontrollers;
};

// Clean display title matching the user design specification
const getCategoryDisplayTitle = (rawName) => {
  const n = (rawName || '').trim().toLowerCase();
  if (n.includes('communication') || n.includes('wireless')) return 'Communication Modules';
  if (n.includes('motor') || n.includes('actuator')) return 'Motors';
  if (n.includes('display') || n.includes('indicator')) return 'Indicators';
  if (n === 'sensor' || n === 'sensors') return 'Sensors';
  if (n.includes('microcontroller') || n.includes('development board')) return 'Microcontrollers';
  if (n.includes('power') || n.includes('battery')) return 'Power & Batteries';
  if (n.includes('iot') || n.includes('kit')) return 'IoT Kits';
  return rawName || 'Category';
};

// Rich curated descriptions matching the user reference screenshot
const getCategoryDescription = (rawName, customDesc) => {
  if (customDesc && !customDesc.toLowerCase().endsWith('- iot products') && customDesc.trim().length > 15) {
    return customDesc.trim();
  }
  const n = (rawName || '').trim().toLowerCase();
  if (n.includes('communication') || n.includes('wireless')) {
    return 'Wireless and wired modules for Bluetooth, Wi-Fi, GSM, GPS, and serial communication.';
  }
  if (n.includes('motor') || n.includes('actuator')) {
    return 'Motors and motor accessories for movement, rotation, robotics, and automation projects.';
  }
  if (n.includes('display') || n.includes('indicator') || n.includes('screen') || n.includes('oled') || n.includes('lcd')) {
    return 'Visual and audible components such as LEDs, buzzers, and signal indicators for project feedback.';
  }
  if (n.includes('sensor')) {
    return 'Components that detect temperature, motion, light, distance, sound, and other physical conditions.';
  }
  if (n.includes('microcontroller') || n.includes('mcu') || n.includes('board') || n.includes('development')) {
    return 'Compact programmable chips used to control electronic circuits and embedded projects.';
  }
  if (n.includes('power') || n.includes('battery')) {
    return 'Reliable power supplies, lithium batteries, regulators, and converters for electronic prototypes.';
  }
  if (n.includes('iot') || n.includes('kit')) {
    return 'Complete all-in-one prototyping kits and modular kits for robotics and connected IoT applications.';
  }
  return 'Curated electronic modules, components, and hardware essentials engineered for innovative projects.';
};

// Baseline order matching user's preferred layout
const initialCategories = [
  {
    _id: 'c1',
    category: 'Wireless & Communication Modules',
    image: imgCommunication,
    productCount: 10,
  },
  {
    _id: 'c2',
    category: 'Actuators & Motors',
    image: imgMotors,
    productCount: 16,
  },
  {
    _id: 'c3',
    category: 'Displays & Indicators',
    image: imgIndicators,
    productCount: 6,
  },
  {
    _id: 'c4',
    category: 'Sensor',
    image: imgSensors,
    productCount: 14,
  },
  {
    _id: 'c5',
    category: 'Microcontrollers & Development Boards',
    image: imgMicrocontrollers,
    productCount: 14,
  },
  {
    _id: 'c6',
    category: 'Power & Battery Components',
    image: imgPower,
    productCount: 12,
  },
  {
    _id: 'c7',
    category: 'IoT KIT',
    image: imgIot,
    productCount: 8,
  },
];

const Swiper = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(initialCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/category/show`);
        if (!isMounted) return;
        if (Array.isArray(res.data) && res.data.length > 0) {
          const activeCategories = res.data.filter(
            (cat) =>
              (!cat.status || cat.status.toLowerCase() === 'active') &&
              (cat.productCount === undefined || cat.productCount > 0)
          );
          if (activeCategories.length > 0) {
            // Sort to align with the visual showcase order (Communication -> Motors -> Indicators -> Sensors -> Microcontrollers...)
            const orderKeys = ['communication', 'wireless', 'motor', 'actuator', 'indicator', 'display', 'sensor', 'microcontroller', 'power', 'battery', 'iot'];
            const getOrderIndex = (name) => {
              const lower = (name || '').toLowerCase();
              const idx = orderKeys.findIndex((k) => lower.includes(k));
              return idx === -1 ? 99 : idx;
            };
            activeCategories.sort((a, b) => getOrderIndex(a.category) - getOrderIndex(b.category));
            setCategories(activeCategories);
          } else {
            setCategories(initialCategories);
          }
        } else {
          setCategories(initialCategories);
        }
      } catch {
        if (isMounted) setCategories(initialCategories);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCategoryClick = (rawCategoryName) => {
    if (rawCategoryName) {
      navigate(`/product?category=${encodeURIComponent(rawCategoryName)}`);
    }
  };

  // Ensure enough slides for a continuous seamless centered loop
  const slideList = categories.length > 0 && categories.length < 12
    ? [...categories, ...categories]
    : categories;
  return (
    <section className="category-swiper-section">
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-11 mx-auto overflow-hidden">
            <div className="container-fluid cat-swiper-outer">
              {/* Header Section */}
              <div className="cat-header-row mb-4 pb-2">
                <div>
                  <div className="cat-eyebrow">BROWSE BY TYPE</div>
                  <h2 className="cat-section-title mb-2">
                    Popular <span className="cat-accent-title">Categories</span>
                  </h2>
                  <p className="cat-section-desc mb-0">
                    Find exactly what your project needs from our curated electronics families.
                  </p>
                </div>

                {/* Navigation Controls (< >) */}
                <div className="cat-nav-controls mt-3 mt-md-0">
                  <button
                    type="button"
                    className="cat-nav-btn swiper-cat-prev"
                    aria-label="Previous Categories"
                    title="Previous"
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <button
                    type="button"
                    className="cat-nav-btn swiper-cat-next"
                    aria-label="Next Categories"
                    title="Next"
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>

              {/* Loading Spinner */}
              {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <div className="spinner-border text-primary me-3" role="status"></div>
                  <span className="text-secondary fw-semibold">Loading component categories...</span>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-5 bg-white rounded-4 border">
                  <i className="bi bi-folder2-open fs-1 text-muted d-block mb-2"></i>
                  <h6 className="text-dark fw-bold mb-1">No Categories Found</h6>
                  <p className="small text-secondary mb-0">
                    Active categories added from the dashboard will appear here.
                  </p>
                </div>
              ) : (
                <div className="cat-swiper-wrapper">
                  <SwiperReact
                    key={`cat-swiper-centered-${slideList.length}`}
                    modules={[Navigation, Autoplay]}
                    centeredSlides={true}
                    centeredSlidesBounds={false}
                    initialSlide={2}
                    loop={true}
                    speed={650}
                    autoplay={{
                      delay: 3200,
                      disableOnInteraction: false,
                      pauseOnMouseEnter: true,
                    }}
                    navigation={{
                      prevEl: '.swiper-cat-prev',
                      nextEl: '.swiper-cat-next',
                    }}
                    breakpoints={{
                      320: {
                        slidesPerView: 1.3,
                        spaceBetween: 14,
                      },
                      480: {
                        slidesPerView: 1.8,
                        spaceBetween: 16,
                      },
                      640: {
                        slidesPerView: 2.6,
                        spaceBetween: 18,
                      },
                      860: {
                        slidesPerView: 3.4,
                        spaceBetween: 20,
                      },
                      1140: {
                        slidesPerView: 4.4,
                        spaceBetween: 22,
                      },
                      1440: {
                        slidesPerView: 5.4,
                        spaceBetween: 24,
                      },
                    }}
                    className="category-swiper"
                  >
                    {slideList.map((cat, index) => {
                      const rawName = cat.category || cat.name || 'Category';
                      const displayTitle = getCategoryDisplayTitle(rawName);
                      const description = getCategoryDescription(rawName, cat.description);
                      const fallbackAsset = getMatchedAsset(rawName);
                      const imageUrl = cat.image && typeof cat.image === 'string' && cat.image.trim()
                        ? formatImg(cat.image, fallbackAsset)
                        : fallbackAsset;

                      return (
                        <SwiperSlide key={`${cat._id || cat.id || 'cat'}-${index}`}>
                          <div
                            className="cat-card w-100"
                            onClick={() => handleCategoryClick(rawName)}
                            title={`Explore ${displayTitle}`}
                          >
                            {/* Centered Circular Halo Stage */}
                            <div className="cat-halo-stage">
                              <img
                                src={imageUrl}
                                alt={displayTitle}
                                className="cat-image"
                                loading="lazy"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = fallbackAsset;
                                }}
                              />
                            </div>

                            {/* Category Title */}
                            <h3 className="cat-title">{displayTitle}</h3>

                            {/* Curated Description */}
                            <p className="cat-desc">{description}</p>

                            {/* Centered Action Link */}
                            <div className="cat-explore-link">
                              Explore products
                              <i className="bi bi-chevron-right ms-1"></i>
                            </div>
                          </div>
                        </SwiperSlide>
                      );
                    })}
                  </SwiperReact>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Swiper;
