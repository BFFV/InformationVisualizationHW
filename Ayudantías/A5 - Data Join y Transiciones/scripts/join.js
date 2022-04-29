// Definimos dimensiones del SVG
const HEIGHT = 50
const WIDTH = 500

// Creamos y guardamos el SVG
const svg = d3.select("#graph")
  .append("svg")
    .attr("height", HEIGHT)
    .attr("width", WIDTH)

// Creamos nuestro arreglo con letras
const alphabet = [..."abcdefghijklmnopqrstuvwxyz"]

// Función enter
const enter = (enter) => enter
  .append("text") 
    .attr("fill", "green")
    .attr("x", (d, i) => i * 19 + 20)
    .attr("y", -30)
  .call((enter) => enter
    .transition()
      .ease(d3.easeBackOut)
      .delay(600)
      .duration(300)
      .attr("y", 30))

// Función update
const update = (update) => update
  .attr("fill", "gray")
  .call((update) => update
    .transition()
      .ease(d3.easeBackOut)
      .delay(300)
      .duration(300)
      .attr("x", (d, i) => i * 19 + 20))

// Función exit
const exit = (exit) => exit
  .attr("fill", "brown")
  .call((exit) => exit
    .transition()
      .ease(d3.easeBackIn)
      .duration(300)
      .attr("y", 75)
    .remove()
  )

// Función par agraficar
const lettersGraph = () => {
  // Seleccionamos aleatoriamente letras del alfabeto 
  const data = _.sample(alphabet, _.random(1, alphabet.length - 1))
  
  // Hacemos el data join
  svg.selectAll("text")
    .data(data, (d) => d)
    .join(enter, update, exit)
      .classed("text-italic", true)
      .text((d) => d)

}


// Graficamos cada 1.5s
lettersGraph()
setInterval(lettersGraph, 1500)