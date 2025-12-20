export const setCookie = (
  name: string,
  value: string,
  options: {
    days?: number;
    path?: string;
    sameSite?: "Strict" | "Lax" | "None";
    secure?: boolean;
  } = {}
): void => {
  const { days = 7, path = "/", sameSite = "Lax", secure = true } = options;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  let cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=${path}; SameSite=${sameSite}`;

  if (secure && window.location.protocol === "https:") {
    cookie += "; Secure";
  }

  document.cookie = cookie;
};

export const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const cookies = document.cookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
};

export const deleteCookie = (name: string, path: string = "/"): void => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
};
