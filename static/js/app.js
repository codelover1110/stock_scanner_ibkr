$(document).ready(function () {
  const ctx = document.getElementById("priceChart").getContext("2d");
  const ctxVolume = document.getElementById("volumeChart").getContext("2d");
  // const ctxhistogram = document.getElementById("histogramChart").getContext("2d");
  const ctxVwap = document.getElementById("vwapChart").getContext("2d");
  const mytable = document.getElementById("orderbook-table");
  
  var priceChart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [{ label: "TSLA Price" }],
    },
    options: {
      borderWidth: 2,
      borderColor: ["rgba(255, 99, 132, 1)"],
      plugins: {
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
  });

  const vwapChart = new Chart(ctxVwap, {
    type: "line",
    data: {
      datasets: [{ label: "VWAP" }],
    },
    options: {
      borderWidth: 1,
      borderColor: ["rgba(55, 9, 102, 1)"],
      plugins: {
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
  });

  const volumeChart = new Chart(ctxVolume, {
    type: "line",
    data: {
      datasets: [{ label: "TSLA Volume" }],
    },
    options: {
      // borderWidth: 3,
      tenion: 0.5,
      borderColor: ["rgba(255, 199, 132, 1)"],
      plugins: {
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
  });

  // const histogramChart = new Chart(ctxhistogram, {
  //   type: 'bar',
  //   data: {
  //     datasets: [{ label: "TSLA Instogram",  }],
  //   },
  //   options: {
  //     borderWidth: 1,
  //     // // tenion: 0.5,
  //     borderColor: ['rgba(155, 9, 132, 1)',],
  //     scales: {
  //       x: {
  //           // type: 'linear',
  //           offset: true,
  //           grid: {
  //             offset: false
  //           },
  //           ticks: {
  //             stepSize: 0
  //           },
  //       },
  //       y: {
  //           beginAtZero: false
  //       }
  //     },
  //   },
  // });

  const histogramChartV2 = new Chart(
    document.getElementById("histogramChartV2"),
    {
      type: "bar",
      data: {
        datasets: [
          {
            label: "TSLA Instogram",
            animation: {
              duration: 0,
            },
            borderWidth: 0,
            barPercentage: 1.0,
            categoryPercentage: 1.0,
          },
        ],
      },
      options: {
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
      plugins: [meanLinesPlugin, customBorderPlugin],
    }
  );

  function addData(chartObject, label, data) {
    chartObject.data.labels.push(label);
    chartObject.data.datasets.forEach((dataset) => {
      dataset.data.push(data);
    });
    chartObject.update();
  }

  function removeFirstData(chartObject) {
    chartObject.data.labels.splice(0, 1);
    chartObject.data.datasets.forEach((dataset) => {
      dataset.data.shift();
    });
  }

  function removeAlltData(chartObject, selectedValue) {
    chartObject.data.labels = [];
    chartObject.data.datasets.forEach((dataset) => {
      dataset.data = [];
      dataset.label = selectedValue;
    });
  }

  function renderDataInTheTable(datas) {
    if (mytable.children.length > 4) {
      mytable.getElementsByTagName("tr")[1].remove();
    }
    datas.forEach((todo) => {
      let newRow = document.createElement("tr");
      newRow.className = "value-detail";
      Object.keys(todo).forEach((key) => {
        let cell = document.createElement("td");
        if (key == "bid_price" || key == "bid_size") {
          cell.className = "bid-detail";
        } else {
          cell.className = "ask-detail";
        }
        cell.innerText = todo[key];
        newRow.appendChild(cell);
      });
      mytable.appendChild(newRow);
    });
  }

  $("#ticker_search").change(function () {
    var selectedValue = $(this).val();
    localStorage.setItem("ticker_name", selectedValue);
    $.post(
      "/tickerChange",
      {
        ticker_search: JSON.stringify({ value: selectedValue }),
      },
      function (err, req, resp) {
        if (resp["responseJSON"]["value"]) {
          removeAlltData(priceChart, selectedValue);
          removeAlltData(volumeChart, selectedValue);
          removeAlltData(histogramChart, selectedValue);
          removeAlltData(vwapChart, selectedValue);

          const boxes = document.querySelectorAll(".value-detail");
          boxes.forEach((box) => {
            box.remove();
          });
        }
      }
    );
  });

  var socket = io.connect();

  //receive details from server
  socket.on("updatePriceData", function (msg) {
    if (priceChart.data.labels.length > 20) {
      removeFirstData(priceChart);
    }
    addData(priceChart, msg.date, msg.value);
  });

  //receive volume details from server
  socket.on("updateVolumeData", function (msg) {
    // Show only MAX_DATA_COUNT data
    if (volumeChart.data.labels.length > 50) {
      removeFirstData(volumeChart);
    }
    addData(volumeChart, msg.date, msg.value);
  });

  //receive histogram details from server
  socket.on("updateHistogramData", function (msg) {
    // console.log("Received histogram :: " + msg.date + " :: " + msg.value);
    if (histogramChartV2.data.labels.length > 50) {
      removeFirstData(histogramChartV2);
    }
    addData(histogramChartV2, msg.date, msg.value);
  });

  //receive vwap details from server
  socket.on("updateVwapData", function (msg) {
    // Show only MAX_DATA_COUNT data
    if (vwapChart.data.labels.length > 100) {
      removeFirstData(vwapChart);
    }
    addData(vwapChart, msg.date, msg.value);
  });

  //receive vwap details from server
  socket.on("updateOrderbookData", function (msg) {
    apiData = [
      {
        bid_size: msg.value.bid_size,
        bid_price: msg.value.bid_price,
        ask_price: msg.value.ask_price,
        ask_size: msg.value.ask_size,
      },
    ];
    renderDataInTheTable(apiData);
  });
});

// Chart JS Plugins

const meanLinesPlugin = {
  id: "meanLinesPlugin",
  afterDatasetDraw: (chart, args, options) => {
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

const customBorderPlugin = {
  id: "customBorderPlugin",
  afterDatasetDraw: (chart, args, options) => {
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

//

/* Utils */

// calculate quantile
const asc = (arr) => arr.sort((a, b) => a - b);
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const mean = (arr) => sum(arr) / arr.length;

const std = (arr) => {
  const mu = mean(arr);
  const diffArr = arr.map((a) => (a - mu) ** 2);
  return Math.sqrt(sum(diffArr) / (arr.length - 1));
};

const quantile = (arr, q) => {
  const sorted = asc(arr);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
};

const q25 = (arr) => quantile(arr, 0.25);

const q50 = (arr) => quantile(arr, 0.5);

const q75 = (arr) => quantile(arr, 0.75);

const median = (arr) => q50(arr);
//
/*  */
