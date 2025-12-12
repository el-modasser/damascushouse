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
      en: "Crafted with excellence",
      ar: "مطور بإتقان"
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
  const [selectedCategory, setSelectedCategory] = useState(Object.keys(menuData)[0] || 'trays');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemOption, setSelectedItemOption] = useState(null);
  const [isSticky, setIsSticky] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceSort, setPriceSort] = useState('default');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [visibleItems, setVisibleItems] = useState(1000);
  const [imageLoadStates, setImageLoadStates] = useState({});
  const [language, setLanguage] = useState(defaultLanguage);
  const [heroImagesLoaded, setHeroImagesLoaded] = useState({});
  const [itemOptions, setItemOptions] = useState({});

  // NEW: Check if order mode is enabled via query parameter
  const [isOrderMode, setIsOrderMode] = useState(false);

  // Refs
  const categoriesRef = useRef(null);
  const categoryScrollRef = useRef(null);
  const animationFrameRef = useRef(null);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastTouchTimeRef = useRef(0);

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
      window.addEventListener('scroll', handleScroll);
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

  // Improved drag scroll functionality
  const handleDragStart = (e) => {
    if (!features.enableDragScroll || !categoryScrollRef.current) return;

    const now = Date.now();
    if (now - lastTouchTimeRef.current < 100) return;
    lastTouchTimeRef.current = now;

    isDraggingRef.current = true;

    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;

    dragStartXRef.current = clientX;
    dragStartScrollLeftRef.current = categoryScrollRef.current.scrollLeft;

    if (!e.type.includes('touch')) {
      categoryScrollRef.current.style.cursor = 'grabbing';
      categoryScrollRef.current.style.userSelect = 'none';
    }

    const moveEvent = e.type.includes('touch') ? 'touchmove' : 'mousemove';
    const endEvent = e.type.includes('touch') ? 'touchend' : 'mouseup';

    document.addEventListener(moveEvent, handleDragMove, { passive: false });
    document.addEventListener(endEvent, handleDragEnd);

    if (e.type.includes('touch')) {
      e.preventDefault();
    }
  };

  const handleDragMove = (e) => {
    if (!isDraggingRef.current || !categoryScrollRef.current) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const walk = (clientX - dragStartXRef.current) * 1.5;

      if (categoryScrollRef.current) {
        categoryScrollRef.current.scrollLeft = dragStartScrollLeftRef.current - walk;
      }
    });
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;

    if (categoryScrollRef.current) {
      categoryScrollRef.current.style.cursor = 'grab';
      categoryScrollRef.current.style.userSelect = 'auto';
    }

    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Filter and sort items
  const getFilteredAndSortedItems = useCallback(() => {
    const categoryData = menuData[selectedCategory];
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
  }, [selectedCategory, searchQuery, priceSort, features]);

  const filteredItems = getFilteredAndSortedItems();
  const displayedItems = filteredItems.slice(0, visibleItems);

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
    hidden: { y: 20, opacity: 0, scale: 0.9 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
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
                  paddingRight: language === 'ar' ? '2.5rem' : '1rem',
                  paddingLeft: language === 'ar' ? '1rem' : '2.5rem',
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

      {/* View-only mode indicator */}
      {/* {!isOrderMode && (
        <div style={viewOnlyIndicatorStyles}>
          <span style={{ fontWeight: '600' }}>
            {language === 'en' ? 'View Mode - To order, use ?order=true in URL' : 'وضع العرض - للطلب، استخدم ?order=true في الرابط'}
          </span>
        </div>
      )} */}

      {/* Sticky Categories Navigation with Drag Scroll */}
      <div
        ref={categoriesRef}
        className={`sticky-categories ${isSticky ? 'sticky' : ''}`}
        style={stickyContainerStyles}
      >
        <div
          ref={categoryScrollRef}
          className="category-scroll-container"
          style={{
            ...categoryListStyles,
            cursor: features.enableDragScroll ? 'grab' : 'pointer',
            ...(isDraggingRef.current && features.enableDragScroll ? {
              cursor: 'grabbing',
              userSelect: 'none'
            } : {})
          }}
          onMouseDown={features.enableDragScroll ? handleDragStart : undefined}
          onTouchStart={features.enableDragScroll ? handleDragStart : undefined}
        >
          {Object.keys(menuData).map((categoryId) => (
            <button
              key={categoryId}
              style={{
                ...categoryButtonStyles,
                ...(selectedCategory === categoryId ? selectedCategoryStyle : {})
              }}
              onClick={() => setSelectedCategory(categoryId)}
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

      {/* Main Content */}
      <div style={contentStyles}>
        {/* Menu Items Grid */}
        <motion.div
          style={{
            ...gridStyles,
            gridTemplateColumns: gridColumns
          }}
          key={selectedCategory + searchQuery + priceSort}
          initial={animations.enableAnimations ? { opacity: 0 } : {}}
          animate={animations.enableAnimations ? { opacity: 1 } : {}}
          transition={animations.enableAnimations ? { duration: animations.animationSpeed } : {}}
        >
          {displayedItems.map((item, index) => {
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
                      src={`${images.itemPath}${selectedCategory}/${item.image}`}
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

        {/* No results message */}
        {displayedItems.length === 0 && (
          <div style={noResultsStyles}>
            <p style={{ textAlign: language === 'ar' ? 'right' : 'center' }}>
              {language === 'en' ? 'No dishes found matching your search.' : 'لم يتم العثور على أطباق تطابق بحثك.'}
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
                        {/* <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '0.5rem' }}>
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.18-1.24-6.169-3.495-8.418" />
                        </svg> */}
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
                      src={`${images.itemPath}${selectedCategory}/${selectedItem.image}`}
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
        
        /* Disable text selection during drag */
        .no-select {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
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

// View-only indicator
const viewOnlyIndicatorStyles = {
  backgroundColor: BRAND_CONFIG.colors.gray[100],
  border: `1px solid ${BRAND_CONFIG.colors.gray[300]}`,
  borderRadius: '8px',
  padding: '0.75rem 1.5rem',
  margin: '0 1.5rem 1rem 1.5rem',
  textAlign: 'center',
  fontSize: '0.9rem',
  color: BRAND_CONFIG.colors.gray[600]
};

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

// ==================== EXISTING STYLES ====================

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

// Hero Image Styles
const heroContainerStyles = {
  position: 'relative',
  width: '100%',
  height: '300px',
  overflow: 'hidden',
  marginBottom: '2rem'
};

const heroImageWrapperStyles = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: BRAND_CONFIG.colors.gray[100]
};

const heroImageStyles = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
};

const heroOverlayStyles = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, rgba(78, 165, 149, 0.3) 0%, rgba(235, 75, 54, 0.2) 100%)`
};

const heroContentStyles = {
  textAlign: 'center',
  color: 'white',
  maxWidth: '600px',
  padding: '0 2rem'
};

const heroTitleStyles = {
  fontSize: '2.5rem',
  fontWeight: 'bold',
  margin: '0 0 1rem 0',
  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
  lineHeight: '1.1'
};

const heroDescriptionStyles = {
  fontSize: '1.1rem',
  margin: 0,
  opacity: 0.9,
  textShadow: '0 1px 5px rgba(0,0,0,0.3)',
  lineHeight: '1.4'
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
  padding: '0.875rem 2.5rem 0.875rem 1rem',
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
  padding: '0.5rem 0'
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
  padding: '0 1.5rem 2rem 1.5rem',
  backgroundColor: BRAND_CONFIG.colors.white,
  minHeight: '60vh'
};

const gridStyles = {
  display: 'grid',
  gap: '2rem',
  padding: '1rem 0'
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

const skeletonStyles = {
  width: '100%',
  height: '100%',
  backgroundColor: BRAND_CONFIG.colors.gray[200],
  borderRadius: '12px'
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

const noResultsStyles = {
  textAlign: 'center',
  padding: '4rem 2rem',
  color: BRAND_CONFIG.colors.gray[500],
  fontSize: '1.1rem'
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