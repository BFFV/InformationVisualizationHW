// Definimos dimensiones del SVG
const HEIGHT = 500
const WIDTH = 500

// Creamos y guardamos el SVG
const svg = d3.select("#graph")
  .append("svg")
    .attr("height", HEIGHT)
    .attr("width", WIDTH)

// Creamos nuestro arreglo con círculos
const circles = [
  {
    cx: 250,
    cy: 250,
    r: 25,
  },
  {
    cx: 102,
    cy: 34,
    r: 54,
  },
  {
    cx: 457,
    cy: 32,
    r: 29,
  },
  {
    cx: 34,
    cy: 87,
    r: 14,
  },
  {
    cx: 500,
    cy: 250,
    r: 10,
  },
  {
    cx: 245,
    cy: 123,
    r: 50,
  }
]

// Agregamos los círculos con transiciones
svg.selectAll("circle")
  .data(circles)
  .enter()
    .append("circle")
      .attr("stroke", "black")
      .attr("fill", "white")
      .attr("cx", (d) => -d.r - 10)
      .attr("cy", (d) => -d.r - 10)
      .attr("r", (d) => d.r)
    .transition()
      .ease(d3.easeBounceOut)
      .duration(1500)
      .attr("cx", (d) => d.cx)
      .attr("cy", (d) => d.cy)
    .transition()
      .ease(d3.easeBackInOut.overshoot(5))
      .duration(1000)
      .delay(350)
      .attr("r", (d) => d.r * 1.85)
    .transition()
      .ease(d3.easeLinear)
      .duration(500)
      .attr("fill", "green")