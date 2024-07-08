const GIPHY_API_KEY = "DcNZKQtGIHS6Uy6GUSVhcSFLugaXlN0q";
const GIF_LIMIT = 20;

export async function FetchGIFS( input ) {
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
        body: result
    }
  } catch (error) {
    return {
        statusCode: 400,
        body: error
    }
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
        body: result
    }
  } catch (error) {
    return {
        statusCode: 400,
        body: error
    }
  }
}

