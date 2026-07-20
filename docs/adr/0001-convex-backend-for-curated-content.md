# Convex backend for a mostly-static curated guide

The site's content (species, prevalence, descriptions) is curated and changes rarely, so a static JSON build would suffice for visitors. We chose Convex anyway: it powers the admin UI (live editing without redeploys, field-level provenance for seed-vs-curated data), and it keeps the door open for v2 live BirdNET detections feeding the collage in real time — the original AvianVisitors behavior. The trade-off is a runtime query dependency on a page that could otherwise be fully static.
