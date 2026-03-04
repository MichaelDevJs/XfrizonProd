import { toast } from "react-toastify";
import api from "../api/axios";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

/**
 * Unified ticket download and parsing service
 * Used by both TicketHistory and PaymentSuccessPage
 */

// Standardize ticket response data
export const normalizeTicketData = (ticket) => {
  if (!ticket) return null;

  // Handle both camelCase and snake_case field names from API
  return {
    id: ticket.id,
    eventId: ticket.eventId || ticket.event_id,
    eventTitle: ticket.eventTitle || ticket.event_title,
    eventDate: ticket.eventDate || ticket.event_date,
    eventLocation: ticket.eventLocation || ticket.event_location,
    eventFlyerUrl: ticket.eventFlyerUrl || ticket.event_flyer_url,
    currency:
      ticket.currency ||
      ticket.currencyCode ||
      ticket.currency_code ||
      ticket.eventCurrency ||
      ticket.event_currency ||
      ticket.ticketCurrency ||
      ticket.ticket_currency ||
      null,
    ticketId: ticket.ticketId || ticket.ticket_id,
    ticketType: ticket.ticketType || ticket.ticket_type,
    ticketTier: ticket.ticketTier || ticket.ticket_tier,
    quantity: ticket.quantity,
    purchaseDate: ticket.purchaseDate || ticket.purchase_date,
    purchasePrice: ticket.purchasePrice || ticket.purchase_price,
    totalPrice: ticket.totalPrice || ticket.total_price,
    status: ticket.status,
    qrCodeUrl: ticket.qrCodeUrl || ticket.qr_code_url,
    pdfUrl: ticket.pdfUrl || ticket.pdf_url,
    validationCode: ticket.validationCode || ticket.validation_code,
    paymentIntentId: ticket.paymentIntentId || ticket.payment_intent_id,
    stripeIntentId: ticket.stripeIntentId || ticket.stripe_intent_id,
    event: ticket.event, // Nested event object
  };
};

// Parse API response to extract tickets
export const parseTicketsFromResponse = (response) => {
  let tickets = [];

  // Handle ApiResponse wrapper format
  if (response?.data?.data) {
    const data = response.data.data;
    if (Array.isArray(data)) {
      tickets = data;
    } else if (data.content && Array.isArray(data.content)) {
      // Handle pagination format
      tickets = data.content;
    } else {
      // Single ticket response
      tickets = [data];
    }
  } else if (Array.isArray(response?.data)) {
    tickets = response.data;
  }

  // Normalize all ticket data
  return tickets.map(normalizeTicketData).filter(Boolean);
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api/v1";

const sanitizeFilename = (value) => {
  const safe = String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return safe || "ticket";
};

const CURRENCY_SYMBOLS = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
  KES: "KSh",
  ZAR: "R",
  GHS: "GH₵",
  CAD: "C$",
  INR: "₹",
  UGX: "UGX",
  AUD: "A$",
  JPY: "¥",
  CHF: "CHF",
  SEK: "kr",
  NZD: "NZ$",
};

const getAbsoluteUrl = (url) => {
  if (!url) return null;
  if (typeof url !== "string") return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });

const tryFetchImageDataUrl = async (url) => {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.type?.startsWith("image/")) return null;
    const type = blob.type.toLowerCase();
    // jsPDF frequently can't embed WEBP directly
    if (type.includes("webp")) return null;
    const dataUrl = await blobToDataUrl(blob);
    const format = type.includes("png") ? "PNG" : "JPEG";
    return { dataUrl, format };
  } catch {
    return null;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const uniqParts = (parts) => {
  const seen = new Set();
  const out = [];
  for (const part of parts) {
    const value = String(part || "").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
};

const buildGoogleMapsLink = (query) => {
  const q = String(query || "").trim();
  if (!q) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
};

const formatAmountWithCurrency = (amountValue, currencyCode) => {
  const currency = String(currencyCode || "").trim() || "NGN";
  const symbol = CURRENCY_SYMBOLS[currency] || "";

  const number =
    typeof amountValue === "number"
      ? amountValue
      : typeof amountValue === "string"
        ? Number.parseFloat(amountValue)
        : Number.NaN;
  if (Number.isNaN(number)) return "";

  const formattedNumber = number.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
    maximumFractionDigits: 2,
  });

  if (symbol && symbol !== currency)
    return `${symbol}${formattedNumber} ${currency}`;
  return `${currency} ${formattedNumber}`;
};

