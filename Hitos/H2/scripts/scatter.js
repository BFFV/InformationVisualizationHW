const height = 500
const width = 500
const marginLeft = 40
const marginTop = 40

const svg = d3.select("#vis")
    .append("svg")
    .attr("height", height)
    .attr("width", width)

const container = svg.append("g")
    .attr("transform", `translate(${marginLeft}, ${marginTop})`)


const dataset = d3.csv(
    "https://gist.githubusercontent.com/curran/a08a1080b88344b0c8a7/raw/0e7a9b0a5d22642a06d3d5b9bcbad9890c8ee534/iris.csv",
    row => {
        return {
            ...row,
            sepal_length: +row.sepal_length,
            sepal_width: +row.sepal_width,
            petal_length: +row.petal_length,
            petal_width: +row.petal_width,
        }
    }    
)
.then(data => {
    const slMax = d3.max(data, row => row.sepal_length)
    const swMax = d3.max(data, row => row.sepal_width)
    const plMax = d3.max(data, row => row.petal_length)
    const pwMax = d3.max(data, row => row.petal_width)

    const xScale = d3.scaleLinear([0, slMax], [0, 300])
    const yScale = d3.scaleLinear([0, swMax], [300, 0])

    const axisB = d3.axisBottom(xScale)
    const axisL = d3.axisLeft(yScale)

    const species = ["setosa", "virginica", "versicolor"]
    const colours = ["blue", "red", "green"]
    const colourScale = d3.scaleOrdinal(species, colours)

    // Add one dot in the legend for each name.
    container.selectAll("circle.legend-swatch")
        .data(species)
        .join("circle")
            .attr("cx", 350)
            .attr("cy", (d, i) => 220 + i*15)
            .attr("r", 4)
            .attr("fill", d => colourScale(d))
            .attr("class", "legend-swatch")

    // Add one label in the legend for each name.
    container.selectAll("mylabels")
        .data(species)
        .join("text")
            .attr("x", 360)
            .attr("y", (d, i) => 220 + i*15) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("fill", d => colourScale(d))
            .text(d => d)
            .attr("text-anchor", "left")
            .attr("alignment-baseline", "middle")

    const xAxis = container.append("g")
        .attr("transform", `translate(0, 300)`)
        .call(axisB)

    const yAxis = container.append("g")
        .attr("transform", `translate(0, 0)`)
        .call(axisL)

    container.selectAll("circle.data-point")
        .data(data)
        .join("circle")
            .attr("cx", d => xScale(d.sepal_length))
            .attr("cy", d => yScale(d.sepal_width))
            .attr("r", 4)
            .attr("fill", d => colourScale(d.species))
            .attr("class", "data-point")

})
