import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { FaArrowLeft, FaPlus, FaTrash } from "react-icons/fa";
import TicketPreview from "../../component/organizer/TicketPreview";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  COUNTRY_CURRENCY,
  EVENT_ALLOWED_COUNTRIES,
  EVENT_CITIES_BY_COUNTRY,
} from "../../data/countriesData";

// Get unique currencies from country currency mapping
const SUPPORTED_CURRENCIES = Array.from(
  new Set(Object.values(COUNTRY_CURRENCY)),
).sort();

// Helper function to construct image URLs
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  // Ensure path starts with /
  const normalized = path.startsWith("/") ? path : `/${path}`;
  // Don't add /api/v1 to paths that already start with /api or /uploads
  if (normalized.startsWith("/api") || normalized.startsWith("/uploads")) {
    return `http://localhost:8081${normalized}`;
  }
  return `http://localhost:8081/api/v1${normalized}`;
};

export default function CreateEvent() {
  const navigate = useNavigate();

  const saleWindowDateFormat = {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  const startOfDay = new Date(0, 0, 0, 0, 0);

  const endOfDay = new Date(0, 0, 0, 23, 45);

  const isSameDay = (left, right) =>
    Boolean(left && right) &&
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();

  const [flyer, setFlyer] = useState(null);
  const [flyerPreview, setFlyerPreview] = useState(null);
  const [flyerInputMethod, setFlyerInputMethod] = useState('upload'); // 'upload' or 'url'
  const [flyerUrl, setFlyerUrl] = useState('');
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    eventDate: null,
    eventTime: null,
    eventEndDate: null,
    eventEndTime: null,
    genres: [],
    ageLimit: "",
    capacity: "",
    venueName: "",
    venueAddress: "",
    postalCode: "",
    venueMapLink: "",
    country: "",
    city: "",
    currency: COUNTRY_CURRENCY["Nigeria"] || "NGN",
    tickets: [],
    rsvpEnabled: false,
    rsvpCapacity: "",
    rsvpRequiredFields: [],
  });

  const [ticketInput, setTicketInput] = useState({
    ticketType: "",
    quantity: "",
    price: "",
    saleStart: null,
    saleEnd: null,
    currency:
      COUNTRY_CURRENCY[form.country] || COUNTRY_CURRENCY["Nigeria"] || "NGN",
  });

  const [genreInput, setGenreInput] = useState("");

  const getMinSaleEndTime = () => {
    if (ticketInput.saleStart && isSameDay(ticketInput.saleStart, ticketInput.saleEnd)) {
      return ticketInput.saleStart;
    }

    return startOfDay;
  };

  const handleFlyerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFlyer(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFlyerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFlyerUrlChange = (e) => {
    const url = e.target.value.trim();
    setFlyerUrl(url);
    if (url) {
      // Update preview - add https:// if no protocol provided
      const displayUrl = url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`;
      setFlyerPreview(displayUrl);
      setFlyer(null); // Clear any uploaded file
    } else {
      setFlyerPreview(null);
    }
  };

  const handleInputMethodChange = (method) => {
    setFlyerInputMethod(method);
    if (method === 'upload') {
      setFlyerUrl('');
    } else {
      setFlyer(null);
    }
  };

  const handleCountryChange = (country) => {
    setForm({
      ...form,
      country,
      city: "", // Reset city when country changes
      currency: COUNTRY_CURRENCY[country] || "NGN",
    });
    setTicketInput({
      ...ticketInput,
      currency: COUNTRY_CURRENCY[country] || "NGN",
    });
  };

  const handleAddGenre = () => {
    if (!genreInput.trim()) {
      toast.error("Please enter a genre");
      return;
    }

    if (form.genres.length >= 5) {
      toast.error("Maximum 5 genres allowed");
      return;
    }

    if (!form.genres.includes(genreInput.trim())) {
      setForm({
        ...form,
        genres: [...form.genres, genreInput.trim()],
      });
    }

    setGenreInput("");
  };

  const handleRemoveGenre = (genre) => {
    setForm({
      ...form,
      genres: form.genres.filter((g) => g !== genre),
    });
  };

  const handleAddTicket = () => {
    if (!ticketInput.ticketType || !ticketInput.price) {
      toast.error("Please fill in ticket type and price");
      return;
    }

    if (
      ticketInput.saleStart &&
      ticketInput.saleEnd &&
      ticketInput.saleEnd <= ticketInput.saleStart
    ) {
      toast.error("Ticket sale end must be after the sale start");
      return;
    }

    const newTicket = {
      ticketType: ticketInput.ticketType,
      quantity: parseInt(ticketInput.quantity) || 1,
      price: parseFloat(ticketInput.price) || 0,
      saleStart: ticketInput.saleStart,
      saleEnd: ticketInput.saleEnd,
      currency: COUNTRY_CURRENCY[form.country] || "NGN",
      description: "",
      maxPerPerson: 5,
    };

    setForm({
      ...form,
      tickets: [...form.tickets, newTicket],
    });

    setTicketInput({
      ticketType: "",
      quantity: "",
      price: "",
      saleStart: null,
      saleEnd: null,
      currency: COUNTRY_CURRENCY[form.country] || "NGN",
    });
  };

  const handleRemoveTicket = (index) => {
    const updated = [...form.tickets];
    updated.splice(index, 1);
    setForm({ ...form, tickets: updated });
  };

  const buildGoogleMapsLink = () => {
    const parts = [form.venueAddress, form.city, form.country]
      .map((part) => String(part || "").trim())
      .filter(Boolean);
    if (parts.length === 0) return "";
    const encodedAddress = encodeURIComponent(parts.join(", "));
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  };

  const generateGoogleMapsLink = () => {
    const mapLink = buildGoogleMapsLink();
    if (!mapLink) {
      toast.error("Please enter venue address, city, and country first");
      return;
    }
    setForm({ ...form, venueMapLink: mapLink });
    toast.success("Google Maps link generated!");
  };

  const handleSubmit = async () => {
    if (
      !form.title ||
      !form.eventDate ||
      !form.eventTime ||
      !form.venueName ||
      !form.venueAddress?.trim() ||
      !form.postalCode
    ) {
      toast.error(
        "Please fill in all required fields (venue address is mandatory)",
      );
      return;
    }

    if (form.tickets.length === 0 && !form.rsvpEnabled) {
      toast.error("Add at least one ticket tier or enable RSVP");
      return;
    }

    const invalidSaleWindowTicket = form.tickets.find(
      (ticket) =>
        ticket.saleStart &&
        ticket.saleEnd &&
        new Date(ticket.saleEnd) <= new Date(ticket.saleStart),
    );

    if (invalidSaleWindowTicket) {
      toast.error(
        `${invalidSaleWindowTicket.ticketType || "Ticket tier"} must end after it starts`,
      );
      return;
    }

    try {
      // Format dates for API
      const dateStr = form.eventDate.toISOString().split("T")[0];
      const hours = String(form.eventTime.getHours()).padStart(2, "0");
      const minutes = String(form.eventTime.getMinutes()).padStart(2, "0");
      const timeStr = `${hours}:${minutes}`;

      // Format end date/time if provided
      let eventEndDateStr = null;
      if (form.eventEndDate && form.eventEndTime) {
        const endDateStr = form.eventEndDate.toISOString().split("T")[0];
        const endHours = String(form.eventEndTime.getHours()).padStart(2, "0");
        const endMinutes = String(form.eventEndTime.getMinutes()).padStart(
          2,
          "0",
        );
        const endTimeStr = `${endHours}:${endMinutes}`;
        eventEndDateStr = `${endDateStr}T${endTimeStr}:00`;
      }

      const generatedVenueMapLink =
        form.venueMapLink?.trim() || buildGoogleMapsLink();
      const createEventRequest = {
        title: form.title,
        description: form.description || "Event organized through Xfrizon",
        eventDateTime: `${dateStr}T${timeStr}:00`,
        ...(eventEndDateStr && { eventEndDate: eventEndDateStr }),
        venueName: form.venueName,
        venueAddress: form.venueAddress.trim(),
        venueMapLink: generatedVenueMapLink,
        country: form.country || "Nigeria",
        city: form.city || "",
        currency: form.currency || "NGN",
        ageLimit: form.ageLimit ? parseInt(form.ageLimit) : 0,
        capacity: form.capacity ? parseInt(form.capacity) : 0,
        genres: form.genres || [],
        tickets: form.tickets.map((ticket) => ({
          ticketType: ticket.ticketType || "General",
          currency: ticket.currency || form.currency,
          price: parseFloat(ticket.price) || 0,
          quantity: parseInt(ticket.quantity) || 1,
          maxPerPerson: parseInt(ticket.maxPerPerson) || 1,
          saleStart: ticket.saleStart ? ticket.saleStart.toISOString() : null,
          saleEnd: ticket.saleEnd ? ticket.saleEnd.toISOString() : null,
          description: ticket.description || "",
        })),
        rsvpEnabled: form.rsvpEnabled || false,
        rsvpCapacity: form.rsvpCapacity ? parseInt(form.rsvpCapacity) : null,
        rsvpRequiredFields: form.rsvpRequiredFields || [],
      };

      // Add flyerUrl to request if using external URL
      const isExternalUrl = flyerUrl && flyerUrl.trim() && flyerInputMethod === 'url';
      if (isExternalUrl) {
        const urlToSave = flyerUrl.startsWith('http://') || flyerUrl.startsWith('https://')
          ? flyerUrl
          : `https://${flyerUrl}`;
        createEventRequest.flyerUrl = urlToSave;
        console.log('Adding flyerUrl to create request:', urlToSave);
      }

      console.log('CreateEvent Save Debug:', {
        hasFlyer: !!flyer,
        flyerUrl,
        isExternalUrl,
        flyerInputMethod,
        willSendFlyerUrl: !!createEventRequest.flyerUrl
      });

      // Create event
      const eventResponse = await api.post("/events", createEventRequest);
      const eventId = eventResponse.data.id;

      // Handle flyer file upload separately (if new file selected)
      if (flyer) {
        try {
          console.log('Uploading new flyer file...');
          const formData = new FormData();
          formData.append("file", flyer);
          const flyerRes = await api.post(
            `/events/${eventId}/flyer`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            },
          );
          const uploadedFlyerUrl = flyerRes.data.url || flyerRes.data.flyerUrl;
          console.log('Flyer upload response:', uploadedFlyerUrl);
          // Update event with the uploaded file URL
          if (uploadedFlyerUrl) {
            await api.put(`/events/${eventId}`, { ...createEventRequest, flyerUrl: uploadedFlyerUrl });
            setFlyerPreview(getImageUrl(uploadedFlyerUrl));
          }
          toast.success("✨ Event created and flyer uploaded successfully!");
        } catch (flyerError) {
          console.warn(
            "Flyer upload failed, but event was created:",
            flyerError,
          );
          toast.success(
            "✨ Event created! (Flyer upload failed, but you can update it later)",
          );
        }
      } else if (isExternalUrl) {
        // Preview was already updated when user input the URL
        console.log('External URL saved with event creation');
        setFlyerPreview(createEventRequest.flyerUrl);
        toast.success("✨ Event created with flyer URL successfully!");
      } else {
        toast.success("✨ Event created successfully!");
      }

      setTimeout(() => navigate("/organizer/my-events"), 1500);
    } catch (error) {
      console.error("Event creation error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.tickets?.[0] ||
        "Error creating event. Please check all fields.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-light text-gray-200 mb-2">
            Create Event
          </h1>
          <p className="text-gray-500 font-light">Set up your new event</p>
        </div>
        <button
          onClick={() => navigate("/organizer/dashboard")}
          className="px-4 py-2 text-gray-400 hover:text-white border border-zinc-700 rounded-lg font-light text-sm transition-all duration-300 flex items-center gap-2"
        >
          <FaArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section - Left (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Flyer Section */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-all duration-300">
            <label className="block mb-3 font-light text-gray-200">
              Event Flyer (Optional)
            </label>
            
            {/* Toggle between Upload and URL */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => handleInputMethodChange('upload')}
                className={`flex-1 px-4 py-2 rounded-lg font-light text-sm transition-all duration-300 ${
                  flyerInputMethod === 'upload'
                    ? 'bg-red-500 text-white'
                    : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => handleInputMethodChange('url')}
                className={`flex-1 px-4 py-2 rounded-lg font-light text-sm transition-all duration-300 ${
                  flyerInputMethod === 'url'
                    ? 'bg-red-500 text-white'
                    : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                }`}
              >
                Use URL
              </button>
            </div>

            <div className="space-y-3">
              {flyerPreview && (
                <div className="relative w-full h-48 bg-zinc-800 rounded-lg overflow-hidden">
                  <img
                    src={flyerPreview}
                    alt="Event Flyer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/assets/african-panther-dark.svg";
                    }}
                  />
                </div>
              )}
              
              {flyerInputMethod === 'upload' ? (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFlyerUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-light text-sm transition-all duration-300"
                  >
                    {flyerPreview ? 'Change Flyer' : 'Upload Flyer'}
                  </button>
                </>
              ) : (
                <input
                  type="url"
                  value={flyerUrl}
                  onChange={handleFlyerUrlChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:border-red-500 font-light text-sm transition-all duration-300"
                />
              )}
            </div>
          </div>

          {/* Event Title */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <label className="block mb-2 font-light text-gray-200">
              Event Title*
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter event title"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Description */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <label className="block mb-2 font-light text-gray-200">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Event description"
              rows="4"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-light text-gray-200 text-xs">
                Event Start Date*
              </label>
              <DatePicker
                selected={form.eventDate}
                onChange={(date) => setForm({ ...form, eventDate: date })}
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-light text-sm focus:outline-none focus:border-red-500"
                placeholderText="Select date"
                withPortal={window.innerWidth < 640}
                popperClassName="react-datepicker-xf-theme"
              />
            </div>
            <div>
              <label className="block mb-2 font-light text-gray-200 text-xs">
                Start Time*
              </label>
              <DatePicker
                selected={form.eventTime}
                onChange={(time) => setForm({ ...form, eventTime: time })}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="HH:mm"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-light text-sm focus:outline-none focus:border-red-500"
                placeholderText="Select time"
                withPortal={window.innerWidth < 640}
                popperClassName="react-datepicker-xf-theme"
              />
            </div>
          </div>

          {/* Event End Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-light text-gray-200 text-xs">
                Event End Date
              </label>
              <DatePicker
                selected={form.eventEndDate}
                onChange={(date) => setForm({ ...form, eventEndDate: date })}
                minDate={form.eventDate || new Date()}
                dateFormat="yyyy-MM-dd"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-light text-sm focus:outline-none focus:border-red-500"
                placeholderText="Select end date (optional)"
                withPortal={window.innerWidth < 640}
                popperClassName="react-datepicker-xf-theme"
              />
            </div>
            <div>
              <label className="block mb-2 font-light text-gray-200 text-xs">
                End Time
              </label>
              <DatePicker
                selected={form.eventEndTime}
                onChange={(time) => setForm({ ...form, eventEndTime: time })}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="HH:mm"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-light text-sm focus:outline-none focus:border-red-500"
                placeholderText="Select end time"
                withPortal={window.innerWidth < 640}
                popperClassName="react-datepicker-xf-theme"
              />
            </div>
          </div>

          {/* Venue Details */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <label className="block mb-2 font-light text-gray-200">
              Venue Name*
            </label>
            <input
              type="text"
              value={form.venueName}
              onChange={(e) => setForm({ ...form, venueName: e.target.value })}
              placeholder="Venue name (e.g., The Grand Arena)"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <label className="block mb-2 font-light text-gray-200">
              Full Address*
            </label>
            <textarea
              value={form.venueAddress}
              onChange={(e) =>
                setForm({ ...form, venueAddress: e.target.value })
              }
              placeholder="Complete street address (e.g., 123 Main Street, Suite 100)"
              rows="2"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
            />
            <p className="text-xs text-gray-400 mt-2 font-light">
              Include street number, street name, and apartment/suite if
              applicable
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <label className="block mb-2 font-light text-gray-200">
              Postal Code*
            </label>
            <input
              type="text"
              value={form.postalCode}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              placeholder="Postal/Zip code (e.g., 100001)"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Generate Maps Link */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <label className="block mb-3 font-light text-gray-200">
              Location Maps Link
            </label>
            <div className="space-y-2">
              {form.venueMapLink && (
                <div className="bg-green-600/20 border border-green-600/50 rounded-lg p-3">
                  <p className="text-green-300 text-sm font-light break-all">
                    {form.venueMapLink}
                  </p>
                </div>
              )}
              <button
                onClick={generateGoogleMapsLink}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-light text-sm transition-all duration-300"
              >
                Generate Google Maps Link
              </button>
              <p className="text-xs text-gray-400 font-light">
                This creates a link users can click from their ticket to find
                directions
              </p>
            </div>
          </div>

          {/* Country & City */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
              <label className="block mb-2 font-light text-gray-200">
                Country
              </label>
              <select
                value={form.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
              >
                <option value="">Select Country *</option>
                {EVENT_ALLOWED_COUNTRIES.map((country) => (
                  <option key={country.name} value={country.name}>
                    {`${country.flag} ${country.name}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
              <label className="block mb-2 font-light text-gray-200">
                City
              </label>
              <input
                type="text"
                placeholder="City *"
                value={form.city}
                list={`cities-create-${form.country}`}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                disabled={!form.country}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {form.country && EVENT_CITIES_BY_COUNTRY[form.country] && (
                <datalist id={`cities-create-${form.country}`}>
                  {EVENT_CITIES_BY_COUNTRY[form.country].map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              )}
            </div>
          </div>

          {/* Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
              <label className="block mb-2 font-light text-gray-200">
                Currency
              </label>
              <input
                type="text"
                value={form.currency}
                placeholder="Currency"
                disabled
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none disabled:opacity-50"
              />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
              <label className="block mb-2 font-light text-gray-200">
                Capacity
              </label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                placeholder="Max attendees (optional)"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Genres */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <label className="block mb-3 font-light text-gray-200">
              Genres (Max 5)
            </label>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={genreInput}
                onChange={(e) => setGenreInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddGenre()}
                placeholder="Type genre and press Enter"
                className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
              />
              <button
                onClick={handleAddGenre}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-light transition-all"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.genres.map((genre, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 bg-red-600/20 border border-red-600/50 px-3 py-1 rounded-full"
                >
                  <span className="text-red-300 font-light text-sm">
                    {genre}
                  </span>
                  <button
                    onClick={() => handleRemoveGenre(genre)}
                    className="text-red-400 hover:text-red-200 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* RSVP Settings */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-light text-gray-200">RSVP</h3>
                <p className="text-xs text-gray-500 font-light mt-0.5">
                  Allow attendees to register interest before buying tickets
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, rsvpEnabled: !form.rsvpEnabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  form.rsvpEnabled ? "bg-red-500" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.rsvpEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {form.rsvpEnabled && (
              <div className="space-y-4 pt-2 border-t border-zinc-800">
                <div>
                  <label className="block mb-2 font-light text-gray-400 text-sm">
                    Max RSVPs (leave empty for unlimited)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.rsvpCapacity}
                    onChange={(e) => setForm({ ...form, rsvpCapacity: e.target.value })}
                    placeholder="e.g. 200"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-light text-gray-400 text-sm">
                    Required fields from attendees
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    First name, last name and email are always collected.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {["phone", "note"].map((field) => {
                      const labels = { phone: "Phone number", note: "Message / note" };
                      const checked = form.rsvpRequiredFields.includes(field);
                      return (
                        <label key={field} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = checked
                                ? form.rsvpRequiredFields.filter((f) => f !== field)
                                : [...form.rsvpRequiredFields, field];
                              setForm({ ...form, rsvpRequiredFields: next });
                            }}
                            className="accent-red-500 w-4 h-4"
                          />
                          <span className="text-sm text-gray-300 font-light">{labels[field]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tickets */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
            <h3 className="text-lg font-light text-gray-200">Ticket Tiers</h3>
            <div className="space-y-3 pb-4 border-b border-zinc-700">
              <input
                type="text"
                value={ticketInput.ticketType}
                onChange={(e) =>
                  setTicketInput({
                    ...ticketInput,
                    ticketType: e.target.value,
                  })
                }
                placeholder="Ticket type (e.g., VIP, General)"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={ticketInput.quantity}
                  onChange={(e) =>
                    setTicketInput({
                      ...ticketInput,
                      quantity: e.target.value,
                    })
                  }
                  placeholder="Quantity"
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
                />
                <input
                  type="number"
                  value={ticketInput.price}
                  onChange={(e) =>
                    setTicketInput({ ...ticketInput, price: e.target.value })
                  }
                  placeholder="Price"
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block mb-2 font-light text-gray-200 text-sm">
                    Sale Starts
                  </label>
                  <DatePicker
                    selected={ticketInput.saleStart}
                    onChange={(date) =>
                      setTicketInput((current) => ({
                        ...current,
                        saleStart: date,
                        saleEnd:
                          current.saleEnd && date && current.saleEnd <= date
                            ? null
                            : current.saleEnd,
                      }))
                    }
                    showTimeSelect
                    dateFormat="yyyy-MM-dd HH:mm"
                    timeIntervals={15}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
                    placeholderText="Select sale start date & time"
                    minDate={new Date()}
                    withPortal={window.innerWidth < 640}
                    popperClassName="react-datepicker-xf-theme"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-light text-gray-200 text-sm">
                    Sale Ends
                  </label>
                  <DatePicker
                    selected={ticketInput.saleEnd}
                    onChange={(date) =>
                      setTicketInput({ ...ticketInput, saleEnd: date })
                    }
                    showTimeSelect
                    dateFormat="yyyy-MM-dd HH:mm"
                    timeIntervals={15}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
                    placeholderText="Select sale end date & time"
                    minDate={ticketInput.saleStart || new Date()}
                    minTime={getMinSaleEndTime()}
                    maxTime={endOfDay}
                    withPortal={window.innerWidth < 640}
                    popperClassName="react-datepicker-xf-theme"
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-500 font-light">
                Sale end must be later than the selected sale start.
              </p>
            </div>
            
            <button
              onClick={handleAddTicket}
              className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-light text-sm transition-all duration-300 flex items-center justify-center gap-2"
            >
              <FaPlus className="w-4 h-4" />
              Add Ticket Tier
            </button>

            {/* Display Ticket Tiers */}
            <div className="space-y-2">
              {form.tickets.map((ticket, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-zinc-800 p-3 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-white font-light">
                      {ticket.ticketType || "General"}
                    </p>
                    <p className="text-gray-400 font-light text-sm">
                      {ticket.quantity} tickets @ {ticket.currency}{" "}
                      {ticket.price}
                    </p>
                    {(ticket.saleStart || ticket.saleEnd) && (
                      <p className="text-gray-500 font-light text-xs mt-1">
                        {ticket.saleStart && (
                          <span>
                            Starts:{" "}
                            {new Date(ticket.saleStart).toLocaleString("en-US", saleWindowDateFormat)}
                          </span>
                        )}
                        {ticket.saleStart && ticket.saleEnd && " | "}
                        {ticket.saleEnd && (
                          <span>
                            Ends:{" "}
                            {new Date(ticket.saleEnd).toLocaleString("en-US", saleWindowDateFormat)}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveTicket(index)}
                    className="px-3 py-1 bg-red-900 hover:bg-red-800 text-red-200 rounded text-sm"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-light transition-all duration-300"
            >
              Create Event
            </button>
            <button
              onClick={() => navigate("/organizer/dashboard")}
              className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-light transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Preview Section - Right (1 column) */}
        <div className="space-y-6 sticky top-20 max-h-screen overflow-y-auto">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <h3 className="text-gray-200 font-light mb-4">Live Preview</h3>
            <TicketPreview
              tickets={form.tickets}
              currency={form.currency}
              eventTitle={form.title}
              venueName={form.venueName}
              eventDate={form.eventDate}
              eventTime={form.eventTime}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
