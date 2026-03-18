import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { FaArrowLeft, FaPlus, FaTrash, FaCrop } from "react-icons/fa";
import TicketPreview from "../../component/organizer/TicketPreview";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { COUNTRY_CURRENCY, CITIES_BY_COUNTRY } from "../../data/countriesData";

// Get unique currencies from country currency mapping
const SUPPORTED_CURRENCIES = Array.from(
  new Set(Object.values(COUNTRY_CURRENCY)),
).sort();

export default function EditEvent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId } = useParams();

  const [loading, setLoading] = useState(true);
  const [eventStatus, setEventStatus] = useState(null);
  const [flyer, setFlyer] = useState(null);
  const [flyerPreview, setFlyerPreview] = useState(null);
  const [flyerInputMethod, setFlyerInputMethod] = useState("upload"); // 'upload' or 'url'
  const [flyerUrl, setFlyerUrl] = useState("");
  const [showCrop, setShowCrop] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

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
    venueMapLink: "",
    country: "",
    city: "",
    currency: COUNTRY_CURRENCY["Nigeria"] || "NGN",
    tickets: [],
  });

  const [ticketInput, setTicketInput] = useState({
    ticketType: "",
    quantity: "",
    price: "",
    priceEnds: null,
    currency:
      COUNTRY_CURRENCY[form.country] || COUNTRY_CURRENCY["Nigeria"] || "NGN",
  });

  const [genreInput, setGenreInput] = useState("");

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const response = await api.get(`/events/${eventId}`);
      const event = response.data;

      // Store event status
      setEventStatus(event.status);

      // Parse event date and time
      const eventDateTime = new Date(event.eventDateTime);
      const eventDateObj = new Date(
        eventDateTime.getFullYear(),
        eventDateTime.getMonth(),
        eventDateTime.getDate(),
      );
      const eventTimeObj = new Date();
      eventTimeObj.setHours(
        eventDateTime.getHours(),
        eventDateTime.getMinutes(),
        0,
      );

      // Parse event end date and time if available
      let eventEndDateObj = null;
      let eventEndTimeObj = null;
      if (event.eventEndDate) {
        const eventEndDateTime = new Date(event.eventEndDate);
        eventEndDateObj = new Date(
          eventEndDateTime.getFullYear(),
          eventEndDateTime.getMonth(),
          eventEndDateTime.getDate(),
        );
        eventEndTimeObj = new Date();
        eventEndTimeObj.setHours(
          eventEndDateTime.getHours(),
          eventEndDateTime.getMinutes(),
          0,
        );
      }

      setForm({
        title: event.title || "",
        description: event.description || "",
        eventDate: eventDateObj,
        eventTime: eventTimeObj,
        eventEndDate: eventEndDateObj,
        eventEndTime: eventEndTimeObj,
        genres: event.genres || [],
        ageLimit: event.ageLimit?.toString() || "",
        capacity: event.capacity?.toString() || "",
        venueName: event.venueName || "",
        venueAddress: event.venueAddress || "",
        venueMapLink: event.venueMapLink || "",
        country: event.country || "Nigeria",
        city: event.city || "",
        currency: event.currency || "NGN",
        tickets: event.ticketTiers || [],
      });

      if (event.flyerUrl || event.flyer_url) {
        const existingUrl = event.flyerUrl || event.flyer_url;
        setFlyerPreview(getImageUrl(existingUrl));
        // If the existing URL is a full URL, set input method to 'url'
        if (
          existingUrl.startsWith("http://") ||
          existingUrl.startsWith("https://")
        ) {
          setFlyerUrl(existingUrl);
          setFlyerInputMethod("url");
        } else {
          setFlyerUrl(existingUrl);
          setFlyerInputMethod("upload");
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching event:", error);

      // Handle specific error cases
      if (error.response?.status === 404) {
        toast.error(
          "Event not found. You may not have permission to edit this event.",
        );
        navigate("/organizer/dashboard");
      } else if (error.response?.status === 401) {
        toast.error("Your session has expired. Please log in again.");
        navigate("/auth/login", {
          replace: true,
          state: { from: location },
        });
      } else {
        toast.error("Failed to load event details");
      }
      setLoading(false);
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

  const handleFlyerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFlyerPreview(event.target.result);
        setFlyer(file);
        setShowCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFlyerUrlChange = (e) => {
    const url = e.target.value.trim();
    setFlyerUrl(url);
    // Update preview for any valid URL attempt (with or without protocol)
    if (url) {
      // If user didn't add protocol, assume https
      const displayUrl =
        url.startsWith("http://") || url.startsWith("https://")
          ? url
          : `https://${url}`;
      setFlyerPreview(displayUrl);
      setFlyer(null); // Clear any uploaded file
    }
  };

  const handleInputMethodChange = (method) => {
    setFlyerInputMethod(method);
    if (method === "upload") {
      setFlyerUrl("");
    } else {
      setFlyer(null);
    }
  };

  const handleAddGenre = () => {
    if (genreInput.trim() && !form.genres.includes(genreInput)) {
      setForm({
        ...form,
        genres: [...form.genres, genreInput],
      });
      setGenreInput("");
    }
  };

  const handleRemoveGenre = (genre) => {
    setForm({
      ...form,
      genres: form.genres.filter((g) => g !== genre),
    });
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
    if (!form.venueAddress?.trim()) {
      toast.error("Venue address is required before generating map link");
      return;
    }

    const mapsLink = buildGoogleMapsLink();
    if (!mapsLink) {
      toast.error(
        "Unable to generate map link. Please check location details.",
      );
      return;
    }

    setForm({ ...form, venueMapLink: mapsLink });
    toast.success("Google Maps link generated!");
  };

  const handleAddTicket = () => {
    if (ticketInput.ticketType && ticketInput.quantity && ticketInput.price) {
      setForm({
        ...form,
        tickets: [
          ...form.tickets,
          {
            ticketType: ticketInput.ticketType,
            quantity: parseInt(ticketInput.quantity),
            price: parseFloat(ticketInput.price),
            currency: COUNTRY_CURRENCY[form.country] || "NGN",
            description: ticketInput.description || "",
            priceEnds: ticketInput.priceEnds
              ? ticketInput.priceEnds.toISOString()
              : null,
          },
        ],
      });
      setTicketInput({
        ticketType: "",
        quantity: "",
        price: "",
        priceEnds: null,
        currency: COUNTRY_CURRENCY[form.country] || "NGN",
      });
    }
  };

  const handleRemoveTicket = (index) => {
    setForm({
      ...form,
      tickets: form.tickets.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async () => {
    if (
      !form.title ||
      !form.eventDate ||
      !form.eventTime ||
      !form.venueName ||
      !form.venueAddress?.trim()
    ) {
      toast.error(
        "Please fill in all required fields (including venue address)",
      );
      return;
    }

    if (form.tickets.length === 0) {
      toast.error("Please add at least one ticket tier");
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

      const updateEventRequest = {
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
          priceEnds: ticket.priceEnds || null,
          description: ticket.description || "",
        })),
      };

      // Add flyerUrl to request if using external URL
      const isExternalUrl =
        flyerUrl && flyerUrl.trim() && flyerInputMethod === "url";
      if (isExternalUrl) {
        const urlToSave =
          flyerUrl.startsWith("http://") || flyerUrl.startsWith("https://")
            ? flyerUrl
            : `https://${flyerUrl}`;
        updateEventRequest.flyerUrl = urlToSave;
        console.log("Adding flyerUrl to update request:", urlToSave);
      }

      console.log("EditEvent Save Debug:", {
        hasFlyer: !!flyer,
        flyerUrl,
        isExternalUrl,
        flyerInputMethod,
        willSendFlyerUrl: !!updateEventRequest.flyerUrl,
      });

      // Update event
      const eventResponse = await api.put(
        `/events/${eventId}`,
        updateEventRequest,
      );

      // Handle flyer file upload separately (if new file selected)
      if (flyer) {
        try {
          console.log("Uploading new flyer file...");
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
          console.log("Flyer upload response:", uploadedFlyerUrl);

          if (uploadedFlyerUrl) {
            // Update event with the uploaded file URL
            await api.put(`/events/${eventId}`, {
              ...updateEventRequest,
              flyerUrl: uploadedFlyerUrl,
            });
            setFlyerPreview(getImageUrl(uploadedFlyerUrl));
          }
          toast.success("✓ Event updated and flyer uploaded successfully!");
        } catch (flyerError) {
          console.warn(
            "Flyer upload failed, but event was updated:",
            flyerError,
          );
          toast.success(
            "✓ Event updated! (Flyer upload failed, but you can update it later)",
          );
        }
      } else if (isExternalUrl) {
        // Preview was already updated when user input the URL
        console.log("External URL saved with event update");
        setFlyerPreview(updateEventRequest.flyerUrl);
        toast.success("✓ Event updated with flyer URL successfully!");
      } else {
        toast.success("✓ Event updated successfully!");
      }

      setTimeout(() => navigate("/organizer/my-events"), 1500);
    } catch (error) {
      console.error("Event update error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.tickets?.[0] ||
        "Error updating event. Please check all fields.";
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-light text-gray-200 mb-2">Edit Event</h1>
          <p className="text-gray-500 font-light">Update your event details</p>
        </div>
        <button
          onClick={() => navigate("/organizer/dashboard")}
          className="px-4 py-2 text-gray-400 hover:text-white border border-zinc-700 rounded-lg font-light text-sm transition-all duration-300 flex items-center gap-2"
        >
          <FaArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Published Event Info Banner */}
      {eventStatus === "PUBLISHED" && (
        <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 flex items-start gap-3">
          <div className="text-2xl">âœ“</div>
          <div className="flex-1">
            <h3 className="text-green-400 font-light mb-1">
              This event is published
            </h3>
            <p className="text-green-300/70 text-sm font-light">
              Changes you make here will update the live event and be visible to
              attendees immediately.
            </p>
          </div>
        </div>
      )}

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
                onClick={() => handleInputMethodChange("upload")}
                className={`flex-1 px-4 py-2 rounded-lg font-light text-sm transition-all duration-300 ${
                  flyerInputMethod === "upload"
                    ? "bg-red-500 text-white"
                    : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => handleInputMethodChange("url")}
                className={`flex-1 px-4 py-2 rounded-lg font-light text-sm transition-all duration-300 ${
                  flyerInputMethod === "url"
                    ? "bg-red-500 text-white"
                    : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
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

              {flyerInputMethod === "upload" ? (
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
                    {flyerPreview ? "Change Flyer" : "Upload New Flyer"}
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
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block mb-2 font-light text-gray-200 text-xs">
                Date*
              </label>
              <DatePicker
                selected={form.eventDate}
                onChange={(date) => setForm({ ...form, eventDate: date })}
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white font-light text-sm focus:outline-none focus:border-red-500"
                placeholderText="Select date"
              />
            </div>
            <div>
              <label className="block mb-2 font-light text-gray-200 text-xs">
                Time*
              </label>
              <DatePicker
                selected={form.eventTime}
                onChange={(time) => setForm({ ...form, eventTime: time })}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="HH:mm"
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white font-light text-sm focus:outline-none focus:border-red-500"
                placeholderText="Select time"
              />
            </div>
            <div>
              <label className="block mb-2 font-light text-gray-200 text-xs">
                End Date
              </label>
              <DatePicker
                selected={form.eventEndDate}
                onChange={(date) => setForm({ ...form, eventEndDate: date })}
                minDate={form.eventDate}
                dateFormat="yyyy-MM-dd"
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white font-light text-sm focus:outline-none focus:border-red-500"
                placeholderText="Select end date"
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
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white font-light text-sm focus:outline-none focus:border-red-500"
                placeholderText="Select end time"
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
              placeholder="Venue name"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <label className="block mb-2 font-light text-gray-200">
              Venue Address*
            </label>
            <input
              type="text"
              value={form.venueAddress}
              onChange={(e) =>
                setForm({ ...form, venueAddress: e.target.value })
              }
              placeholder="Venue address"
              required
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Location Maps Link */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <label className="block mb-3 font-light text-gray-200">
              Location Maps Link
            </label>
            <div className="space-y-2">
              <input
                type="url"
                value={form.venueMapLink}
                onChange={(e) =>
                  setForm({ ...form, venueMapLink: e.target.value })
                }
                placeholder="https://maps.google.com/..."
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
              />
              <button
                onClick={generateGoogleMapsLink}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-light text-sm transition-all duration-300"
              >
                Generate Map Link
              </button>
            </div>
          </div>

          {/* Country & City */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
              <label className="block mb-2 font-light text-gray-200">
                Country
              </label>
              <input
                type="text"
                placeholder="Country *"
                value={form.country}
                list="countries-edit"
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
              />
              <datalist id="countries-edit">
                {Object.keys(COUNTRY_CURRENCY).map((country) => (
                  <option key={country} value={country} />
                ))}
              </datalist>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
              <label className="block mb-2 font-light text-gray-200">
                City
              </label>
              <input
                type="text"
                placeholder="City *"
                value={form.city}
                list={`cities-edit-${form.country}`}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                disabled={!form.country}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {form.country && CITIES_BY_COUNTRY[form.country] && (
                <datalist id={`cities-edit-${form.country}`}>
                  {CITIES_BY_COUNTRY[form.country].map((city) => (
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
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
              >
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
              <label className="block mb-2 font-light text-gray-200">
                Capacity
              </label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                placeholder="Event capacity"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Genres */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <label className="block mb-2 font-light text-gray-200">
              Genres
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={genreInput}
                onChange={(e) => setGenreInput(e.target.value)}
                placeholder="Add genre"
                className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
              />
              <button
                onClick={handleAddGenre}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-light text-sm transition-all duration-300"
              >
                <FaPlus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.genres.map((genre) => (
                <div
                  key={genre}
                  className="px-3 py-1 bg-red-900 text-red-200 rounded-full text-sm flex items-center gap-2"
                >
                  {genre}
                  <button
                    onClick={() => handleRemoveGenre(genre)}
                    className="hover:text-red-100"
                  >
                    âœ•
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Capacity & Age Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
              <label className="block mb-2 font-light text-gray-200">
                Capacity
              </label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
              <label className="block mb-2 font-light text-gray-200">
                Age Limit
              </label>
              <input
                type="number"
                value={form.ageLimit}
                onChange={(e) => setForm({ ...form, ageLimit: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Ticket Tiers */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <label className="block mb-4 font-light text-gray-200">
              Ticket Tiers*
            </label>
            <div className="space-y-3 mb-4">
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
              <div>
                <label className="block mb-2 font-light text-gray-200 text-sm">
                  Sale Ends
                </label>
                <DatePicker
                  selected={ticketInput.priceEnds}
                  onChange={(date) =>
                    setTicketInput({ ...ticketInput, priceEnds: date })
                  }
                  showTimeSelect
                  dateFormat="yyyy-MM-dd HH:mm"
                  timeIntervals={15}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-light focus:outline-none focus:border-red-500"
                  placeholderText="Select sale end date & time"
                />
              </div>
              <button
                onClick={handleAddTicket}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-light text-sm transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FaPlus className="w-4 h-4" />
                Add Ticket Tier
              </button>
            </div>

            {/* Display Ticket Tiers */}
            <div className="space-y-2">
              {form.tickets.map((ticket, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-zinc-800 p-3 rounded-lg"
                >
                  <div>
                    <p className="text-white font-light">
                      {ticket.ticketType || "General"}
                    </p>
                    <p className="text-gray-400 font-light text-sm">
                      {ticket.quantity} tickets @ {ticket.currency}{" "}
                      {ticket.price}
                    </p>
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
              Update Event
            </button>
            <button
              onClick={() => navigate("/organizer/my-events")}
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
