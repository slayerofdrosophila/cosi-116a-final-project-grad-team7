// when user hover the area of the map, the name of the area will pop up
// Load the SVG file

// Load the income data from the CSV file
let neighborhoodIncomeData = {};
let neighborhoodHighLevelIncomeData = {};

// For the click compare thing
let selectedNeighborhoods = [];

d3.csv("files/combined_income_real_2021only.csv").then((data) => {
  data.forEach((d) => {
    const neighborhood = d["Neighborhood"].trim();
    const incomeBracket = d["Bracket"].trim();
    const count = +d["Count"];

    if (!neighborhoodIncomeData[neighborhood]) {
      neighborhoodIncomeData[neighborhood] = {};
    }
    if (!neighborhoodHighLevelIncomeData[neighborhood]) {
      neighborhoodHighLevelIncomeData[neighborhood] = {};
    }

    if (
      incomeBracket == "Total households" ||
      incomeBracket == "Median household income (dollars)"
    ) {
      neighborhoodHighLevelIncomeData[neighborhood][incomeBracket] = count;
    } else {
      neighborhoodIncomeData[neighborhood][incomeBracket] = count;
    }
  });

  console.log(neighborhoodIncomeData);

  d3.xml("../images/boston.svg").then((data) => {
    d3.select("#map-container").node().append(data.documentElement);
    //append the scale for user for better understanding
    gradientScale();
    hoverEffects(); // This now uses the loaded income data
  });
});

const areaMapping = {
  Path_1: "Brighton + Allston",
  Path_2: "Charlestown",
  Path_3: "East Boston",
  Path_4: "North End",
  Path_5: "South End",
  Path_6: "Fenway + Kenmore",
  Path_7: "Beacon Hill",
  Path_8: "Roxbury",
  Path_9: "Mission Hill + Jamaica Plain",
  Path_10: "West Roxbury",
  Path_11: "Hyde Park",
  Path_12: "Roslindale",
  Path_13: "South Boston",
  Path_14: "Dorchester",
  Path_15: "Mid Dorchester",
  Path_16: "Mattapan",
};

const avgPropertyPriceMapping = {
  Allston: 916740.64,
  "Back Bay": 3197086.84,
  "Beacon Hill": 862190.36,
  Brighton: 481060.42,
  Charlestown: 1373784.86,
  Dorchester: 210946.12,
  "Mid Dorchester": 210946.12,
  Downtown: 488458.88,
  "East Boston": 701523.18,
  Fenway: 1396758.27,
  "Hyde Park": 391282.15,
  "Mission Hill": 1046294.81,
  "North End": 432038.02,
  Roslindale: 745318.39,
  Roxbury: 622434.05,
  "South Boston": 1019673.75,
  "South End": 530424.48,
  Waterfront: 516528.89,
  "West End": 418939.65,
  "West Roxbury": 801997.48,
  Mattapan: 555863.4,
  "Fenway + Kenmore": 1194750.286,
  "Mission Hill + Jamaica Plain": 1053993.927,
  "Brighton + Allston": 698900.5284,
};

// Example color scale - adjust as needed
const colorScale = d3
  .scaleLinear()
  .domain([
    d3.min(Object.values(avgPropertyPriceMapping)),
    d3.max(Object.values(avgPropertyPriceMapping)),
  ])
  .range(["#ffffcc", "#800026"]);

function hoverEffects() {
  const tooltip = d3.select("#tooltip");
  d3.selectAll("#map-container svg g#areas path")
    .style("fill", function () {
      const areaName = areaMapping[d3.select(this).attr("id")];
      const avgPrice = avgPropertyPriceMapping[areaName];
      return colorScale(avgPrice);
    })
    .on("click", function (event, d) {
      const pathId = d3.select(this).attr("id");
      const areaName = areaMapping[pathId];

      const index = selectedNeighborhoods.indexOf(areaName);
      if (index > -1) {
        selectedNeighborhoods.splice(index, 1); // Remove from array
      } else {
        selectedNeighborhoods.push(areaName); // Add to array
      }
      updateComparisonContainer();
    })
    .on("mouseover", function (event, d) {
      const pathId = d3.select(this).attr("id");
      const areaName = areaMapping[pathId];
      const avgPrice = avgPropertyPriceMapping[areaName];

      const incomeData = neighborhoodIncomeData[areaName] || {};
      const dataEntries = Object.entries(incomeData);

      console.log(dataEntries);

      // Prepare the SVG for the histogram
      const histogramSvg = d3
        .create("svg")
        .attr("width", 350)
        .attr("height", 300);

      // Create scales for your histogram based on the data
      const xScale = d3
        .scaleBand()
        .domain(dataEntries.map((d) => d[0]))
        .range([0, 300])
        .padding(0.1);

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(dataEntries, (d) => d[1] * 1.05)])
        .range([300, 0]);

      // Append the bars to the SVG
      histogramSvg
        .selectAll("rect")
        .data(dataEntries)
        .enter()
        .append("rect")
        .attr("x", (d) => xScale(d[0]))
        .attr("y", (d) => yScale(d[1]))
        .attr("width", xScale.bandwidth())
        .attr("height", (d) => 300 - yScale(d[1]))
        .attr("fill", "steelblue");

      histogramSvg
        .selectAll(".bar-label")
        .data(dataEntries)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", (d) => xScale(d[0]) + xScale.bandwidth() / 2)
        .attr("y", (d) => yScale(d[1]) - 5) // adjust the 5 pixels offset as needed
        .attr("text-anchor", "middle")
        .text((d) => d[1]); // This will display the count on top of each bar

      d3.select(this).style("fill", "lightblue");
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(
          "<h3>" +
            areaName +
            `<br>Avg. Property Price: ${avgPrice}` +
            "</h3>" +
            "<h5> Household Income Distribution: </h5>"
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");

      tooltip.node().appendChild(histogramSvg.node());
    })

    .on("mouseout", function (d) {
      const areaName = areaMapping[d3.select(this).attr("id")];
      const avgPrice = avgPropertyPriceMapping[areaName];
      d3.select(this).style("fill", colorScale(avgPrice));
      tooltip.transition().duration(500).style("opacity", 0);
    });
}

