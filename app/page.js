'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '@/components/Layout';
import menuData from '@/data/menu.json';
import { motion, AnimatePresence } from 'framer-motion';

// ==================== BRAND CONFIGURATION ====================
const BRAND_CONFIG = {
  brandName: "Damascus House",
  brandNameAr: "",

  colors: {
    primary: '#ab2230',
    secondary: '#eea644',
    contrast: '#ffffff',
    accent: '#000000',
    white: '#FFFFFF',
    black: '#1A1A1A',
    gray: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717'
    }
  },

  features: {
    enableHeroImage: false,
    enableLanguageSwitcher: true,
    enableSearch: true,
    enablePriceSorting: true,
    enableCart: true,
    enableWhatsAppOrder: true,
    enableItemModal: true,
    enableDragScroll: false,
    enableBranchSelection: false,
    enableProductOptions: true,
  },

  branches: [
    {
      id: 'main',
      name: 'Main Branch',
      nameAr: '',
      whatsappNumber: '+254123456789',
      address: 'Nairobi CBD, Kenya'
    }
  ],
  defaultBranch: 'main',

  languages: {
    en: { code: 'en', name: 'English', dir: 'ltr' },
    ar: { code: 'ع', name: 'العربية', dir: 'rtl' }
  },
  defaultLanguage: 'en',

  currency: {
    code: 'Ksh',
    symbol: 'Ksh',
    symbolEn: 'Ksh',
    format: 'en-KE'
  },

  contact: {
    whatsappNumber: "+254123456789",
    whatsappMessage: {
      en: "Hello! I'd like to place an order from",
      ar: "مرحباً! أود تقديم طلب من"
    }
  },

  images: {
    heroPath: '/images/hero/',
    itemPath: '/images/',
    defaultHero: 'trays.png'
  },

  layout: {
    itemsPerRow: 3,
    showItemImages: true,
    showItemDescription: true,
    showQuantitySelector: true,
    stickyCategories: true,
  },

  footer: {
    copyrightText: {
      en: "All rights reserved.",
      ar: "جميع الحقوق محفوظة."
    },
    developedBy: {
      en: "Developed by Esto Solutions",
      ar: "مطور بواسطة إستو للحلول"
    },
    showBrandName: true
  },

  animations: {
    enableAnimations: true,
    animationSpeed: 0.3,
    staggerDelay: 0.1
  }
};

// ==================== HELPER FUNCTIONS ====================
const formatPrice = (price, language = BRAND_CONFIG.defaultLanguage) => {
  const { currency } = BRAND_CONFIG;

  if (price === null || price === undefined || price === '') {
    return language === 'en'
      ? `${currency.symbolEn} 0`
      : `${currency.symbol} 0`;
  }

  if (Array.isArray(price)) {
    if (price.length === 0) {
      return language === 'en'
        ? `${currency.symbolEn} 0`
        : `${currency.symbol} 0`;
    }

    const minPrice = Math.min(...price);
    const maxPrice = Math.max(...price);

    if (minPrice === maxPrice) {
      return language === 'en'
        ? `${currency.symbolEn} ${minPrice.toLocaleString(currency.format)}`
        : `${currency.symbol} ${minPrice.toLocaleString(currency.format)}`;
    } else {
      return language === 'en'
        ? `${currency.symbolEn} ${minPrice.toLocaleString(currency.format)} - ${maxPrice.toLocaleString(currency.format)}`
        : `${currency.symbol} ${minPrice.toLocaleString(currency.format)} - ${maxPrice.toLocaleString(currency.format)}`;
    }
  }

  return language === 'en'
    ? `${currency.symbolEn} ${price.toLocaleString(currency.format)}`
    : `${currency.symbol} ${price.toLocaleString(currency.format)}`;
};

const getText = (item, field, language) => {
  if (!item) return '';
  if (language === 'ar') {
    return item[`${field}_ar`] || item[field] || '';
  }
  return item[field] || '';
};

const getCartItemId = (item, selectedOption = null) => {
  if (!item) return '';
  if (selectedOption && selectedOption.name) {
    return `${item.name}_${selectedOption.name}`;
  }
  return item.name;
};

const getItemPrice = (item, selectedOption = null) => {
  if (!item) return 0;

  if (selectedOption && item.options) {
    const option = item.options.find(opt => opt.name === selectedOption.name);
    if (option) {
      return option.price;
    }
  }

  if (Array.isArray(item.price)) {
    return item.price[0] || 0;
  }

  return item.price || 0;
};

const getItemDisplayName = (item, selectedOption = null, language) => {
  const baseName = getText(item, 'name', language);

  if (selectedOption && item.options) {
    const optionText = getText(selectedOption, 'name', language);
    return `${baseName} (${optionText})`;
  }

  return baseName;
};