const getTicketDisplayFields = (ticket) => {
  const event = ticket?.event || {};
  const eventTitle =
    ticket?.eventTitle || event?.title || event?.name || "Event";
  const eventDate =
    ticket?.eventDate ||
    event?.eventDateTime ||
    event?.event_date_time ||
    event?.dateTime ||
    "";

  const venueName =
    ticket?.venueName ||
    ticket?.venue ||
    ticket?.eventVenue ||
    event?.venueName ||
    event?.venue_name ||
    event?.venue ||
    event?.locationName ||
    event?.location_name ||
    "";

  const venueAddress =
    ticket?.venueAddress ||
    ticket?.address ||
    event?.venueAddress ||
    event?.venue_address ||
    event?.address ||
    event?.locationAddress ||
    event?.location_address ||
    "";

  const city = ticket?.city || event?.city || "";
  const state = ticket?.state || event?.state || "";
  const country = ticket?.country || event?.country || "";

  // Some backends send a single "eventLocation" string; keep it but avoid duplicates.
  const fallbackLocation =
    ticket?.eventLocation || ticket?.event_location || "";

  const location = uniqParts([
    venueName,
    venueAddress,
    fallbackLocation,
    city,
    state,
    country,
  ]).join(", ");

  const flyerUrl =
    ticket?.eventFlyerUrl || event?.flyerUrl || event?.flyer_url || null;

  const ticketType =
    ticket?.ticketType || ticket?.ticketTier?.name || ticket?.ticketTier || "";
  const quantity = ticket?.quantity || 1;

  const validationCode =
    ticket?.validationCode || ticket?.validation_code || "";
  const ticketRef = ticket?.ticketId || ticket?.ticket_id || ticket?.id || "";

  const purchaseDate = ticket?.purchaseDate || ticket?.purchase_date || "";

  // Prefer the currency captured on the ticket/tier (source of truth), then fall back to event/organizer.
  const currency =
    ticket?.currency ||
    ticket?.currencyCode ||
    ticket?.currency_code ||
    ticket?.eventCurrency ||
    ticket?.event_currency ||
    ticket?.ticketCurrency ||
    ticket?.ticket_currency ||
    ticket?.ticketTierCurrency ||
    ticket?.ticket_tier_currency ||
    ticket?.ticketTier?.currency ||
    ticket?.ticketTier?.currencyCode ||
    ticket?.ticketTier?.currency_code ||
    event?.currency ||
    event?.currencyCode ||
    event?.currency_code ||
    event?.baseCurrency ||
    event?.base_currency ||
    event?.priceCurrency ||
    event?.price_currency ||
    event?.organizerCurrency ||
    event?.organizer_currency ||
    event?.organizer?.currency ||
    event?.organizer?.currencyCode ||
    event?.organizer?.currency_code ||
    "NGN";

  const amountNumber =
    ticket?.totalPrice ??
    ticket?.total_price ??
    ticket?.purchasePrice ??
    ticket?.purchase_price ??
    ticket?.amount ??
    ticket?.price ??
    "";

  const amountText = formatAmountWithCurrency(amountNumber, currency);

  const qrPayload =
    ticket?.qrCodeUrl ||
    (ticket?.validationCode
      ? `XFRIZON:TICKET:${ticket.validationCode}`
      : ticketRef);

  const paymentRef = ticket?.paymentIntentId || ticket?.stripeIntentId || "";

  const mapLink =
    event?.venueMapLink ||
    event?.mapLink ||
    event?.map_url ||
    ticket?.venueMapLink ||
    ticket?.mapLink ||
    ticket?.map_url ||
    "";
  const mapUrl = getAbsoluteUrl(mapLink) || buildGoogleMapsLink(location);

  return {
    eventTitle,
    eventDate,
    location,
    flyerUrl,
    ticketType,
    quantity,
    ticketRef,
    validationCode,
    amountText,
    purchaseDate,
    currency,
    qrPayload,
    paymentRef,
    mapUrl,
  };
};

