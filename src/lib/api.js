const API_BASE = "http://127.0.0.1:5001/api/v1";

function getAuthToken() {
  // We'll store the JWT token in localStorage when the user logs in
  return localStorage.getItem("ph_token");
}

async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch(e) {}
    const message = errorData?.error?.message || response.statusText || "API Error";
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  get: (endpoint) => fetchApi(endpoint, { method: "GET" }),
  
  post: (endpoint, data) => fetchApi(endpoint, {
    method: "POST",
    body: JSON.stringify(data)
  }),
  
  patch: (endpoint, data) => fetchApi(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data)
  }),
  
  delete: (endpoint) => fetchApi(endpoint, { method: "DELETE" }),
};
