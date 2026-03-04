import React from "react";
import { FaBarcode, FaCalendarAlt, FaClock } from "react-icons/fa";

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
};

const TicketPreview = ({
  ticket,
  tickets = [],
  eventTitle,
  venueName,
  eventDate,
  eventTime,
  currency = "NGN",
}) => {
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  // Handle both single ticket and multiple tickets
  const displayTickets =
    tickets && tickets.length > 0 ? tickets : ticket ? [ticket] : [];

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    // Handle both Date objects and strings
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    // Handle Date objects from DatePicker
    if (timeStr instanceof Date) {
      const hours = String(timeStr.getHours()).padStart(2, "0");
      const minutes = String(timeStr.getMinutes()).padStart(2, "0");
      const hour = timeStr.getHours();
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    // Handle string format "HH:MM"
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // If no tickets, show placeholder
  if (displayTickets.length === 0) {
    return (
      <div className="bg-linear-to-br from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg max-w-sm opacity-50">
        <div className="mb-6 pb-4 border-b border-red-500 border-opacity-50">
          <p className="text-xs font-light text-red-200 mb-1">EVENT TICKET</p>
          <h3 className="text-lg font-light">Add tickets to preview</h3>
        </div>
        <p className="text-sm text-red-100">Ticket preview will appear here</p>
      </div>
    );
  }

  // Show all tickets in a scrollable list
  return (
    <div className="space-y-4">
      {displayTickets.map((currentTicket, index) => (
        <div
          key={index}
          className="bg-linear-to-br from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg max-w-sm"
        >
          {/* Header */}
          <div className="mb-6 pb-4 border-b border-red-500 border-opacity-50">
            <p className="text-xs font-light text-red-200 mb-1">EVENT TICKET</p>
            <h3 className="text-lg font-light line-clamp-2">
              {eventTitle || "Event Name"}
            </h3>
            {displayTickets.length > 1 && (
              <p className="text-xs font-light text-red-300 mt-2">
                Ticket {index + 1} of {displayTickets.length}
              </p>
            )}
          </div>

          {/* Date & Time */}
          {(eventDate || eventTime) && (
            <div className="mb-4 space-y-2 text-xs">
              {eventDate && (
                <div className="flex items-center gap-2 text-red-100">
                  <FaCalendarAlt className="w-3 h-3" />
                  <span>{formatDate(eventDate)}</span>
                </div>
              )}
              {eventTime && (
                <div className="flex items-center gap-2 text-red-100">
                  <FaClock className="w-3 h-3" />
                  <span>{formatTime(eventTime)}</span>
                </div>
              )}
            </div>
          )}

          {/* Ticket Info */}
          <div className="space-y-3 mb-6">
            <div>
              <p className="text-xs font-light text-red-200">TICKET TYPE</p>
              <p className="text-sm font-light">
                {currentTicket?.ticketType || "General Admission"}
              </p>
            </div>

            <div className="flex justify-between">
              <div>
                <p className="text-xs font-light text-red-200">PRICE</p>
                <p className="text-2xl font-light">
                  {currencySymbol}
                  {currentTicket?.price || "0"}
                </p>
              </div>
              <div>
                <p className="text-xs font-light text-red-200">QUANTITY</p>
                <p className="text-sm font-light">
                  {currentTicket?.quantity || "∞"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-light text-red-200">VENUE</p>
              <p className="text-sm font-light line-clamp-2">
                {venueName || "Venue Location"}
              </p>
            </div>
          </div>

          {/* Barcode Area */}
          <div className="bg-white rounded-lg p-3 flex items-center justify-center mb-4">
            <FaBarcode className="w-12 h-12 text-gray-300" />
          </div>

          {/* Footer */}
          <p className="text-xs font-light text-red-200 text-center">
            Scan this ticket at the event entrance
          </p>
        </div>
      ))}
    </div>
  );
};

export default TicketPreview;
