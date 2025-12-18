export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// OAuth is disabled in this version - using ID/Password authentication instead
export const getLoginUrl = () => {
  return "/login";
};
