const USER_AGENT =
  "birds-in-ueno/0.1 (audio-select; https://github.com/scheffchuk/birds-in-ueno-park)";

/** Fetch a Wikidata endpoint with the application identity required by its bot policy. */
export function fetchWikidata(url: string | URL): Promise<Response> {
  return fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": USER_AGENT,
      "Api-User-Agent": USER_AGENT,
    },
  });
}
