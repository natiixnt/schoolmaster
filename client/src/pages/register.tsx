import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Register() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", "register");
    setLocation(`/auth?${params.toString()}`);
  }, [setLocation]);

  return null;
}
