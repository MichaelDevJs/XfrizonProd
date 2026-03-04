import OrganizerCard from "./OrganizerCard";
import SectionBlock from "../section/SectionBlock";
import React from "react";

const OrganizerRow = ({ organizers = [] }) => {
  return (
    <SectionBlock title="Top Organizers">
      {organizers.map((organizer) => (
        <OrganizerCard key={organizer.id} organizer={organizer} />
      ))}
    </SectionBlock>
  );
};

export default OrganizerRow;
