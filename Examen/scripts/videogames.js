// Definitions & settings
const network = d3.select('#network');
const networkSize = {
  width: Math.floor(parseInt(network.style('width'), 10)),
  height: Math.floor(parseInt(network.style('width'), 10) * 0.9)};
network.style('height', `${networkSize.height}px`);
const info = d3.select('#info');
info.style('height', `${networkSize.height * 1.1}px`);
const search = d3.select('#search');
search.style('height', `${networkSize.height * 0.8}px`);
const list = d3.select('#list');
list.style('height', `${networkSize.height * 0.8}px`);
const radius = {min: Math.floor(networkSize.height * 0.01),
  max: Math.floor(networkSize.height) / 4};
const initialState = d3.zoomIdentity.translate(245, 220).scale(0.46);
const networkState = {level: 0, genre: '', year: '', tag: ''};
const selectedData = [];
let games = [];
let currentGames = [];
let tree = {};
let popularity = {min: 0, max: 0};
let countValues = {min: 0, max: 0};
let zoom = null;
let headerImage = 'images/categories.png';

// Color scales
let logCount = null;
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

// Updates the network graph levels
function updateTree() {
  for (let genre in tree) {
    tree[genre].count = 0;
    for (let year in tree[genre].dates) {
      tree[genre].dates[year].count = 0;
      for (let tag in tree[genre].dates[year].tags) {
        tree[genre].dates[year].tags[tag].count = 0;
      }
    }
  }
  for (let game of currentGames) {
    for (let genre of game.genres.split(';')) {
      tree[genre].count ++;
      const gameYear = game.release_date.slice(0, 4);
      tree[genre].dates[gameYear].count ++;
      for (let tag of game.steamspy_tags.split(';')) {
        tree[genre].dates[gameYear].tags[tag].count ++;
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
      levelData.push({id: tree[g].id, name: g, count: tree[g].count});
    }
  } else if (level == 1) {
    for (let d in tree[genre].dates) {
      levelData.push({id: tree[genre].dates[d].id, name: d, count: tree[genre].dates[d].count});
    }
  } else if (level == 2) {
    for (let t in tree[genre].dates[year].tags) {
      levelData.push({id: tree[genre].dates[year].tags[t].id, name: t, count: tree[genre].dates[year].tags[t].count});
    }
  } else {
    levelData = currentGames.filter((game) => {
      return (game.genres.split(';').includes(genre)) &&
       (game.release_date.slice(0, 4) == year) &&
        (game.steamspy_tags.split(';').includes(tag))});
  }
  return levelData;
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
    nodeCount = parseInt(node.owners, 10);
  } else {
    maxValue = countValues.max;
    minValue = countValues.min;
    nodeCount = node.count;
  }
  // Size Scale
  const sizeScale = (popularity) => {
    const adjust = 5;
    const logPopularity = d3.scaleLog()
      .domain([adjust * minValue, adjust * maxValue]);
    const linearSize = d3.scaleLinear()
      .domain([0, 1])
      .range([radius.min, radius.max])
    if (popularity < 1) {
      return linearSize(logPopularity(adjust * 1));
    }
    return linearSize(logPopularity(adjust * popularity));
  }
  return sizeScale(nodeCount);
}

