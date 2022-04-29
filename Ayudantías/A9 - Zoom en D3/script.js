const gridRows = 50;
const gridCols = 50

const rectWidth = 5;
const rectHeight = 5;

const svgWidth = gridCols * rectWidth;
const svgHeight = gridRows * rectHeight;

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);


const colourScale = d3.scaleOrdinal([0,1,2],["red", "green", "blue"])
const numberGenerator = d3.randomInt(3)
const rects = svg
  .selectAll("rect")
  .data(d3.range(gridRows * gridCols))
  .enter()
  .append("rect")
  .attr("width", rectWidth)
  .attr("height", rectHeight)
  // .attr("fill", "transparent")
  .attr("stroke", "black")
  .attr("x", (_, i) => (i % gridCols) * rectWidth)
  .attr("y", (_, i) => Math.floor(i / gridCols) * rectHeight)
  .attr("fill", () => colourScale(numberGenerator()));

const blackSheep = d3.select(
  rects.nodes()[d3.randomInt(gridCols * gridRows)()]
)
  .attr("fill", "magenta");

const manejadorZoom = (evento) => {
  const transformacion = evento.transform;  // {x: 2, y: 4, k:1.5}
  // console.log(transformacion);
  rects.attr("transform", transformacion);
};

const scale = 15
const zoom = d3
  .zoom()
  .on("zoom", manejadorZoom);

svg.call(zoom);  // zoom(svg)


// give up button
d3.select("body")
  .append("button")
  .text("I give up")
  .on("click", () => {
    const newTransform = d3.zoomIdentity
      .scale(scale)
      .translate(
        -blackSheep.attr("x") + svgWidth/2/scale - rectWidth/2,
        -blackSheep.attr("y") + svgHeight/2/scale - rectHeight/2
      )

    svg.transition().duration(1000)
      .call(zoom.transform, newTransform)
  })
