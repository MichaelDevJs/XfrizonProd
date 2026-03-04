import { useState } from "react";
import axios from "axios";
import TicketTierForm from "./TicketTierForm";
import { EVENT_LOCATIONS } from "../../feature/home/FilterBar";
import { CITIES_BY_COUNTRY_CODE } from "../../data/countriesData";

const EventForm = () => {
  const [tickets, setTickets] = useState([]);

  const [event, setEvent] = useState({
    title: "",
    description: "",
    flyerUrl: "",
    lineup: "",
    eventType: "",
    genres: [],
    venueName: "",
    mapLink: "",
    ageLimit: "",
    policy: "",
    country: "",
    state: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalData = {
      ...event,
      tickets,
    };

    await axios.post("http://localhost:8081/api/v1/events", finalData);

    alert("Event Created Successfully!");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Flyer */}
      <input
        placeholder="Flyer Image URL"
        className="input"
        onChange={(e) => setEvent({ ...event, flyerUrl: e.target.value })}
      />

      {/* Title */}
      <input
        placeholder="Event Title"
        className="input"
        onChange={(e) => setEvent({ ...event, title: e.target.value })}
      />

      {/* Description */}
      <textarea
        placeholder="Event Description"
        className="input"
        onChange={(e) => setEvent({ ...event, description: e.target.value })}
      />

      {/* Lineup */}
      <input
        placeholder="Lineup (comma separated)"
        className="input"
        onChange={(e) => setEvent({ ...event, lineup: e.target.value })}
      />

      {/* Event Type */}
      <select
        className="input"
        onChange={(e) => setEvent({ ...event, eventType: e.target.value })}
      >
        <option>NightLife</option>
        <option>Comedy</option>
        <option>Festival</option>
      </select>

      {/* Genres (max 5) */}
      <input
        placeholder="Genres (comma separated, max 5)"
        className="input"
        onChange={(e) =>
          setEvent({
            ...event,
            genres: e.target.value.split(",").slice(0, 5),
          })
        }
      />

      {/* Country */}
      <select
        className="input"
        value={event.country}
        onChange={(e) =>
          setEvent({ ...event, country: e.target.value, state: "" })
        }
      >
        <option value="">Select Country</option>
        {EVENT_LOCATIONS.filter(
          (c) => c.code !== "OTHER" && c.code !== "MORE",
        ).map((country) => (
          <option key={country.code} value={country.code}>
            {country.flag} {country.name}
          </option>
        ))}
      </select>

      {/* City (user can input their city) */}
      <input
        className="input"
        placeholder="Enter your city"
        value={event.state}
        onChange={(e) => setEvent({ ...event, state: e.target.value })}
      />

      {/* Venue */}
      <input
        placeholder="Venue Name"
        className="input"
        onChange={(e) => setEvent({ ...event, venueName: e.target.value })}
      />

      <input
        placeholder="Google Map Link"
        className="input"
        onChange={(e) => setEvent({ ...event, mapLink: e.target.value })}
      />

      {/* Age */}
      <input
        placeholder="Age Limit (e.g 18+)"
        className="input"
        onChange={(e) => setEvent({ ...event, ageLimit: e.target.value })}
      />

      {/* Policy */}
      <textarea
        placeholder="Disclaimers / Policies"
        className="input"
        onChange={(e) => setEvent({ ...event, policy: e.target.value })}
      />

      {/* Ticket Tier Section */}
      <TicketTierForm tickets={tickets} setTickets={setTickets} />

      <button className="bg-indigo-600 px-6 py-3 rounded-xl">
        Publish Event
      </button>
    </form>
  );
};

export default EventForm;
