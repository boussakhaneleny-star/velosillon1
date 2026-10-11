"use strict";
const CACHE = "velosillon-v3";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest"];
const NETWORK_FIRST = ["./", "./index.html"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("message", e => { if (e.data === "skip-waiting") self.skipWaiting(); });

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const key = url.pathname.endsWith("/") ? "./" : "./" + url.pathname.split("/").pop();
  const isNetworkFirst = NETWORK_FIRST.includes(key) || e.request.mode === "navigate";

  e.respondWith(
    fetch(e.request, { cache: "no-store" }).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() =>
      caches.match(e.request).then(cached => cached || caches.match("./index.html"))
    )
  );
});
