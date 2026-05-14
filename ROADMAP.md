# Roadmap

## SEO & Discoverability

- [ ] **Google Search Console** - Submit sitemap, monitor indexing, and track keyword performance.
- [ ] **Content pages** - Add indexable content such as "How to create a free map poster"; an SPA alone gives search engines little page-level context.
- [ ] **Directory submissions** - List PosterEngine on Product Hunt, AlternativeTo, Futurepedia, and similar design-tool directories.
- [ ] **OpenStreetMap community** - Showcase PosterEngine in OSM forums, wiki tool pages, and community channels.
- [ ] **Backlink outreach** - Reach out to map/design blogs for reviews or mentions.
- [ ] **Social media presence** - Share poster examples on visual and design-focused channels.

## Code Quality

- [ ] **TypeScript strict mode** - Migrate to `strict: true` and remove `allowJs`.
- [ ] **Pre-existing type cleanup** - Review known weak spots around export, startup location, and poster typography after strictness improves.
- [ ] **Architecture cleanup** - Continue moving browser I/O out of UI components and into application/infrastructure boundaries.

## Features

- [ ] **Export controls** - Add quality or size controls beyond current PNG, PDF, and SVG options.
- [ ] **Markers improvements** - Improve custom icons, bulk import, and marker management.
- [ ] **Theme gallery** - Add a browsable theme preview experience.
- [ ] **Accessibility audit** - Verify keyboard navigation and screen reader behavior across core workflows.

## Google Search Console Setup

1. Go to `https://search.google.com/search-console`.
2. Add `https://posterengine.andreapizzetti.com` as a URL prefix property.
3. Verify ownership with the HTML meta tag or DNS TXT record.
4. Submit `https://posterengine.andreapizzetti.com/sitemap.xml`.
5. Use URL Inspection to request indexing for `https://posterengine.andreapizzetti.com`.
6. Monitor the Performance tab for keyword impressions, clicks, and average position.
