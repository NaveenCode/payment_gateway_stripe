"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <button
      onClick={handleLogout}
      className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
    >
      Logout
    </button>
  );
}
