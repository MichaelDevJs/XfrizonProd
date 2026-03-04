import EventCard from "./EventCard";
import React from "react";

import SectionBlock from "../../component/section/SectionBlock";

const EventRow = ({ category, onEventSave }) => {
  return (
    <SectionBlock title={category.name}>
      {category.events.map((event) => (
        <EventCard key={event.id} event={event} onSaveChange={onEventSave} />
      ))}
    </SectionBlock>
  );
};

export default EventRow;
