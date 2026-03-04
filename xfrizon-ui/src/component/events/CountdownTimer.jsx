import { useState, useEffect } from "react";
import { FaHourglass } from "react-icons/fa";

export default function CountdownTimer({ eventDate }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    ended: false,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const eventTime = new Date(eventDate).getTime();
      const currentTime = new Date().getTime();
      const difference = eventTime - currentTime;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          ),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
          ended: false,
        });
      } else {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          ended: true,
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [eventDate]);

  if (timeLeft.ended) {
    return (
      <div className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-3 text-center">
        <p className="text-red-500 font-semibold">Event Has Started</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <FaHourglass className="text-red-500" />
        <p className="text-gray-300 font-semibold">Time Until Event</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-zinc-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-500">
            {String(timeLeft.days).padStart(2, "0")}
          </div>
          <div className="text-xs text-gray-400 mt-1">Days</div>
        </div>
        <div className="bg-zinc-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-500">
            {String(timeLeft.hours).padStart(2, "0")}
          </div>
          <div className="text-xs text-gray-400 mt-1">Hours</div>
        </div>
        <div className="bg-zinc-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-500">
            {String(timeLeft.minutes).padStart(2, "0")}
          </div>
          <div className="text-xs text-gray-400 mt-1">Mins</div>
        </div>
        <div className="bg-zinc-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-500">
            {String(timeLeft.seconds).padStart(2, "0")}
          </div>
          <div className="text-xs text-gray-400 mt-1">Secs</div>
        </div>
      </div>
    </div>
  );
}
