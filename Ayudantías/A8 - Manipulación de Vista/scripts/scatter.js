const graphScatter = async (dimensions, margin) => {
  // Creamos el SVG
  const container = d3.select("#graph")
    .append("svg")
      .attr("height", dimensions.height)
      .attr("width", dimensions.width)

  // Creamos contenedor para las lables
  const labels = container.append("g")

  // Creamos contenedor para el scatter plot
  const circles = container.append("g")

  // Creamos contenedores para los ejes
  const x = container.append("g")
  const y = container.append("g")

  // Obtenemos el dataset
  const data = await d3.csv("https://gist.githubusercontent.com/curran/a08a1080b88344b0c8a7/raw/0e7a9b0a5d22642a06d3d5b9bcbad9890c8ee534/iris.csv")

  // Definimos los rangos de valores de la data
  const slMax = d3.max(data, row => row.sepal_length)
  const swMax = d3.max(data, row => row.sepal_width)
  const slMin = d3.min(data, row => row.sepal_length)
  const swMin = d3.min(data, row => row.sepal_width)

  // Definimos las escalas
  const xScale = d3.scaleLinear()
    .domain([slMin, slMax])
    .range([margin.left, dimensions.width - margin.right])

  const yScale = d3.scaleLinear()
    .domain([swMin, swMax])
    .range([dimensions.height - margin.bottom, margin.top])

  const species = ["setosa", "virginica", "versicolor"]
  const colours = ["blue", "red", "green"]
  const colourScale = d3.scaleOrdinal()
    .domain(species)
    .range(colours)

  // Definimos las funcionas generadoras de ejes
  const xAxis = (g) => g
      .attr("transform", `translate(0,${dimensions.height - margin.bottom})`)
      .call(d3.axisBottom(xScale))

  const yAxis = (g) => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale))

  // Generamos los ejes
  x.call(xAxis)
  y.call(yAxis)

  // Graficamos las labels
  labels.selectAll("labels")
    .data(species)
    .join((enter) => {
      // Añadimos los círculos
      enter
        .append("circle")
          .attr("cx", dimensions.width - margin.right + 50)
          .attr("cy", (_, i) => dimensions.height / 2 - species.length / 2 * 15 + i * 15)
          .attr("r", 4)
          .attr("fill", d => colourScale(d))
          .attr("class", "legend-swatch")

      // Añadimos el texto
      enter
        .append("text")
          .attr("x", dimensions.width - margin.right + 70)
          .attr("y", (_, i) => dimensions.height / 2 - species.length / 2 * 15 + i * 15)
          .attr("fill", d => colourScale(d))
          .text(d => d)
          .attr("text-anchor", "left")
          .attr("alignment-baseline", "middle")
    })


  // Data join
  circles.selectAll("circle")
      .data(data)
      .join(enter => {
          enter
            .append("circle")
              .attr("cx", d => xScale(d.sepal_length))
              .attr("cy", d => yScale(d.sepal_width))
              .attr("r", 6)
              .attr("fill", d => colourScale(d.species))
      })


}



const dimensions = {
  height: 600,
  width: 800
}

const margin = {
  left: 40,
  right: 160,
  top: 10,
  bottom: 20
}

graphScatter(dimensions, margin)