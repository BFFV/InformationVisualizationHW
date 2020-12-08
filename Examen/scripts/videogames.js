// Definitions
const network = d3.select('#network');
const networkSize = {
  width: network.style('width'),
  height: Math.floor(parseInt(network.style('width'), 10) / 2)};
network.style('height', `${networkSize.height}px`);
const networkState = {level: 0, genre: '', year: '', tag: ''};
let games = [];
let currentGames = [];
let tree = {};
const selectedData = [];

// Updates the network graph levels
function updateTree() {
  for (let genre in tree) {
    tree[genre].count = 0;
    for (let year in tree[genre].dates) {
      tree[genre].dates[year].count = 0;
      for (let tag in tree[genre].dates[year].tags) {
        tree[genre].dates[year].tags[tag] = 0;
      }
    }
  }
  for (let game of currentGames) {
    for (let genre of game.genres.split(';')) {
      tree[genre].count ++;
      const gameYear = game.release_date.slice(0, 4);
      tree[genre].dates[gameYear].count ++;
      for (let tag of game.steamspy_tags.split(';')) {
        tree[genre].dates[gameYear].tags[tag] ++;
      }
    }
  }
}

// Get current data for network graph
function getLevelData() {
  const {level, genre, year, tag} = networkState;
  let levelData = [];
  if (!level) {
    for (let g in tree) {
      levelData.push({name: g, count: tree[g].count});
    }
  } else if (level == 1) {
    for (let d in tree[genre].dates) {
      levelData.push({name: d, count: tree[genre].dates[d].count});
    }
  } else if (level == 2) {
    for (let t in tree[genre].dates[year].tags) {
      levelData.push({name: t, count: tree[genre].dates[year].tags[t]});
    }
  } else {
    levelData = currentGames.filter((game) => {
      return (game.genres.split(';').includes(genre)) &&
       (game.release_date.slice(0, 4) == year) &&
        (game.steamspy_tags.split(';').includes(tag))});
  }
  return levelData;
}

