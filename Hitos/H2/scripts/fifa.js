const cardContainer = d3.select('.card-container');
const navbar = d3.select('.navbar');

// Generate hexagon for spider chart
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

// Generate axis for spider chart
function drawAxis(maxRadius, values) {
  const scale = d3
    .scaleLinear()
    .domain([1, 99])
    .range([1, maxRadius]);
  const axis = d3.axisTop(scale).tickValues(values).tickSize(0);
  return axis;
}

// Obtain correct color for display
function getColor(attribute, value) {
  if (attribute == 'rating') {
    if (value < 65) {
      return 'peru';
    } else if (value < 75) {
      return 'silver';
    } else {
      return 'gold';
    }
  } else if (['CB', 'RB', 'LB', 'LWB', 'RWB'].includes(value)) {
    return 'blue';
  } else if (['CM', 'CAM', 'CDM', 'LM', 'RM'].includes(value)) {
    return 'green';
  } else {
    return 'red';
  }
}

// Wrap text for svg display
function wrapText(text, limit) {
  const words = text.split(' ');
  let firstLine = '';
  let secondLine = '';
  let first = true;
  for (word of words) {
    if ((firstLine.length + word.length <= limit) && first) {
      firstLine += word + ' ';
    } else {
      first = false;
      secondLine += word + ' ';
    }
  }
  return [firstLine, secondLine];
}

// Highlight team
function highlight(team) {
  cardContainer
    .selectAll('.card')
    .filter((d) => d.CLUB == team)
    .select('rect')
    .attr('opacity', 0.3)
}

// Load player card
function addCard(cards) {
  const card = cards.append('svg').attr('class', 'card');

  // Rectangle
  card
    .append('rect')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('fill', (p) => getColor('rating', p.RATING))
    .attr('rx', 20)

  // Player Info
  const info = card
    .append('g')
    .attr('transform', `translate(10 30)`);
  info.append('text').text((p) => p.RATING)
    .attr('class', 'big-title').attr('x', '1%')
  info.append('text').text((p) => wrapText(p.NAME, 17)[0])
    .attr('class', 'title').attr('x', '16%')
  info.append('text').text((p) => wrapText(p.NAME, 17)[1])
    .attr('class', 'title').attr('x', '16%').attr('y', '7%')
  info.append('text').text((p) => p.POSITION)
    .attr('class', 'sub-title').attr('x', '0%').attr('y', '7%')
  info.append('line').attr('x1', '-10').attr('y1', '9%')
    .attr('x2', '100%').attr('y2', '9%').attr('stroke', 'black')
  info.append('text').text((p) => wrapText(p.CLUB, 24)[0])
    .attr('class', 'sub-title').attr('x', '6%').attr('y', '15%')
  info.append('text').text((p) => wrapText(p.CLUB, 24)[1])
    .attr('class', 'sub-title').attr('x', '6%').attr('y', '20%')
  info.append('text').text((p) => wrapText(p.LEAGUE, 24)[0])
    .attr('class', 'sub-title').attr('x', '6%').attr('y', '25%')
  info.append('text').text((p) => wrapText(p.LEAGUE, 24)[1])
    .attr('class', 'sub-title').attr('x', '6%').attr('y', '30%')

  const chart = card
    .append('g')
    .attr('transform', `translate(150 280)`);

  // Circles
  chart
    .append('circle')
    .attr('r', 115)
    .attr('fill', 'white')
    .attr('stroke', 'black')
  chart
    .append('circle')
    .attr('r', 3)
    .attr('fill', 'black')
  for (i = 1; i < 5; i++) {
    chart
      .append('circle')
      .attr('r', i * 16)
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-opacity', 0.5)
  }

  // Spider Chart
  chart
    .append('path')
    .attr('d', drawHexagon([100, 100, 100, 100, 100, 100, 100], 80))
    .attr('fill', 'none')
    .attr('stroke', 'black')
  chart
    .append('path')
    .attr('d', (p) => drawHexagon([p.PHYSICAL, p.PACE, p.SHOOTING, p.PASSING,
      p.DRIBBLING, p.DEFENDING, p.PHYSICAL], 80))
    .attr('fill', (p) => getColor('position', p.POSITION))
    .attr('fill-opacity', 0.7)
  const labels = ['PAC', 'SHO', 'PASS', 'DRI', 'DEF', 'PHY'];
  const positions = [[85, 5], [30, 85], [-55, 85], [-110, 5], [-55, -75], [30, -75]];
  for (i = 0; i < 6; i++) {
    const pos = positions.shift()
    chart
    .append('text')
    .text(labels.shift())
    .attr('class', 'label')
    .attr('x', pos[0])
    .attr('y', pos[1])
  }

  // Axis
  const axis = drawAxis(80, [20, 40, 60, 80]);
  chart
    .append('g')
    .call(axis)
  for (i = 1; i < 6; i++) {
    const axis = drawAxis(80, []);
    chart
      .append('g')
      .call(axis)
      .attr('transform', `rotate(${60 * i})`)
  }
}

