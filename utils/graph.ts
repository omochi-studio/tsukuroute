import { Client } from "@microsoft/microsoft-graph-client";
import type { IPublicClientApplication } from "@azure/msal-browser";
import { loginRequest } from "./msalConfig";

function getGraphClient(accessToken: string) {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

async function getToken(msalInstance: IPublicClientApplication) {
  const accounts = msalInstance.getAllAccounts();
  const activeAccount = msalInstance.getActiveAccount();
  const account = activeAccount ?? accounts[0];

  if (!account) {
    throw new Error("ログインしていません");
  }

  msalInstance.setActiveAccount(account);

  try {
    const token = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });

    return token.accessToken;
  } catch (error) {
    console.error("Token取得失敗:", error);

    const token = await msalInstance.acquireTokenPopup({
      ...loginRequest,
      account,
    });

    return token.accessToken;
  }
}

export async function getCurrentUser(msalInstance: IPublicClientApplication) {
  const accessToken = await getToken(msalInstance);
  const client = getGraphClient(accessToken);

  return await client.api("/me").get();
}

export async function saveProjectJsonToOneDrive(
  msalInstance: IPublicClientApplication,
  data: unknown
) {
  const accessToken = await getToken(msalInstance);
  const client = getGraphClient(accessToken);

  const jsonText = JSON.stringify(data, null, 2);

  return await client
    .api("/me/drive/root:/tsukuroute/tsukuroute-project.json:/content")
    .put(jsonText);
}

export async function loadProjectJsonFromOneDrive(
  msalInstance: IPublicClientApplication
) {
  const accessToken = await getToken(msalInstance);
  const client = getGraphClient(accessToken);

  const response = await client
    .api("/me/drive/root:/tsukuroute/tsukuroute-project.json")
    .get();

  const downloadUrl = response["@microsoft.graph.downloadUrl"] as string;

  if (!downloadUrl) {
    throw new Error("ダウンロードURLを取得できませんでした");
  }

  const fileResponse = await fetch(downloadUrl);

  if (!fileResponse.ok) {
    throw new Error("クラウドファイルの取得に失敗しました");
  }

  return await fileResponse.json();
}

export async function getSiteInfo(
  msalInstance: IPublicClientApplication
) {
  const accessToken = await getToken(msalInstance);
  const client = getGraphClient(accessToken);

  return await client
    .api("/sites/jc21.sharepoint.com:/sites/JC_2025_GC1")
    .get();
}

export async function getSiteDrive(
  msalInstance: IPublicClientApplication
) {
  const accessToken = await getToken(msalInstance);
  const client = getGraphClient(accessToken);

  return await client
    .api("/sites/jc21.sharepoint.com:/sites/JC_2025_GC1:/drives")
    .get();
}
export async function getDefaultSiteDrive(
  msalInstance: IPublicClientApplication
) {
  const accessToken = await getToken(msalInstance);
  const client = getGraphClient(accessToken);

  return await client
    .api("/sites/jc21.sharepoint.com:/sites/JC_2025_GC1:/drive")
    .get();
}

function encodeSharingUrl(url: string) {
  const base64 = btoa(url)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `u!${base64}`;
}

export async function loadProjectJsonFromSharedFolder(
  msalInstance: IPublicClientApplication,
  shareUrl: string
) {
  const accessToken = await getToken(msalInstance);
  const client = getGraphClient(accessToken);

  const shareId = encodeSharingUrl(shareUrl);

  const folder = await client
    .api(`/shares/${shareId}/driveItem`)
    .get();

  const driveId = folder.parentReference.driveId;
  const folderId = folder.id;

  const file = await client
    .api(`/drives/${driveId}/items/${folderId}:/tsukuroute-project.json`)
    .get();

  const downloadUrl = file["@microsoft.graph.downloadUrl"] as string;

  const response = await fetch(downloadUrl);

  return await response.json();
}

export async function saveProjectJsonToSharedFolder(
  msalInstance: IPublicClientApplication,
  shareUrl: string,
  data: unknown
) {
  const accessToken = await getToken(msalInstance);
  const client = getGraphClient(accessToken);

  const shareId = encodeSharingUrl(shareUrl);

  const folder = await client
    .api(`/shares/${shareId}/driveItem`)
    .get();

  const driveId = folder.parentReference.driveId;
  const folderId = folder.id;

  const jsonText = JSON.stringify(data, null, 2);

  return await client
    .api(`/drives/${driveId}/items/${folderId}:/tsukuroute-project.json:/content`)
    .put(jsonText);
}