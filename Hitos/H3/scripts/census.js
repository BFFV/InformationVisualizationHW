// Update Graph
function updateGraph (selectedData, censusData) {
  // Census data
  const data = censusData.filter((c) => selectedData.includes(c.ID));
  const maxPopulation = Math.max(...data.map(c => c.TOTAL_PERS));

  // Dimensions
  const width = 550;
  const height = 400;

  // Scales
  const scaleX = d3.scaleBand()
    .domain(data.map((d) => d.ID))
    .rangeRound([0, width])
    .padding(0.5)
  const scaleY = d3.scaleLinear()
    .domain([0, maxPopulation])
    .range([height, 0])
  const scaleHeight = d3.scaleLinear()
    .domain([0, maxPopulation])
    .range([0, height])

  // Create/Update graph
  const graph = d3.select('#graph');
  graph
    .selectAll('rect')
    .data(data, (d) => d.ID)
    .join('rect')
      .attr('x', (d) => scaleX(d.ID))
      .attr('y', (d) => scaleY(d.TOTAL_PERS))
      .attr('width', scaleX.bandwidth())
      .attr('height', (d) => scaleHeight(d.TOTAL_PERS))
      .attr('fill', 'red')
}

// Census Map
const censusGraph = (height, width, margin, geoData, census) => {
  // Map Container
  const map = d3.select('#map');
  const svg = map
    .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('id', 'geo-map')
  const container = svg
    .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
  const communes = container.append('g');
  svg.append('rect')
    .attr('width', '100%')
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-width', 3)

  // Density Limits
  const maxDensity = Math.max(...census.map(c => c.DENSIDAD));

  // Zoom/Pan
  const initialState = d3.zoomIdentity.translate(-1800, -730).scale(4.6);
  const zoom = d3.zoom()
    .extent([
      [0, 0],
      [width, height]
    ])
    .translateExtent([
      [-100, -50],
      [width + 100, height + 50]
    ])
    .scaleExtent([1, 100])
    .on('zoom', (e) => container.attr('transform', e.transform))
  svg.call(zoom);
  svg.call(zoom.transform, initialState);

  // Density Map Properties
  const geoScale = d3
    .geoMercator()
    .fitSize(
      [width - margin.left - margin.right, height - margin.top - margin.bottom],
      geoData)
  const logScale = d3.scaleLog().domain([0.1, maxDensity]);
  const logValue = (density) => {
    if (density < 0.1) {
      return logScale(0.1);
    }
    return logScale(density);
  }
  const fillScale = d3
    .scaleSequential()
    .domain([0, 1])
    .interpolator(d3.interpolateBlues)
  const geoPaths = d3.geoPath().projection(geoScale);

  // Legend & Panning Options
  const densityValues = [0, 1, 10, 100, 1000, 10000, 15000];
  const scaleX = d3.scaleBand()
    .domain(densityValues)
    .rangeRound([0, 500])
    .padding(0)
  const legend = map.append('svg')
    .attr('height', 60)
    .attr('width', 510)
  const squares = legend.append('g');
  for (let i = 0; i < 7; i++) {
    squares
      .append('rect')
        .attr('x', scaleX(densityValues[i]))
        .attr('y', 0)
        .attr('width', scaleX.bandwidth())
        .attr('height', 40)
        .attr('fill', fillScale(logValue(densityValues[i])))
  }
  const ticks = [0, 1, 10, 100, 1000, 10000, 15000];
  const axis = d3.axisTop(scaleX).tickValues(ticks);
  legend.append('g')
    .attr('transform', 'translate(0, 50)')
    .call(axis)
  const bigNorthState = d3.zoomIdentity.translate(-2853, -15).scale(6);
  const smallNorthState = d3.zoomIdentity.translate(-2797, -596).scale(6);
  const centralState = d3.zoomIdentity.translate(-2722, -1160).scale(6);
  const southState = d3.zoomIdentity.translate(-2611, -1856).scale(6);
  const australState = d3.zoomIdentity.translate(-1148, -1280).scale(3);
  const states = [initialState, bigNorthState, smallNorthState,
    centralState, southState, australState];
  const stateNames = ['Inicio', 'Norte Grande', 'Norte Chico',
    'Centro', 'Sur', 'Austral'];
  map.append('h3').text('Zonas del Mapa');
  const buttons = map.append('div').attr('class', 'button-set');
  for (let i = 0; i < 6; i++) {
    buttons
      .append('button')
      .text(stateNames[i])
      .on('click', () => {
        container.attr('transform', states[i]);
        svg.call(zoom.transform, states[i]);
      })
  }

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
        .attr('fill', (d) => fillScale(logValue(census.find(c => c.ID == d.properties.id).DENSIDAD)))
    } else {
      selectedData.push(id);
      selected_commune
        .attr('fill', 'green')
    }
    updateGraph(selectedData, census);
  }

  // Map DataJoin
  communes
    .selectAll('path')
    .data(geoData.features, (d) => d.properties.id)
    .join('path')
      .attr('d', geoPaths)
      .attr('fill', (d) => fillScale(logValue(census.find(c => c.ID == d.properties.id).DENSIDAD)))
      .attr('stroke', '#1F1F1F')
      .attr('stroke-width', 0.03)
    .on('click', (_, d) => selected(d.properties.id))
}

// Info View
const info = (census) => {
  // View
  const info = d3.select('#info');

  // Info Graph
  const svg = info
    .append('svg')
      .attr('width', 600)
      .attr('height', 600)
      .attr('id', 'svg-graph')
  svg.append('g')
    .attr('transform', 'translate(40, 20)')
    .attr('id', 'graph');
  updateGraph(selectedData, census);
}

// Load Data
const initialize = async () => {
  const geoData = await d3.json('../data/comunas.geojson');
  let census = await d3.csv('../data/censo.csv');
  const parseData = (object) => {
    object.ID = parseInt(object.ID, 10);
    return object;
  }
  census = census.map(parseData);
  return [geoData, census];
}

// Initialize Visualization
const selectedData = [];
initialize().then(([geoData, census]) => {
  censusGraph(700, 600, {top: 20, left: 20, right: 20, bottom: 20}, geoData, census);
  info(census);
})
