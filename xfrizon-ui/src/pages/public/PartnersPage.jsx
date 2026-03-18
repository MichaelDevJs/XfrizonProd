import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import partnersApi from "../../api/partnersApi";
import RedeemModal from "../../component/points/RedeemModal";

const CATEGORIES = [
  { key: null, label: "All" },
  { key: "FOOD", label: "🍔 Food" },
  { key: "HAIR_SALON", label: "✂️ Hair Salon" },
  { key: "FASHION", label: "👗 Fashion" },
  { key: "BEAUTY", label: "💄 Beauty" },
  { key: "FITNESS", label: "🏋️ Fitness" },
  { key: "ENTERTAINMENT", label: "🎭 Entertainment" },
  { key: "OTHER", label: "🏷️ Other" },
];

const TYPE_BADGE = {
  ONLINE: {
    label: "Online",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  IN_PERSON: {
    label: "In-Person",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  BOTH: {
    label: "Online & In-Person",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
};

export default function PartnersPage() {
  const [partners, setPartners] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);

  useEffect(() => {
    setLoading(true);
    const runner = search.trim()
      ? partnersApi.search(search.trim())
      : partnersApi.getAll(activeCategory);

    runner
      .then((data) => {
        const filtered = activeCategory
          ? data.filter((p) => p.category === activeCategory)
          : data;
        setPartners(filtered);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory, search]);

  const partnerCount = useMemo(() => partners.length, [partners]);

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">
          XF Partner Rewards
        </h1>
        <p className="text-gray-400 text-sm">
          Earn points on every ticket — redeem for exclusive discounts at our
          partner brands.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partners by name"
            className="w-full sm:max-w-md bg-[#0f0f0f] border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <Link
            to="/partner-register"
            className="inline-flex items-center justify-center bg-[#c0f24d] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110"
          >
            Register as Partner
          </Link>
        </div>
        <p className="text-xs text-gray-500 mt-2">{partnerCount} partner profiles found</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key ?? "all"}
            onClick={() => setActiveCategory(key)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
              activeCategory === key
                ? "bg-[#c0f24d] text-black border-[#c0f24d] font-semibold"
                : "border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#c0f24d] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No partners found in this category yet. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner) => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              onRedeem={setSelectedOffer}
            />
          ))}
        </div>
      )}

      {selectedOffer && (
        <RedeemModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
        />
      )}
    </div>
  );
}

function PartnerCard({ partner, onRedeem }) {
  const [expanded, setExpanded] = useState(false);
  const badge = TYPE_BADGE[partner.type] || TYPE_BADGE.BOTH;

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all">
      {/* Logo / Header */}
      <div className="h-36 bg-[#111] flex items-center justify-center p-4 border-b border-gray-800">
        {partner.logoUrl ? (
          <img
            src={partner.logoUrl}
            alt={partner.name}
            className="max-h-24 max-w-full object-contain"
            onError={(e) => {
              e.currentTarget.src = "/assets/african-panther-dark.svg";
            }}
          />
        ) : (
          <img
            src="/assets/african-panther-dark.svg"
            alt="Partner placeholder"
            className="max-h-24 max-w-full object-contain"
          />
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-white font-semibold text-base leading-tight">
            {partner.name}
          </h3>
          <span
            className={`text-xs px-2 py-0.5 rounded border shrink-0 ${badge.color}`}
          >
            {badge.label}
          </span>
        </div>

        {partner.description && (
          <p className="text-gray-400 text-xs mt-1 mb-3 line-clamp-2">
            {partner.description}
          </p>
        )}

        {partner.location && (
          <p className="text-gray-500 text-xs mb-1">📍 {partner.location}</p>
        )}
        {partner.website && (
          <a
            href={partner.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#c0f24d] text-xs hover:underline"
          >
            🌐 {partner.website}
          </a>
        )}

        {/* Offers */}
        {partner.offers && partner.offers.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-gray-400 hover:text-white mb-2 flex items-center gap-1"
            >
              {expanded ? "▲" : "▼"} {partner.offers.length} offer
              {partner.offers.length !== 1 ? "s" : ""} available
            </button>

            {expanded && (
              <div className="space-y-2">
                {partner.offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-[#111] rounded-lg p-3 border border-gray-700 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-white text-xs font-medium">
                        {offer.title}
                      </p>
                      <p className="text-[#c0f24d] text-xs mt-0.5 font-bold">
                        {offer.discountPercent}% OFF
                      </p>
                      <p className="text-gray-500 text-xs">
                        {offer.pointsCost.toLocaleString()} pts
                      </p>
                    </div>
                    <button
                      onClick={() => onRedeem(offer)}
                      className="shrink-0 bg-[#c0f24d] hover:brightness-110 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                    >
                      Redeem
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
          <Link
            to={`/partners/${partner.id}`}
            className="text-xs text-gray-300 hover:text-white underline"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