const renderTicketPdfPage = async (doc, ticket) => {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Theme colors (match screenshot)
  const bg = [24, 24, 27];
  const text = [229, 231, 235];
  const muted = [156, 163, 175];
  const accent = [64, 56, 56]; // #403838
  const border = [64, 56, 56]; // #403838
  const panel = [17, 17, 19];

  const {
    eventTitle,
    eventDate,
    location,
    flyerUrl,
    ticketType,
    quantity,
    ticketRef,
    validationCode,
    amountText,
    purchaseDate,
    currency,
    qrPayload,
    paymentRef,
    mapUrl,
  } = getTicketDisplayFields(ticket);

  // Background
  doc.setFillColor(...bg);
  doc.rect(0, 0, pageW, pageH, "F");

  // Top brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...accent);
  doc.text("XFRIZON", pageW / 2, 18, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("Your Event, Your Experience", pageW / 2, 25, {
    align: "center",
  });

  // Flyer panel
  const flyerX = margin;
  const flyerY = 32;
  const flyerW = pageW - margin * 2;
  const flyerH = 64;
  doc.setFillColor(...panel);
  doc.setDrawColor(...border);
  doc.setLineWidth(0.8);
  doc.rect(flyerX, flyerY, flyerW, flyerH, "FD");

  const flyerAbsUrl = getAbsoluteUrl(flyerUrl);
  const flyerImage = await tryFetchImageDataUrl(flyerAbsUrl);
  if (flyerImage?.dataUrl) {
    try {
      const pad = 8;
      const maxW = flyerW - pad * 2;
      const maxH = flyerH - pad * 2;
      const props = doc.getImageProperties(flyerImage.dataUrl);
      const imgRatio =
        props?.width && props?.height ? props.width / props.height : 1;
      const boxRatio = maxW / maxH;
      const drawW = imgRatio > boxRatio ? maxW : maxH * imgRatio;
      const drawH = imgRatio > boxRatio ? maxW / imgRatio : maxH;
      const drawX = flyerX + pad + (maxW - drawW) / 2;
      const drawY = flyerY + pad + (maxH - drawH) / 2;
      doc.addImage(
        flyerImage.dataUrl,
        flyerImage.format,
        drawX,
        drawY,
        drawW,
        drawH,
      );
    } catch {
      // If addImage fails, keep panel empty
    }
  }

  // Middle section: QR (left) + event details (right)
  const midY = flyerY + flyerH + 10;
  const qrBoxW = 70;
  const qrBoxH = 62;
  const gap = 10;

  const qrBoxX = margin;
  const qrBoxY = midY;
  doc.setFillColor(...panel);
  doc.setDrawColor(...border);
  doc.setLineWidth(0.8);
  doc.rect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...accent);
  doc.text("SCAN TO VERIFY", qrBoxX + qrBoxW / 2, qrBoxY + 8, {
    align: "center",
  });

  // QR white square - centered
  const qrSquare = 40;
  const qrSquareX = qrBoxX + (qrBoxW - qrSquare) / 2;
  const qrSquareY = qrBoxY + 12;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(qrSquareX, qrSquareY, qrSquare, qrSquare, "FD");

  try {
    const qrDataUrl = await QRCode.toDataURL(
      String(qrPayload || validationCode || ticketRef || ""),
      {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 256,
        color: { dark: "#000000", light: "#FFFFFF" },
      },
    );
    doc.addImage(
      qrDataUrl,
      "PNG",
      qrSquareX + 2,
      qrSquareY + 2,
      qrSquare - 4,
      qrSquare - 4,
    );
  } catch {
    // leave blank
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...muted);
  const idText =
    validationCode || ticketRef
      ? `ID: ${validationCode || ticketRef}`
      : "ID: —";
  doc.text(idText, qrBoxX + qrBoxW / 2, qrBoxY + qrBoxH - 5, {
    align: "center",
  });

  // Event details (right)
  const detailsX = qrBoxX + qrBoxW + gap;
  const detailsY = midY;
  const detailsW = pageW - margin - detailsX;
  const detailsH = qrBoxH;

  doc.setFillColor(...bg);
  doc.setDrawColor(...bg);
  doc.rect(detailsX, detailsY, detailsW, detailsH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...text);
  const nameLines = doc.splitTextToSize(eventTitle, detailsW);
  doc.text(nameLines, detailsX, detailsY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.text(
    `${formatDate(eventDate) || ""}${eventDate ? " | " : ""}${formatTime(eventDate) || ""}`.trim() ||
      "Date / Time TBD",
    detailsX,
    detailsY + 16,
  );

  const locLines = doc.splitTextToSize(location || "—", detailsW);
  doc.text(locLines, detailsX, detailsY + 23);

  doc.setFontSize(7);
  doc.setTextColor(...muted);
  const detailsGap = 6;
  const colW = (detailsW - detailsGap) / 2;
  const leftX = detailsX;
  const rightX = detailsX + colW + detailsGap;

  // Ticket Type (left column)
  doc.text("Ticket Type:", leftX, detailsY + 38);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...accent);
  const typeLine =
    doc.splitTextToSize(ticketType || "General", colW)[0] || "General";
  doc.text(typeLine, leftX, detailsY + 45);

  // Venue Location (right column) with same styling
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...muted);
  doc.text("Venue Location:", rightX, detailsY + 38);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...accent);
  const venueShort = location
    ? location
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .slice(0, 2)
        .join(", ")
    : "—";
  const venueLine = doc.splitTextToSize(venueShort || "—", colW)[0] || "—";
  doc.text(venueLine, rightX, detailsY + 45);

  // Open map (clickable) below venue location
  if (mapUrl && mapUrl !== "") {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(220, 38, 38);
    if (typeof doc.textWithLink === "function") {
      doc.textWithLink("Open map", rightX, detailsY + 53, { url: mapUrl });
    } else {
      doc.text(`Map: ${mapUrl}`, rightX, detailsY + 53);
    }
  }

  // Ticket details table with better text wrapping
  const tableTitleY = detailsY + detailsH + 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...accent);
  doc.text("TICKET DETAILS", margin, tableTitleY);

  const tableX = margin;
  const tableY = tableTitleY + 6;
  const tableW = pageW - margin * 2;
  const tableH = 28; // Increased height to accommodate wrapped text
  const half = tableW / 2;
  const rowH = tableH / 2;
  const cellPadX = 3;
  const maxCellW = half - cellPadX * 2;

  doc.setFillColor(...bg);
  doc.setDrawColor(...border);
  doc.setLineWidth(0.6);
  doc.rect(tableX, tableY, tableW, tableH, "S");
  doc.line(tableX + half, tableY, tableX + half, tableY + tableH);
  doc.line(tableX, tableY + rowH, tableX + tableW, tableY + rowH);

  const cellLabel = (x, y, txt) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...accent);
    doc.text(txt, x + cellPadX, y + 5);
  };

  const cellValue = (x, y, txt) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...text);
    // Use splitTextToSize to handle long text
    const lines = doc.splitTextToSize(String(txt || "—"), maxCellW);
    doc.text(lines, x + cellPadX, y + 12);
  };

  cellLabel(tableX, tableY, "Ticket ID");
  cellValue(tableX, tableY, ticketRef || "—");

  cellLabel(tableX + half, tableY, "Quantity");
  cellValue(tableX + half, tableY, String(quantity));

  cellLabel(tableX, tableY + rowH, "Amount");
  cellValue(tableX, tableY + rowH, amountText || "—");

  cellLabel(tableX + half, tableY + rowH, "Purchase Date");
  cellValue(
    tableX + half,
    tableY + rowH,
    formatDate(purchaseDate) || (purchaseDate ? String(purchaseDate) : "—"),
  );

  // Note above footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.text(
    "Please show this QR code at the event entrance",
    pageW / 2,
    tableY + tableH + 18,
    { align: "center" },
  );

  // Footer (keep it on one page)
  const footerTop = pageH - 32;
  doc.setDrawColor(55, 65, 81);
  doc.setLineWidth(0.3);
  doc.line(margin, footerTop, pageW - margin, footerTop);

  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.text("Keep this ticket safe and secure", pageW / 2, footerTop + 10, {
    align: "center",
  });
  doc.text(
    "Digital ticket is valid only for registered user",
    pageW / 2,
    footerTop + 16,
    { align: "center" },
  );
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text(
    `© ${new Date().getFullYear()} XFRIZON. All rights reserved.`,
    pageW / 2,
    footerTop + 22,
    { align: "center" },
  );
};

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
};

