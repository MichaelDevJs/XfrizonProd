const OrganizerCard = ({ organizer }) => {
  return (
    <div className="min-w-[260px] bg-gray-900 text-white p-6 rounded-2xl shadow-lg snap-start text-center">
      <img
        src={organizer.image}
        alt={organizer.name}
        className="w-28 h-28 rounded-full mx-auto object-cover"
      />

      <h3 className="mt-4 text-lg font-semibold">{organizer.name}</h3>

      <p className="text-gray-400 text-sm mt-1">
        {organizer.eventsCount} Events Hosted
      </p>

      <div className="flex justify-between mt-6 text-sm">
        <button className="hover:text-blue-400">View Profile</button>
        <button className="text-blue-500 font-semibold hover:text-blue-400">
          Follow
        </button>
      </div>
    </div>
  );
};

export default OrganizerCard;
