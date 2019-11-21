const app = require('express')();
const resf = require('resf');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const util = require('util');
const cors = require('cors');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('port', process.env.PORT || 3001);
app.use(cors());

const config = {
  host: '35.198.8.59',
  user: 'root',
  password: '',
  database: 'db_datathon'
};

const conn = mysql.createConnection(config);

conn.connect(err => {
  if (err) throw err;
  console.log('connected');
});

const query = util.promisify(conn.query).bind(conn);

// const exportChartData = async (queryCmd, fieldName) => {
//   const rows = await query(queryCmd);

//   // const chartArray = [['date', 'NDVI', 'Average']];
//   const chartArray = [fieldName];

//   const length = fieldName.length;

//   rows.forEach(element => {
//     let tArray = [];
//     for (let i = 0; i < length; i++) {
//       const name = fieldName[i];
//       tArray[i] = element[name];
//     }
//     chartArray.push(tArray);
//   });
//   return chartArray;
// };

const exportNdviChart = async fieldId => {
  const rows = await query(
    `SELECT * FROM avg_ndvi WHERE field_id = "${fieldId}"`
  );

  const ndviChart = [['date', 'ndvi', 'average']];

  rows.forEach(element => {
    let tArray = [element.date, element.ndvi, 0.45];
    ndviChart.push(tArray);
  });
  return ndviChart;
};

const exportRainfallChart = async fieldId => {
  const rows = await query(
    `SELECT * FROM rainfall_temp WHERE field_id = "${fieldId}"`
  );

  const rainfallChart = [["date", 'Temp', 'Rainfal']];

  rows.forEach(element => {
    let tArray = [element.date, element.mean_min_temp, element.average_rainfall_mm];
    rainfallChart.push(tArray);
  });
  return rainfallChart;
};

const exportRainfallOnlyChart = async fieldId => {
  const rows = await query(
    `SELECT date, average_rainfall_mm FROM rainfall_temp WHERE field_id = "${fieldId}"`
  );

  const rainfallChart = [];

  rows.forEach(element => {
    // let tArray = [element.date, element.average_rainfall_mm];
    rainfallChart.push({x:element.date, y:element.average_rainfall_mm});
  });
  return rainfallChart;
};

const exportTempOnlyChart = async fieldId => {
  const rows = await query(
    `SELECT * FROM rainfall_temp WHERE field_id = "${fieldId}"`
  );

  const rainfallChart = [];

  rows.forEach(element => {
    // let tArray = [element.date, element.mean_min_temp];
    rainfallChart.push({x:element.date, y:element.mean_min_temp});
  });
  return rainfallChart;
};

const exportLocationInfo = async fieldId => {
  const rows = await query(
    `SELECT * FROM location_info WHERE field_id = "${fieldId}"`
  );

  const location_info = [];

  rows.forEach(element => {
    let tArray = [element.country, element.state, element.region, element.postcode, element.mill, element.company, element.area_m2, element.area_ha, element.lat, element.lng];
    location_info.push(tArray);
  });
  return location_info;
};

const exportYieldChart = async fieldId => {
  const rows = await query(
    `SELECT * FROM historical_yield WHERE field_id = "${fieldId}"`
  );

  const chart = [['Years', 'Harvest']];

  rows.forEach(element => {
    let tArray = [element.year.toString(), element.tonnes_cane_harvested_per_hecta];
    chart.push(tArray);
  });
  return chart;
};

const exportPieChart = async fieldId => {
  const harvested = await query(
    `SELECT COUNT(harvested) as count FROM pixel_ndvi WHERE field_id = "${fieldId}" AND harvested=1`
  );
  const unharvested = await query(
    `SELECT COUNT(harvested) as count FROM pixel_ndvi WHERE field_id = "${fieldId}" AND harvested=0`
  );
  const chart = [
    ['Status', 'Value'],
    ['Harvested', harvested[0].count],
    ['Unharvested', unharvested[0].count]
  ];

  // rows.forEach(element => {
  //   let tArray = [element.year, element.tonnes_cane_harvested_per_hecta];
  //   chart.push(tArray);
  // });
  return chart;
};

const exportMap = async fieldId => {
  const rows = await query(
    `SELECT lat_1, lat_2, lng_1, lng_2, ndvi, harvested FROM pixel_ndvi WHERE field_id = "${fieldId}"`
  );

  const map = [];

  rows.forEach(element => {
    let tArray = [
      element.lat_1,
      element.lat_2,
      element.lng_1,
      element.lng_2,
      element.ndvi,
      element.harvested
    ];
    map.push(tArray);
  });
  return map;
};

app.get('/api/chart', async (req, res) => {
  const fieldId = req.query.fieldId;

  rows = await query(`show tables`);
  console.log(rows);

  //ndviChart
  const ndviChart = await exportNdviChart(fieldId);

  //rainfallChart
  const rainfallChart = await exportRainfallChart(fieldId);

  const rainfallOnlyChart = await exportRainfallOnlyChart(fieldId);

  const tempOnlyChart = await exportTempOnlyChart(fieldId);
  //location info
  const location_info = await exportLocationInfo(fieldId);

  //yieldChart
  const yieldChart = await exportYieldChart(fieldId);

  //harvestChart
  const harvestChart = await exportPieChart(fieldId);

  //add into data

  const data = {
    fieldId,
    ndviChart,
    rainfallChart,
    rainfallOnlyChart,
    tempOnlyChart,
    location_info,
    yieldChart,
    harvestChart
  };

  const message = resf.dataResponse({ data, httpCode: 200 });
  res.send(message);
});

app.get('/api/map', async (req, res) => {
  const fieldId = req.query.fieldId;

  const mapArray = await exportMap(fieldId);

  const data = {
    mapArray
  };
  const message = resf.dataResponse({ data, httpCode: 200 });
  res.send(message);
});

app.listen(app.get('port'), () => {
  console.log(`Express server listening on port: ${app.get('port')}`);
});