// ==================== MAIN COMPONENT ====================
export default function MenuPage() {
  const {
    colors,
    features,
    languages,
    defaultLanguage,
    currency,
    contact,
    images,
    layout,
    footer,
    animations
  } = BRAND_CONFIG;

  // State management
  const [activeCategory, setActiveCategory] = useState(Object.keys(menuData)[0] || 'trays');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemOption, setSelectedItemOption] = useState(null);
  const [isSticky, setIsSticky] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceSort, setPriceSort] = useState('default');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [language, setLanguage] = useState(defaultLanguage);
  const [itemOptions, setItemOptions] = useState({});

  // NEW: Check if order mode is enabled via query parameter
  const [isOrderMode, setIsOrderMode] = useState(false);

  // Refs
  const categoriesRef = useRef(null);
  const categoryScrollRef = useRef(null);
  const categorySectionsRef = useRef({});
  const observerRef = useRef(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // Get category order
  const categoryOrder = Object.keys(menuData);

  // Check for order mode on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsOrderMode(params.get('order') === 'true');
  }, []);

  // Set document language only
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Initialize auto-selected options for items with options
  useEffect(() => {
    if (features.enableProductOptions) {
      const initialOptions = {};
      Object.keys(menuData).forEach(categoryId => {
        const categoryData = menuData[categoryId];
        if (categoryData && categoryData.items) {
          categoryData.items.forEach(item => {
            if (item.options && item.options.length > 0) {
              initialOptions[item.name] = item.options[0];
            }
          });
        }
      });
      setItemOptions(initialOptions);
    }
  }, [features.enableProductOptions]);

  // Sticky navigation effect
  useEffect(() => {
    if (layout.stickyCategories) {
      const handleScroll = () => {
        if (categoriesRef.current) {
          const rect = categoriesRef.current.getBoundingClientRect();
          setIsSticky(rect.top <= 0);
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [layout.stickyCategories]);

  // Close modals on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (isItemModalOpen) setIsItemModalOpen(false);
        if (isCartOpen) setIsCartOpen(false);
      }
    };

    if (isItemModalOpen || isCartOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isItemModalOpen, isCartOpen]);

  // NEW: Intersection Observer to detect which category is currently in view
  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the most visible category
        let mostVisibleEntry = null;
        let highestIntersection = 0;

        entries.forEach(entry => {
          if (entry.intersectionRatio > highestIntersection) {
            highestIntersection = entry.intersectionRatio;
            mostVisibleEntry = entry;
          }
        });

        // Update active category if we found one with significant visibility
        if (mostVisibleEntry && highestIntersection > 0.3 && !isScrollingRef.current) {
          const categoryId = mostVisibleEntry.target.dataset.categoryId;
          if (categoryId && categoryId !== activeCategory) {
            setActiveCategory(categoryId);
          }
        }
      },
      {
        threshold: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: '-100px 0px -100px 0px' // Buffer to trigger before category fully enters view
      }
    );

    // Observe all category sections
    Object.values(categorySectionsRef.current).forEach(section => {
      if (section) {
        observerRef.current.observe(section);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [activeCategory]);

  // NEW: Scroll active category into view (horizontal)
  useEffect(() => {
    if (!categoryScrollRef.current) return;

    const activeButton = categoryScrollRef.current.querySelector(`[data-category-id="${activeCategory}"]`);
    if (!activeButton) return;

    const container = categoryScrollRef.current;
    const buttonRect = activeButton.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Check if button is not fully visible
    if (buttonRect.left < containerRect.left || buttonRect.right > containerRect.right) {
      const scrollLeft = activeButton.offsetLeft - (container.offsetWidth / 2) + (activeButton.offsetWidth / 2);

      // Use smooth scroll for better UX
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [activeCategory]);

  // NEW: Smooth scroll to category when clicking on tab
  const scrollToCategory = useCallback((categoryId) => {
    const section = categorySectionsRef.current[categoryId];
    if (!section) return;

    isScrollingRef.current = true;
    setActiveCategory(categoryId);

    // Calculate position with offset for sticky header
    const headerOffset = categoriesRef.current ? categoriesRef.current.offsetHeight + 20 : 80;
    const elementPosition = section.offsetTop;
    const offsetPosition = elementPosition - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });

    // Reset scrolling flag
    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 500);
  }, []);

  // Filter and sort items for a specific category
  const getFilteredAndSortedItems = useCallback((categoryId) => {
    const categoryData = menuData[categoryId];
    if (!categoryData || !categoryData.items) return [];

    let items = [...categoryData.items];

    if (features.enableSearch && searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name?.toLowerCase().includes(query) ||
        (item.name_ar && item.name_ar.includes(searchQuery)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.description_ar && item.description_ar.includes(searchQuery))
      );
    }

    if (features.enablePriceSorting) {
      if (priceSort === 'low-high') {
        items = items.sort((a, b) => {
          const priceA = Array.isArray(a.price) ? Math.min(...a.price) : (a.price || 0);
          const priceB = Array.isArray(b.price) ? Math.min(...b.price) : (b.price || 0);
          return priceA - priceB;
        });
      } else if (priceSort === 'high-low') {
        items = items.sort((a, b) => {
          const priceA = Array.isArray(a.price) ? Math.max(...a.price) : (a.price || 0);
          const priceB = Array.isArray(b.price) ? Math.max(...b.price) : (b.price || 0);
          return priceB - priceA;
        });
      }
    }

    return items;
  }, [searchQuery, priceSort, features]);

  // Handle item option selection
  const handleOptionSelect = (itemName, option) => {
    setItemOptions(prev => ({
      ...prev,
      [itemName]: option
    }));
  };

  // Get selected option for an item
  const getSelectedOption = (itemName) => {
    return itemOptions[itemName] || null;
  };

  // Cart functions (only if order mode is enabled)
  const addToCart = (item, quantity = 1, selectedOption = null) => {
    if (!features.enableCart || !item || !isOrderMode) return;

    const cartPrice = getItemPrice(item, selectedOption);
    const cartItemId = getCartItemId(item, selectedOption);

    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === cartItemId);
      if (existing) {
        return prev.map(cartItem =>
          cartItem.id === cartItemId
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      }
      return [...prev, {
        ...item,
        id: cartItemId,
        price: cartPrice,
        quantity,
        selectedOption,
        displayName: getItemDisplayName(item, selectedOption, language)
      }];
    });

    if (selectedOption) {
      setItemOptions(prev => ({
        ...prev,
        [item.name]: selectedOption
      }));
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (!isOrderMode) return;
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (itemId) => {
    if (!isOrderMode) return;
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    if (!isOrderMode) return;
    setCart([]);
    setOrderNotes('');
  };

  const getTotalItems = () => cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const getTotalPrice = () => cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

  // Function to open item modal
  const handleItemClick = (item) => {
    if (!item || !features.enableItemModal) return;
    setSelectedItem(item);
    const currentOption = getSelectedOption(item.name);
    setSelectedItemOption(currentOption);
    setIsItemModalOpen(true);
  };

  // Animation variants
  const cardVariants = animations.enableAnimations ? {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: animations.animationSpeed
      }
    }
  } : {};

  // Calculate grid columns based on configuration
  const gridColumns = `repeat(auto-fill, minmax(${layout.itemsPerRow === 3 ? '300px' : layout.itemsPerRow === 2 ? '400px' : '250px'}, 1fr))`;

  return (
    <Layout>
      {/* Language Switcher */}
      {features.enableLanguageSwitcher && (
        <div lang='ltr' style={languageSwitcherStyles}>
          {Object.entries(languages).map(([langCode, langData]) => (
            <button
              key={langCode}
              onClick={() => setLanguage(langCode)}
              style={{
                ...languageButtonStyles,
                ...(language === langCode ? { display: 'none' } : activeLanguageButtonStyles)
              }}
            >
              {langData.code.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Search and Filter Bar */}
      {(features.enableSearch || features.enablePriceSorting) && (
        <div style={searchContainerStyles}>
          {features.enableSearch && (
            <div style={searchBarStyles}>
              <input
                type="text"
                placeholder={language === 'en' ? "Search dishes..." : "ابحث في الأطباق..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  ...searchInputStyles,
                  textAlign: language === 'ar' ? 'right' : 'left',
                  paddingLeft: language === 'ar' ? '2.5rem' : '3rem',
                  paddingRight: language === 'ar' ? '3rem' : '2.5rem',
                }}
              />
              <svg style={{
                ...searchIconStyles,
                left: language === 'ar' ? 'auto' : '1rem',
                right: language === 'ar' ? '1rem' : 'auto',
                transform: 'translateY(-50%)'
              }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}

          {features.enablePriceSorting && (
            <div style={customDropdownStyles}>
              <select
                value={priceSort}
                onChange={(e) => setPriceSort(e.target.value)}
                style={{
                  ...customSelectStyles,
                  textAlign: language === 'ar' ? 'right' : 'left',
                }}
              >
                <option value="default">{language === 'en' ? 'Sort by Price' : 'ترتيب حسب السعر'}</option>
                <option value="low-high">{language === 'en' ? 'Price: Low to High' : 'السعر: من الأقل للأعلى'}</option>
                <option value="high-low">{language === 'en' ? 'Price: High to Low' : 'السعر: من الأعلى للأقل'}</option>
              </select>
              <div style={{
                ...dropdownArrowStyles,
                left: language === 'ar' ? '0.75rem' : 'auto',
                right: language === 'ar' ? 'auto' : '0.75rem'
              }}>▼</div>
            </div>
          )}
        </div>
      )}

      {/* Sticky Categories Navigation */}
      <div
        ref={categoriesRef}
        className={`sticky-categories ${isSticky ? 'sticky' : ''}`}
        style={stickyContainerStyles}
      >
        <div
          ref={categoryScrollRef}
          className="category-scroll-container"
          style={categoryListStyles}
        >
          {Object.keys(menuData).map((categoryId) => (
            <button
              key={categoryId}
              data-category-id={categoryId}
              style={{
                ...categoryButtonStyles,
                ...(activeCategory === categoryId ? selectedCategoryStyle : {})
              }}
              onClick={() => scrollToCategory(categoryId)}
              className="category-btn"
            >
              <span style={{
                display: 'block',
                textAlign: language === 'ar' ? 'right' : 'center'
              }}>
                {getText(menuData[categoryId], 'name', language)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content - Infinite Scroll All Categories */}
      <div style={contentStyles}>
        {Object.keys(menuData).map((categoryId) => {
          const filteredItems = getFilteredAndSortedItems(categoryId);

          // Don't render empty categories when searching
          if (features.enableSearch && searchQuery && filteredItems.length === 0) {
            return null;
          }

          return (
            <section
              key={categoryId}
              ref={(el) => categorySectionsRef.current[categoryId] = el}
              data-category-id={categoryId}
              style={categorySectionStyles}
            >
              {/* Category Header */}
              <motion.h2
                style={{
                  ...categoryTitleStyles,
                  textAlign: "center"
                }}
                initial={animations.enableAnimations ? { opacity: 0, y: -20 } : {}}
                animate={animations.enableAnimations ? { opacity: 1, y: 0 } : {}}
                transition={animations.enableAnimations ? { duration: animations.animationSpeed } : {}}
              >
                {getText(menuData[categoryId], 'name', language)}
              </motion.h2>

              {/* Menu Items Grid */}
              {filteredItems.length > 0 ? (
                <motion.div
                  style={{
                    ...gridStyles,
                    gridTemplateColumns: gridColumns
                  }}
                  initial={animations.enableAnimations ? { opacity: 0 } : {}}
                  animate={animations.enableAnimations ? { opacity: 1 } : {}}
                  transition={animations.enableAnimations ? { duration: animations.animationSpeed * 2 } : {}}
                >
                  {filteredItems.map((item, index) => {
                    if (!item) return null;

                    const selectedOption = getSelectedOption(item.name);
                    const itemPrice = getItemPrice(item, selectedOption);
                    const cartItemId = getCartItemId(item, selectedOption);
                    const cartQuantity = cart.find(ci => ci.id === cartItemId)?.quantity || 0;

                    return (
                      <motion.div
                        key={item.name || index}
                        style={gridItemStyles}
                        className="menu-item-card"
                        variants={cardVariants}
                        initial={animations.enableAnimations ? "hidden" : {}}
                        animate={animations.enableAnimations ? "visible" : {}}
                        transition={animations.enableAnimations ? { delay: index * animations.staggerDelay } : {}}
                        whileHover={animations.enableAnimations ? {
                          y: -8,
                          transition: { duration: 0.2 }
                        } : {}}
                        onClick={() => handleItemClick(item)}
                      >
                        {/* Image */}
                        {layout.showItemImages && item.image && (
                          <div style={imageContainerStyles}>
                            <img
                              src={`${images.itemPath}${categoryId}/${item.image}`}
                              alt={getText(item, 'name', language)}
                              style={imageStyles}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}

                        <div style={contentContainerStyles}>
                          <div style={titleContainerStyles}>
                            <h3 style={{
                              ...itemNameStyles,
                              textAlign: language === 'ar' ? 'right' : 'left'
                            }}>
                              {getText(item, 'name', language)}
                              {selectedOption && (
                                <span style={optionBadgeStyles}>
                                  {selectedOption.name}
                                </span>
                              )}
                            </h3>
                          </div>

                          {layout.showItemDescription && (
                            <p style={{
                              ...itemDescriptionStyles,
                              textAlign: language === 'ar' ? 'right' : 'left'
                            }}>
                              {getText(item, 'description', language)}
                            </p>
                          )}

                          {/* Product Options - Only in order mode */}
                          {isOrderMode && features.enableProductOptions && item.options && item.options.length > 0 && (
                            <div style={optionsContainerStyles}>
                              <div style={{
                                ...optionsLabelStyles,
                                textAlign: language === 'ar' ? 'right' : 'left'
                              }}>
                                {language === 'en' ? 'Select option:' : 'اختر الخيار:'}
                              </div>
                              <div style={optionsListStyles}>
                                {item.options.map((option) => (
                                  <button
                                    key={option.name}
                                    style={{
                                      ...optionButtonStyles,
                                      ...(selectedOption?.name === option.name ? selectedOptionStyle : {})
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOptionSelect(item.name, option);
                                    }}
                                  >
                                    <span style={{
                                      textAlign: language === 'ar' ? 'right' : 'left',
                                      flex: 1
                                    }}>
                                      {getText(option, 'name', language)}
                                    </span>
                                    <span style={optionPriceStyles}>
                                      +{currency.symbolEn} {option.price.toLocaleString(currency.format)}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={priceCartContainerStyles}>
                            <p style={{
                              ...priceStyles,
                              textAlign: language === 'ar' ? 'right' : 'left'
                            }}>
                              {formatPrice(itemPrice, language)}
                            </p>

                            {/* Quantity Selector - Only in order mode */}
                            {isOrderMode && layout.showQuantitySelector && features.enableCart && (
                              <div style={quantitySelectorStyles}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (cartQuantity > 0) {
                                      updateQuantity(cartItemId, cartQuantity - 1);
                                    }
                                  }}
                                  style={quantityButtonStyles}
                                >
                                  -
                                </button>
                                <span style={quantityDisplayStyles}>
                                  {cartQuantity}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(item, 1, selectedOption);
                                  }}
                                  style={quantityButtonStyles}
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                /* No results message for this category (only shown when searching) */
                features.enableSearch && searchQuery && (
                  <div style={categoryNoResultsStyles}>
                    <p style={{ textAlign: language === 'ar' ? 'right' : 'center' }}>
                      {language === 'en' ? 'No dishes found in this category.' : 'لم يتم العثور على أطباق في هذه الفئة.'}
                    </p>
                  </div>
                )
              )}
            </section>
          );
        })}

        {/* Global no results message */}
        {features.enableSearch && searchQuery && Object.keys(menuData).every(categoryId => {
          const filteredItems = getFilteredAndSortedItems(categoryId);
          return filteredItems.length === 0;
        }) && (
            <div style={globalNoResultsStyles}>
              <p style={{ textAlign: language === 'ar' ? 'right' : 'center' }}>
                {language === 'en' ? 'No dishes found matching your search in any category.' : 'لم يتم العثور على أطباق تطابق بحثك في أي فئة.'}
              </p>
            </div>
          )}
      </div>

      {/* Proceed to Order Button - Only in order mode */}
      {isOrderMode && features.enableCart && getTotalItems() > 0 && (
        <motion.button
          onClick={() => setIsCartOpen(true)}
          style={proceedButtonStyles}
          className="proceed-order-btn"
        >
          <span style={proceedButtonTextStyles}>
            {language === 'en' ? 'Proceed to Order' : 'المتابعة للطلب'}
          </span>
          <span style={proceedButtonBadgeStyles}>
            {getTotalItems()} • {language === 'en' ? currency.symbolEn : currency.symbol} {getTotalPrice().toLocaleString(currency.format)}
          </span>
        </motion.button>
      )}

      {/* Order Summary Modal - Only in order mode */}
      <AnimatePresence>
        {isOrderMode && isCartOpen && features.enableCart && (
          <motion.div
            style={modalOverlayStyles}
            initial={animations.enableAnimations ? { opacity: 0 } : {}}
            animate={animations.enableAnimations ? { opacity: 1 } : {}}
            exit={animations.enableAnimations ? { opacity: 0 } : {}}
          >
            <motion.div
              style={glassBackdropStyles}
              initial={animations.enableAnimations ? { opacity: 0 } : {}}
              animate={animations.enableAnimations ? { opacity: 1 } : {}}
              exit={animations.enableAnimations ? { opacity: 0 } : {}}
              onClick={() => setIsCartOpen(false)}
            />

            <motion.div
              style={modalContainerStyles}
              initial={animations.enableAnimations ? {
                scale: 0.8,
                opacity: 0,
                y: 20
              } : {}}
              animate={animations.enableAnimations ? {
                scale: 1,
                opacity: 1,
                y: 0
              } : {}}
              exit={animations.enableAnimations ? {
                scale: 0.8,
                opacity: 0,
                y: 20
              } : {}}
              transition={animations.enableAnimations ? {
                type: "spring",
                damping: 25,
                stiffness: 300
              } : {}}
            >
              <div style={modalContentStyles}>
                <div style={cartHeaderStyles}>
                  <motion.h2
                    style={{
                      ...cartTitleStyles,
                      textAlign: language === 'ar' ? 'right' : 'left'
                    }}
                    initial={animations.enableAnimations ? { y: -20, opacity: 0 } : {}}
                    animate={animations.enableAnimations ? { y: 0, opacity: 1 } : {}}
                    transition={animations.enableAnimations ? { delay: animations.staggerDelay * 2 } : {}}
                  >
                    {language === 'en' ? 'Your Order' : 'طلبك'}
                  </motion.h2>

                  {cart.length > 0 && (
                    <motion.button
                      onClick={clearCart}
                      style={clearCartButtonStyles}
                      initial={animations.enableAnimations ? { opacity: 0 } : {}}
                      animate={animations.enableAnimations ? { opacity: 1 } : {}}
                      transition={animations.enableAnimations ? { delay: animations.staggerDelay * 3 } : {}}
                    >
                      {language === 'en' ? 'Clear All' : 'مسح الكل'}
                    </motion.button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <motion.div
                    style={emptyCartStyles}
                    initial={animations.enableAnimations ? { opacity: 0, scale: 0.8 } : {}}
                    animate={animations.enableAnimations ? { opacity: 1, scale: 1 } : {}}
                    transition={animations.enableAnimations ? { delay: animations.staggerDelay * 3 } : {}}
                  >

                    <p style={{ textAlign: 'center' }}>{language === 'en' ? 'No items in your order' : 'لا توجد عناصر في طلبك'}</p>
                  </motion.div>
                ) : (
                  <>
                    <div style={cartItemsContainerStyles}>
                      {cart.map((item, index) => (
                        <motion.div
                          key={item.id}
                          style={cartItemContainerStyles}
                          initial={animations.enableAnimations ? { opacity: 0, x: -20 } : {}}
                          animate={animations.enableAnimations ? { opacity: 1, x: 0 } : {}}
                          transition={animations.enableAnimations ? { delay: index * animations.staggerDelay } : {}}
                        >
                          <div style={cartItemContentStyles}>
                            <div style={cartItemHeaderStyles}>
                              <h4 style={{
                                ...cartItemNameStyles,
                                textAlign: language === 'ar' ? 'right' : 'left'
                              }}>
                                {item.displayName || (language === 'ar' && item.name_ar ? item.name_ar : item.name)}
                                {item.selectedOption && (
                                  <span style={cartItemOptionStyles}>
                                    ({getText(item.selectedOption, 'name', language)})
                                  </span>
                                )}
                              </h4>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                style={cartRemoveButtonStyles}
                              >
                                ×
                              </button>
                            </div>
                            <div style={cartItemDetailsStyles}>
                              <span style={{
                                ...cartItemPriceStyles,
                                textAlign: language === 'ar' ? 'right' : 'left'
                              }}>
                                {language === 'en' ? currency.symbolEn : currency.symbol} {item.price.toLocaleString(currency.format)} {language === 'en' ? 'each' : 'للقطعة'}
                              </span>
                              <div style={cartItemControlsStyles}>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  style={cartQuantityButtonStyles}
                                >
                                  −
                                </button>
                                <span style={cartQuantityStyles}>{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  style={cartQuantityButtonStyles}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div style={{
                              ...cartItemTotalStyles,
                              textAlign: language === 'ar' ? 'right' : 'left'
                            }}>
                              {language === 'en' ? 'Total' : 'المجموع'}: <strong>{language === 'en' ? currency.symbolEn : currency.symbol} {((item.price || 0) * (item.quantity || 0)).toLocaleString(currency.format)}</strong>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div
                      style={orderNotesContainerStyles}
                      initial={animations.enableAnimations ? { opacity: 0 } : {}}
                      animate={animations.enableAnimations ? { opacity: 1 } : {}}
                      transition={animations.enableAnimations ? { delay: animations.staggerDelay * 4 } : {}}
                    >
                      <label style={{
                        ...orderNotesLabelStyles,
                        textAlign: language === 'ar' ? 'right' : 'left'
                      }}>
                        {language === 'en' ? 'Special Instructions:' : 'تعليمات خاصة:'}
                      </label>
                      <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder={language === 'en'
                          ? "Any special requests or dietary requirements..."
                          : "أي طلبات خاصة أو متطلبات غذائية..."}
                        style={{
                          ...orderNotesInputStyles,
                          textAlign: language === 'ar' ? 'right' : 'left'
                        }}
                        rows="3"
                      />
                    </motion.div>

                    <motion.div
                      style={cartTotalContainerStyles}
                      initial={animations.enableAnimations ? { opacity: 0 } : {}}
                      animate={animations.enableAnimations ? { opacity: 1 } : {}}
                      transition={animations.enableAnimations ? { delay: animations.staggerDelay * 5 } : {}}
                    >
                      <div style={cartTotalStyles}>
                        <span style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                          {language === 'en' ? 'Total:' : 'المجموع الكلي:'}
                        </span>
                        <strong style={cartTotalPriceStyles}>
                          {language === 'en' ? currency.symbolEn : currency.symbol} {getTotalPrice().toLocaleString(currency.format)}
                        </strong>
                      </div>
                    </motion.div>

                    {features.enableWhatsAppOrder && (
                      <motion.button
                        onClick={() => {
                          // WhatsApp order logic
                        }}
                        style={checkoutButtonStyles}
                        whileHover={animations.enableAnimations ? { scale: 1.02 } : {}}
                        whileTap={animations.enableAnimations ? { scale: 0.98 } : {}}
                      >
                        {language === 'en' ? 'Order via WhatsApp' : 'طلب عبر واتساب'}
                      </motion.button>
                    )}
                  </>
                )}

                {/* Close Button */}
                <motion.button
                  onClick={() => setIsCartOpen(false)}
                  style={modalCloseButtonStyles}
                  whileHover={animations.enableAnimations ? { scale: 1.02 } : {}}
                  whileTap={animations.enableAnimations ? { scale: 0.98 } : {}}
                >
                  {language === 'en' ? 'Close' : 'إغلاق'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {isItemModalOpen && selectedItem && features.enableItemModal && (
          <motion.div
            style={modalOverlayStyles}
            initial={animations.enableAnimations ? { opacity: 0 } : {}}
            animate={animations.enableAnimations ? { opacity: 1 } : {}}
            exit={animations.enableAnimations ? { opacity: 0 } : {}}
          >
            <motion.div
              style={glassBackdropStyles}
              initial={animations.enableAnimations ? { opacity: 0 } : {}}
              animate={animations.enableAnimations ? { opacity: 1 } : {}}
              exit={animations.enableAnimations ? { opacity: 0 } : {}}
              onClick={() => setIsItemModalOpen(false)}
            />

            <motion.div
              style={modalContainerStyles}
              initial={animations.enableAnimations ? {
                scale: 0.8,
                opacity: 0,
                y: 20
              } : {}}
              animate={animations.enableAnimations ? {
                scale: 1,
                opacity: 1,
                y: 0
              } : {}}
              exit={animations.enableAnimations ? {
                scale: 0.8,
                opacity: 0,
                y: 20
              } : {}}
              transition={animations.enableAnimations ? {
                type: "spring",
                damping: 25,
                stiffness: 300
              } : {}}
            >
              <div style={itemModalContentStyles}>
                {layout.showItemImages && selectedItem.image && (
                  <motion.div
                    style={itemModalImageContainerStyles}
                    initial={animations.enableAnimations ? { scale: 0.8, opacity: 0 } : {}}
                    animate={animations.enableAnimations ? { scale: 1, opacity: 1 } : {}}
                    transition={animations.enableAnimations ? { delay: animations.staggerDelay * 2, duration: animations.animationSpeed } : {}}
                  >
                    <img
                      src={`${images.itemPath}${selectedItem.category || 'trays'}/${selectedItem.image}`}
                      alt={getText(selectedItem, 'name', language)}
                      style={itemModalImageStyles}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </motion.div>
                )}
                <motion.h2
                  style={{
                    ...itemModalTitleStyles,
                    textAlign: language === 'ar' ? 'right' : 'center'
                  }}
                  initial={animations.enableAnimations ? { y: -20, opacity: 0 } : {}}
                  animate={animations.enableAnimations ? { y: 0, opacity: 1 } : {}}
                  transition={animations.enableAnimations ? { delay: animations.staggerDelay * 3 } : {}}
                >
                  {getItemDisplayName(selectedItem, selectedItemOption, language)}
                </motion.h2>

                {layout.showItemDescription && (
                  <motion.p
                    style={{
                      ...itemModalDescriptionStyles,
                      textAlign: language === 'ar' ? 'right' : 'center'
                    }}
                    initial={animations.enableAnimations ? { y: -10, opacity: 0 } : {}}
                    animate={animations.enableAnimations ? { y: 0, opacity: 1 } : {}}
                    transition={animations.enableAnimations ? { delay: animations.staggerDelay * 4 } : {}}
                  >
                    {getText(selectedItem, 'description', language)}
                  </motion.p>
                )}

                {/* Product Options in Modal - Only in order mode */}
                {isOrderMode && features.enableProductOptions && selectedItem.options && selectedItem.options.length > 0 && (
                  <motion.div
                    style={modalOptionsContainerStyles}
                    initial={animations.enableAnimations ? { opacity: 0 } : {}}
                    animate={animations.enableAnimations ? { opacity: 1 } : {}}
                    transition={animations.enableAnimations ? { delay: animations.staggerDelay * 4.5 } : {}}
                  >
                    <div style={{
                      ...modalOptionsLabelStyles,
                      textAlign: language === 'ar' ? 'right' : 'center'
                    }}>
                      {language === 'en' ? 'Select option:' : 'اختر الخيار:'}
                    </div>
                    <div style={modalOptionsListStyles}>
                      {selectedItem.options.map((option) => (
                        <button
                          key={option.name}
                          style={{
                            ...modalOptionButtonStyles,
                            ...(selectedItemOption?.name === option.name ? selectedModalOptionStyle : {})
                          }}
                          onClick={() => {
                            setSelectedItemOption(option);
                            handleOptionSelect(selectedItem.name, option);
                          }}
                        >
                          <span style={{
                            ...modalOptionNameStyles,
                            textAlign: language === 'ar' ? 'right' : 'left'
                          }}>
                            {getText(option, 'name', language)}
                          </span>
                          <span style={modalOptionPriceStyles}>
                            +{currency.symbolEn} {option.price.toLocaleString(currency.format)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                <motion.p
                  style={{
                    ...itemModalPriceStyles,
                    textAlign: language === 'ar' ? 'right' : 'center'
                  }}
                  initial={animations.enableAnimations ? { scale: 0.8, opacity: 0 } : {}}
                  animate={animations.enableAnimations ? { scale: 1, opacity: 1 } : {}}
                  transition={animations.enableAnimations ? { delay: animations.staggerDelay * 5 } : {}}
                >
                  {formatPrice(getItemPrice(selectedItem, selectedItemOption), language)}
                </motion.p>

                {/* Add to Cart button - Only in order mode */}
                {isOrderMode && features.enableCart && (
                  <motion.button
                    onClick={() => {
                      addToCart(selectedItem, 1, selectedItemOption);
                      setIsItemModalOpen(false);
                    }}
                    style={addToCartButtonStyles}
                    whileHover={animations.enableAnimations ? { scale: 1.02 } : {}}
                    whileTap={animations.enableAnimations ? { scale: 0.98 } : {}}
                  >
                    {language === 'en' ? ' Add to My Order' : 'أضف إلى الطلب'}
                  </motion.button>
                )}

                <motion.button
                  onClick={() => setIsItemModalOpen(false)}
                  style={modalCloseButtonStyles}
                  whileHover={animations.enableAnimations ? { scale: 1.02 } : {}}
                  whileTap={animations.enableAnimations ? { scale: 0.98 } : {}}
                >
                  {language === 'en' ? 'Close' : 'إغلاق'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Copyright Footer */}
      <footer style={footerStyles}>
        <div style={copyrightStyles}>
          © {new Date().getFullYear()} {language === 'ar' && BRAND_CONFIG.brandNameAr ? BRAND_CONFIG.brandNameAr : BRAND_CONFIG.brandName}. {footer.copyrightText[language]}
          <br />
          {footer.showBrandName && (
            <span style={{
              ...developedByStyles,
              textAlign: language === 'ar' ? 'right' : 'center'
            }}>
              {footer.developedBy[language]}
            </span>
          )}
        </div>
      </footer>
      {/* Global Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        :root {
          --color-primary: ${colors.primary};
          --color-secondary: ${colors.secondary};
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        html {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          scroll-behavior: smooth;
        }
        
        body {
          background: #ffffff;
          color: #000000;
          line-height: 1.6;
          font-weight: 400;
          overflow-x: hidden;
          direction: ${languages[language]?.dir || 'ltr'};
        }
        
        /* Scrollbar styling for category container */
        .sticky-categories > div {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        
        .sticky-categories > div::-webkit-scrollbar {
          height: 4px;
        }
        
        .sticky-categories > div::-webkit-scrollbar-track {
          background: ${colors.gray[100]};
          border-radius: 2px;
        }
        
        .sticky-categories > div::-webkit-scrollbar-thumb {
          background: ${colors.gray[300]};
          border-radius: 2px;
        }
        
        .sticky-categories > div::-webkit-scrollbar-thumb:hover {
          background: ${colors.gray[400]};
        }
        
        /* Hide scrollbars for other elements */
        ::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
        
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Focus styles for accessibility */
        button:focus-visible,
        input:focus-visible,
        select:focus-visible {
          outline: 2px solid ${colors.primary};
          outline-offset: 2px;
        }
        
        /* Selection color */
        ::selection {
          background: ${colors.primary};
          color: white;
        }
        
        /* RTL support */
        [dir="rtl"] {
          textAlign: right;
        }
        
        [dir="ltr"] {
          textAlign: left;
        }
        
        /* Smooth transitions */
        .sticky-categories {
          transition: all 0.3s ease;
        }
        
        .sticky-categories.sticky {
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </Layout>
  );
}

// ==================== NEW STYLES ====================

// Category Section Styles
const categorySectionStyles = {
  marginBottom: '4rem',
  scrollMarginTop: '120px' // For anchor linking with sticky header
};

const categoryTitleStyles = {
  display: 'none',
  fontSize: '1.8rem',
  fontWeight: 'bold',
  color: BRAND_CONFIG.colors.black,
  margin: '0 0 1rem 0',
  padding: '0 0.5rem',
  backgroundColor: BRAND_CONFIG.colors.primary
};

const categoryNoResultsStyles = {
  textAlign: 'center',
  padding: '3rem 2rem',
  color: BRAND_CONFIG.colors.gray[500],
  fontSize: '1rem',
  fontStyle: 'italic'
};

const globalNoResultsStyles = {
  textAlign: 'center',
  padding: '6rem 2rem',
  color: BRAND_CONFIG.colors.gray[500],
  fontSize: '1.1rem',
  backgroundColor: BRAND_CONFIG.colors.gray[50],
  borderRadius: '12px',
  margin: '2rem 0'
};

// ==================== EXISTING STYLES ====================

// Option Badge
const optionBadgeStyles = {
  display: 'inline-block',
  fontSize: '0.7rem',
  fontWeight: '600',
  padding: '0.2rem 0.5rem',
  borderRadius: '4px',
  backgroundColor: BRAND_CONFIG.colors.primary + '20',
  color: BRAND_CONFIG.colors.contrast,
  marginLeft: '0.5rem',
  verticalAlign: 'middle'
};

// Options Container
const optionsContainerStyles = {
  marginBottom: '1rem',
  padding: '0.75rem',
  backgroundColor: BRAND_CONFIG.colors.gray[50],
  borderRadius: '8px',
  border: `1px solid ${BRAND_CONFIG.colors.gray[200]}`
};

const optionsLabelStyles = {
  fontSize: '0.8rem',
  fontWeight: '600',
  color: BRAND_CONFIG.colors.gray[700],
  marginBottom: '0.5rem',
  textAlign: 'left'
};

const optionsListStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const optionButtonStyles = {
  padding: '0.5rem 0.75rem',
  border: `1px solid ${BRAND_CONFIG.colors.gray[300]}`,
  borderRadius: '6px',
  backgroundColor: BRAND_CONFIG.colors.white,
  fontSize: '0.85rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  textAlign: 'left',
  color: BRAND_CONFIG.colors.gray[800]
};

const selectedOptionStyle = {
  backgroundColor: BRAND_CONFIG.colors.primary + '20',
  border: `1px solid ${BRAND_CONFIG.colors.primary}`,
  color: BRAND_CONFIG.colors.contrast,
  fontWeight: '600'
};

const optionPriceStyles = {
  fontSize: '0.8rem',
  fontWeight: '600',
  color: BRAND_CONFIG.colors.secondary
};

// Cart Item Option
const cartItemOptionStyles = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: '500',
  color: BRAND_CONFIG.colors.gray[600],
  marginTop: '0.25rem'
};

// Modal Options
const modalOptionsContainerStyles = {
  marginBottom: '1.5rem',
  padding: '1rem',
  backgroundColor: BRAND_CONFIG.colors.gray[50],
  borderRadius: '12px',
  border: `1px solid ${BRAND_CONFIG.colors.gray[200]}`
};

const modalOptionsLabelStyles = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: BRAND_CONFIG.colors.gray[700],
  marginBottom: '0.75rem',
  textAlign: 'center'
};

const modalOptionsListStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const modalOptionButtonStyles = {
  padding: '0.75rem',
  border: `1px solid ${BRAND_CONFIG.colors.gray[300]}`,
  borderRadius: '8px',
  backgroundColor: BRAND_CONFIG.colors.white,
  fontSize: '0.9rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: BRAND_CONFIG.colors.gray[800]
};

const selectedModalOptionStyle = {
  backgroundColor: BRAND_CONFIG.colors.primary + '20',
  border: `2px solid ${BRAND_CONFIG.colors.primary}`,
  color: BRAND_CONFIG.colors.contrast,
  fontWeight: '600'
};

const modalOptionNameStyles = {
  fontWeight: '500'
};

const modalOptionPriceStyles = {
  fontSize: '0.85rem',
  fontWeight: '600',
  color: BRAND_CONFIG.colors.secondary
};

// Modal Styles
const modalOverlayStyles = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem'
};

const glassBackdropStyles = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backdropFilter: 'blur(8px)',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  WebkitBackdropFilter: 'blur(8px)'
};

const modalContainerStyles = {
  position: 'relative',
  borderRadius: '16px',
  backgroundColor: 'white',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  maxWidth: '500px',
  width: '100%',
  maxHeight: '85vh',
  overflow: 'auto',
  margin: '0 auto',
  WebkitOverflowScrolling: 'touch',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
};

const modalContentStyles = {
  padding: '2rem 1.5rem 1.5rem'
};

const itemModalContentStyles = {
  padding: '2.5rem 2rem 2rem',
  textAlign: 'center'
};

const itemModalImageContainerStyles = {
  width: '180px',
  height: '180px',
  margin: '0 auto 1.5rem',
  borderRadius: '16px',
  overflow: 'hidden'
};

const itemModalImageStyles = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
};

const itemModalTitleStyles = {
  fontSize: '1.75rem',
  fontWeight: 'bold',
  color: BRAND_CONFIG.colors.black,
  margin: '0 0 1rem 0',
  lineHeight: '1.2'
};

const itemModalDescriptionStyles = {
  fontSize: '1rem',
  color: BRAND_CONFIG.colors.gray[600],
  lineHeight: '1.6',
  margin: '0 0 1.5rem 0'
};

const itemModalPriceStyles = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: BRAND_CONFIG.colors.secondary,
  margin: '0 0 2rem 0'
};

// Proceed Button Styles
const proceedButtonStyles = {
  position: 'fixed',
  bottom: '1rem',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'calc(100% - 3rem)',
  maxWidth: '400px',
  padding: '1rem 1.5rem',
  backgroundColor: BRAND_CONFIG.colors.primary,
  color: BRAND_CONFIG.colors.contrast,
  border: 'none',
  borderRadius: '12px',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  zIndex: 30,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  fontFamily: 'inherit'
};

const proceedButtonTextStyles = {
  fontSize: '1.1rem',
  fontWeight: '600'
};

const proceedButtonBadgeStyles = {
  fontSize: '0.9rem',
  opacity: 0.9,
  fontWeight: '500'
};

// Modal Close Button
const modalCloseButtonStyles = {
  width: '100%',
  padding: '0.875rem 1.5rem',
  backgroundColor: BRAND_CONFIG.colors.gray[200],
  color: BRAND_CONFIG.colors.gray[700],
  border: 'none',
  borderRadius: '12px',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  fontFamily: 'inherit',
  marginTop: '1rem'
};

// Component Styles
const languageSwitcherStyles = {
  position: 'absolute',
  top: '0rem',
  right: '0rem',
  transform: 'translateX(-1rem)',
  display: 'flex',
  justifyContent: 'center',
  gap: '0.25rem',
  backgroundColor: BRAND_CONFIG.colors.white,
  padding: '0.5rem',
  borderRadius: '12px',
  border: `1px solid ${BRAND_CONFIG.colors.gray[200]}`,
  margin: '0.5rem auto',
  width: 'fit-content',
};

const languageButtonStyles = {
  padding: '0.5rem 1rem',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: 'transparent',
  color: BRAND_CONFIG.colors.gray[600],
  fontSize: '0.9rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  minWidth: '50px'
};

const activeLanguageButtonStyles = {
  backgroundColor: BRAND_CONFIG.colors.primary,
  color: BRAND_CONFIG.colors.white,
};

const searchContainerStyles = {
  display: 'flex',
  gap: '1rem',
  padding: '1.5rem',
  paddingBottom: '0rem',
  alignItems: 'center',
  flexWrap: 'wrap',
  backgroundColor: BRAND_CONFIG.colors.white,
  marginTop: '0',
  justifyContent: 'center'
};

const searchBarStyles = {
  position: 'relative',
  flex: 1,
  minWidth: '280px',
  maxWidth: '400px'
};

const searchInputStyles = {
  width: '100%',
  padding: '0.875rem 1rem 0.875rem 3rem',
  border: `1px solid ${BRAND_CONFIG.colors.gray[300]}`,
  borderRadius: '12px',
  fontSize: '1rem',
  outline: 'none',
  transition: 'all 0.3s ease',
  backgroundColor: BRAND_CONFIG.colors.gray[50],
  fontFamily: 'inherit',
  color: BRAND_CONFIG.colors.gray[800],
};

const searchIconStyles = {
  position: 'absolute',
  left: '1rem',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '1.25rem',
  height: '1.25rem',
  color: BRAND_CONFIG.colors.gray[500]
};

const customDropdownStyles = {
  position: 'relative',
  display: 'inline-block',
  minWidth: '200px'
};

const customSelectStyles = {
  width: '100%',
  padding: '1rem',
  display: 'flex',
  border: `1px solid ${BRAND_CONFIG.colors.gray[300]}`,
  borderRadius: '12px',
  fontSize: '0.9rem',
  outline: 'none',
  backgroundColor: BRAND_CONFIG.colors.gray[50],
  appearance: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.3s ease',
  color: BRAND_CONFIG.colors.gray[800],
};

const dropdownArrowStyles = {
  position: 'absolute',
  right: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  color: BRAND_CONFIG.colors.gray[500],
  fontSize: '0.8rem'
};

const stickyContainerStyles = {
  position: 'sticky',
  top: 0,
  zIndex: 40,
  backgroundColor: BRAND_CONFIG.colors.white,
  padding: '1rem 1.5rem',
  transition: 'all 0.3s ease',
  borderBottom: `1px solid ${BRAND_CONFIG.colors.gray[200]}`
};

const categoryListStyles = {
  display: 'flex',
  gap: '0.75rem',
  overflowX: 'auto',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  flex: 1,
  userSelect: 'none',
  WebkitUserSelect: 'none',
  padding: '0.5rem 0',
  scrollBehavior: 'smooth'
};

const categoryButtonStyles = {
  padding: '0.75rem 1.5rem',
  border: `1px solid ${BRAND_CONFIG.colors.gray[300]}`,
  borderRadius: '25px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  backgroundColor: BRAND_CONFIG.colors.white,
  fontFamily: 'inherit',
  color: BRAND_CONFIG.colors.gray[700],
};

const selectedCategoryStyle = {
  backgroundColor: BRAND_CONFIG.colors.primary,
  color: BRAND_CONFIG.colors.contrast,
  border: `1px solid ${BRAND_CONFIG.colors.primary}`,
  fontWeight: '700'
};

const contentStyles = {
  padding: '0 1.5rem 4rem 1.5rem',
  backgroundColor: BRAND_CONFIG.colors.white
};

const gridStyles = {
  display: 'grid',
  gap: '2rem',
  padding: '0 1rem 2rem 1rem'
};

const gridItemStyles = {
  padding: '1.5rem',
  border: `1px solid ${BRAND_CONFIG.colors.gray[200]}`,
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  backgroundColor: BRAND_CONFIG.colors.white,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
};

const imageContainerStyles = {
  width: '100%',
  height: '200px',
  marginBottom: '1rem',
  borderRadius: '12px',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: BRAND_CONFIG.colors.gray[100],
  position: 'relative'
};

const imageStyles = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: '12px'
};

const contentContainerStyles = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column'
};

const titleContainerStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '0.75rem'
};

const itemNameStyles = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  color: BRAND_CONFIG.colors.black,
  margin: 0,
  marginBottom: '0.5rem',
  lineHeight: '1.4'
};

const itemDescriptionStyles = {
  fontSize: '0.9rem',
  color: BRAND_CONFIG.colors.gray[600],
  lineHeight: '1.5',
  margin: 0,
  marginBottom: '1rem'
};

const priceCartContainerStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 'auto',
  paddingTop: '1rem',
  borderTop: `1px solid ${BRAND_CONFIG.colors.gray[200]}`
};

const priceStyles = {
  fontSize: '1rem',
  fontWeight: 'bold',
  color: BRAND_CONFIG.colors.secondary,
  margin: 0
};

const quantitySelectorStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  backgroundColor: BRAND_CONFIG.colors.gray[100],
  borderRadius: '20px',
  padding: '0.25rem'
};

const quantityButtonStyles = {
  width: '1.75rem',
  height: '1.75rem',
  border: 'none',
  borderRadius: '50%',
  backgroundColor: BRAND_CONFIG.colors.white,
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: BRAND_CONFIG.colors.gray[700],
};

const quantityDisplayStyles = {
  minWidth: '1.5rem',
  textAlign: 'center',
  fontSize: '0.9rem',
  fontWeight: '600',
  color: BRAND_CONFIG.colors.gray[800]
};

const cartHeaderStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
  paddingBottom: '1rem',
  borderBottom: `2px solid ${BRAND_CONFIG.colors.gray[200]}`
};

const cartTitleStyles = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: BRAND_CONFIG.colors.black,
  margin: 0
};

const clearCartButtonStyles = {
  padding: '0.5rem 1rem',
  border: `1px solid ${BRAND_CONFIG.colors.gray[400]}`,
  borderRadius: '20px',
  backgroundColor: 'transparent',
  color: BRAND_CONFIG.colors.gray[600],
  fontSize: '0.8rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  whiteSpace: 'nowrap',
};

const emptyCartStyles = {
  textAlign: 'center',
  color: BRAND_CONFIG.colors.gray[500],
  fontSize: '1.1rem',
  padding: '3rem 2rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
};

const cartItemsContainerStyles = {
  maxHeight: '300px',
  overflowY: 'auto',
  marginBottom: '1.5rem',
  paddingRight: '0.5rem'
};

const cartItemContainerStyles = {
  border: `1px solid ${BRAND_CONFIG.colors.gray[200]}`,
  borderRadius: '12px',
  marginBottom: '1rem',
  backgroundColor: BRAND_CONFIG.colors.gray[50],
  overflow: 'hidden'
};

const cartItemContentStyles = {
  padding: '1.25rem'
};

const cartItemHeaderStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1rem'
};

const cartItemNameStyles = {
  fontWeight: '600',
  fontSize: '1rem',
  color: BRAND_CONFIG.colors.black,
  margin: 0,
  flex: 1,
  textAlign: 'left'
};

const cartRemoveButtonStyles = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  color: BRAND_CONFIG.colors.gray[500],
  cursor: 'pointer',
  padding: '0',
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  transition: 'all 0.2s ease',
};

const cartItemDetailsStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem'
};

const cartItemPriceStyles = {
  color: BRAND_CONFIG.colors.gray[600],
  fontSize: '0.9rem'
};

const cartItemControlsStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  backgroundColor: BRAND_CONFIG.colors.white,
  borderRadius: '20px',
  padding: '0.25rem'
};

const cartQuantityButtonStyles = {
  width: '28px',
  height: '28px',
  border: 'none',
  borderRadius: '50%',
  backgroundColor: BRAND_CONFIG.colors.gray[100],
  color: BRAND_CONFIG.colors.gray[700],
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
};

const cartQuantityStyles = {
  minWidth: '30px',
  textAlign: 'center',
  fontWeight: '600',
  fontSize: '1rem',
  color: BRAND_CONFIG.colors.black
};

const cartItemTotalStyles = {
  textAlign: 'left',
  fontWeight: '600',
  color: BRAND_CONFIG.colors.black,
  fontSize: '1rem',
  paddingTop: '0.5rem',
  borderTop: `1px solid ${BRAND_CONFIG.colors.gray[200]}`
};

const orderNotesContainerStyles = {
  marginBottom: '1.5rem',
  textAlign: 'left'
};

const orderNotesLabelStyles = {
  display: 'block',
  fontWeight: '600',
  marginBottom: '0.5rem',
  color: BRAND_CONFIG.colors.black,
  fontSize: '1rem'
};

const orderNotesInputStyles = {
  width: '100%',
  padding: '0.75rem',
  border: `1px solid ${BRAND_CONFIG.colors.gray[300]}`,
  borderRadius: '12px',
  fontSize: '0.9rem',
  outline: 'none',
  resize: 'vertical',
  fontFamily: 'inherit',
  transition: 'all 0.3s ease',
  backgroundColor: BRAND_CONFIG.colors.gray[50],
  color: BRAND_CONFIG.colors.gray[800],
};

const cartTotalContainerStyles = {
  borderTop: `2px solid ${BRAND_CONFIG.colors.gray[200]}`,
  paddingTop: '1rem',
  marginBottom: '1.5rem'
};

const cartTotalStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '1.25rem',
  fontWeight: '600',
  color: BRAND_CONFIG.colors.black
};

const cartTotalPriceStyles = {
  color: BRAND_CONFIG.colors.secondary,
  fontSize: '1.5rem'
};

const checkoutButtonStyles = {
  width: '100%',
  padding: '1rem 2rem',
  backgroundColor: BRAND_CONFIG.colors.secondary,
  color: BRAND_CONFIG.colors.white,
  border: 'none',
  borderRadius: '12px',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  fontFamily: 'inherit',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const addToCartButtonStyles = {
  width: '100%',
  padding: '1rem 2rem',
  backgroundColor: BRAND_CONFIG.colors.primary,
  color: BRAND_CONFIG.colors.contrast,
  border: 'none',
  borderRadius: '12px',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  fontFamily: 'inherit',
};

const footerStyles = {
  padding: '3rem 1.5rem 8rem 1.5rem',
  marginTop: '3rem',
  backgroundColor: BRAND_CONFIG.colors.white,
  borderTop: `1px solid ${BRAND_CONFIG.colors.gray[200]}`
};

const copyrightStyles = {
  textAlign: 'center',
  color: BRAND_CONFIG.colors.gray[500],
  fontSize: '0.9rem',
  lineHeight: '1.6'
};

const developedByStyles = {
  display: 'block',
  marginTop: '0.5rem',
  fontStyle: 'italic',
  color: BRAND_CONFIG.colors.gray[400],
  fontSize: '0.8rem'
};