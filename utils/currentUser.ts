let currentUserName = "";
let currentUserEmail = "";

export function setCurrentUserName(name: string) {
  currentUserName = name;
}

export function getCurrentUserName() {
  return currentUserName;
}

export function setCurrentUserEmail(email: string) {
  currentUserEmail = email;
  localStorage.setItem("tsukuroute-user-email", email);
}

export function getCurrentUserEmail() {
  return (
    currentUserEmail ||
    localStorage.getItem("tsukuroute-user-email") ||
    ""
  );
}

