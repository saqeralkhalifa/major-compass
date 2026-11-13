/* Site monitoring, added 13 November 2026.
   Sentry reports page errors so broken pages can be fixed quickly.
   PostHog counts page visits and clicks without cookies: no session recording,
   visitor IP addresses are discarded by the project settings, and browsers that
   ask not to be tracked are respected. */
(function () {
  var SITE = "major-compass";
  var SENTRY_DSN = "https://77ed1820baa9f60f79a86f2291788a7b@o4512423200030720.ingest.de.sentry.io/4512423212286032";
  var POSTHOG_KEY = "phc_oWM6BdwGEsZiUqgdxBxW9VGPGZCymstiaDX2LhyNakTV";

  /* Keep errors that happen before Sentry finishes loading. */
  var early = [];
  function keep(e) { early.push(e.error || e.reason || e.message); }
  window.addEventListener("error", keep);
  window.addEventListener("unhandledrejection", keep);

  var s = document.createElement("script");
  s.src = "https://browser.sentry-cdn.com/11.12.0/bundle.min.js";
  s.crossOrigin = "anonymous";
  s.async = true;
  s.onload = function () {
    if (!window.Sentry) return;
    window.Sentry.init({
      dsn: SENTRY_DSN,
      environment: "production",
      sendDefaultPii: false,
      initialScope: { tags: { site: SITE } }
    });
    window.removeEventListener("error", keep);
    window.removeEventListener("unhandledrejection", keep);
    early.forEach(function (err) { if (err) window.Sentry.captureException(err); });
  };
  document.head.appendChild(s);

  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  window.posthog.init(POSTHOG_KEY, {
    api_host: "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    persistence: "localStorage",
    disable_session_recording: true,
    respect_dnt: true
  });
  window.posthog.register({ site: SITE });
})();
