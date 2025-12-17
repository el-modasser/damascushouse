import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://damascushouse.esto.solutions'),
  title: "Damascus House | Authentic Syrian Restaurant in Nairobi | بيت دمشق",
  description: "Damascus House offers authentic Syrian cuisine in Nairobi. Experience traditional shawarma, mandi, hummus, falafel, kebbeh, and more in a warm Middle Eastern atmosphere. Order online for delivery or pickup!",
  keywords: "Damascus House, Syrian food, Arabic food, Middle Eastern cuisine, shawarma, mandi, hummus, falafel, kebbeh, tabbouleh, fattoush, Nairobi restaurant, Syrian restaurant, authentic Arabic food, Sports Road Nairobi, Mvuli Road, بيت دمشق, مطعم سوري, طعام سوري في نيروبي",
  authors: [{ name: "Damascus House" }],
  openGraph: {
    title: "Damascus House | Authentic Syrian Restaurant in Nairobi | بيت دمشق",
    description: "Experience authentic Syrian cuisine in Nairobi. Traditional shawarma, mandi, hummus, falafel, and more in a warm Middle Eastern atmosphere. Order online!",
    url: "https://damascushouse.esto.solutions",
    siteName: "Damascus House",
    locale: "en_KE",
    type: "website",
    images: [
      {
        url: "/images/hero.png", // Use your hero image
        width: 1200,
        height: 630,
        alt: "Delicious Syrian food at Damascus House",
      },
      {
        url: "/images/hero-lg.png", // Use your desktop hero image
        width: 800,
        height: 600,
        alt: "Damascus House shawarma plate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Damascus House | Authentic Syrian Restaurant in Nairobi | بيت دمشق",
    description: "Experience authentic Syrian cuisine in Nairobi. Traditional shawarma, mandi, hummus, falafel, and more.",
    images: ["/images/hero.png"],
    creator: "@damascushouse_ke",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_CODE",
    yandex: "YOUR_YANDEX_VERIFICATION_CODE",
    yahoo: "YOUR_YAHOO_VERIFICATION_CODE",
  },
  alternates: {
    canonical: "https://damascushouse.esto.solutions",
    languages: {
      "en-KE": "https://damascushouse.esto.solutions",
    },
  },
  category: "Food & Drink",
  other: {
    "facebook-domain-verification": "YOUR_FACEBOOK_DOMAIN_VERIFICATION",
  },
};

// JSON-LD structured data for enhanced SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Damascus House",
  "name_ar": "بيت دمشق",
  "description": "Authentic Syrian restaurant offering traditional shawarma, mandi, hummus, falafel, kebbeh, and more in Nairobi. Experience the taste of Damascus in Kenya.",
  "url": "https://damascushouse.esto.solutions",
  "telephone": "+254 123 456 789",
  "address": [
    {
      "@type": "PostalAddress",
      "streetAddress": "Sports Road, & Mvuli Rd",
      "addressLocality": "Nairobi",
      "addressRegion": "Nairobi",
      "postalCode": "00100",
      "addressCountry": "KE"
    }
  ],
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -1.2631897254973337,
    "longitude": 36.792070047236784
  },
  "openingHours": "Mo-Th,Su 10:00-23:00; Fr,Sa 11:00-00:00",
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
  "servesCuisine": ["Syrian", "Middle Eastern", "Arabic"],
  "priceRange": "$$",
  "image": [
    "https://damascushouse.esto.solutions/images/hero.png",
    "https://damascushouse.esto.solutions/images/hero-lg.png"
  ],
  "menu": "https://damascushouse.esto.solutions/?order=true",
  "acceptsReservations": true,
  "paymentAccepted": ["Cash", "Credit Card", "M-Pesa", "Debit Card"],
  "currenciesAccepted": "KES",
  "hasMenu": "https://damascushouse.esto.solutions/?order=true",
  "sameAs": [
    "https://www.facebook.com/damascushouseke",
    "https://www.instagram.com/damascushouseke",
    "https://twitter.com/damascushouseke"
  ],
  "potentialAction": {
    "@type": "OrderAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://damascushouse.esto.solutions/?order=true",
      "actionPlatform": [
        "http://schema.org/DesktopWebPlatform",
        "http://schema.org/IOSPlatform",
        "http://schema.org/AndroidPlatform"
      ]
    }
  },
  "makesOffer": [
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "MenuItem",
        "name": "Chicken Mandi",
        "description": "Tender, slow-cooked chicken served over fragrant basmati rice with traditional Mandi spices.",
        "offers": {
          "@type": "Offer",
          "price": 1100,
          "priceCurrency": "KES"
        }
      }
    },
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "MenuItem",
        "name": "Hummus Plate",
        "description": "Smooth chickpeas blended with tahini, lemon, garlic and olive oil, lightly spiced.",
        "offers": {
          "@type": "Offer",
          "price": 480,
          "priceCurrency": "KES"
        }
      }
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        {/* Additional meta tags for food/restaurant SEO */}
        <meta name="food:cuisine" content="Syrian, Middle Eastern, Arabic" />
        <meta name="food:price_range" content="$$" />
        <meta name="food:menu_url" content="https://damascushouse.esto.solutions/?order=true" />
        <meta name="food:restaurant_type" content="Restaurant" />
        <meta name="food:restaurant_category" content="Syrian, Arabic, Middle Eastern" />

        {/* Location meta tags */}
        <meta name="geo.region" content="KE-NAIROBI" />
        <meta name="geo.placename" content="Nairobi" />
        <meta name="geo.position" content="-1.2631897254973337;36.792070047236784" />
        <meta name="ICBM" content="-1.2631897254973337, 36.792070047236784" />

        {/* WhatsApp Business integration */}
        <meta property="whatsapp:business" content="+254123456789" />
        <meta property="whatsapp:message" content="Hello Damascus House! I'd like to order Syrian food" />

        {/* Ordering Action meta */}
        <meta property="business:contact:phone" content="+254123456789" />
        <meta property="business:contact:website" content="https://damascushouse.esto.solutions" />
        <meta property="business:contact:ordering" content="https://damascushouse.esto.solutions/?order=true" />
      </head>
      <body
        className={`${inter.variable} ${cairo.variable} antialiased bg-gray-50 text-gray-900`}
      >
        {children}
      </body>
    </html>
  );
}