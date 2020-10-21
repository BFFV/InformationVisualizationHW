const cardContainer = d3.select('.card-container')

function drawHexagon(radiusInfo, maxRadius) {
  const scale = d3
    .scaleLinear()
    .domain([1, 99])
    .range([1, maxRadius]);
  const hexagon = [];
  for (i = 1; i <= 13; i += 2) {
    hexagon.push([i * Math.PI/6, scale(radiusInfo.shift())]);
  }
  return d3.lineRadial()(hexagon);
}

function dataJoin(players) {

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
}

function wrapText(text, limit) {
  //wrap name here
}

function addCard(cards) {
  const card = cards.append('svg').attr('class', 'card')
  card
    .append('rect')
    .attr('fill', 'none')
    .attr('stroke', 'black')

  const info = card
    .append('g')
    .attr('transform', `translate(10 30)`)
  info.append('text').text((p) => p.RATING)
    .attr('class', 'big-title').attr('x', '1%')
  info.append('text').text((p) => p.NAME)
    .attr('class', 'title').attr('x', '22%')
  info.append('text').text((p) => p.NAME)
    .attr('class', 'title').attr('x', '22%').attr('y', '7%')
  //info.append('text').text('Christodoulopoulos Lazaros')
    //.attr('class', 'title').attr('x', '15%')
  info.append('text').text((p) => p.POSITION)
    .attr('class', 'title').attr('x', '0%').attr('y', '7%')
  info.append('text').text((p) => p.CLUB)
    .attr('class', 'sub-title').attr('x', '10%').attr('y', '15%')
  info.append('text').text((p) => p.CLUB)
    .attr('class', 'sub-title').attr('x', '10%').attr('y', '20%')
  info.append('text').text((p) => p.LEAGUE)
    .attr('class', 'sub-title').attr('x', '6%').attr('y', '25%')
  info.append('text').text((p) => p.LEAGUE)
    .attr('class', 'sub-title').attr('x', '6%').attr('y', '30%')

  const chart = card
    .append('g')
    .attr('transform', `translate(150 280)`)
  chart
    .append('circle')
    .attr('r', 110)
    .attr('fill', 'none')
    .attr('stroke', 'black')
  chart
    .append('path')
    .attr('d', drawHexagon([100, 100, 100, 100, 100, 100, 100], 80))
    .attr('fill', 'none')
    .attr('stroke', 'black')
  chart
    .append('path')
    .attr('d', (p) => drawHexagon([p.PHYSICAL, p.PACE, p.SHOOTING, p.PASSING,
      p.DRIBBLING, p.DEFENDING, p.PHYSICAL], 80))
    .attr('fill', 'red')
}

function loadCards(players) {
  cardContainer
    .selectAll('.card')
    .data(players, (player) => player.NAME)
    .join((enter) => addCard(enter))
}


// Read database info
d3.csv('fifa_20_data.csv')
  .then((data) => {
    // loadCards([data[0], data[1], data[2], data[3], data[4]]);
    loadCards(data);
  })
  .catch((error) => console.log(error));