// Create/Update Bar Graph
function updateGraph(selectedData, censusData) {
  // Census data
  const data = censusData
    .filter((c) => selectedData.includes(c.ID))
    .sort((a, b) => selectedData.indexOf(a.ID) - selectedData.indexOf(b.ID))
    .map((object) => {
      const {ID, HOMBRES, MUJERES, NOM_COMUNA} = object;
      return {ID, HOMBRES, MUJERES, NOM_COMUNA};
    });
  const stack = d3
    .stack()
    .keys(['HOMBRES', 'MUJERES'])
  const series = stack(data);
  const maxValue = d3.max(series, (s) => d3.max(s, (array) => array[1]));

  // Dimensions
  const width = 560;
  const height = 400;

  // Scales
  const scaleX = d3.scaleBand()
    .domain(data.map((d) => d.NOM_COMUNA))
    .rangeRound([0, width])
    .padding(0.3)
  const scaleY = d3.scaleLinear()
    .domain([0, maxValue])
    .range([height, 0])
  const scaleColor = d3.scaleOrdinal()
    .domain(series.keys())
    .range(['red', 'blue'])

  // Create/Update graph
  const graph = d3.select('#graph');
  graph
    .selectAll('g')
    .data(series)
    .join('g')
      .attr('fill', (d) => scaleColor(d.key))
      .selectAll('rect')
      .data((d) => d, (d) => d.data.NOM_COMUNA)
      .join((enter) =>
        enter
          .append('rect')
          .attr('class', (d) => d.data.NOM_COMUNA.replace(/\s+/g, ''))
          .attr('x', (d) => scaleX(d.data.NOM_COMUNA))
          .attr('width', scaleX.bandwidth())
          .attr('y', height)
          .attr('height', 0)
          .transition()
          .duration(800)
          .attr('y', (d) => scaleY(d[1]))
          .attr('height', (d) => scaleY(d[0]) - scaleY(d[1]))
          .selection(),
        (update) =>
        update
          .transition()
          .duration(800)
          .attr('x', (d) => scaleX(d.data.NOM_COMUNA))
          .attr('width', scaleX.bandwidth())
          .attr('y', (d) => scaleY(d[1]))
          .attr('height', (d) => scaleY(d[0]) - scaleY(d[1]))
          .selection(),
        (exit) =>
        exit
          .transition()
          .duration(500)
          .attr('y', height)
          .attr('height', 0)
          .remove()
      )
      .on('mouseenter', (_, d) => {
        const total = parseInt(d.data.HOMBRES, 10) + parseInt(d.data.MUJERES, 10);
        let amount = 0;
        let detailType = '';
        let color = '';
        if (!d[0]) {
          amount = parseInt(d.data.HOMBRES);
          detailType = 'Hombres';
          color = '#F35C5C';
        } else {
          amount = parseInt(d.data.MUJERES);
          detailType = 'Mujeres';
          color = '#3F77E8';
        }
        const proportion = Math.round(100 * ((amount * 100) / total)) / 100;
        let offset = scaleX.bandwidth() + 10;
        if (scaleX(d.data.NOM_COMUNA) > (width / 2)) {
          offset = - 130;
        }
        const details = graph.append('g')
          .attr('transform', `translate(${scaleX(d.data.NOM_COMUNA) + offset}, ${scaleY(d[1]) - 15})`)
          .attr('class', 'detail')
        details.append('rect')
          .attr('width', 120)
          .attr('height', 120)
          .attr('rx', 20)
          .attr('fill', color)
          .attr('stroke', 'black')
          .attr('opacity', 0.9)
        details.append('text').text(detailType).attr('x', 25).attr('y', 30).attr('class', 'label');
        details.append('text').text(`Total: ${amount}`).attr('x', 10).attr('y', 60).attr('class', 'label');
        details.append('text').text(`${proportion}%`).attr('x', 30).attr('y', 95).attr('class', 'big-label');
        graph.selectAll(`.${d.data.NOM_COMUNA.replace(/\s+/g, '')}`).attr('opacity', 0.8);
        d3.select('#current-commune').text(`Comuna Actual: ${d.data.NOM_COMUNA}`);
      })
      .on('mouseleave', (_, d) => {
        graph.selectAll('.detail').remove();
        d3.select('#current-commune').text(`Comuna Actual:`);
        graph.selectAll(`.${d.data.NOM_COMUNA.replace(/\s+/g, '')}`).attr('opacity', 1);
      })

  // Axis
  const axisX = d3.axisBottom(scaleX);
  if (data.length > 60) {
    axisX.tickValues([]);
  }
  const axisY = d3.axisLeft(scaleY);
  graph
    .append('g')
      .attr('transform', `translate(0, ${height})`)
    .call(axisX)
    .selectAll('text')
      .attr('y', -4)
      .attr('x', 9)
      .attr('transform', 'rotate(90)')
      .style('text-anchor', 'start')
  graph
    .append('g')
      .attr('transform', `translate(0, 0)`)
    .call(axisY)
    .selectAll('line')
      .attr('x1', width)
      .attr('opacity', 0.1)
      .attr('pointer-events', 'none')
}

// Generate Steam Games Network
const gameNetwork = (height, width) => {
  // Graph Container
  const svg = network
    .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('id', 'graphContainer')
  svg.append('rect')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-width', 3)
  const graph = svg.append('g')
    .attr('transform', `translate(200, 100)`)

  /*
  // Density Limits
  const maxDensity = Math.max(...census.map(c => c.DENSIDAD));
  */

  // Zoom/Pan
  const initialState = d3.zoomIdentity.translate(0, 0).scale(1);
  const zoom = d3.zoom()
    .extent([
      [0, 0],
      [width, height]
    ])
    .translateExtent([
      [-100, -50],
      [width + 100, height + 50]
    ])
    .scaleExtent([1, 5])
    .on('zoom', (e) => network.attr('transform', e.transform))
  svg.call(zoom);
  /*
  svg
    .transition()
    .duration(2000)
    .call(zoom.transform, initialState)
  */

  const fillScale = d3
    .scaleSequential()
    .domain([0, 1])
    .interpolator(d3.interpolateBlues)

  // Legend & Panning Options
  const options = ['Inicio'];
  const buttons = network.append('div').attr('class', 'button-set');
  for (let i = 0; i < options.length; i++) {
    buttons
      .append('button')
      .text(options[i])
      .on('click', () => {
        console.log(options[i]);
        svg
          .transition()
          .duration(1500)
      })
  }

  /*
  // Select Communes
  const selected = (id) => {
    // Clicked commune
    const selected_commune = communes
      .selectAll('path')
      .filter((d) => d.properties.id == id)

    // Unselect/Select commune
    if (selectedData.includes(id)) {
      const index = selectedData.indexOf(id);
      selectedData.splice(index, 1);
      selected_commune
        .attr('fill', (d) => fillScale(logValue(census.find((c) => c.ID == d.properties.id).DENSIDAD)))
    } else {
      selectedData.push(id);
      selected_commune
        .attr('fill', 'green')
    }
    updateGraph(selectedData, census);
  }

  // Highlight Communes
  const highlight = (id) => {
    const selected_commune = communes
      .selectAll('path')
      .filter((d) => d.properties.id == id)
    selected_commune.attr('opacity', 0.6);
    const cName = census.find((c) => c.ID == id).NOM_COMUNA;
    name.text(`${cName}`);
  }

  // Stop Highlight
  const stopHighlight = (id) => {
    const selected_commune = communes
      .selectAll('path')
      .filter((d) => d.properties.id == id)
    selected_commune.attr('opacity', 1);
    name.text('');
  }
  */

  // Map DataJoin
  graph
    .selectAll('circle')
    .data(getLevelData(), (d) => d.name)
    .join('circle')
      .attr('r', 30)
      .attr('cx', 10)
      .attr('cy', 0)
      .attr('fill', (d) => 'red')
      .attr('stroke', '#1F1F1F')
      .attr('stroke-width', 0.03)
    //.on('click', (_, d) => selected(d.properties.id))
    //.on('mouseenter', (_, d) => highlight(d.properties.id))
    //.on('mouseleave', (_, d) => stopHighlight(d.properties.id))
}

