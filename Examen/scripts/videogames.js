// Definitions & Settings
const network = d3.select('#network');
const networkSize = {
  width: Math.floor(parseInt(network.style('width'), 10)),
  height: Math.floor(parseInt(network.style('width'), 10) / 2)};
network.style('height', `${networkSize.height}px`);
const radius = {min: Math.floor(networkSize.height * 0.05),
  max: Math.floor(networkSize.height * 0.2)};
const networkState = {level: 0, genre: '', year: '', tag: ''};
const selectedData = [];
let games = [];
let currentGames = [];
let tree = {};
let popularity = {min: 0, max: 0};
let countValues = {min: 0, max: 0};
let zoom = null;

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

// Create/Update Bar Graph*************
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

// Scale nodes to popularity size
function scaleNode(node) {
  let maxValue = 0;
  let minValue = 0;
  let nodeCount = 0;
  const level = networkState.level;
  if (level == 3) {
    maxValue = popularity.max;
    minValue = popularity.min;
    nodeCount = node.owners;
  } else {
    maxValue = countValues.max;
    minValue = countValues.min;
    nodeCount = node.count;
  }
  // Size Scale
  const sizeScale = (popularity) => {
    const logPopularity = d3.scaleLog()
      .domain([minValue, maxValue]);
    const linearSize = d3.scaleLinear()
      .domain([0, 1])
      .range([radius.min, radius.max])
    if (popularity < 1) {
      return linearSize(logPopularity(1));
    }
    return linearSize(logPopularity(popularity));
  }
  return sizeScale(nodeCount);
}

// Fill nodes with color based on rating / size
function fillNode(node) {
  // Color Scale
  const logCount = d3.scaleLog()
    .domain([countValues.min, countValues.max])
  const fillScaleGenres = d3
    .scaleSequential()
    .domain([0, 1])
    .interpolator(d3.interpolateRgb('#F1C40F', '#AF7AC5'))
  const fillScaleDates = d3
    .scaleSequential()
    .domain([0, 1])
    .interpolator(d3.interpolateRgb('#F1C40F', '#AF7AC5'))
  const fillScaleTags = d3
    .scaleSequential()
    .domain([0, 1])
    .interpolator(d3.interpolateBlues)
  const level = networkState.level;
  if (level == 3) {
    if (selectedData.includes(node.steam_appid)) {
      return '#8E44AD';
    }
    if (node.positive >= 95) {
      return '#3498DB'; // Extremely Good #3498DB
    } else if (node.positive >= 80) {
      return '#48C9B0'; // Great #48C9B0
    } else if (node.positive >= 70) {
      return '#27AE60'; // Good #27AE60
    } else if (node.positive >= 50) {
      return '#F4D03F'; // Average #F4D03F
    } else if (node.positive >= 30) {
      return '#E67E22'; // Bad #E67E22
    } else if (node.positive >= 15) {
      return '#E74C3C'; // Really Bad #E74C3C
    }
    return '#641E16'; // Horrible #641E16
  } else if (level == 2) {
    return fillScaleTags(logCount(node.count));
  } else if (level == 1) {
    return fillScaleDates(logCount(node.count));
  }
  return fillScaleGenres(logCount(node.count));
}

// Select nodes / Go deeper
function selected(node, graph) {
  const lvl = networkState.level;
  // Go deeper in the tree
  if (lvl < 3) {
    if (!lvl) {
      networkState.genre = node.name;
    } else if (lvl == 1) {
      networkState.year = node.name;
    } else {
      networkState.tag = node.name;
    }
    networkState.level ++;
    return updateNetwork();
  }
  // Select games
  const selectedNode = graph
    .selectAll('circle')
    .filter((d) => d.steam_appid == node.steam_appid)
  if (selectedData.includes(node.steam_appid)) {
    const index = selectedData.indexOf(node.steam_appid);
    selectedData.splice(index, 1);
  } else {
    selectedData.push(node.steam_appid);
  }
  selectedNode.attr('fill', (d) => fillNode(d));
}

