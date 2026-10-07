/**
 * J-Card Template: Album Art Lookup
 *
 * Searches MusicBrainz (with the Cover Art Archive) and Apple Music for album
 * art and track lists, straight from the browser. Art is fetched on demand
 * and never re-hosted. Recent picks are kept in this browser.
 */

import { LOOKUP } from "./constants.mjs";
import * as storage from "./storage.mjs";
import { STORES } from "./storage.mjs";

/** Recent picks record key. */
const RECENT_KEY = 1;

/** Returns the given text quoted for a MusicBrainz (Lucene) query. */
function quote(text) {
  return '"' + text.replace(/[\\"]/g, "\\$&") + '"';
}

/** Fetches the given URL as JSON, failing on HTTP errors. */
async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }
  return response.json();
}

/**
 * Resolves with search results for the given artist and album from the given
 * source ("musicbrainz" or "itunes"). Each result has `source`, `id`,
 * `title`, `artist`, `year`, `format`, `country` and `thumb`.
 */
export async function searchAlbums(artist = "", album = "", source = "") {
  return source === "itunes"
    ? searchItunes(artist, album)
    : searchMusicBrainz(artist, album);
}

/** Searches MusicBrainz releases, listing cassette releases first. */
async function searchMusicBrainz(artist, album) {
  const terms = [];
  if (album) {
    terms.push("release:" + quote(album));
  }
  if (artist) {
    terms.push("artist:" + quote(artist));
  }
  const data = await getJson(
    LOOKUP.musicBrainz +
      "release/?fmt=json&limit=" +
      LOOKUP.limit +
      "&query=" +
      encodeURIComponent(terms.join(" AND "))
  );
  const results = (data.releases || []).map((release) => {
    const formats = Array.from(
      new Set((release.media || []).map((medium) => medium.format).filter(Boolean))
    );
    return {
      artist: (release["artist-credit"] || [])
        .map((credit) => credit.name + (credit.joinphrase || ""))
        .join(""),
      country: release.country || "",
      format: formats.join(", "),
      id: release.id,
      source: "musicbrainz",
      thumb: LOOKUP.coverArt + "release/" + release.id + "/front-250",
      title: release.title,
      year: (release.date || "").slice(0, 4),
    };
  });
  const isCassette = (result) => /cassette/i.test(result.format);
  return results.filter(isCassette).concat(results.filter((r) => !isCassette(r)));
}

/** Searches Apple Music albums. */
async function searchItunes(artist, album) {
  const data = await getJson(
    LOOKUP.itunes +
      "search?entity=album&limit=" +
      LOOKUP.limit +
      "&term=" +
      encodeURIComponent([artist, album].filter(Boolean).join(" "))
  );
  return (data.results || []).map((result) => ({
    artist: result.artistName,
    country: result.country || "",
    format: "Digital",
    id: String(result.collectionId),
    source: "itunes",
    thumb: (result.artworkUrl100 || "").replace("100x100bb", "250x250bb"),
    title: result.collectionName,
    year: (result.releaseDate || "").slice(0, 4),
    full: (result.artworkUrl100 || "").replace(
      "100x100bb",
      LOOKUP.itunesSize + "x" + LOOKUP.itunesSize + "bb"
    ),
  }));
}

/**
 * Resolves with the largest front image for the given result as a Blob, or
 * rejects when it has none.
 */
export async function fetchArt(result) {
  let url = result.full;
  if (result.source === "musicbrainz") {
    const data = await getJson(LOOKUP.coverArt + "release/" + result.id);
    const image =
      (data.images || []).find((candidate) => candidate.front) ||
      (data.images || [])[0];
    if (!image) {
      throw new Error("No cover art");
    }
    url = image.image;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }
  const blob = await response.blob();
  // Some servers label images generically; the bytes are still an image.
  return blob.type.startsWith("image/")
    ? blob
    : new Blob([blob], { type: "image/jpeg" });
}

/**
 * Resolves with the track list for the given result as `{ sideA, sideB }`
 * arrays of titles. Two-sided releases keep their sides; others are split in
 * half.
 */
export async function fetchTracks(result) {
  const sides =
    result.source === "musicbrainz"
      ? await fetchMusicBrainzSides(result.id)
      : await fetchItunesSides(result.id);
  return { sideA: sides[0] || [], sideB: sides.slice(1).flat() };
}

/** Resolves with MusicBrainz track titles grouped into sides. */
async function fetchMusicBrainzSides(id) {
  const data = await getJson(
    LOOKUP.musicBrainz + "release/" + id + "?fmt=json&inc=recordings"
  );
  const media = (data.media || []).filter((medium) => (medium.tracks || []).length);
  if (media.length >= 2) {
    return media.map((medium) => medium.tracks.map((track) => track.title));
  }
  const tracks = media.length ? media[0].tracks : [];
  // Cassette tracks are often numbered A1, A2, B1...
  if (tracks.some((track) => /^B/i.test(track.number || ""))) {
    return [
      tracks.filter((track) => !/^B/i.test(track.number)).map((t) => t.title),
      tracks.filter((track) => /^B/i.test(track.number)).map((t) => t.title),
    ];
  }
  return splitHalf(tracks.map((track) => track.title));
}

/** Resolves with Apple Music track titles grouped into sides. */
async function fetchItunesSides(id) {
  const data = await getJson(LOOKUP.itunes + "lookup?entity=song&id=" + id);
  const tracks = (data.results || [])
    .filter((item) => item.wrapperType === "track")
    .sort(
      (a, b) => a.discNumber - b.discNumber || a.trackNumber - b.trackNumber
    );
  const discs = Array.from(new Set(tracks.map((track) => track.discNumber)));
  if (discs.length >= 2) {
    return discs.map((disc) =>
      tracks
        .filter((track) => track.discNumber === disc)
        .map((track) => track.trackName)
    );
  }
  return splitHalf(tracks.map((track) => track.trackName));
}

/** Returns the given list split into two halves, the first one longer. */
function splitHalf(list) {
  const middle = Math.ceil(list.length / 2);
  return [list.slice(0, middle), list.slice(middle)];
}

/** Resolves with recent picks, newest first. */
export function getRecent() {
  return storage
    .get(STORES.recent, RECENT_KEY)
    .then((recent) => (Array.isArray(recent) ? recent : []));
}

/** Records the given result as a recent pick. */
export async function addRecent(result) {
  const recent = (await getRecent()).filter(
    (item) => !(item.source === result.source && item.id === result.id)
  );
  recent.unshift(result);
  await storage.put(STORES.recent, RECENT_KEY, recent.slice(0, LOOKUP.recentMax));
  return recent.slice(0, LOOKUP.recentMax);
}
