import React from "react";
import { Link } from "react-router-dom";

const apiBaseUrl =
  import.meta?.env?.VITE_API_BASE_URL || "http://localhost:8081/api/v1";
const apiOrigin = apiBaseUrl.replace(/\/api\/v1\/?$/, "");

const resolveMediaUrl = (value) => {
  if (!value) return "";

  const path = String(value).trim();
  if (!path) return "";

  if (
    /^https?:\/\//i.test(path) ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  if (path.startsWith("/assets/")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (
    normalizedPath.startsWith("/uploads/") ||
    normalizedPath.startsWith("/api/v1/uploads/")
  ) {
    return `${apiOrigin}${normalizedPath}`;
  }

  return normalizedPath;
};

const getPartnerLogo = (partner) =>
  resolveMediaUrl(
    partner?.logoUrl ||
      partner?.profilePhotoUrl ||
      partner?.logo ||
      partner?.profilePicture ||
      partner?.photoUrl ||
      partner?.image ||
      partner?.avatar,
  );

export default function PartnersShowcaseSection({ partners = [] }) {
  const hasPartners = Array.isArray(partners) && partners.length > 0;

  return (
    <section className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-center">
        <h2 className="text-lg sm:text-xl font-semibold text-white text-center">
          Partners
        </h2>
      </div>

      {hasPartners ? (
        <div className="overflow-hidden pb-2">
          <div className="partners-marquee-track flex min-w-max gap-3 sm:gap-4">
            {partners.map((partner) => {
              const logoSrc = getPartnerLogo(partner);

              return (
                <Link
                  key={partner.id}
                  to={`/partners/${partner.id}`}
                  className="group flex w-40 shrink-0 flex-col p-3 transition-colors sm:w-44"
                >
                  <div className="flex h-24 items-center justify-center overflow-hidden p-2">
                    {logoSrc ? (
                      <img
                        src={logoSrc}
                        alt={partner.name || "Partner logo"}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-[#c0f24d]">
                        {String(partner.name || "P").charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="mt-1 pt-0.5">
                    <p className="line-clamp-1 text-center text-sm font-semibold text-white group-hover:text-[#c0f24d]">
                      {partner.name || "Partner"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-5 text-sm text-zinc-400">
          No featured partners yet. This area updates when partners are selected in admin.
        </div>
      )}
    </section>
  );
}

