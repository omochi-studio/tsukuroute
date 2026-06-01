"use client";

import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/utils/msalConfig";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/utils/graph";

import {
  setCurrentUserName,
  setCurrentUserEmail,
} from "@/utils/currentUser";

export default function LoginButton() {
  const { instance, accounts } = useMsal();

  const [displayName, setDisplayName] = useState("");

  const handleLogin = async () => {
    try {
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("tgs-authorized");
    await instance.logoutRedirect();
  };

  useEffect(() => {
    async function loadUser() {
      if (accounts.length === 0) return;

      try {
        const user = await getCurrentUser(instance);

        if (user?.displayName) {
          setDisplayName(user.displayName);

          setCurrentUserName(user.displayName);

          setCurrentUserEmail(
            user.mail ||
              user.userPrincipalName ||
              accounts[0].username ||
              ""
          );

          window.dispatchEvent(
            new Event("tsukuroute-user-updated")
          );
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadUser();
  }, [accounts, instance]);

  if (accounts.length > 0) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm">
          {displayName || accounts[0].username}
        </span>

        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-500 px-3 py-2 text-white"
        >
          ログアウト
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="rounded-lg bg-blue-500 px-3 py-2 text-white"
    >
      Microsoftでログイン
    </button>
  );
}