import { LASTFM_API_KEY } from "$env/static/private";
import { formatDistanceToNow } from "date-fns";

import type { RequestHandler } from "../$types";

export interface LastFMResponse {
  artist: string;
  name: string;
  album: string;
  image: string;
  delta: string;
}

export const GET: RequestHandler = async () => {
  const response = await fetch(
    `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=Ooglely&api_key=${LASTFM_API_KEY}&format=json`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  if (!response.ok) {
    return new Response("Failed to fetch data from Last.fm", {
      status: response.status,
    });
  }
  const data = await response.json();
  const most_recent_track = data["recenttracks"]["track"][0];
  if (!most_recent_track) {
    return new Response("No recent tracks found", { status: 404 });
  }
  let time_ago: string;

  if (
    most_recent_track["@attr"] &&
    most_recent_track["@attr"]["nowplaying"] === "true"
  ) {
    time_ago = "right now!";
  } else {
    const timestamp = new Date(most_recent_track["date"]["uts"] * 1000);
    time_ago = formatDistanceToNow(timestamp, { addSuffix: true });
  }
  const response_data = {
    artist: most_recent_track["artist"]["#text"],
    name: most_recent_track["name"],
    album: most_recent_track["album"]["#text"],
    image: most_recent_track["image"][2]["#text"],
    delta: time_ago,
  };
  return new Response(JSON.stringify(response_data), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
