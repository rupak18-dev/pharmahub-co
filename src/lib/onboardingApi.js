import { apiRequest } from "./api";

export const getOnboarding = () => apiRequest("/onboarding");

export const saveOnboarding = (data) =>
  apiRequest("/onboarding", {
    method: "PUT",
    body: JSON.stringify(data),
  });