// Fill nodes with color based on rating / size
function fillNode(node) {
  const level = networkState.level;
  if (level == 3) {
    if (selectedData.includes(node.steam_appid)) {
      return '#8E44AD';
    }
    if ((node.positive >= 95) && (node.ratings >= 500)) {
      return '#3498DB'; // Extremely Good #3498DB
    } else if (node.positive >= 80) {
      return '#48C9B0'; // Great #48C9B0
    } else if (node.positive >= 70) {
      return '#27AE60'; // Good #27AE60
    } else if (node.positive >= 50) {
      return '#F4D03F'; // Average #F4D03F
    } else if ((node.positive >= 30) || (node.ratings < 20)) {
      return '#E67E22'; // Bad #E67E22
    } else if ((node.positive >= 15) || (node.ratings < 50)) {
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
      headerImage = 'images/category.png';
    } else if (lvl == 1) {
      networkState.year = node.name;
      headerImage = 'images/calendar.png';
    } else {
      networkState.tag = node.name;
      headerImage = 'images/tag.png';
    }
    networkState.level ++;
    updateNetwork();
    return updateInfo(node, false);
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
  updateList();
}

// Go back to the previous state
function back() {
  const level = networkState.level;
  if (level) {
    if (level == 1) {
      networkState.genre = '';
      headerImage = 'images/categories.png';
    } else if (level == 2) {
      networkState.year = '';
      headerImage = 'images/category.png';
    } else {
      networkState.tag = '';
      headerImage = 'images/calendar.png';
    }
    networkState.level --;
    updateNetwork();
    updateInfo(null, false);
  }
}

// Show details about a node
function showData(node, graph) {
  let currentNode = null;
  const {level} = networkState;
  if (level == 3) {
    currentNode = graph
      .selectAll('circle')
      .filter((d) => d.steam_appid == node.steam_appid)
  } else {
    currentNode = graph
      .selectAll('circle')
      .filter((d) => d.id == node.id)
  }
  // Increase Size + opacity
  currentNode.attr('opacity', 0.6);
  updateInfo(node, false);
  updateInfo(node, true);
}

// Hide details
function hideData(node, graph) {
  let currentNode = null;
  const {level} = networkState;
  if (level == 3) {
    currentNode = graph
      .selectAll('circle')
      .filter((d) => d.steam_appid == node.steam_appid)
  } else {
    currentNode = graph
      .selectAll('circle')
      .filter((d) => d.id == node.id)
  }
  // Normal size + opacity
  currentNode.attr('opacity', 1);
  updateInfo(node, false);
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
      [- width * 10, - height * 10],
      [width * 10, height * 10]
    ])
    .scaleExtent([0.03, 3])
    .on('zoom', (e) => container.attr('transform', e.transform))
  svg.call(zoom);
  svg.on('dblclick.zoom', null);
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
      headerImage = 'images/categories.png';
      updateInfo(null, false);
    })
  buttons.append('button')
    .text('Back to Previous Level')
    .on('click', () => back())

  // Create Network
  updateNetwork();
}

// Update steam games network
function updateNetwork() {
  // Reset Zoom/Panning
  const svg = d3.select('#graphContainer');
  svg
    .transition()
    .duration(500)
    .call(zoom.transform, initialState)

  // Nodes DataJoin
  const container = d3.select('#nodeContainer');
  const nodeData = getLevelData();
  const node = container
    .selectAll('circle')
    .data(nodeData, (d) => {
      if (networkState.level < 3) {
        return d.id;
      }
      return d.steam_appid;
    })
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
          .attr('stroke', '#1F1F1F')
          .attr('stroke-width', 0.1)
          .selection(),
        (exit) =>
        exit
          .remove()
      )
    .on('click', (_, d) => selected(d, container))
    .on('mouseenter', (_, d) => showData(d, container))
    .on('mouseleave', (_, d) => hideData(d, container))

  // Simulation
  const simulation = d3
    .forceSimulation(nodeData)
    .force('charge', d3.forceManyBody().strength(-5))
    .force('collision', d3.forceCollide((d) => 1.1 * scaleNode(d)))
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

// Detailed info about node
function infoView() {
  const images = info.append('div').attr('id', 'images');
  images.append('div').attr('id', 'positive');
  const image = images.append('img');
  image
    .attr('src', headerImage)
    .attr('id', 'headerImage')
    .on('error', () => image.attr('src', 'images/game.png'))
  images.append('div').attr('id', 'negative');
  updateInfo(null, false);
}

