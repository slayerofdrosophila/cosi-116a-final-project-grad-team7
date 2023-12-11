// when user hover the area of the map, the name of the area will pop up

let neighborhoodIncomeData = {};
let neighborhoodHighLevelIncomeData = {};

// For the click compare thing
let selectedNeighborhoods = [];
let selectedElements = [];

const clonedNeighborhoods = new Set(['Mid Dorchester', 'Mattapan']);

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

  // aggregate
  for (let neighborhoodName of Object.keys(neighborhoodIncomeData)) {
    if (neighborhoodName === 'Allston' || neighborhoodName === 'Brighton') {
      neighborhoodIncomeData['Allston + Brighton'] = aggregateNeighborhoodData('Allston', 'Brighton', neighborhoodIncomeData);
    }

    if (neighborhoodName === 'Mission Hill' || neighborhoodName === 'Jamaica Plain') {
      neighborhoodIncomeData['Mission Hill + Jamaica Plain'] = aggregateNeighborhoodData('Mission Hill', 'Jamaica Plain', neighborhoodIncomeData);
    }

    if (neighborhoodName === 'Fenway' || neighborhoodName === 'Kenmore') {
      neighborhoodIncomeData['Fenway + Kenmore'] = aggregateNeighborhoodData('Fenway', 'Kenmore', neighborhoodIncomeData);
    }
  }

  // Clone Dorchester data for Mid Dorchester and Mattapan (because the ACS doesn't care about these divisions, apparently)
  neighborhoodIncomeData['Mid Dorchester'] = {...neighborhoodIncomeData['Dorchester']};
  neighborhoodIncomeData['Mattapan'] = {...neighborhoodIncomeData['Dorchester']};

  neighborhoodHighLevelIncomeData['Mid Dorchester'] = {...neighborhoodHighLevelIncomeData['Dorchester']};
  neighborhoodHighLevelIncomeData['Mattapan'] = {...neighborhoodHighLevelIncomeData['Dorchester']};

  d3.xml("https://slayerofdrosophila.github.io/cosi-116a-final-project-grad-team7/images/boston.svg").then((data) => {
    d3.select("#map-container").node().append(data.documentElement);
    gradientScale();
    hoverEffects();
  });
});

const areaMapping = {
  Path_1: "Allston + Brighton",
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
  "Fenway + Kenmore": 1194750.29,
  "Mission Hill + Jamaica Plain": 1053993.93,
  "Allston + Brighton": 698900.53,
};

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
      const pathElement = d3.select(this);
      const pathId = d3.select(this).attr("id");
      const areaName = areaMapping[pathId];
      //check if we selected the right stroke
      console.log(pathElement.attr("stroke"));
      if (!isNeighborhoodSelected(areaName)) {
        selectedNeighborhoods.push(areaName);

        //get the original color
        let color = {};
        color["element"] = pathElement;
        color["color"] = pathElement.attr("fill");

        selectedElements.push(color);

        //change the style of the selected area
        pathElement.style("stroke", "blue");
        pathElement.style("stroke-width", 5);
      }
      renderSelectedArea();
    })
    .on("mouseover", function (event, d) {
      const pathId = d3.select(this).attr("id");
      const areaName = areaMapping[pathId];
      const avgPrice = Math.round(avgPropertyPriceMapping[areaName] / 1000) * 1000;

      const incomeData = neighborhoodIncomeData[areaName] || {};
      const dataEntries = Object.entries(incomeData);

      const histogramSvg = d3
        .create("svg")
        .attr("width", 300)
        .attr("height", 200);

      const xScale = d3
        .scaleBand()
        .domain(dataEntries.map((d) => d[0]))
        .range([0, 300])
        .padding(0.1);

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(dataEntries, (d) => d[1] * 1.1)])
        .range([200, 0]);

      // Append the bars to the SVG
      histogramSvg
        .selectAll("rect")
        .data(dataEntries)
        .enter()
        .append("rect")
        .attr("x", (d) => xScale(d[0]))
        .attr("y", (d) => yScale(d[1]))
        .attr("width", xScale.bandwidth())
        .attr("height", (d) => 200 - yScale(d[1]))
        .attr("fill", "steelblue");

      const totalCount = dataEntries.reduce((sum, entry) => sum + entry[1], 0);

      histogramSvg
        .selectAll(".bar-label")
        .data(dataEntries)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", (d) => xScale(d[0]) + xScale.bandwidth() / 2)
        .attr("y", (d) => yScale(d[1]) - 5) // adjust the 5 pixels offset as needed
        .attr("text-anchor", "middle")
        .text(d => `${((d[1] / totalCount) * 100).toFixed(0)}%`);

      // d3.select(this).style("fill", "lightblue");
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(
          "<h3>" +
            areaName +
            `<br>Avg. Property Price: $${avgPrice}` +
            "</h3>" +
            "<h5> Household Income Distribution: </h5>"
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");

      // If this is cloned
      if (clonedNeighborhoods.has(areaName)) {
        const disclaimer = document.createElement("p");
        disclaimer.innerHTML = "<em>Note: Data for this neighborhood is estimated based on Dorchester's data.</em>";
        disclaimer.style.fontSize = "0.8em";
        disclaimer.style.textDecoration = "underline";

        tooltip.node().appendChild(disclaimer);
      }
      tooltip.node().appendChild(histogramSvg.node());


    })

    .on("mouseout", function (d) {
      const areaName = areaMapping[d3.select(this).attr("id")];
      const avgPrice = avgPropertyPriceMapping[areaName];
      // d3.select(this).style("fill", colorScale(avgPrice));
      tooltip.transition().duration(500).style("opacity", 0);
    });
}