const tryFetchTicketById = async (ticketId) => {
  if (!ticketId) return null;

  // Try direct endpoint first
  try {
    const response = await api.get(`/user-tickets/${ticketId}`);
    const tickets = parseTicketsFromResponse(response);
    if (tickets?.[0]) return tickets[0];
  } catch {
    // ignore
  }

  // Fallback to list endpoints
  const listEndpoints = ["/user-tickets", "/user-tickets/list"];
  for (const endpoint of listEndpoints) {
    try {
      const response = await api.get(endpoint);
      const tickets = parseTicketsFromResponse(response);
      const found = tickets.find((t) => String(t.id) === String(ticketId));
      if (found) return found;
    } catch {
      // ignore
    }
  }

  return null;
};

// Download ticket PDF
export const downloadTicketPDF = async (ticketOrId, eventTitle = "event") => {
  try {
    const ticketId =
      typeof ticketOrId === "object" && ticketOrId !== null
        ? ticketOrId.id
        : ticketOrId;

    if (!ticketId) {
      throw new Error("No ticket ID provided");
    }

    // Prefer client-side branded PDF generation
    const ticketData =
      typeof ticketOrId === "object" && ticketOrId !== null
        ? normalizeTicketData(ticketOrId)
        : await tryFetchTicketById(ticketId);

    if (ticketData) {
      const fields = getTicketDisplayFields(ticketData);
      const fileBase = sanitizeFilename(
        fields.eventTitle || eventTitle || ticketId,
      );
      const filename = `XF-ticket-${fileBase}.pdf`;

      try {
        const doc = new jsPDF({ unit: "mm", format: "a4" });
        await renderTicketPdfPage(doc, ticketData);
        const blob = doc.output("blob");
        downloadBlob(blob, filename);
        toast.success("Ticket downloaded successfully!");
        return true;
      } catch (pdfError) {
        console.warn(
          "Client-side PDF generation failed; falling back to backend PDF:",
          pdfError,
        );
      }
    }

    // Fallback: backend-generated PDF
    const response = await api.get(`/user-tickets/${ticketId}/download-pdf`, {
      responseType: "blob",
    });
    downloadBlob(
      response.data,
      `ticket-${sanitizeFilename(eventTitle || ticketId)}.pdf`,
    );
    toast.success("Ticket downloaded successfully!");
    return true;
  } catch (error) {
    console.error("Error downloading ticket PDF:", error);
    toast.error("Failed to download ticket");
    return false;
  }
};

