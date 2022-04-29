const USAgraph = async (height, width, margin) => {
  const svg = d3
    .select("#graph")
    .append("svg")
        .attr("width", width)
        .attr("height", height);

  const container = svg
    .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)

  const states = container.append("g")

  const points = container.append("g")

  const geoData = await d3.json("../data/USA.geo.json")
  const killings = await d3.csv("../data/police_killings.csv")
  const stateData = await d3.json("../data/state_data.json")
  const maxKillings = Math.max(...Object.values(stateData).map((d) => +d))

  const zoom = d3.zoom()
    .scaleExtent([0.25, 8])
    .on("zoom", (e) => container.attr("transform", e.transform));

  svg.call(zoom)

  const geoScale = d3
    .geoMercator()
    .fitSize(
      [width - margin.left - margin.right, height - margin.top - margin.bottom], 
      geoData
    );
    
  const fillScale = d3
    .scaleSequential()
    .interpolator(d3.interpolateReds)
    .domain([-1, maxKillings])

  const geoPaths = d3.geoPath().projection(geoScale);

  const clicked = (event, d) => {
    const [[x0, y0], [x1, y1]] = geoPaths.bounds(d);

    svg
      .transition()
        .duration(750)
        .call(
          zoom.transform,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
          d3.pointer(event, svg.node())
    );

    const circles = points
      .selectAll("circle")
        .transition()
        .attr("r", 0)

    circles
      .filter((point) => point.state === d.properties.NAME)
        .transition()
        .attr("r", 2)
  }

  states
    .selectAll("path")
    .data(geoData.features, (d) => d.properties.NAME)
    .join("path")
      .attr("d", geoPaths)
      .attr("fill", (d) => fillScale(stateData[d.properties.NAME]))
      .attr("stroke", "#bbb")
    .on("click", clicked)



  points
    .selectAll("circle")
    .data(killings, (d) => d.state)
    .join("circle")
      .attr("cx", ({ latitude, longitude }) => geoScale([longitude, latitude])[0])
      .attr("cy", ({ latitude, longitude }) => geoScale([longitude, latitude])[1])
      .attr("r", 0)
      .attr("fill", "white")
      .attr("stroke", "red")
}

const WIDTH = 800;
const HEIGHT = 500;
const MARGIN = {
  top: 20,
  left: 20,
  right: 20,
  bottom: 20,
}

USAgraph(HEIGHT, WIDTH, MARGIN)