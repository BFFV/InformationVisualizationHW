const svgWidth = 500
const svgHeight = 500
const cellSize = 10
const colorScale = d3.scaleOrdinal([0, 1], ["white", "blue"])

let adjMatrix
let adjMatrixFlat
let adjMatrixRows
let adjMatrixCols

const svg = d3.select("div#container")
    .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)

const renderGrid = () => {
    const gridG = svg.append("g")
        .attr("id", "grid")

    gridG.selectAll("rect.grid-cell")
        .data(adjMatrixFlat)
        .join("rect")
            .attr("stroke", "black")
            .attr("fill", d => colorScale(d))
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("x", (_, i) => (i % adjMatrixCols)*cellSize)
            .attr("y", (_, i) => (Math.floor(i / adjMatrixCols))*cellSize)
}

const loadDataAndRender = async () => {
    adjMatrixText = await d3.text("./clustered_adj_matrix.csv")
    adjMatrix = d3.csvParseRows(adjMatrixText, row => row.map(v => +v))
    adjMatrixRows = adjMatrix.length
    adjMatrixCols = adjMatrix[0].length
    adjMatrixFlat = adjMatrix.flat()
    renderGrid()
}

loadDataAndRender()