"use client";

import { ReactNode, useMemo } from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "@/utils/msalConfig";

type Props = {
  children: ReactNode;
};

export default function MsalProviderWrapper({ children }: Props) {
  const msalInstance = useMemo(() => {
    return new PublicClientApplication(msalConfig);
  }, []);

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}