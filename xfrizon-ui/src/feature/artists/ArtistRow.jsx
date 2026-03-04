import ArtistCard from "./ArtistCard";
import SectionBlock from "../../component/section/SectionBlock";
import React from "react";

const ArtistRow = ({ artists = [] }) => {
  return (
    <SectionBlock title="Trending Artists">
      {artists.map((artist) => (
        <ArtistCard key={artist.id} artist={artist} />
      ))}
    </SectionBlock>
  );
};

export default ArtistRow;
