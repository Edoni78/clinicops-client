export const getJwtPayload = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};
