import React from "react";

export default function Tags() {
  return (
    {
      /* Menu Section */
    },
    (
      <div className="container mx-auto px-1 py-6">
        <div className="mb-1 p-6  ">
          <ul className="flex items-center gap-7">
            <a href="" className="border-b-red-700 border-b-1">
              Popular
            </a>
            <a href="">Event Type</a>
            <a href="">Genre</a>
            <a href="">Location</a>
          </ul>
        </div>
        {/* Tags Section */}
        <div className=" p-1  shadow-md">
          {/* <p className="mb-2 font-semibold text-lg">Popular Tags:</p> */}
          <ul className="flex flex-wrap items-center gap-7">
            <a
              href="#"
              className="inline-block bg-primary text-gray-700 px-3 py-1 rounded-full text-sm mr-2 mb-2"
            >
              Hip-Hop
            </a>
            <a
              href="#"
              className="inline-block bg-fuchsia-800 text-gray-700 px-3 py-1 rounded-full text-sm mr-2 mb-2"
            >
              AfroBeats
            </a>
            <a
              href="#"
              className="inline-block bg-teal-800 text-gray-700 px-3 py-1 rounded-full text-sm mr-2 mb-2"
            >
              R&B
            </a>
            <a
              href="#"
              className="inline-block bg-blue-700 text-gray-700 px-3 py-1 rounded-full text-sm mr-2 mb-2"
            >
              Jazz
            </a>
          </ul>
        </div>
      </div>
    )
  );
}
