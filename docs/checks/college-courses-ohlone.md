# Ohlone College courses: not drafted

Checked 2026-11-22. Ohlone's own site answers 403 Forbidden to plain requests on every path tried, so no catalog page could be read and no course file was written.

## What was tried (plain requests, no browser headers)

| URL | Tool | Result |
| --- | --- | --- |
| https://www.ohlone.edu/ | curl | 403 (server awselb/2.0, generic 403 page) |
| http://www.ohlone.edu/ | curl | 403 |
| https://ohlone.edu/ | curl | 403 |
| https://ohlone.edu/robots.txt | curl | 403 |
| https://www.ohlone.edu/catalog | curl, WebFetch | 403 both |
| https://www.ohlone.edu/catalog/ | curl | 403 |
| https://www.ohlone.edu/catalog/2025-2026 | curl | 403 |
| https://www.ohlone.edu/sites/default/files/documents/catalog.pdf | curl | 403 |
| https://ohlone.curriqunet.com/ | curl | 403 |
| https://catalog.ohlone.edu/ | curl | no response (host doesn't resolve or connect) |
| https://ohlone.elumenapp.com/ | curl | no response |
| https://ohlone.smartcatalogiq.com/ | curl | 500 "Layout Not Found" (not an Ohlone catalog) |

The block covers the whole ohlone.edu domain, robots.txt included, so I couldn't see which catalog system Ohlone links to as its official catalog. I didn't guess at one or use any other site.

## What a person needs to do

- Open Ohlone's catalog in a browser and send the catalog's address and year, or save the course pages, AA-T and AS-T pages for the 9 majors.
- If the official catalog is on a host other than ohlone.edu that answers plain requests, the draft can be run again from there.

No rows, judgment calls or todos: nothing was drafted.
