const width = 800;
const height = 600;
const margin = {
  top: 30,
  bottom: 30,
  right: 30,
  left: 30,
};

const svg = d3
  .select('#players')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

// const boton = d3.select('body').append('button').text('Agregar elemento');

// const parrafo = d3.select('body').append('p');

const cardContainer = svg
  .append('g')
  .append('rect')
  .attr('width', 300)
  .attr('height', 400)
  .attr('fill', 'none')
  .attr('stroke', 'black')
  .attr('transform', `translate(${margin.left + 200} ${margin.top + 50})`)


const chartContainer = svg
  .append('g')
  .attr('transform', `translate(${margin.left + 350} ${margin.top + 300})`)


const chartExterior = chartContainer
  .append('path')
  .attr('d', drawHexagon([100, 100, 100, 100, 100, 100, 100]))
  .attr('fill', 'none')
  .attr('stroke', 'black')


function drawHexagon(radiusInfo) {
  const hexagon = [];
  for (i = 1; i <= 13; i += 2) {
    hexagon.push([i * Math.PI/6, radiusInfo.shift()]);
  }
  return d3.lineRadial()(hexagon);
}

function showCards(players) {
  const scale = d3
    .scaleRadial()
    .domain([1, 99])
    .range([0, 20]);

  /*
  const escalaY = d3
    .scaleLinear()
    .domain([0, maximaFrecuencia])
    .range([height - margin.top - margin.bottom, 0]);

  const ejeY = d3.axisLeft(escalaY);

  contenedorEjeY
    .transition()
    .duration(1000)
    .call(ejeY)
    .selection()
    .selectAll('line')
    .attr('x1', width - margin.right - margin.left)
    .attr('stroke-dasharray', '5')
    .attr('opacity', 0.5);

  const escalaX = d3
    .scaleBand()
    .domain(datos.map((d) => d.categoria))
    .rangeRound([0, width - margin.right - margin.left])
    .padding(0.5);

  const ejeX = d3.axisBottom(escalaX);

  contenedorEjeX
    .transition()
    .duration(1000)
    .call(ejeX)
    .selection()
    .selectAll('text')
    .attr('font-size', 20);

  contenedorBarras
    .selectAll('rect')
    .data(datos, (d) => d.categoria)
    .join(
      (enter) =>
        enter
          .append('rect')
          .attr('fill', 'magenta')
          .attr('y', height - margin.top - margin.bottom)
          .attr('x', (d) => escalaX(d.categoria))
          .attr('width', escalaX.bandwidth())
          .attr('height', 0)
          .transition()
          .duration(1000)
          .attr('height', (d) => escalaAltura(d.frecuencia))
          .attr('y', (d) => escalaY(d.frecuencia))
          .selection(),
      (update) =>
        update
          .transition()
          .duration(1000)
          .attr('height', (d) => escalaAltura(d.frecuencia))
          .attr('y', (d) => escalaY(d.frecuencia))
          .attr('x', (d) => escalaX(d.categoria))
          .attr('width', escalaX.bandwidth())
          .selection(),
      (exit) =>
        exit
          .transition()
          .duration(500)
          .attr('y', height - margin.top - margin.bottom)
          .attr('height', 0)
          .remove()
    )
    .on('mouseenter', (_, d) => {
      parrafo.text(`Categoría: ${d.categoria}, Frecuencia: ${d.frecuencia}`);
    })
    .on('mouseleave', () => {
      parrafo.text('');
    })
    .on('click', (_, d) => {
      datos.splice(datos.indexOf(d), 1);
      joinDeDatos(datos);
    });
    */

  player = players[0];
  const playerInfo = [player.PHYSICAL, player.PACE, player.SHOOTING, player.PASSING, player.DRIBBLING, player.DEFENDING, player.PHYSICAL];
  chartContainer
    .append('path')
    .attr('d', drawHexagon(playerInfo))
    .attr('fill', 'red')
    .selection()
}


// Read database info
d3.csv('fifa_20_data.csv')
  .then((data) => {
    showCards(data);
  })
  .catch((error) => console.log(error));
