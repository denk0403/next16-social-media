// Pre-paint inline script that sets `aria-current="page"` on every
// `[data-navlink-href]` link whose `href` matches `location.pathname`.
// Runs once during HTML parse before first paint, then re-tags itself as
// `text/plain` so React leaves it alone on hydration.
//
// Without this, the Suspense fallback in `NavLink` paints inactive HTML
// briefly on hard navigation before the resolved content swaps in. The
// component still works without the script — this just smooths the flash.
export function NavLinkScript() {
  const html = `(function(){
  var p = location.pathname;
  document.querySelectorAll('[data-navlink-href]').forEach(function(el) {
    var href = el.getAttribute('data-navlink-href');
    var exact = el.hasAttribute('data-navlink-exact');
    var active = (exact || href === '/') ? p === href : (p === href || p.startsWith(href + '/'));
    if (active) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });
})()`;

  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
