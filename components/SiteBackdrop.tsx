'use client';

/** Shared atmospheric backdrop used across talmor.top pages. */
export default function SiteBackdrop() {
  return (
    <div className="site-backdrop" aria-hidden>
      <div className="site-backdrop__vignette" />
      <div className="site-backdrop__aurora site-backdrop__aurora--a" />
      <div className="site-backdrop__aurora site-backdrop__aurora--b" />
      <div className="site-backdrop__aurora site-backdrop__aurora--c" />
      <div className="site-backdrop__mesh" />
      <div className="site-backdrop__noise" />
    </div>
  );
}
