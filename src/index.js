import * as gif_animation_library from "./gif-animation-library.js";

const gifModal = document.getElementById("gifModal");
const gifTitle = document.getElementById("gifTitle");
const gifDisplay = document.getElementById("gifDisplay");
const gifInput = document.getElementById("gifInput");

let selectedGifUrl = "";
let clickedImageInfo = {};

window.onload = async () => {
  let gifs = await gif_animation_library.FetchTrendingGIFS();
  displayGIFS(gifs);
};

document
  .querySelector(".close")
  .addEventListener("click", () => {
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

      // store the clicked image in a global variable.
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
document.getElementById("downloadButton").addEventListener("click", () =>
    downloadGIF(clickedImageInfo?.img, clickedImageInfo?.title));

async function downloadGIF(url, filename) {
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

// upload gif
document
  .getElementById("uploadButton")
  .addEventListener("click", () => gifInput.click());

document
  .getElementById("gifInput")
  .addEventListener("change", () => uploadGIF());

async function uploadGIF() {
  let file = gifInput.files[0];
  if (file && file.type === "image/gif") {
    selectedGifUrl = URL.createObjectURL(file);
    gifDisplay.src = selectedGifUrl;
    gifTitle.innerText = file.name;
    gifModal.style.display = "flex";

    clickedImageInfo = {
      url: selectedGifUrl,
      title: file.name,
      alt: file.name,
      img: selectedGifUrl,
    };
  } else {
    alert("Please select a valid GIF file.");
  }
}
