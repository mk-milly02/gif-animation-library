import * as gif_codec from "./gif-codec.js"

const GIPHY_API_KEY = "DcNZKQtGIHS6Uy6GUSVhcSFLugaXlN0q";
const GIF_LIMIT = 20;

export async function FetchGIFS(input) {
  const SEARCH_ENDPOINT = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${input}&limit=${GIF_LIMIT}&offset=0&rating=g&lang=en&bundle=messaging_non_clips`;

  try {
    const response = await fetch(SEARCH_ENDPOINT, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }

    const result = await response.json();
    return {
      statusCode: 200,
      body: result,
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: error,
    };
  }
}

export async function FetchTrendingGIFS() {
  const TRENDING_ENDPOINT = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${GIF_LIMIT}&offset=0&rating=g&bundle=messaging_non_clips`;

  try {
    const response = await fetch(TRENDING_ENDPOINT, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }

    const result = await response.json();
    return {
      statusCode: 200,
      body: result,
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: error,
    };
  }
}

export async function TrimGIF(url, trimCount) {
  const gifFile = await fetch(url);

  if (!gifFile.ok) {
    throw new Error("Network response was not ok " + response.statusText);
  }

  const decoder = new gif_codec.Decoder(await gifFile.arrayBuffer());

  const decodedGIF = decoder.decode();

  if (parseInt(trimCount) > decodedGIF.frames.length || trimCount == 0) {
    throw new Error("Invalid trim count" + trimCount);
  }

  decodedGIF.frames = decodedGIF.frames.slice(0, trimCount);

  const encoder = new gif_codec.Encoder(decodedGIF);

  return encoder.encode();
}