// Create/Update Bar Graph
function updateNetwork(selectedData, censusData) {
  // Census data
  const data = censusData
    .filter((c) => selectedData.includes(c.ID))
    .sort((a, b) => selectedData.indexOf(a.ID) - selectedData.indexOf(b.ID))
    .map((object) => {
      const {ID, HOMBRES, MUJERES, NOM_COMUNA} = object;
      return {ID, HOMBRES, MUJERES, NOM_COMUNA};
    });
  const stack = d3
    .stack()
    .keys(['HOMBRES', 'MUJERES'])
  const series = stack(data);
  const maxValue = d3.max(series, (s) => d3.max(s, (array) => array[1]));

  // Dimensions
  const width = 560;
  const height = 400;

  // Scales
  const scaleX = d3.scaleBand()
    .domain(data.map((d) => d.NOM_COMUNA))
    .rangeRound([0, width])
    .padding(0.3)
  const scaleY = d3.scaleLinear()
    .domain([0, maxValue])
    .range([height, 0])
  const scaleColor = d3.scaleOrdinal()
    .domain(series.keys())
    .range(['red', 'blue'])

  // Create/Update graph
  const graph = d3.select('#graph');
  graph
    .selectAll('g')
    .data(series)
    .join('g')
      .attr('fill', (d) => scaleColor(d.key))
      .selectAll('rect')
      .data((d) => d, (d) => d.data.NOM_COMUNA)
      .join((enter) =>
        enter
          .append('rect')
          .attr('class', (d) => d.data.NOM_COMUNA.replace(/\s+/g, ''))
          .attr('x', (d) => scaleX(d.data.NOM_COMUNA))
          .attr('width', scaleX.bandwidth())
          .attr('y', height)
          .attr('height', 0)
          .transition()
          .duration(800)
          .attr('y', (d) => scaleY(d[1]))
          .attr('height', (d) => scaleY(d[0]) - scaleY(d[1]))
          .selection(),
        (update) =>
        update
          .transition()
          .duration(800)
          .attr('x', (d) => scaleX(d.data.NOM_COMUNA))
          .attr('width', scaleX.bandwidth())
          .attr('y', (d) => scaleY(d[1]))
          .attr('height', (d) => scaleY(d[0]) - scaleY(d[1]))
          .selection(),
        (exit) =>
        exit
          .transition()
          .duration(500)
          .attr('y', height)
          .attr('height', 0)
          .remove()
      )
      .on('mouseenter', (_, d) => {
        const total = parseInt(d.data.HOMBRES, 10) + parseInt(d.data.MUJERES, 10);
        let amount = 0;
        let detailType = '';
        let color = '';
        if (!d[0]) {
          amount = parseInt(d.data.HOMBRES);
          detailType = 'Hombres';
          color = '#F35C5C';
        } else {
          amount = parseInt(d.data.MUJERES);
          detailType = 'Mujeres';
          color = '#3F77E8';
        }
        const proportion = Math.round(100 * ((amount * 100) / total)) / 100;
        let offset = scaleX.bandwidth() + 10;
        if (scaleX(d.data.NOM_COMUNA) > (width / 2)) {
          offset = - 130;
        }
        const details = graph.append('g')
          .attr('transform', `translate(${scaleX(d.data.NOM_COMUNA) + offset}, ${scaleY(d[1]) - 15})`)
          .attr('class', 'detail')
        details.append('rect')
          .attr('width', 120)
          .attr('height', 120)
          .attr('rx', 20)
          .attr('fill', color)
          .attr('stroke', 'black')
          .attr('opacity', 0.9)
        details.append('text').text(detailType).attr('x', 25).attr('y', 30).attr('class', 'label');
        details.append('text').text(`Total: ${amount}`).attr('x', 10).attr('y', 60).attr('class', 'label');
        details.append('text').text(`${proportion}%`).attr('x', 30).attr('y', 95).attr('class', 'big-label');
        graph.selectAll(`.${d.data.NOM_COMUNA.replace(/\s+/g, '')}`).attr('opacity', 0.8);
        d3.select('#current-commune').text(`Comuna Actual: ${d.data.NOM_COMUNA}`);
      })
      .on('mouseleave', (_, d) => {
        graph.selectAll('.detail').remove();
        d3.select('#current-commune').text(`Comuna Actual:`);
        graph.selectAll(`.${d.data.NOM_COMUNA.replace(/\s+/g, '')}`).attr('opacity', 1);
      })

  // Axis
  const axisX = d3.axisBottom(scaleX);
  if (data.length > 60) {
    axisX.tickValues([]);
  }
  const axisY = d3.axisLeft(scaleY);
  graph
    .append('g')
      .attr('transform', `translate(0, ${height})`)
    .call(axisX)
    .selectAll('text')
      .attr('y', -4)
      .attr('x', 9)
      .attr('transform', 'rotate(90)')
      .style('text-anchor', 'start')
  graph
    .append('g')
      .attr('transform', `translate(0, 0)`)
    .call(axisY)
    .selectAll('line')
      .attr('x1', width)
      .attr('opacity', 0.1)
      .attr('pointer-events', 'none')
}

