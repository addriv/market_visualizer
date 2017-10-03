import $ from 'jquery';
import * as d3 from 'd3';

function chartStock(ajaxResponse, investment){
  const quotes = ajaxResponse["Time Series (Daily)"];
  const dates = Object.keys(quotes).sort();
  const data = dates.map(date => {
    return {
      date: date,
      open: parseFloat(quotes[date]["1. open"]),
      close: parseFloat(quotes[date]["4. close"]),
      low: parseFloat(quotes[date]["3. low"]),
      high: parseFloat(quotes[date]["2. high"]),
      volume: parseInt(quotes[date]["5. volume"])
    };
  });

  let minClose, minOpen, minLow, minHigh, maxClose, maxOpen, maxLow, maxHigh;

  data.forEach(dayStat => {
    if (!minClose || minClose > dayStat.close) { minClose = dayStat.close; }
    if (!maxClose || maxClose < dayStat.close) { maxClose = dayStat.close; }
    if (!minOpen || minOpen > dayStat.open) { minOpen = dayStat.open; }
    if (!maxOpen || maxOpen < dayStat.open) { maxOpen = dayStat.open; }
    if (!minLow || minLow > dayStat.low) { minLow = dayStat.low; }
    if (!maxLow || maxLow < dayStat.low) { maxLow = dayStat.low; }
    if (!minHigh || minHigh> dayStat.high) { minHigh = dayStat.high; }
    if (!maxHigh || maxHigh < dayStat.high) { maxHigh = dayStat.high; }
  });

  console.log(data);
  //Chart dimensions
  // const margin =  { top: 50, bot: 50, left: 50, right: 50 };
  const margin = 50;
  const width = 1000 - 2 * margin;
  const height = 600 - 2 * margin;

  //Calculate with investment
  const units = investment ? (investment / data[0].close) : 1;

  // Scale
  const xScale = d3.scaleTime()
    .domain([new Date(dates[0]), new Date(dates.slice(-1))])
    .range([0,width]);

  // const x = d3.time.scale().range([0, width]);
  const yScale = d3.scaleLinear()
    .domain([units * minClose, units * maxClose])
    .range([height, 0]);

  //Axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  //Line function
  const priceLine = d3.line()
    .x(function(d) { return xScale(new Date(d.date)); })
    .y(function(d) { return yScale(units * d.close); });

  //svg
  const svg = d3.select('chart').append('svg')
    .attr('class', 'chart')
    .attr('width', width + 2 * margin)
    .attr('height', height + 2 * margin);

  const g = svg.append('g')
    .attr('transform', `translate(${margin}, ${margin})`);

  //Append axes
  const xAxisGroup = g.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis);

  const yAxisGroup = g.append('g')
    .call(yAxis);

  //Focus
  const focus = g.append('g')
    .attr('class', 'focus')
    .style('display', 'none');

  focus.append('line')
    .attr('class', 'x-hover-line hover-line')
    .attr('y1', 0)
    .attr('y2', height);

  focus.append('line')
    .attr('class', 'y-hover-line hover-line')
    .attr('x1', 0)
    .attr('x2', 0);

  focus.append('circle').attr('r', 7.5);

  focus.append('text')
    .attr('x', 15)
    .attr('dy', '.31em');

  //Append line
  svg.append('path')
    .attr('d', priceLine(data))
    .attr('stroke', 'blue')
    .attr('stroke-width', 1)
    .attr('transform', `translate(${margin}, ${margin})`)
    .attr('fill', 'none');

  svg.append('rect')
    .attr('transform', `translate(${margin}, ${margin})`)
    .attr('class', 'overlay')
    .attr('width', width)
    .attr('height', height)
    .on("mouseover", function() { focus.style("display", null); })
    .on("mouseout", function() { focus.style("display", "none"); })
    .on('mousemove', mousemove);

    // Mouse move handler
  function mousemove(){
    const x0 = xScale.invert(d3.mouse(this)[0]);
    const bisectDate = d3.bisector(function(d) { return new Date(d.date); }).left;
    const i = bisectDate(data, x0, 1);
    const d0 = data[i - 1];
    const d1 = data[i];
    const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
    focus.attr('transform', `translate(${xScale(new Date(d.date))}, ${yScale(units * d.close)})`);
    focus.select('text').text(() => d.close);
    focus.select('.x-hover-line').attr('y2', height - yScale(units * d.close));
    focus.select('.y-hover-line').attr('x1', - xScale(new Date(d.date)));
  }
}

const plot = (ticker, investment) => {
  $.ajax({
    method: 'GET',
    url: `http://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=INCSV57JMRCTRZ1V`,
  }).then(response => chartStock(response, investment));
};

function handleAnalyze(){
  const tickerInput = document.getElementById('ticker');
  const charts = document.getElementsByClassName('chart');
  const investment = document.getElementById('investment');

  //Remove charts if they exist
  if (charts.length > 0) { charts[0].remove(); }

  plot(tickerInput.value, parseInt(investment.value));
}

document.addEventListener('DOMContentLoaded', () => {
  const analyzeBtn = document.getElementById('analyze');

  //Add click event to analyze button
  analyzeBtn.addEventListener('click', handleAnalyze);
});


// API Key
// INCSV57JMRCTRZ1V