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

// Create Geo Map
const geoMap = (height, width, margin, geoData, census) => {
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
  svg
    .transition()
    .duration(2000)
    .call(zoom.transform, initialState)

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
    .attr('height', 65)
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
    .attr('transform', 'translate(0, 60)')
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
        svg
          .transition()
          .duration(1500)
          .call(zoom.transform, states[i])
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
  const info = d3.select('#info');

  // Bar Graph
  const svg = info
    .append('svg')
      .attr('width', 620)
      .attr('height', 661)
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
      .attr('y', 25)
      .attr('class', 'sub-title')
  legend
    .append('rect')
      .attr('x', 140)
      .attr('width', 50)
      .attr('height', 40)
      .attr('fill', 'red')
      .attr('stroke', 'black')
  legend
    .append('text')
      .text('Mujeres')
      .attr('x', 270)
      .attr('y', 25)
      .attr('class', 'sub-title')
  legend
    .append('rect')
      .attr('x', 350)
      .attr('width', 50)
      .attr('height', 40)
      .attr('fill', 'blue')
      .attr('stroke', 'black')

  // Create Bar Graph
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
  geoMap(700, 600, {top: 20, left: 20, right: 20, bottom: 20}, geoData, census);
  info(census);
})
