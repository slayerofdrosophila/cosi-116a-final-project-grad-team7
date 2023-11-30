// when user hover the area of the map, the name of the area will pop up
// Load the SVG file
d3.xml("../images/boston.svg").then((data) => {
  d3.select("#map-container").node().append(data.documentElement);
});
