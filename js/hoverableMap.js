// when user hover the area of the map, the name of the area will pop up
// Load the SVG file
d3.xml("../images/boston.svg").then((data) => {
  d3.select("#map-container").node().append(data.documentElement);
  hoverEffects();
});

function hoverEffects() {
  d3.selectAll("#map-container svg g#areas path")
    .on("click", function (event, d) {
      // Change fill color on click
      d3.selectAll("#map-container svg g#areas path").style("fill", ""); // Reset other paths' color
      d3.select(this).style("fill", "lightblue"); // Highlight clicked path
    })
    .on("mouseover", function (event, d) {
      const pathId = d3.select(this).attr("id");
      console.log("Area Name: " + pathId); // Display the area name (you can replace this with code to show a tooltip)
    });
}
