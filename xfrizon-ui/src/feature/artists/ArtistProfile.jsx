import React, { useState } from "react";

export default function () {

    x = useState();
  return (
    <>
      <div className="container ">
        <div className="h-[250px] bg-darkbg border shadow-lg ">
          <img
            className="w-[100px] h-[100px] items-center m-15"
            src="src\assets\img\Burna-Boy.jpg"
            alt=""
          />
        </div>
        <div className="container flex items-center justify-center">
          <li className=" flex gap-4  items-center justify-center ">
            <a href="">Profile</a>
            <a href="">View Concert</a>
            <a href="">Dj Mix</a>
            <a href="">Mentions</a>
            <a href="">Xf Blogs</a>
          </li>
        </div>
      </div>
      <div className="container flex gap-5 border p-5 flex-row ">
        <div>
          <h3 className="text-blue-700">Born</h3>
          <p>1993-07-29</p>
        </div>
        <div>
          <h3 className="text-blue-700">From</h3>
          <p>Porth-Harcouth, Nigeria</p>
        </div>
        <div>
          <h3 className="text-blue-700">Albums</h3>
          <p>43</p>
        </div>
        <div>
          <h3 className="text-blue-700">Upcoming Concerts</h3>
          <p>21</p>
        </div>
      </div>

    </>
  );
}
