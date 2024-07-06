require('dotenv').config();

document
  .getElementById("searchButton")
  .addEventListener("click", async function (event) {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    // Get the value from the text field
    const input = document.getElementById("searchInput").value;

    if (input == "") {
      alert("Please enter a search query.");
      return;
    }

    var url = `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API}&q=${input}&limit=25&offset=0&rating=g&lang=en&bundle=messaging_non_clips`;

    try {
      // Post the data to the API
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }

      // Parse the JSON response
      const result = await response.json();
      console.log(result);
    } catch (error) {
      // Handle errors
      console.error("Error:", error);
    }
  });
