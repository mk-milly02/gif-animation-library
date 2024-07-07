import * as gif_animation_library from "./gif-animation-library.js";

const gifModal = document.getElementById("gifModal");
const gifDisplay = document.getElementById("gifDisplay");
const closeBtn = document.querySelector(".close");
let selectedGifUrl = "";

closeBtn.addEventListener("click", () => {
  gifModal.style.display = "none";
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
      gifModal.style.display = "flex";
    });

    container.appendChild(img);
  });
}
