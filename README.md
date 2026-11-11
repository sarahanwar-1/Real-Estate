# Fernhill Realty

A modern real estate website in plain HTML, CSS and JavaScript. No build step, no frameworks, no installs.
It has a light and dark theme, works from 320px phones up to wide desktops, and the sample homes, agents and prices are all made up for the demo.

## What is on the page

- A hero with a search card (Buy, Rent, Sell tabs) and quick filters
- Listings with filters, sorting, saved homes, a grid view and an illustrated map view
- A quick view for every home with a gallery, facts, a tour or viewing request form, and a shareable link
- Neighbourhood tiles that filter the listings
- A "what is my home worth" estimate with a lead form
- A monthly payment calculator that a listing can pre-fill
- Buying and selling steps, agent cards, FAQ, newsletter sign-up and footer

## Run it

Open `index.html` in a browser. To serve it locally: `python3 -m http.server` and visit `http://localhost:8000`.
To publish, upload the whole folder to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages or plain hosting).

## Files

| File | What it does |
| --- | --- |
| `index.html` | The page, SEO tags and the structured data |
| `style.css` | All styling. Colours and sizes are tokens at the top |
| `listings.js` | The homes, neighbourhoods and agents. Edit this to change the content |
| `art.js` | Draws the illustrated homes, hero scene, map and avatars when there is no photo |
| `script.js` | Filters, map, quick view, forms, calculator and saved homes. Settings are in `CONFIG` at the top |
| `assets/favicon.svg`, `assets/og-image.png` | Browser icon and the social sharing image (1200 x 630) |
| `robots.txt`, `sitemap.xml` | Search engine files |

## Use your own homes

Open `listings.js`. The comment at the top explains every field. In short, each home needs an `id`, `status` (`'sale'` or `'rent'`), `price`, `hood`, `address`, `type`, `beds`, `baths`, `sqft`, an `agent`, and map position `x`, `y`.

- **Photos:** the pictures in the demo are illustrations. Add `photo: 'photos/larkspur-1.jpg'` to a home to use a real picture. Add `photos: ['front.jpg', 'evening.jpg', 'street.jpg']` for a three-picture gallery. Put the files in a `photos/` folder. Use JPG or WebP around 1280 x 960.
- **Home types:** `House`, `Bungalow`, `Cottage`, `Cabin`, `Townhouse`, `Duplex`, `Row house`, `Condo`, `Loft condo`. The Home type filter groups them into house, townhouse and condo.
- **Link to one home:** `index.html#home-<id>` opens that home's quick view.
- **Neighbourhoods and agents** are lists in the same file. A home's `hood` and `agent` must match an `id` there. `perSqft` in each neighbourhood drives the valuation estimate.
- **Map:** the map is an illustration drawn in `art.js` (`mapBase`). Pins use each home's `x`, `y` (0 to 1000 across, 0 to 760 down). To use a real map later, replace the map block with an embed from your map provider and keep the listing cards.

## Make the forms work

Tour requests, valuation requests and the newsletter run in demo mode until you add an address. In `script.js`:

```js
const CONFIG = { endpoint: 'https://your-form-service.example/submit', ... }
```

Any service that accepts a JSON `POST` works (Formspree, Getform, a Google Apps Script web app, your own server). The page sends:

```json
{ "type": "tour", "listing": "larkspur-14", "address": "14 Larkspur Lane", "kind": "person", "date": "2026-11-14", "time": "1:00 PM", "name": "...", "email": "...", "phone": "...", "note": "...", "agent": "maya" }
{ "type": "valuation", "name": "...", "email": "...", "address": "...", "hood": "...", "beds": "3", "baths": "2", "sqft": "1800", "condition": "Average", "estimate": "$482,000 to $544,000" }
{ "type": "newsletter", "email": "..." }
```

The valuation number is a rough estimate (size x neighbourhood price per square foot, adjusted for rooms and condition). It is not an appraisal, and the page says so. Change the wording or the formula in `script.js` if your market needs it.

## Before you launch

Replace the made-up details in these places:

1. **Business details:** name, phone `(555) 010-0172`, `hello@fernhillrealty.example` and the address appear in `index.html` (header, call-to-action, footer, `noscript` message and the JSON-LD block near the top). `CONFIG.phone` in `script.js` is shown in form error messages.
2. **Web address:** `https://www.fernhillrealty.example/` appears in the canonical link, the Open Graph and Twitter tags and the JSON-LD in `index.html`, and in `robots.txt` and `sitemap.xml`.
3. **Social image:** regenerate `assets/og-image.png` with your own name and photo if you like (1200 x 630).
4. **Listings, agents, hours and the FAQ answers** are samples. Check every claim against your real business, and add the licence and fair-housing wording your local rules require.
5. **Photos** (see above).

## Colours and fonts

The palette is yellow `#FFDE42`, moss `#4C5C2D`, forest `#313E17` and cocoa `#1B0C0C`. They are tokens at the top of `style.css`; the dark theme has its own values in the two dark blocks. Fonts are Outfit (headings) and Instrument Sans (text), loaded from Google Fonts with system fallbacks.

## Theme

A visitor's choice is remembered in `localStorage`. The first-visit default is set at the top of `index.html` (`DEFAULT = 'light'`; change it to `'dark'` or make it follow the system setting).

## Accessibility and browsers

Keyboard friendly, visible focus rings, labelled controls, reduced-motion support, and the quick view uses the native `<dialog>` element. Text meets WCAG AA contrast in both themes. Works in current Chrome, Edge, Firefox and Safari.
