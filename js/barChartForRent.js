d3.json("../data/rentData.json", function (error, data) {
  if (error) throw error;

  //sort the data
  data.sort(function (a, b) {
    return b.averageRent - a.averageRent;
  });

  const margin = { top: 20, right: 20, bottom: 80, left: 40 },
    width = 800 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  // choose existing svg
  const svg = d3
    .select("#vis-svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // x axis scale
  const x = d3
    .scaleBand()
    .rangeRound([0, width])
    .padding(0.1)
    .domain(
      data.map(function (d) {
        return d.city;
      })
    );

  // y axis scale
  const y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, function (d) {
        return d.averageRent;
      }),
    ])
    .range([height, 0]);

  // create x axis
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-75)"); // 旋转标签

  // create y axis
  svg.append("g").call(d3.axisLeft(y));

  // create y axis label
  svg
    .selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", function (d) {
      return x(d.city);
    })
    .attr("y", function (d) {
      return y(d.averageRent);
    })
    .attr("width", x.bandwidth())
    .attr("height", function (d) {
      return height - y(d.averageRent);
    })
    // set color
    .attr("fill", function (d, i) {
      return d3.schemeCategory10[i % 10];
    });
});
