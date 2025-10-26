"use client";
import React, { useState } from "react";

const Page = () => {
  const [name, setName] = useState("");

  console.log(name);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md border border-gray-200">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          ✉️ Email Sending
        </h1>

        <div className="flex flex-col space-y-4">
          <label htmlFor="name" className="text-gray-700 font-medium">
            Enter Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            placeholder="Type your name..."
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
          />
        </div>

        <button
          className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg shadow-sm transition-all"
          onClick={() => alert(`Email sent to ${name || "someone special"} ✨`)}
        >
          Send Email
        </button>
      </div>
    </div>
  );
};

export default Page;
