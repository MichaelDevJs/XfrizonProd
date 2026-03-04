import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function UnauthorizedRedirectListener() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = (event) => {
      const loginPath =
        event?.detail?.loginPath ||
        (location.pathname.startsWith("/admin")
          ? "/admin-login"
          : location.pathname.startsWith("/organizer")
            ? "/organizer/login"
            : "/auth/login");

      if (location.pathname === loginPath) return;

      navigate(loginPath, {
        replace: true,
        state: {
          from: location,
        },
      });
    };

    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
  }, [navigate, location]);

  return null;
}
