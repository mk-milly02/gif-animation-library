import * as gif_animation_library from "./gif-animation-library.js";

const gifModal = document.getElementById("gifModal");
const gifTitle = document.getElementById("gifTitle");
const gifDisplay = document.getElementById("gifDisplay");

const closeBtn = document.querySelector(".close");
let selectedGifUrl = "";
let clickedImageInfo = {};

window.onload = async () => {
  let gifs = await gif_animation_library.FetchTrendingGIFS();
  displayGIFS(gifs);
};

closeBtn.addEventListener("click", () => {
  gifModal.style.display = "none";
  gifDisplay.src = "";
});

window.addEventListener("click", (event) => {
  if (event.target === gifModal) {
    gifModal.style.display = "none";
  }
});

document
  .getElementById("searchButton")
  .addEventListener("click", async function (event) {
    event.preventDefault();

    const input = document.getElementById("searchInput").value;

    if (input == "") {
      alert("Please enter a search query.");
      return;
    }

    let gifs = await gif_animation_library.FetchGIFS(input);

    console.log(gifs.statusCode);

    displayGIFS(gifs);
  });

function displayGIFS(gifs) {
  const container = document.getElementById("gallery");

  container.innerHTML = "";

  gifs.body.data.forEach((gif) => {
    const img = document.createElement("img");

    img.src = gif.images.fixed_height_small.url;
    img.alt = gif.title;
    img.className = "gif-item";
    img.addEventListener("click", () => {
      selectedGifUrl = gif.images.original.url;
      gifDisplay.src = selectedGifUrl;
      gifTitle.innerText = gif.title;
      gifModal.style.display = "flex";

      // Store the clicked image in a global variable.
      clickedImageInfo = {
        url: gif.images.original.url,
        title: gif.title,
        alt: gif.title,
        img: gif.images.original.url,
      };
    });

    container.appendChild(img);
  });
}

// share gif.
document.getElementById("shareButton").addEventListener("click", () => {
  console.log(clickedImageInfo?.img);
  navigator.share({
    title: `${clickedImageInfo?.title}`,
    text: "Build a GIF animation library, such that a user can search a GIF by keyword or select from a gallery.",
    url: `${clickedImageInfo?.url}`,
  });
});

// download gif
document
  .getElementById("downloadButton")
  .addEventListener("click", () =>
    downloadImage(clickedImageInfo?.img, clickedImageInfo?.title)
  );

async function downloadImage(url, filename) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Error downloading image:", error);
  }
}
