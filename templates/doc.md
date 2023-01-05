To add a new chart please check these resource first of all

- How to use ChartJs https://www.chartjs.org/docs/latest/getting-started/
- How to create a custom chartJs Plugin https://www.chartjs.org/docs/latest/developers/plugins.html

add your canvas to the html

```html
<div class="hero">
  <h1>Histogram</h1>
  <div class="chart-container">
    <canvas id="histogramChartV2" width="1000" height="600"></canvas> <= like
    that
  </div>
</div>
```

```js
const histogramChartV2 = new Chart(
  document.getElementById("histogramChartV2") /* <= add ref to the element */,
  {
    type: "bar" /* <= choose the chartjs type */,
    data: {
      datasets: [
        {
          label: "TSLA Instogram",
          /* disable the animations */
          animation: {
            duration: 0,
          },
          /* to remove the x and y borders*/
          borderWidth: 0,
          /* reduce the distance between the columns*/
          barPercentage: 1.0,
          categoryPercentage: 1.0,
          //
        },
      ],
    },
    options: {
      /* remove the borders*/
      scales: {
        y: {
          beginAtZero: false,
          drawBoarder: false,
        },
        x: {
          drawBoarder: false,
        },
      },
      plugins: {
        /* you can add a custom plugins we have some custom plugins please check below */
        customBorderPlugin: {},
        meanLinesPlugin: {},
        zoom: {
          pan: {
            enabled: true,
            mode: "x",
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            drag: {
              enabled: true,
              modifierKey: "ctrl",
            },
            mode: "x",
          },
        },
      },
    },
    /* register your custom plugins*/
    plugins: [meanLinesPlugin, customBorderPlugin],
  }
);
```

## Custom plugins

### customBorderPlugin

```js
const customBorderPlugin = {
  id: "customBorderPlugin" /* <= plugin name*/,
  afterDatasetDraw: (chart, args, options) => {
    /* draw the boarder using canvas functions please check  https://www.w3schools.com/html/html5_canvas.asp */
    const {
      ctx,
      chartArea: { top, bottom, left, right, width, height },
    } = chart;
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.moveTo(left, top);
    ctx.lineTo(right, top);
    ctx.lineTo(right, bottom);
    ctx.lineTo(left, bottom);
    ctx.closePath();
    ctx.stroke();
  },
};
```

### meanLinesPlugin

```js
const meanLinesPlugin = {
  id: "meanLinesPlugin" /* <= plugin name*/,
  afterDatasetDraw: (chart, args, options) => {
    /* draw the dash lines using the canvas functions please check  https://www.w3schools.com/html/html5_canvas.asp */
    const {
      ctx,
      chartArea: { top, bottom, right, left },
    } = chart;
    // ignore if there aren't any data.
    if (!args.meta.data?.length) return;
    ctx.save();
    ctx.beginPath();
    const q1 = Math.floor(q25(args.meta.data.map((e, i) => i)));
    const q2 = Math.floor(median(args.meta.data.map((e, i) => i)));
    const q3 = Math.floor(q75(args.meta.data.map((e, i) => i)));
    // first value
    ctx.beginPath();
    ctx.setLineDash([1, 0]);
    ctx.strokeStyle = "gray";
    console.log(args.meta.data);
    ctx.moveTo(args.meta.data[0].x, bottom);
    ctx.lineTo(args.meta.data[0].x, top);
    ctx.stroke();

    // 0.25
    ctx.beginPath();
    ctx.setLineDash([5, 15]);
    ctx.strokeStyle = "black";
    ctx.moveTo(args.meta.data[q1].x, bottom);
    ctx.lineTo(args.meta.data[q1].x, top);
    ctx.stroke();

    // mean
    ctx.beginPath();
    ctx.setLineDash([5, 15]);
    ctx.strokeStyle = "green";
    ctx.moveTo(args.meta.data[q2].x, bottom);
    ctx.lineTo(args.meta.data[q2].x, top);
    ctx.stroke();

    // 0.25
    ctx.beginPath();
    ctx.setLineDash([5, 15]);
    ctx.strokeStyle = "black";
    ctx.moveTo(args.meta.data[q3].x, bottom);
    ctx.lineTo(args.meta.data[q3].x, top);
    ctx.stroke();

    // last value
    ctx.beginPath();
    ctx.setLineDash([1, 0]);
    ctx.strokeStyle = "gray";
    ctx.moveTo(args.meta.data[args.meta.data.length - 1].x, bottom);
    ctx.lineTo(args.meta.data[args.meta.data.length - 1].x, top);
    ctx.stroke();

    ctx.restore();
  },
};
```
