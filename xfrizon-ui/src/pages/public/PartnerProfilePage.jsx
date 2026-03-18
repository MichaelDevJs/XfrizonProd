import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { FaGlobe, FaInstagram, FaTwitter } from "react-icons/fa";
import { FiMail, FiMapPin } from "react-icons/fi";
import partnersApi from "../../api/partnersApi";
import api from "../../api/axios";
import OrganizerCoverSlideshow from "../../component/organizer/OrganizerCoverSlideshow";
import HeroSlideshow from "../../component/HeroSlideshow/HeroSlideshow";

export default function PartnerProfilePage() {
  const { partnerId } = useParams();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [blogHeadlineSlideshow, setBlogHeadlineSlideshow] = useState([]);

  useEffect(() => {
    setLoading(true);
    partnersApi
      .getById(partnerId)
      .then(setPartner)
      .catch((e) => setError(e?.response?.data?.message || "Partner not found"))
      .finally(() => setLoading(false));
  }, [partnerId]);

  useEffect(() => {
    const fetchBlogHeadlineSlides = async () => {
      try {
        const response = await api.get("/blog-hero-settings");
        const settings = response?.data || {};
        if (!settings.blogHeroSlideshow) {
          setBlogHeadlineSlideshow([]);
          return;
        }

        const parsed = JSON.parse(settings.blogHeroSlideshow);
        setBlogHeadlineSlideshow(Array.isArray(parsed) ? parsed : []);
      } catch {
        setBlogHeadlineSlideshow([]);
      }
    };

    fetchBlogHeadlineSlides();
  }, []);

  const coverSlides = useMemo(() => {
    const items = Array.isArray(partner?.coverMedia) ? partner.coverMedia : [];
    if (items.length > 0) {
      return items.map((item, index) => ({
        id: item?.url || `cover-${index}`,
        url: getMediaUrl(item?.url) || item?.url,
        type: item?.type || (isVideoMedia(item?.url) ? "video" : "image"),
      }));
    }
    if (partner?.coverPhoto) {
      return [{ id: "cover-photo", url: getMediaUrl(partner.coverPhoto) || partner.coverPhoto, type: isVideoMedia(partner.coverPhoto) ? "video" : "image" }];
    }
    return [];
  }, [partner]);

  const galleryItems = useMemo(() => {
    return (Array.isArray(partner?.gallery) ? partner.gallery : []).map((item, index) => ({
      id: item?.url || `gallery-${index}`,
      url: getMediaUrl(item?.url) || item?.url,
      type: item?.type || (isVideoMedia(item?.url) ? "video" : "image"),
      caption: item?.caption || "",
    }));
  }, [partner]);

  const offers = useMemo(() => {
    return Array.isArray(partner?.offers) ? partner.offers : [];
  }, [partner]);

  const couponItems = useMemo(() => {
    if (Array.isArray(partner?.coupons) && partner.coupons.length > 0) {
      return partner.coupons;
    }

    return offers
      .filter((offer) => {
        return Boolean(
          offer?.couponCode || offer?.promoCode || offer?.code || offer?.voucherCode,
        );
      })
      .map((offer) => ({
        id: offer?.id,
        title: offer?.title,
        description: offer?.description,
        code:
          offer?.couponCode || offer?.promoCode || offer?.code || offer?.voucherCode,
      }));
  }, [partner, offers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading partner profile...
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 text-sm">{error || "Partner not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen pt-4 sm:pt-6">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative w-full aspect-video sm:aspect-2/1 lg:aspect-3/1 xl:aspect-10/3 bg-black overflow-hidden">
          <OrganizerCoverSlideshow slides={coverSlides} />
        </div>
      </div>

      <PartnerAboutBlockOne partner={partner} />

      <div className="px-4 sm:px-6">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex justify-center gap-5 mb-6 pt-6">
            <button
              className={`pb-2.5 text-xs font-medium transition-colors duration-200 ${
                activeTab === "overview"
                  ? "text-gray-200 border-b-2 border-red-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`pb-2.5 text-xs font-medium transition-colors duration-200 ${
                activeTab === "offers"
                  ? "text-gray-200 border-b-2 border-red-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("offers")}
            >
              Offers
            </button>
            <button
              className={`pb-2.5 text-xs font-medium transition-colors duration-200 ${
                activeTab === "coupons"
                  ? "text-gray-200 border-b-2 border-red-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("coupons")}
            >
              Coupons
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-12">
        <div className="mx-auto max-w-5xl space-y-8">

          {activeTab === "overview" ? (
            <>
              <div className="w-full max-w-4xl mx-auto mt-8">
                <h3 className="text-sm font-medium tracking-wide uppercase text-gray-200 mb-3 text-center">
                  Gallery
                </h3>
                <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-1 hide-scrollbar">
                  {galleryItems.length > 0 ? (
                    galleryItems.map((item) => (
                      <div
                        key={item.id}
                        className="shrink-0 w-48 sm:w-60 h-28 sm:h-32 rounded-lg border border-zinc-800 bg-zinc-900/70 overflow-hidden"
                      >
                        {item.type === "video" ? (
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                            muted
                            controls
                            playsInline
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt={item.caption || "Gallery"}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">
                      No gallery media yet.
                    </p>
                  )}
                </div>
              </div>

              {blogHeadlineSlideshow.length > 0 ? (
                <div className="w-full max-w-lg mx-auto mt-8">
                  <h3 className="text-sm font-medium tracking-wide uppercase text-gray-200 mb-3 text-center">
                    XF Blog Headline
                  </h3>
                  <div className="overflow-hidden">
                    <HeroSlideshow items={blogHeadlineSlideshow} />
                  </div>
                </div>
              ) : null}

              <PartnerAboutBlockOne partner={partner} showDescription showPartnerIcon />
            </>
          ) : null}

          {activeTab === "offers" ? (
            <section className="rounded-2xl border border-gray-800 bg-[#121212] p-6">
              <h2 className="text-lg font-semibold">Offers</h2>
              <div className="mt-3 space-y-2">
                {offers.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No active offers available right now.
                  </p>
                ) : null}

                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="flex items-center justify-between rounded-lg border border-gray-800 bg-[#0f0f0f] p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{offer.title}</p>
                      <p className="text-xs text-gray-500">{offer.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#c0f24d]">
                        {offer.discountPercent}% OFF
                      </p>
                      <p className="text-xs text-gray-500">{offer.pointsCost} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "coupons" ? (
            <section className="rounded-2xl border border-gray-800 bg-[#121212] p-6">
              <h2 className="text-lg font-semibold">Coupons</h2>
              <div className="mt-3 space-y-2">
                {couponItems.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No coupons available right now.
                  </p>
                ) : null}

                {couponItems.map((coupon, index) => (
                  <div
                    key={coupon.id || coupon.code || `coupon-${index}`}
                    className="rounded-lg border border-gray-800 bg-[#0f0f0f] p-3"
                  >
                    <p className="text-sm font-semibold">{coupon.title || "Coupon"}</p>
                    {coupon.description ? (
                      <p className="mt-1 text-xs text-gray-500">{coupon.description}</p>
                    ) : null}
                    <p className="mt-2 inline-flex rounded-md border border-[#c0f24d]/40 px-2.5 py-1 text-xs font-medium text-[#c0f24d]">
                      {coupon.code || coupon.couponCode || coupon.promoCode || "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function isVideoMedia(value) {
  return /(\.mp4|\.webm|\.ogg|\.mov|\.m4v|\.avi|\.mkv)(\?|$)/i.test(String(value || ""));
}

function PartnerAboutBlockOne({ partner, showDescription = false, showPartnerIcon = false }) {
  const locationText = partner?.location || [partner?.city, partner?.country].filter(Boolean).join(", ");
  const joinedText = partner?.createdAt
    ? new Date(partner.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    })
    : null;

  const websiteLink = normalizeUrl(partner?.website);
  const instagramLink = normalizeUrl(partner?.instagram);
  const emailLink = partner?.contactEmail ? `mailto:${partner.contactEmail}` : null;
  const phoneValue = String(partner?.contactPhone || "").trim();
  const phoneLink = phoneValue ? `tel:${phoneValue}` : null;
  const hasMeta = locationText || joinedText || partner?.industry || partner?.type;
  const hasContact = websiteLink || emailLink || phoneValue;

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="rounded-lg p-4 sm:p-5 text-center">
          {showPartnerIcon ? (
            <div className="mx-auto mb-4 h-20 w-20 overflow-hidden bg-black sm:h-24 sm:w-24">
              {partner?.profilePhotoUrl || partner?.logoUrl ? (
                <img
                  src={getMediaUrl(partner.profilePhotoUrl || partner.logoUrl) || partner.profilePhotoUrl || partner.logoUrl}
                  alt={partner?.name || "Partner logo"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/african-panther-dark.svg";
                  }}
                />
              ) : (
                <img
                  src="/assets/african-panther-dark.svg"
                  alt="Partner placeholder"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          ) : null}

          <p className="text-sm font-medium text-white">
            {partner?.name || "Partner"}
          </p>
          {hasMeta ? (
            <div className="mt-1 max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-light tracking-[0.02em] text-gray-200/90">
              {locationText ? (
                <span className="inline-flex items-center gap-1">
                  <FiMapPin size={12} /> {locationText}
                </span>
              ) : null}
              {locationText && (joinedText || partner?.industry || partner?.type) ? <span className="text-gray-500">|</span> : null}
              {joinedText ? <span>Joined {joinedText}</span> : null}
              {joinedText && (partner?.industry || partner?.type) ? <span className="text-gray-500">|</span> : null}
              {partner?.industry ? <span>Industry: {partner.industry}</span> : null}
              {partner?.industry && partner?.type ? <span className="text-gray-500">|</span> : null}
              {partner?.type ? <span>Type: {partner.type}</span> : null}
            </div>
          ) : null}

          {hasContact ? (
            <div className="mt-2 max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-light tracking-[0.02em] text-gray-200/90">
              {websiteLink ? (
                <a
                  href={websiteLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <FaGlobe size={12} /> Website
                </a>
              ) : null}
              {websiteLink && (emailLink || phoneValue) ? <span className="text-gray-500">|</span> : null}
              {emailLink ? (
                <a
                  href={emailLink}
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <FiMail size={12} /> Email
                </a>
              ) : null}
              {emailLink && phoneValue ? <span className="text-gray-500">|</span> : null}
              {phoneLink ? (
                <a
                  href={phoneLink}
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  Phone: {phoneValue}
                </a>
              ) : null}
            </div>
          ) : null}

          {showDescription && (partner?.aboutPrimaryBody || partner?.description) ? (
            <div className="mt-3 max-w-2xl mx-auto max-h-30 overflow-y-auto hide-scrollbar">
              <p className="whitespace-pre-wrap text-[11px] font-light leading-6 tracking-[0.02em] text-gray-200/90">
                {partner.aboutPrimaryBody || partner.description}
              </p>
            </div>
          ) : null}

          {instagramLink ? (
            <div className="mt-2">
              <a
                href={instagramLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-light tracking-[0.02em] text-gray-200/90 hover:text-white transition-colors"
              >
                <FaInstagram size={12} /> Instagram
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function getMediaUrl(path) {
  if (!path) return null;
  const value = String(path).trim();
  if (value.startsWith("http") || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }
  if (/^:\d+\//.test(value)) {
    return `http://localhost${value}`;
  }
  if (/^localhost:\d+\//i.test(value)) {
    return `http://${value}`;
  }
  if (/^\/\/localhost:\d+\//i.test(value)) {
    return `http:${value}`;
  }
  const normalized = value.startsWith("/") ? value : `/${value}`;
  if (import.meta.env.PROD) {
    return normalized;
  }
  if (normalized.startsWith("/api") || normalized.startsWith("/uploads")) {
    return `http://localhost:8081${normalized}`;
  }
  return `http://localhost:8081/api/v1${normalized}`;
}

function normalizeUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed.replace(/^\/+/, "")}`;
}



