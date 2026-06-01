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
  const account = msalInstance.getActiveAccount() ?? accounts[0];

  if (!account) {
    throw new Error("ログインしていません");
  }

  msalInstance.setActiveAccount(account);

  const token = await msalInstance.acquireTokenSilent({
    ...loginRequest,
    account,
  });

  return token.accessToken;
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