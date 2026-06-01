import { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "3536eb2b-a36d-4c15-af31-0dde44bd716f",
    authority:
      "https://login.microsoftonline.com/431b3cf0-5edf-4581-af84-b09d425055b9",
    redirectUri:
      typeof window !== "undefined"
        ? window.location.origin
        : "",
  },
};

export const loginRequest = {
  scopes: ["User.Read", "Files.ReadWrite"],
};