"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function isPlainLeftClick(event: MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function RouteLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const routeSignature = `${pathname}?${searchParams.toString()}`;
  const previousRouteSignatureRef = useRef(routeSignature);

  useEffect(() => {
    if (previousRouteSignatureRef.current === routeSignature) return;

    previousRouteSignatureRef.current = routeSignature;
    const frame = window.requestAnimationFrame(() => setLoading(false));

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    return () => window.cancelAnimationFrame(frame);
  }, [routeSignature]);

  useEffect(() => {
    function startLoading() {
      setLoading(true);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setLoading(false);
        timeoutRef.current = null;
      }, 8000);
    }

    function handleClick(event: MouseEvent) {
      if (!isPlainLeftClick(event)) return;

      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!target) return;

      const href = target.getAttribute("href");
      const targetValue = target.getAttribute("target");

      if (!href || href.startsWith("#") || targetValue === "_blank" || target.hasAttribute("download")) return;

      const nextUrl = new URL(href, window.location.href);

      if (nextUrl.origin !== window.location.origin) return;
      if (nextUrl.href === window.location.href) return;

      startLoading();
    }

    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("click", handleClick);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!loading) return null;

  return (
    <div aria-label="Page loading" className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-slate-950">
      <div className="h-full w-1/2 animate-route-progress rounded-r-full bg-gradient-to-r from-sky-300 via-emerald-300 to-amber-200" />
    </div>
  );
}
