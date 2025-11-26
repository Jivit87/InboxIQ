const BASE_URL = "http://localhost:3000/api";

export async function apiRequest(path, options = {}) {
  const method = options.method || "GET";
  const body = options.body ? JSON.stringify(options.body) : null;

  const token = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")).token
    : null;

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(BASE_URL + path, {
    method: method,
    headers: headers,
    body: body,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}