// Go back to the previous state
function back() {
  const level = networkState.level;
  if (level) {
    if (level == 1) {
      networkState.genre = '';
    } else if (level == 2) {
      networkState.year = '';
    } else {
      networkState.tag = '';
    }
    networkState.level --;
    return updateNetwork();
  }
}

// Show popup with details about the games
function showPopUp(game) {
  return;
}

// Hide popup with details about the games
function hidePopUp(game) {
  return;
}

// Generate steam games network
function gameNetwork(height, width) {
  // Graph Container
  const svg = network
    .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('id', 'graphContainer')
      .on('contextmenu', (event) => {
        event.preventDefault();
        back();
      })

  // Node Container
  const container = svg
    .append('g')
    .attr('id', 'nodeContainer')

  // Zoom/Panning
  zoom = d3.zoom()
    .extent([
      [0, 0],
      [width, height]
    ])
    .translateExtent([
      [- width * 6, - height * 10],
      [width * 7, height * 10]
    ])
    .scaleExtent([0.03, 2])
    .on('zoom', (e) => container.attr('transform', e.transform))
  svg.call(zoom);
  svg.on('dblclick.zoom', null);
  const initialState = d3.zoomIdentity.translate(330, 174).scale(0.2);
  svg.call(zoom.transform, initialState);

  // Shortcuts
  const buttons = network.append('div').attr('class', 'button-set');
  buttons.append('button')
    .text('Back to Root')
    .on('click', () => {
      networkState.level = 0;
      networkState.genre = '';
      networkState.year = '';
      networkState.tag = '';
      updateNetwork();
    })
  buttons.append('button')
    .text('Back to Previous Level')
    .on('click', () => back())

  // Create Network
  updateNetwork();
}

// Update steam games network
function updateNetwork() {
  /*
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

  // Reset Zoom/Panning
  const svg = d3.select('#graphContainer');
  const initialState = d3.zoomIdentity.translate(330, 174).scale(0.2);
  svg
    .transition()
    .duration(1000)
    .call(zoom.transform, initialState)

  // Nodes DataJoin
  const container = d3.select('#nodeContainer');
  const nodeData = getLevelData();
  const node = container
    .selectAll('circle')
    .data(nodeData, (d) => d.name)
    .join((enter) =>
        enter
          .append('circle')
          .attr('r', (d) => scaleNode(d))
          .attr('fill', (d) => fillNode(d))
          .attr('stroke', '#1F1F1F')
          .attr('stroke-width', 0.1)
          .selection(),
        (update) =>
        update
          .selection(),
        (exit) =>
        exit
          .remove()
      )
    .on('click', (_, d) => selected(d, container))
    .on('mouseenter', (_, d) => showPopUp(d))
    .on('mouseleave', (_, d) => hidePopUp(d))

  // Simulation
  const simulation = d3
    .forceSimulation(nodeData)
    //.force('charge', d3.forceManyBody().strength(5))
    .force('collision', d3.forceCollide((d) => 2 * scaleNode(d)))
    .force('center', d3.forceCenter(networkSize.width / 2, networkSize.height / 2))
  simulation.on('tick', (a) => {
    node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
  })

  // Border
  svg.append('rect')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-width', 3)
}

// Info View*********
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

// Load data
const initialize = async () => {
  /* Columns: name, release_date, developer, publisher, platforms,
    genres, steamspy_tags, price, positive, negative, steam_appid, short_description,
    header_image, minimum, owners */
  games = await d3.csv('../data/steam.csv');
  currentGames = games.slice();
  popularity.max = Math.max(...games.map(g => g.owners));
  popularity.min = Math.min(...games.map(g => g.owners));
  /* Levels: genres -> dates -> tags -> games */
  tree = await d3.json('../data/network.json');
  const genreValues = [];
  for (genre in tree) {
    genreValues.push(tree[genre].count);
  }
  countValues.max = Math.max(...genreValues.map(g => g));
  countValues.min = Math.min(...genreValues.map(g => g));
}

// Initialize visualization
initialize().then(() => {
  gameNetwork(networkSize.height, networkSize.width);
  // Search View
  // Comparison View
  // Recommendation View
})