// Download combined PDF for all tickets from a single payment
export const downloadCombinedTicketsPDF = async (
  paymentIntentId,
  eventTitle = "tickets",
) => {
  try {
    if (!paymentIntentId) {
      throw new Error("No payment intent ID provided");
    }

    // Try client-side combined PDF first
    try {
      const listResponse = await api.get("/user-tickets/list");
      const allTickets = parseTicketsFromResponse(listResponse);
      const purchasedTickets = allTickets.filter(
        (t) =>
          t.paymentIntentId === paymentIntentId ||
          t.stripeIntentId === paymentIntentId,
      );

      if (purchasedTickets.length > 0) {
        const fileBase = sanitizeFilename(eventTitle || "tickets");
        const filename = `XF-tickets-${fileBase}.pdf`;

        const doc = new jsPDF({ unit: "mm", format: "a4" });
        for (let i = 0; i < purchasedTickets.length; i += 1) {
          if (i > 0) doc.addPage();
          // eslint-disable-next-line no-await-in-loop
          await renderTicketPdfPage(doc, purchasedTickets[i]);
        }
        const blob = doc.output("blob");
        downloadBlob(blob, filename);
        toast.success("Tickets downloaded successfully!");
        return true;
      }
    } catch (pdfError) {
      console.warn(
        "Client-side combined PDF generation failed; falling back to backend PDF:",
        pdfError,
      );
    }

    // Fallback: backend combined PDF
    const response = await api.get(
      `/user-tickets/payment/${paymentIntentId}/download-pdf`,
      {
        responseType: "blob",
      },
    );
    downloadBlob(response.data, `tickets-${sanitizeFilename(eventTitle)}.pdf`);
    toast.success("Tickets downloaded successfully!");
    return true;
  } catch (error) {
    console.error("Error downloading combined tickets PDF:", error);
    toast.error("Failed to download tickets");
    return false;
  }
};