// Load all player cards
function loadCards(players) {
  cardContainer
    .selectAll('.card')
    .data(players, (player) => player.NAME)
    .join((enter) => addCard(enter))

  // Events
  cardContainer
    .selectAll('.card')
    .on('mouseenter', (_, d) => {
      highlight(d.CLUB);
    })
    .on('mouseleave', () => {
      cardContainer
        .selectAll('.card')
        .select('rect')
        .attr('opacity', 1)
    })
}

// Load navbar info
function loadStats(players) {
  // General Info
  navbar
    .append('h1')
    .text('Hito 2 - IIC2026')
    .attr('style', 'color:#87CEFA')
    .attr('class', 'big-title')
  navbar
    .append('h2')
    .text(`Tarjetas: ${players.length}`)
    .attr('style', 'color:#FFA07A')
    .attr('class', 'title')
  navbar
    .append('h2')
    .text('Resumen')
    .attr('style', 'color:#FFA07A')
    .attr('class', 'title')

  // Spider Chart
  const avgStats = []
  for (stat of ['PHYSICAL', 'PACE', 'SHOOTING', 'PASSING', 'DRIBBLING', 'DEFENDING', 'PHYSICAL']) {
    avgStats.push(players.reduce((total, next) => total + parseInt(next[stat]), 0) / players.length);
  }
  const chart = navbar
    .append('svg')
    .attr('class', 'chart')
    .append('g')
    .attr('transform', 'translate (120 120)')
  chart
    .append('circle')
    .attr('r', 115)
    .attr('fill', 'white')
    .attr('stroke', 'black')
  chart
    .append('circle')
    .attr('r', 3)
    .attr('fill', 'black')
  for (i = 1; i < 5; i++) {
    chart
      .append('circle')
      .attr('r', i * 16)
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-opacity', 0.5)
  }
  chart
    .append('path')
    .attr('d', drawHexagon([100, 100, 100, 100, 100, 100, 100], 80))
    .attr('fill', 'none')
    .attr('stroke', 'black')
  chart
    .append('path')
    .attr('d', drawHexagon(avgStats, 80))
    .attr('fill', 'orange')
    .attr('fill-opacity', 0.7)
  const labels = ['PAC', 'SHO', 'PASS', 'DRI', 'DEF', 'PHY'];
  const positions = [[85, 5], [30, 85], [-55, 85], [-110, 5], [-55, -75], [30, -75]];
  for (i = 0; i < 6; i++) {
    const pos = positions.shift()
    chart
    .append('text')
    .text(labels.shift())
    .attr('class', 'label')
    .attr('x', pos[0])
    .attr('y', pos[1])
  }

  // Axis
  const axis = drawAxis(80, [20, 40, 60, 80]);
  chart
    .append('g')
    .call(axis)
  for (i = 1; i < 6; i++) {
    const axis = drawAxis(80, []);
    chart
      .append('g')
      .call(axis)
      .attr('transform', `rotate(${60 * i})`)
  }
}


// Read database info
d3.csv('fifa_20_data.csv')
  .then((data) => {
    loadStats(data);
    loadCards(data);
  })
  .catch((error) => console.log(error));