function createHistogram(areaName) {
  const incomeData = neighborhoodIncomeData[areaName] || {};
  const dataEntries = Object.entries(incomeData);

  const avgPrice2 = avgPropertyPriceMapping[areaName];
  
  const height = 350
  const width = 350

  const histogramSvg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background-color", colorScale(avgPrice2));

  // Create scales for your histogram based on the data
  const xScale = d3
    .scaleBand()
    .domain(dataEntries.map((d) => d[0]))
    .range([0, width])
    .padding(0.1);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(dataEntries, (d) => d[1] * 1.1)])
    .range([height - 125, 0]);

  // Append the bars to the SVG
  histogramSvg
    .selectAll("rect")
    .data(dataEntries)
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d[0]))
    .attr("y", (d) => yScale(d[1]))
    .attr("width", xScale.bandwidth()) // leaves room between bars
    .attr("height", (d) => height - 125 - yScale(d[1]))
    .attr("fill", "steelblue");

  const totalCount = dataEntries.reduce((sum, entry) => sum + entry[1], 0);

  histogramSvg
    .selectAll(".bar-label")
    .data(dataEntries)
    .enter()
    .append("text")
    .attr("class", "bar-label")
    .attr("x", (d) => xScale(d[0]) + xScale.bandwidth() / 2)
    .attr("y", (d) => yScale(d[1]) - 5)
    .attr("text-anchor", "middle")
    .text(d => `${((d[1] / totalCount) * 100).toFixed(0)}%`);
    
  // Append vertical labels
  histogramSvg.selectAll(".label")
              .data(dataEntries)
              .enter()
              .append("text")
              .attr("class", "label")
              .attr("x", d => xScale(d[0]) + xScale.bandwidth() / 2 + 120)
              .attr("y", height)
              .attr("text-anchor", "end")
              .attr("transform", d => "rotate(-90," + (xScale(d[0]) + xScale.bandwidth() / 2) + "," + (height) + ")")
              .text(d => d[0])
              .style("font-size", "12px") ;

  return histogramSvg.node();
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
  // Clear previous content
  selectedNeighborhoods = [];
  renderSelectedArea();

  //reset the color of selected area
  selectedElements.forEach((pathElement) => {
    pathElement.element.style("stroke", "#000");
    pathElement.element.style("stroke-width", 1);
  });
});

//avoid double selected the area
function isNeighborhoodSelected(neighborhood) {
  return selectedNeighborhoods.includes(neighborhood);
}

//render out the selected area
function renderSelectedArea() {
  const container = d3.select("#comparison-data-container").node();
  container.innerHTML = "";
  selectedNeighborhoods.forEach((areaName) => {
    const heading = document.createElement("div");
    heading.innerHTML = `<h3>${areaName}</h3>`;
    container.appendChild(heading);

    const histogramSvg = createHistogram(areaName);

    container.appendChild(histogramSvg);
  });
}

function aggregateNeighborhoodData(neighborhood1, neighborhood2, neighborhoodIncomeData) {
  const aggregatedData = {};

  if (neighborhoodIncomeData[neighborhood2] == undefined){
    Object.keys(neighborhoodIncomeData[neighborhood1]).forEach(bracket => {
      aggregatedData[bracket] = (neighborhoodIncomeData[neighborhood1][bracket] || 0);
    });
    return aggregatedData
  }

  Object.keys(neighborhoodIncomeData[neighborhood1]).forEach(bracket => {
    aggregatedData[bracket] = (neighborhoodIncomeData[neighborhood1][bracket] || 0) +
                              (neighborhoodIncomeData[neighborhood2][bracket] || 0);
  });

  return aggregatedData;
}