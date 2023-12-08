// when user hover the area of the map, the name of the area will pop up
// Load the SVG file
// d3.xml("../images/boston.svg").then((data) => {
//   d3.select("#map-container").node().append(data.documentElement);
//   hoverEffects();
// });


// Load the income data from the CSV file
let neighborhoodIncomeData = {};
let neighborhoodHighLevelIncomeData = {};

d3.csv("files/combined_income_real_2021only.csv").then(data => {
  data.forEach(d => {

    const neighborhood = d['Neighborhood'].trim();
    const incomeBracket = d['Bracket'].trim();
    const count = +d['Count'];

    if (!neighborhoodIncomeData[neighborhood]) {
      neighborhoodIncomeData[neighborhood] = {};
    }
    if (!neighborhoodHighLevelIncomeData[neighborhood]) {
      neighborhoodHighLevelIncomeData[neighborhood] = {};
    }

    if (incomeBracket == "Total households" || incomeBracket == "Median household income (dollars)"){
      neighborhoodHighLevelIncomeData[neighborhood][incomeBracket] = count;
    } else {
      neighborhoodIncomeData[neighborhood][incomeBracket] = count;
    }


  });

  console.log(neighborhoodIncomeData)

  d3.xml("../images/boston.svg").then((data) => {
    d3.select("#map-container").node().append(data.documentElement);
    hoverEffects(); // This now uses the loaded income data
  });
});



const areaMapping = {
  "Path_1": "Brighton + Allston",
  "Path_2": "Charlestown",
  "Path_3": "East Boston",
  "Path_4": "North End",
  "Path_5": "South End",
  "Path_6": "Fenway + Kenmore",
  "Path_7": "Beacon Hill",
  "Path_8": "Roxbury",
  "Path_9": "Mission Hill + Jamaica Plain",
  "Path_10": "West Roxbury",
  "Path_11": "Hyde Park",
  "Path_12": "Roslindale",
  "Path_13": "South Boston",
  "Path_14": "Dorchester",
  "Path_15": "Mid Dorchester",
  "Path_16": "Mattapan"
};

const avgPropertyPriceMapping = {
  "Allston": 916740.64,
  "Back Bay": 3197086.84,
  "Beacon Hill": 862190.36,
  "Brighton": 481060.42,
  "Charlestown": 1373784.86,
  "Dorchester": 210946.12,
  "Mid Dorchester": 210946.12,
  "Downtown": 488458.88,
  "East Boston": 701523.18,
  "Fenway": 1396758.27,
  "Hyde Park": 391282.15,
  "Mission Hill": 1046294.81,
  "North End": 432038.02,
  "Roslindale": 745318.39,
  "Roxbury": 622434.05,
  "South Boston": 1019673.75,
  "South End": 530424.48,
  "Waterfront": 516528.89,
  "West End": 418939.65,
  "West Roxbury": 801997.48,
  "Mattapan": 555863.40,
  "Fenway + Kenmore": 1194750.286,
  "Mission Hill + Jamaica Plain": 1053993.927,
  "Brighton + Allston": 698900.5284
};


// Example color scale - adjust as needed
const colorScale = d3.scaleLinear()
  .domain([d3.min(Object.values(avgPropertyPriceMapping)), d3.max(Object.values(avgPropertyPriceMapping))])
  .range(["#ffffcc", "#800026"]);


function hoverEffects() {
  const tooltip = d3.select("#tooltip");
  d3.selectAll("#map-container svg g#areas path")
    .style("fill", function() {
      const areaName = areaMapping[d3.select(this).attr("id")];
      const avgPrice = avgPropertyPriceMapping[areaName];
      return colorScale(avgPrice);
    })
    .on("mouseover", function (event, d) {
      const pathId = d3.select(this).attr("id");
      const areaName = areaMapping[pathId];
      const avgPrice = avgPropertyPriceMapping[areaName];

      const incomeData = neighborhoodIncomeData[areaName] || {};
      const dataEntries = Object.entries(incomeData);

      console.log(dataEntries)

      // Prepare the SVG for the histogram
      const histogramSvg = d3.create("svg")
                             .attr("width", 200)
                             .attr("height", 100);

      // Create scales for your histogram based on the data
      const xScale = d3.scaleBand()
                       .domain(dataEntries.map(d => d[0]))
                       .range([0, 200])
                       .padding(0.1);

      const yScale = d3.scaleLinear()
                       .domain([0, d3.max(dataEntries, d => d[1])])
                       .range([100, 0]);

      // Append the bars to the SVG
      histogramSvg.selectAll("rect")
                  .data(dataEntries)
                  .enter()
                  .append("rect")
                  .attr("x", d => xScale(d[0]))
                  .attr("y", d => yScale(d[1]))
                  .attr("width", xScale.bandwidth())
                  .attr("height", d => 100 - yScale(d[1]))
                  .attr("fill", "steelblue");

      histogramSvg.selectAll(".bar-label")
                  .data(dataEntries)
                  .enter()
                  .append("text")
                  .attr("class", "bar-label")
                  .attr("x", d => xScale(d[0]) + xScale.bandwidth() / 2)
                  .attr("y", d => yScale(d[1]) - 5) // adjust the 5 pixels offset as needed
                  .attr("text-anchor", "middle")
                  .text(d => d[1]); // This will display the count on top of each bar


      d3.select(this).style("fill", "lightblue");
      tooltip.transition()
             .duration(200)
             .style("opacity", .9);
      tooltip.html("<h3>" + areaName + `<br>Avg. Property Price: ${avgPrice}` + "</h3>"
              + "<h5> Household Income Distribution: </h5>")
             .style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 28) + "px");
      tooltip.node().appendChild(histogramSvg.node());
    })
    
    .on("mouseout", function (d) {
      const areaName = areaMapping[d3.select(this).attr("id")];
      const avgPrice = avgPropertyPriceMapping[areaName];
      d3.select(this).style("fill", colorScale(avgPrice));
      tooltip.transition()
             .duration(500)
             .style("opacity", 0);
    });
}


// Data

