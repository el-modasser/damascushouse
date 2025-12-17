"use client";
import Image from 'next/image';
import Script from 'next/script';

// ==================== BRAND CONFIGURATION ====================
// Edit these values to customize for your brand

const BRAND_CONFIG = {
  // Brand identity
  brandName: "Damascus House",
  brandNameAr: "بيت دمشق",

  // Hero Image Configuration
  heroImage: {
    enableHero: true,
    mobile: "/images/hero.png", // Update with your hero image
    desktop: "/images/hero-lg.png", // Update with your hero image
    alt: "Delicious Syrian cuisine at Damascus House",
    height: {
      mobile: "280px",
      desktop: "320px"
    },
    overlay: false,
    overlayOpacity: 0.2
  },

  // Contact information
  contact: {
    phone: "+254720811925", // Update with your actual phone
    whatsapp: "+254720811925" // Update with your actual WhatsApp
  },

  // Locations
  locations: [
    {
      name: "Main Branch",
      address: "Sports Road, & Mvuli Rd, Nairobi",
      coordinates: {
        latitude: -1.2631897254973337,
        longitude: 36.792070047236784
      }
    }
  ],

  // Business information for SEO
  businessInfo: {
    type: "Restaurant",
    cuisine: ["Syrian", "Middle Eastern", "Arabic", "Shawarma", "Mandi", "Hummus", "Falafel", "Kebbeh"],
    priceRange: "$$",
    description: "Damascus House - Authentic Syrian cuisine in Nairobi. Experience traditional shawarma, mandi, hummus, falafel, and more in a warm Middle Eastern atmosphere.",
    domain: "https://damascushouse.esto.solutions" // Update with your actual domain
  },

  // Layout settings
  layout: {
    showHeroImage: true,
    heroHeight: "medium" // "small" | "medium" | "large"
  }
};

// ==================== HELPER FUNCTIONS ====================

// Generate structured data for SEO
const generateStructuredData = () => {
  const { brandName, businessInfo, locations, contact } = BRAND_CONFIG;

  const localBusinessData = {
    "@context": "https://schema.org",
    "@type": businessInfo.type,
    "name": brandName,
    "name_ar": BRAND_CONFIG.brandNameAr,
    "@id": businessInfo.domain,
    "url": businessInfo.domain,
    "telephone": contact.phone,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": locations[0].address,
      "addressLocality": "Nairobi",
      "addressRegion": "Nairobi",
      "addressCountry": "KE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": locations[0].coordinates.latitude,
      "longitude": locations[0].coordinates.longitude
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"],
        "opens": "10:00",
        "closes": "23:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Friday", "Saturday"],
        "opens": "11:00",
        "closes": "00:00"
      }
    ],
    "servesCuisine": businessInfo.cuisine,
    "priceRange": businessInfo.priceRange,
    "description": businessInfo.description,
    "hasMenu": `${businessInfo.domain}/menu`,
    "menu": {
      "@type": "Menu",
      "hasMenuSection": [
        {
          "@type": "MenuSection",
          "name": "Appetizers",
          "name_ar": "مقبلات",
          "description": "Traditional Syrian appetizers"
        },
        {
          "@type": "MenuSection",
          "name": "Salads",
          "name_ar": "سلطات",
          "description": "Fresh Middle Eastern salads"
        },
        {
          "@type": "MenuSection",
          "name": "Shawarma & Wraps",
          "name_ar": "شاورما ولفائف",
          "description": "Authentic Syrian shawarma"
        },
        {
          "@type": "MenuSection",
          "name": "Main Courses",
          "name_ar": "أطباق رئيسية",
          "description": "Main Syrian dishes"
        },
        {
          "@type": "MenuSection",
          "name": "Drinks",
          "name_ar": "مشروبات",
          "description": "Beverages"
        }
      ]
    }
  };

  return localBusinessData;
};

// Get hero height based on configuration
const getHeroHeight = (heightType) => {
  switch (heightType) {
    case "small":
      return { mobile: "220px", desktop: "260px" };
    case "large":
      return { mobile: "340px", desktop: "380px" };
    default: // medium
      return { mobile: "280px", desktop: "320px" };
  }
};

// ==================== LAYOUT COMPONENT ====================

export default function Layout({ children }) {
  const {
    brandName,
    heroImage,
    layout
  } = BRAND_CONFIG;

  const structuredData = generateStructuredData();
  const heroHeight = getHeroHeight(layout.heroHeight);

  return (
    <div className="min-h-screen bg-white">
      {/* Structured Data for SEO */}
      <Script
        id="local-business-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Hero Image Section */}
      {layout.showHeroImage && (
        <div className="relative w-full overflow-hidden">
          {/* Mobile Hero Image */}
          <div className="block md:hidden relative">
            <div
              className="w-full bg-cover bg-center"
              style={{
                height: heroHeight.mobile,
                backgroundImage: `url('${heroImage.mobile}')`,
                backgroundColor: '#f5f5f5' // Fallback color
              }}
            >
              {heroImage.overlay && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: `rgba(0, 0, 0, ${heroImage.overlayOpacity})`
                  }}
                />
              )}
            </div>
          </div>

          {/* Desktop Hero Image */}
          <div className="hidden md:block relative">
            <div
              className="w-full bg-cover bg-center"
              style={{
                height: heroHeight.desktop,
                backgroundImage: `url('${heroImage.desktop}')`,
                backgroundColor: '#f5f5f5' // Fallback color
              }}
            >
              {heroImage.overlay && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: `rgba(0, 0, 0, ${heroImage.overlayOpacity})`
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="w-full">
        {children}
      </main>

      {/* Global Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cairo:wght@300;400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        html {
          font-family: 'Inter', 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          scroll-behavior: smooth;
        }
        
        body {
          background: #ffffff;
          color: #000000;
          line-height: 1.6;
          font-weight: 400;
        }
        
        /* RTL text support */
        .arabic-text {
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          text-align: right;
        }
        
        /* Clean scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #fafafa;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #e5e5e5;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #d4d4d4;
        }
        
        /* Focus styles */
        button:focus-visible,
        input:focus-visible,
        select:focus-visible {
          outline: 2px solid #8B4513; /* Brown accent for Middle Eastern theme */
          outline-offset: 2px;
        }
        
        /* Selection */
        ::selection {
          background: #D4AF37; /* Gold accent */
          color: #000000;
        }
        
        /* Image loading animation */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .hero-image {
          animation: fadeIn 0.5s ease-out;
        }
        
        /* Responsive images */
        img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
}