function createHistogram(areaName) {
  const incomeData = neighborhoodIncomeData[areaName] || {};
  const dataEntries = Object.entries(incomeData);

  const avgPrice2 = avgPropertyPriceMapping[areaName];

  const histogramSvg = d3
    .create("svg")
    .attr("width", 350)
    .attr("height", 300)
    .style("background-color", colorScale(avgPrice2)); // Set the background color

  // Create scales for your histogram based on the data
  const xScale = d3
    .scaleBand()
    .domain(dataEntries.map((d) => d[0]))
    .range([0, 350])
    .padding(0.1);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(dataEntries, (d) => d[1] * 1.1)])
    .range([300, 0]);

  // Append the bars to the SVG
  histogramSvg
    .selectAll("rect")
    .data(dataEntries)
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d[0]))
    .attr("y", (d) => yScale(d[1]))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => 300 - yScale(d[1]))
    .attr("fill", "steelblue");

  histogramSvg
    .selectAll(".bar-label")
    .data(dataEntries)
    .enter()
    .append("text")
    .attr("class", "bar-label")
    .attr("x", (d) => xScale(d[0]) + xScale.bandwidth() / 2)
    .attr("y", (d) => yScale(d[1]) - 5) // adjust the 5 pixels offset as needed
    .attr("text-anchor", "middle")
    .text((d) => d[1]); // This will display the count on top of each bar

  return histogramSvg.node();
}

function updateComparisonContainer() {
  const container = d3.select("#comparison-data-container").node();
  // container.innerHTML = ""; // Clear previous content

  selectedNeighborhoods.forEach((areaName) => {
    const histogramSvg = createHistogram(areaName);

    container.appendChild(histogramSvg);

    const heading = document.createElement("div");
    heading.innerHTML = `<h3>${areaName}</h3>`;
    container.appendChild(heading);
  });
}

function gradientScale() {
  const svg = d3.select("#map-container svg");
  const width = 200;
  const height = 20;

  // Define the gradient
  const defs = svg.append("defs");
  const linearGradient = defs
    .append("linearGradient")
    .attr("id", "gradient-legend");

  //start
  linearGradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#ffffcc");
  //end
  linearGradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#800026");

  // Create the rectangle and apply the gradient
  svg
    .append("rect")
    .attr("x", 20)
    .attr("y", 20)
    .attr("width", width)
    .attr("height", height)
    .style("fill", "url(#gradient-legend)");

  // axis or labels here to show the value range
  const legendScale = d3
    .scaleLinear()
    .domain([
      d3.min(Object.values(avgPropertyPriceMapping)),
      d3.max(Object.values(avgPropertyPriceMapping)),
    ])
    .range([20, 20 + width]); // Adjust the range to match the position of the legend

  // Only the min and max values
  const legendAxis = d3
    .axisBottom(legendScale)
    .tickValues([legendScale.domain()[0], legendScale.domain()[1]])
    .tickFormat(d3.format(".2s"));

  // position to align with the legend
  svg
    .append("g")
    .attr("transform", `translate(0, ${20 + height})`)
    .call(legendAxis);

  // Title below the scale
  svg
    .append("text")
    .attr("x", 40)
    .attr("y", 60)
    .text("Average Property Price")
    .attr("font-size", "12px")
    .attr("fill", "#000");
}

//when user click this button, clean up the comparison area
document.getElementById("resetBtn").addEventListener("click", function () {
  const container = d3.select("#comparison-data-container").node();
  container.innerHTML = ""; // Clear previous content
});

//when the area is in the comparison, highlight the area
function checkDuplicate() {
  // Find the key in the areaMapping object that has the value equal to areaName
  const pathId = Object.keys(areaMapping).find(
    (key) => areaMapping[key] === areaName
  );

  // If the pathId is found, select the path and change its color
  if (pathId) {
    d3.select(`#${pathId}`).style("fill", "red"); // Change this color to your preferred highlight color
  }
}