// Update information about node
function updateInfo(node, show) {
  const {level} = networkState;
  // Hide details
  if (!show) {
    info.selectAll('p').remove();
    info.selectAll('h3').remove();
    info.selectAll('h2').remove();
    info.select('#infoContainer').remove();
    info.select('#positiveImg').remove();
    info.select('#negativeImg').remove();
    if (!level) {
      info.append('h2').text('All Genres');
      info.append('h3').text('Explore All Game Genres');
    } else if (level == 1) {
      info.append('h2').text('Genre: ' + networkState.genre);
      info.append('h3').text(`Explore ${networkState.genre} Games`);
    } else if (level == 2) {
      info.append('h2').text('Year: ' + networkState.year);
      info.append('h3').text(`Explore ${networkState.genre} Games Released in ${networkState.year}`);
    } else {
      info.append('h2').text('Tag: ' + networkState.tag);
      info.append('h3').text(`Explore ${networkState.genre} Games Released in ${networkState.year} with the Tag ${networkState.tag}`);
    }
    return info.select('#headerImage').attr('src', headerImage);
  }
  // Show details
  info.selectAll('h3').remove();
  info.selectAll('h2').remove();
  let img = '';
  if (!level) {
    img = 'images/category.png';
  } else if (level == 1) {
    img = 'images/calendar.png';
  } else if (level == 2) {
    img = 'images/tag.png';
  } else {
    img = node.header_image;
  }
  // Update image
  info.select('#headerImage').attr('src', img);

  // Update information
  if (level == 3) {
    info.append('h2').text(node.name);
    const positive = info.select('#positive');
    positive.append('p');
    positive.append('img')
      .attr('src', 'images/like.png')
      .attr('id', 'positiveImg')
    positive.append('h3').text(node.positive + '%');
    const negative = info.select('#negative');
    negative.append('p');
    negative.append('img')
      .attr('src', 'images/dislike.png')
      .attr('id', 'negativeImg')
    negative.append('h3').text(node.negative + '%');
    const infoContainer = info.append('div').attr('id', 'infoContainer');
    const left = infoContainer.append('div').attr('id', 'leftInfo');
    const right = infoContainer.append('div').attr('id', 'rightInfo');
    left.append('p').text('Developer: ' + node.developer.replaceAll(';', ', '));
    left.append('p').text('Publisher: ' + node.publisher.replaceAll(';', ', '));
    left.append('p').text('Release Date: ' + node.release_date);
    left.append('p').text('Platforms: ' + node.platforms.replaceAll(';', ', '));
    right.append('p').text('Genres: ' + node.genres.replaceAll(';', ', '));
    right.append('p').text('Tags: ' + node.steamspy_tags.replaceAll(';', ', '));
    right.append('p').text('Price: US$ ' + node.price);
    right.append('p').text('Owners ~ ' + node.owners);
    info.append('p').text(node.short_description).style('text-align', 'justify');
  } else {
    if (!level) {
      info.append('h2').text('Genre: ' + node.name);
      info.append('h3').text(`Explore ${node.name} Games`);
    } else if (level == 1) {
      info.append('h2').text('Year: ' + node.name);
      info.append('h3').text(`Explore ${networkState.genre} Games Released in ${node.name}`);
    } else {
      info.append('h2').text('Tag: ' + node.name);
      info.append('h3').text(`Explore ${networkState.genre} Games Released in ${networkState.year} with the Tag ${node.name}`);
    }
    info.append('h3').text('(Contains ' + node.count + ' Games)');
  }
}

// Search games
function searchGames(name) {
  let results = [];
  if (name) {
    const direct = currentGames.filter(
      (g) => g.name.toLowerCase().slice(0, name.length) == name.toLowerCase()).sort(
      (g, h) => g.ratings - h.ratings).reverse();
    const indirect = currentGames.filter(
      (g) => g.name.toLowerCase().includes(name.toLowerCase())).sort(
      (g, h) => g.ratings - h.ratings).reverse();
    results = direct.concat(indirect);
    results = [...new Set([...direct, ...indirect])];
  }
  updateSearch(results.slice(0, 10));
}

// Search bar
function searchView() {
  const searchContainer = search.append('div')
    .attr('id', 'searchContainer')
  searchContainer.append('h2').text('Game Search');
  searchContainer.append('p').text('(Click the search icon to locate a game in the main graph)');
  const searchBar = searchContainer.append('input')
    .attr('type', 'text')
    .attr('maxlength', '128')
    .attr('id', 'searchBar')
    .on('keyup', () => searchGames(searchBar.property('value')))
  search.append('div').attr('id', 'searchResults');
}

