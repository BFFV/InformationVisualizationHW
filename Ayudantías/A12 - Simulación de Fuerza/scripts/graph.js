const drag = (simulation) => {
  const startDrag = (event) => {
    if (event.active === 0) {
      simulation.alphaTarget(0.3).restart()
    }

    event.subject.fx = event.subject.x
    event.subject.fy = event.subject.y
  }

  const duringDrag = (event) => {
    event.subject.fx = event.x
    event.subject.fy = event.y
  }

  const endDrag = (event) => {
    if (event.active === 0) {
      simulation.alphaTarget(0)
    }
  }

  return d3
    .drag()
    .on("start", startDrag)
    .on("drag", duringDrag)
    .on("end", endDrag)
}

const forceGraph = async (height, width) => {
  const { nodes, edges } = await d3.json('../data/countries.json')
  
  const fScale = d3
    .scaleOrdinal()
    .domain(['NA', 'CA', 'SA'])
    .range(['red', 'blue', 'green'])

  const infectRange = d3.extent(nodes.map(d => d.infections))
  const rScale = d3.scaleSequential().domain(infectRange).range([5, 15])

  const svg = d3
    .select("#graph")
    .append("svg")
      .attr("width", width)
      .attr("height", height)

  const label = svg.append("text")

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "enlaces", 
      d3.forceLink(edges).id((d) => d.name).distance(50)
    )
    .force("carga", d3.forceManyBody().strength(-50))
    .force("colision", d3.forceCollide((d) => rScale(d.infections)))
    .force("centro", d3.forceCenter(width / 2, height / 2))

  const lines = svg
    .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(edges)
      .join("line")
        .attr("stroke-width", 2)

  const circles = svg
    .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll('circle')
      .data(nodes)
      .join("circle")
        .attr("fill", (d) => fScale(d.location))
        .attr("r", (d) => rScale(d.infections))
      .on("dblclick", (_, d) => {
        d.fx = null
        d.fy = null
        simulation.restart()
      })
      .on("mouseover", (_, d) => {
        label
          .attr("x", d.x + 20)
          .attr("y", d.y + 5)
          .text(d.infections)
      })
      .on("mouseout", () => {
        label
          .attr("x", -10)
          .attr("y", -10)
          .text("")
      })
      .call(drag(simulation))

  simulation.on("tick", () => {
    circles
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)

    lines
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y)
  })

  d3.select("#reset")
    .on("click", () => {
      simulation.nodes().map((d) => {
        d.fx = null
        d.fy = null
      })
      simulation.restart()
    })
}

const HEIGHT = 500
const WIDTH = 800

forceGraph(HEIGHT, WIDTH)