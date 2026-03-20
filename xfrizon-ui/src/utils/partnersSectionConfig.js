const createFallbackManualPartnerId = (index = 0) =>
  `manual-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;

export const createPartnerOrderToken = (partnerId) =>
  `partner:${String(partnerId)}`;

export const createManualOrderToken = (manualPartnerId) =>
  `manual:${String(manualPartnerId)}`;

export const syncPartnersSectionOrder = ({
  order = [],
  partnerIds = [],
  manualPartners = [],
}) => {
  const validTokens = [
    ...partnerIds.map((id) => createPartnerOrderToken(id)),
    ...manualPartners.map((partner) => createManualOrderToken(partner.id)),
  ];
  const validTokenSet = new Set(validTokens);
  const normalizedOrder = Array.isArray(order)
    ? order
        .map((token) => String(token))
        .filter((token) => validTokenSet.has(token))
    : [];
  const missingTokens = validTokens.filter(
    (token) => !normalizedOrder.includes(token),
  );

  return [...normalizedOrder, ...missingTokens];
};

export const normalizeManualPartnerEntry = (entry, index = 0) => ({
  id:
    typeof entry?.id === "string" && entry.id.trim()
      ? entry.id.trim()
      : createFallbackManualPartnerId(index),
  name: typeof entry?.name === "string" ? entry.name.trim() : "",
  logoUrl: typeof entry?.logoUrl === "string" ? entry.logoUrl.trim() : "",
});

export const parsePartnersSectionConfig = (rawValue) => {
  if (typeof rawValue !== "string" || !rawValue.trim()) {
    return {
      configured: false,
      partnerIds: [],
      manualPartners: [],
    };
  }

  const parsed = JSON.parse(rawValue);

  if (Array.isArray(parsed)) {
    return {
      configured: true,
      partnerIds: parsed.map((id) => String(id)),
      manualPartners: [],
      order: parsed.map((id) => createPartnerOrderToken(id)),
    };
  }

  if (parsed && typeof parsed === "object") {
    const rawPartnerIds = Array.isArray(parsed.partnerIds)
      ? parsed.partnerIds
      : Array.isArray(parsed.selectedPartnerIds)
        ? parsed.selectedPartnerIds
        : [];
    const rawManualPartners = Array.isArray(parsed.manualPartners)
      ? parsed.manualPartners
      : [];
    const partnerIds = rawPartnerIds.map((id) => String(id));
    const manualPartners = rawManualPartners.map((entry, index) =>
      normalizeManualPartnerEntry(entry, index),
    );

    return {
      configured: true,
      partnerIds,
      manualPartners,
      order: syncPartnersSectionOrder({
        order: Array.isArray(parsed.order) ? parsed.order : [],
        partnerIds,
        manualPartners,
      }),
    };
  }

  return {
    configured: true,
    partnerIds: [],
    manualPartners: [],
    order: [],
  };
};

export const serializePartnersSectionConfig = ({
  partnerIds = [],
  manualPartners = [],
  order = [],
}) =>
  {
    const normalizedPartnerIds = partnerIds.map((id) => String(id));
    const normalizedManualPartners = manualPartners.map((entry, index) =>
      normalizeManualPartnerEntry(entry, index),
    );

    return JSON.stringify({
      partnerIds: normalizedPartnerIds,
      manualPartners: normalizedManualPartners,
      order: syncPartnersSectionOrder({
        order,
        partnerIds: normalizedPartnerIds,
        manualPartners: normalizedManualPartners,
      }),
    });
  };