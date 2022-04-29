const face_parts = [
    "left_eye",
    "right_eye",
    "mouth_leftmost",
    "mouth_left",
    "mouth_right",
    "mouth_rightmost"
];
const parts_x = [
    20,
    100,
    0,
    40,
    80,
    120
];

const parts_y = [
    0,
    0,
    90,
    90,
    90,
    90
];

const g = d3.select("svg#canvas")
    .append("g")
    .attr("transform", "translate(170, 170)");

let moving_parts = g.selectAll("rect")
    .data(face_parts)
    .join("rect")
    .attr("height", 40)
    .attr("width", 40)
    .attr("x", (_,i) => parts_x[i])
    .attr("y", (_,i) => parts_y[i])
    .attr("fill", "green")
    .filter((_,i) => i == 2 || i == 5);  // hhhhmmmmmmm


const get_sad = () => {
    moving_parts.attr("transform", "translate(0,20)");
}

const get_happy = () => {
    moving_parts.attr("transform", "translate(0,-20)");
}

const relax = () => {
    moving_parts.attr("transform", "translate(0,0)");
}


d3.select("button#bad-button").on("click", get_sad);
d3.select("button#good-button").on("click", get_happy);
d3.select("button#neutral-button").on("click", relax);

// how can we generalise????
// where is the join?????
// what is our data????

