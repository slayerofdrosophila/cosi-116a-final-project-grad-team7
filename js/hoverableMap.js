// when user hover the area of the map, the name of the area will pop up
// Load the SVG file
d3.xml("../images/boston.svg").then((data) => {
  d3.select("#map-container").node().append(data.documentElement);
  hoverEffects();
});

function hoverEffects() {
  const tooltip = d3.select("#tooltip");

  d3.selectAll("#map-container svg g#areas path")
    .on("mouseover", function (event, d) {
      d3.select(this).style("fill", "lightblue");
      tooltip.transition()
             .duration(200)
             .style("opacity", .9);
      tooltip.html("Area Name: " + d3.select(this).attr("id"))
             .style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function (d) {
      d3.select(this).style("fill", "");
      tooltip.transition()
             .duration(500)
             .style("opacity", 0);
    });
}