// Locate games
function locateGames(game) {
  const {genres, release_date, steamspy_tags} = game;
  const genre = genres.split(';')[0];
  const year = release_date.slice(0, 4);
  const tag = steamspy_tags.split(';')[0];
  networkState.genre = genre;
  networkState.year = year;
  networkState.tag = tag;
  headerImage = 'images/tag.png';
  networkState.level = 3;
  updateNetwork();
  updateInfo(game, false);
  updateInfo(game, true);
  const selectedNode = d3.select('#nodeContainer')
    .selectAll('circle')
    .filter((d) => d.steam_appid == game.steam_appid)
  const nodeRadius = selectedNode.attr('r');
  selectedNode
    .attr('stroke', 'purple')
    .attr('stroke-width', nodeRadius / 4)
    .attr('stroke-dasharray', `${nodeRadius / 2},${nodeRadius / 2}`)
}

// Search results
function updateSearch(results) {
  const resultsView = search.select('#searchResults');
  resultsView.selectAll('div').remove();
  for (let game of results) {
    const result = resultsView.append('div').attr('class', 'searchResult');
    const resultImg = result.append('img')
      .attr('src', game.header_image)
      .attr('class', 'resultImage')
      .on('error', () => resultImg.attr('src', 'images/game.png'))
    result.append('h3').text(game.name);
    result.append('img')
      .attr('src', 'images/locate.png')
      .attr('class', 'locateImage')
      .on('click', () => locateGames(game))
  }
}

// List view
function listView() {
  list.append('h2').text('My Game List');
  list.append('p').text('(Your selected games will appear in this list)');
  list.append('div').attr('id', 'selectedGames');
}

// Show game info
function gameInfo(game) {
  updateInfo(game, false);
  const currentLevel = networkState.level;
  networkState.level = 3;
  updateInfo(game, true);
  networkState.level = currentLevel;
}

// Remove game from list
function removeGame(game) {
  const index = selectedData.indexOf(game.steam_appid);
  selectedData.splice(index, 1);
  const selectedNode = network.select('#nodeContainer')
    .selectAll('circle')
    .filter((d) => d.steam_appid == game.steam_appid)
  if (selectedNode) {
    selectedNode.attr('fill', (d) => fillNode(d));
  }
  updateList();
}

// Selected games on list
function updateList() {
  const getGame = (id) => currentGames.filter((g) => g.steam_appid == id)[0];
  const selectedList = list.select('#selectedGames');
  selectedList
    .selectAll('div')
    .data(selectedData, (d) => d)
    .join((enter) => {
        const obj = enter.append('div').attr('class', 'selectedGame');
        const selectedImg = obj.append('img')
          .attr('src', (d) => getGame(d).header_image)
          .attr('class', 'selectedImage')
          .on('error', () => selectedImg.attr('src', 'images/game.png'))
        obj.append('h3').text((d) => getGame(d).name);
        obj.append('img')
          .attr('src', 'images/info.png')
          .attr('class', 'infoImage')
          .on('click', (_, d) => gameInfo(getGame(d)))
        obj.append('img')
          .attr('src', 'images/delete.png')
          .attr('class', 'removeImage')
          .on('click', (_, d) => removeGame(getGame(d)))
        return obj.selection();
        },
        (update) =>
        update
          .selection(),
        (exit) =>
        exit
          .remove()
      )
}

// Load data
const initialize = async () => {
  /* Columns: name, release_date, developer, publisher, platforms,
    genres, steamspy_tags, price, positive, negative, steam_appid, short_description,
    header_image, ratings, owners */
  games = await d3.csv('../data/steam.csv');
  currentGames = games.slice();
  popularity.max = Math.max(...games.map(g => parseInt(g.owners, 10)));
  popularity.min = Math.min(...games.map(g => parseInt(g.owners, 10)));
  /* Levels: genres -> dates -> tags -> games */
  tree = await d3.json('../data/network.json');
  const genreValues = [];
  for (genre in tree) {
    genreValues.push(tree[genre].count);
  }
  countValues.max = Math.max(...genreValues.map(g => g));
  countValues.min = 1;
  logCount = d3.scaleLog().domain([countValues.min, countValues.max]);
}

// Initialize visualization
initialize().then(() => {
  gameNetwork(networkSize.height, networkSize.width);
  infoView();
  searchView();
  listView();
})
