import React from "react";
import OrganizerRow from "./OrganizerRow";
import { topOrganizersByGenre } from "../../data/topOrganizersMockData";

// Flatten all organizers for display
const allOrganizers = topOrganizersByGenre.flatMap((g) =>
  g.organizers.map((o, idx) => ({
    ...o,
    id: `${g.genre}-${idx}`,
    genre: g.genre,
  })),
);

const OrganizersSection = () => {
  return <OrganizerRow organizers={allOrganizers} />;
};

export default OrganizersSection;
