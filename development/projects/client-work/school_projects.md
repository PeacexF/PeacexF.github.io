# School Projects

A handful of small websites built on request for classmates and their contacts, from more than a year ago. Included here for completeness rather than as current examples of quality — early work, done quickly, before most of the practices described elsewhere in this portfolio were in place.

---

## What These Were

Two of the three were variations on the same brief: a small organization's request/order form — visitors fill out a form (name, address, phone, category, comment), and the submission needs to reach someone who can act on it. The third was a static page for a literary/cultural exhibit, with photos and audio guides for different landmarks, no backend involved.

**First version** — a FastAPI backend that appended form submissions to a plain text file. About as simple as a working version could be: no database, no auth, no persistence beyond a flat file.

**Second version**, for the same kind of brief, iterated on that considerably — SQLite storage instead of a text file, an authenticated admin page to view submissions, rate limiting on the submission endpoint, and Nginx with Certbot in front of it for TLS. A real, if small, step up in how the same problem was solved the second time around.

**Third one** was purely static — HTML/CSS/JS with embedded audio players for a set of location-based audio guides. No backend, no build step, just a page meant to be browsed.

---

## Honest Assessment

These were fast, informal jobs — the kind of thing you build in a couple of days for someone you know, not projects done under real client pressure or with the process described in the rest of this portfolio. A few things stand out looking back: the improved version's admin authentication logic printed the configured username and password to the console for debugging, which is exactly the kind of thing that shouldn't ship even in a small project. CORS was left wide open in the first version. Neither has tests, CI, or documentation beyond a setup guide.

They're worth keeping in the portfolio as a marker of where things started, and as a contrast — the jump from the first version (flat file, no auth) to the second (SQLite, rate limiting, authenticated admin panel, TLS via Nginx/Certbot) is a reasonable illustration of iterating on the same problem and taking it more seriously the second time.

---

## Technical Stack

**Backend**
Python, FastAPI, SQLite

**Frontend**
Static HTML/CSS/JS

**Infrastructure**
Docker, Nginx, Certbot

---

## Suitable Portfolio Categories

Client Work · Early Projects