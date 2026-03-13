import React, { useState, useEffect } from "react";
import HeroSlideshow from "../../component/HeroSlideshow/HeroSlideshow";
import CompactFilterBar from "../../feature/home/CompactFilterBar";
import EventSection from "../../feature/home/EventSection";
import CenteredBanner from "../../component/CenteredBanner/CenteredBanner";
import BlogsSection from "../../feature/home/blogs/BlogsSection";
import FilterProvider from "../../context/FilterContext";
import api from "../../api/axios";
import useSeo from "../../hooks/useSeo";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [heroSlideshow, setHeroSlideshow] = useState([
    {
      id: "1",
      type: "video",
      url: "/assets/Xfrizon-Hero-Vid.mp4",
      duration: 10000,
      order: 0,
    },
  ]);
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [bannerTexts, setBannerTexts] = useState([
    "Promoting Afrocentric Events",
    "Discover Events Near You",
    "Celebrate Culture Together",
  ]);
  const [blockOrder, setBlockOrder] = useState([
    "centeredBanner",
    "heroSection",
    "blogsSection",
    "eventSection",
  ]);

  useSeo({
    title: "Xfrizon | Discover Events and Culture Blogs",
    description:
      "Discover upcoming events, buy tickets, and explore music and culture stories on Xfrizon.",
    keywords:
      "events, tickets, concerts, nightlife, music blog, culture blog, Xfrizon",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Xfrizon",
        url:
          typeof window !== "undefined"
            ? window.location.origin
            : "https://xfrizon.up.railway.app",
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Xfrizon",
        url:
          typeof window !== "undefined"
            ? window.location.origin
            : "https://xfrizon.up.railway.app",
      },
    ],
  });

  const isVideoUrl = (url = "") => {
    const value = String(url).toLowerCase();
    return /(\.mp4|\.mov|\.webm|\.m4v|\.ogg)(\?|$)/.test(value);
  };

  const normalizeSlide = (slide, index = 0) => {
    const url = typeof slide?.url === "string" ? slide.url : "";
    const rawType = String(slide?.type || "").toLowerCase();
    const inferredType =
      rawType.includes("video") || isVideoUrl(url) ? "video" : "image";

    return {
      id: slide?.id ? String(slide.id) : `${Date.now()}-${index}`,
      type: inferredType,
      url,
      duration: Number(slide?.duration) > 0 ? Number(slide.duration) : 5000,
      order: Number.isFinite(Number(slide?.order))
        ? Number(slide.order)
        : index,
      title: typeof slide?.title === "string" ? slide.title : "",
      caption: typeof slide?.caption === "string" ? slide.caption : "",
      ctaLabel: typeof slide?.ctaLabel === "string" ? slide.ctaLabel : "",
      ctaLink: typeof slide?.ctaLink === "string" ? slide.ctaLink : "",
      sourceType: typeof slide?.sourceType === "string" ? slide.sourceType : "",
      organizerId: slide?.organizerId != null ? String(slide.organizerId) : "",
      blogId: slide?.blogId != null ? String(slide.blogId) : "",
      // Text styling properties
      textColor:
        typeof slide?.textColor === "string" ? slide.textColor : "#ffffff",
      textSize: typeof slide?.textSize === "string" ? slide.textSize : "normal",
      textPosition:
        typeof slide?.textPosition === "string"
          ? slide.textPosition
          : "bottom-left",
      overlayOpacity:
        typeof slide?.overlayOpacity === "string" ? slide.overlayOpacity : "30",
      ctaBgColor:
        typeof slide?.ctaBgColor === "string" ? slide.ctaBgColor : "#ef4444",
      ctaTextColor:
        typeof slide?.ctaTextColor === "string"
          ? slide.ctaTextColor
          : "#ffffff",
    };
  };

  useEffect(() => {
    fetchHomePageSettings();
  }, []);

  const fetchHomePageSettings = async () => {
    try {
      const response = await api.get("/homepage-settings");
      const settings = response.data;

      if (settings.heroSlideshow) {
        try {
          const slideshow = JSON.parse(settings.heroSlideshow);
          if (Array.isArray(slideshow) && slideshow.length > 0) {
            setHeroSlideshow(
              slideshow.map((slide, index) => normalizeSlide(slide, index)),
            );
          }
        } catch (e) {
          console.error("Error parsing hero slideshow:", e);
        }
      }

      if (settings.bannerTexts) {
        try {
          const texts = JSON.parse(settings.bannerTexts);
          if (Array.isArray(texts) && texts.length > 0) {
            setBannerTexts(texts);
          }
        } catch (e) {
          console.error("Error parsing banner texts:", e);
        }
      }

      if (typeof settings.heroTitle === "string") {
        setHeroTitle(settings.heroTitle);
      }

      if (typeof settings.heroSubtitle === "string") {
        setHeroSubtitle(settings.heroSubtitle);
      }

      if (settings.blockOrder) {
        try {
          const order = JSON.parse(settings.blockOrder);
          if (Array.isArray(order) && order.length > 0) {
            setBlockOrder(order);
          }
        } catch (e) {
          console.error("Error parsing block order:", e);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching homepage settings:", error);
      // Continue with defaults
      setLoading(false);
    }
  };

  const renderBlock = (blockId) => {
    switch (blockId) {
      case "centeredBanner":
        return <CenteredBanner key="centeredBanner" texts={bannerTexts} />;

      case "heroSection":
        return (
          <HeroSlideshow
            key="heroSection"
            items={heroSlideshow}
            title={heroTitle}
            subtitle={heroSubtitle}
          />
        );

      case "blogsSection":
        return (
          <div key="blogsSection">
            {/* Transition spacing */}
            <div className="h-8 sm:h-12" />
            {/* Blog Section - Dark Background */}
            <div className="bg-[#1e1e1e] text-gray-100 rounded-none px-0 py-0 mt-0 mx-0 shadow-none transition-all duration-500">
              <BlogsSection />
            </div>
          </div>
        );

      case "eventSection":
        return (
          <div key="eventSection" className="mt-6 sm:mt-8">
            <CompactFilterBar />
            <div className="h-6" />
            <EventSection />
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <FilterProvider>
        <div className="bg-black text-white min-h-screen flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      </FilterProvider>
    );
  }

  return (
    <FilterProvider>
      <div className="bg-black text-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-0">
          {blockOrder.map((blockId) => renderBlock(blockId))}
        </div>
      </div>
    </FilterProvider>
  );
}
