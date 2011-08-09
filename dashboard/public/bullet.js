var w = 960,
    h = 50,
    m = [5, 40, 20, 120]; // top right bottom left

var chart = d3.chart.bullet()
    .width(w - m[1] - m[3])
    .height(h - m[0] - m[2]);

d3.json("bullet.json", function(data) {

  var vis = d3.select("#chart").selectAll("svg")
      .data(data)
    .enter().append("svg:svg")
      .attr("class", "bullet")
      .attr("width", w)
      .attr("height", h)
      .attr("id", function(d) { return d.id; })
    .append("svg:g")
      .attr("transform", "translate(" + m[3] + "," + m[0] + ")")
      .call(chart);

  var title = vis.append("svg:g")
      .attr("text-anchor", "end")
      .attr("transform", "translate(-6," + (h - m[0] - m[2]) / 2 + ")");

  title.append("svg:text")
      .attr("class", "title")
      .text(function(d) { return d.title; });

  title.append("svg:text")
      .attr("class", "subtitle")
      .attr("dy", "1em")
      .text(function(d) { return d.subtitle; });

  chart.duration(500);
  window.transition = function() {
    vis.map(updateBullets).call(chart);
  };
  window.transition2 = function() {
	  d3.select("#counter2").map(updateBullets).call(chart);
  };
});

function updateBullets(d, i) {
  if (!d.measures_update) d.measures_update = measures_update(d, i);
  if (!d.maximum) d.maximum = maximum(d, i);

  //d.ranges = d.ranges.map(d.randomizer);
  d.markers = d.markers.map(d.maximum);
  d.measures = d.measures.map(d.measures_update);
  return d;
}

function maximum(d, i) {
	return function(d, j) {
	    return Math.max(d,counters[i] );
	  };
}

function measures_update(d, i) {
  return function(d, j) {
    return Math.max(0,counters[i] );
  };
}