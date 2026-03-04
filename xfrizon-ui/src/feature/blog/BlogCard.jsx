import React from "react";

export default function BlogCard() {
  return (
    <div className="container flex space-x-9 mx-auto px-4 py-6">
      <div className="container max-w-sm rounded overflow-hidden shadow-lg mb-10">
        <img
          src="src\assets\img\Bovi-img.jpg"
          className="w-full h-48 object-cover"
        />
        <div>
          <h3 className="text-xl font-bold p-4 text-amber-50">
            Bovi New Comedy Show <br /> in Berlin
          </h3>
          <p className="text-gray-700 text-base p-4">
            Bovi new Comedy Show Event, will be Happening live at Berlin Maaya
            Event Space on the 15th, Feb 2026!. You dont want to miss...
          </p>
        </div>
      </div>
      {/* // You can duplicate the above block to create more blog cards */}
      <div className="container max-w-sm rounded overflow-hidden shadow-lg mb-10">
        <img
          src="src\assets\img\Bovi-img.jpg"
          className="w-full h-48 object-cover"
        />
        <div>
          <h3 className="text-xl font-bold p-4 text-amber-50">
            Bovi New Comedy Show <br /> in Berlin
          </h3>
          <p className="text-gray-700 text-base p-4">
            Bovi new Comedy Show Event, will be Happening live at Berlin Maaya
            Event Space on the 15th, Feb 2026!. You dont want to miss...
          </p>
        </div>
      </div>
      {/* // You can duplicate the above block to create more blog cards */}
      <div className="container max-w-sm rounded overflow-hidden shadow-lg mb-10">
        <img
          src="src\assets\img\Bovi-img.jpg"
          className="w-full h-48 object-cover"
        />
        <div>
          <h3 className="text-xl font-bold p-4 text-amber-50">
            Bovi New Comedy Show <br /> in Berlin
          </h3>
          <p className="text-gray-700 text-base p-4">
            Bovi new Comedy Show Event, will be Happening live at Berlin Maaya
            Event Space on the 15th, Feb 2026!. You dont want to miss...
          </p>
        </div>
      </div>
    </div>
  );
}