// Info View
const info = (census) => {
  const info = d3.select('#info');

  // Bar Graph
  const svg = info
    .append('svg')
      .attr('width', 620)
      .attr('height', 700)
      .attr('id', 'svg-graph')
  svg.append('rect')
    .attr('width', '100%')
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-width', 3)
  svg.append('g')
    .attr('transform', 'translate(50, 20)')
    .attr('id', 'graph')

  // Current Commune
  svg.append('text')
    .text('Comuna Actual:')
    .attr('class', 'sub-title')
    .attr('x', 80)
    .attr('y', 580)
    .attr('id', 'current-commune')

  // Legend
  const legend = svg
    .append('g')
    .attr('transform', 'translate(100, 600)')
  legend
    .append('text')
      .text('Hombres')
      .attr('x', 50)
      .attr('y', 45)
      .attr('class', 'sub-title')
  legend
    .append('rect')
      .attr('x', 140)
      .attr('y', 20)
      .attr('width', 50)
      .attr('height', 40)
      .attr('fill', 'red')
      .attr('stroke', 'black')
  legend
    .append('text')
      .text('Mujeres')
      .attr('x', 270)
      .attr('y', 45)
      .attr('class', 'sub-title')
  legend
    .append('rect')
      .attr('x', 350)
      .attr('y', 20)
      .attr('width', 50)
      .attr('height', 40)
      .attr('fill', 'blue')
      .attr('stroke', 'black')

  // Create Bar Graph
  updateGraph(selectedData, census);
}

// Load Data
const initialize = async () => {
  /* Columns: name, release_date, developer, publisher, platforms,
    genres, steamspy_tags, price, positive, negative, steam_appid, short_description,
    header_image, minimum */
  games = await d3.csv('../data/steam.csv');
  currentGames = games.slice();
  /* Levels: genres -> dates -> tags -> games */
  tree = await d3.json('../data/network.json');
}

// Initialize Visualization
initialize().then(() => {
  gameNetwork(network.height, network.width);
  // Search View
  // Comparison View
  // Recommendation
})
