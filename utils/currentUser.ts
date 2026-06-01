let currentUserName = "";

export function setCurrentUserName(name: string) {
  currentUserName = name;
}

export function getCurrentUserName() {
  return currentUserName;
}