# Country Search

A country autocomplete built with Next.js 16 (App Router), TanStack Query, Axios, and Tailwind CSS v4. Start typing a country name and get instant results with flags, capitals, and regions — powered by the free [countries.dev](https://countries.dev) API, no API key required.

## Stack

- **Next.js 16** — App Router, `next/image` for optimised flag rendering
- **TanStack Query v5** — client-side fetching, per-query caching, and deduplication
- **Axios** — HTTP client with typed responses and consistent error handling
- **Tailwind CSS v4** — utility-first styling, no config file needed
- **countries.dev** — free, keyless REST API for country data

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start searching.

---

### Tradeoffs

I built the country search as a client-side autocomplete since the results depend on what the user types. I used **Axios** to make the API requests because it makes it straightforward to work with the API response and handle errors.

I used **TanStack Query** mainly for its caching. If a user searches for the same country again, the app can use the result it already has instead of making another request. This helps reduce unnecessary API calls and makes repeated searches faster.

For the styling, I used **Tailwind CSS** because it made it easy to build the interface and keep the styles close to the component. I also added a short debounce to the search input so the app doesn't send a request every time the user types a character. There is a small delay before the search starts, but it helps avoid making too many requests.

### Scaling and Hardening

If the application had a lot more users, I wouldn't want every user to depend directly on the external country API. I would put a small server-side endpoint in between and cache the country data there. Since country information doesn't change often, most requests could be served from the cache.

I would also keep a local copy of the country data so the search can still work if the external API goes down.

### Testing

I would use Jest for unit tests. I would test the API function to make sure it returns the expected countries and handles cases where there are no results or the API fails.

I would also test the search component by typing a search, selecting a country, and checking that the keyboard navigation works as expected. For the complete user flow, I would add an end-to-end test to make sure the search and selection process works correctly from start to finish.
