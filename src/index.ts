var fs = require("fs");
const https = require("https");
const config = require("../config.json");

const ssid = config.SSID;
const apiKey = config.API_KEY;

const fileNames = ["en.json", "vi.json", "zh-TW.json", "zh-CN.json"];
var locales = [{}, {}, {}, {}];

// index is sheetId of sheet data
const loadDataSheet = (sheetData: any, index: number) => {
  console.log(sheetData.sheets[index].properties.sheetId);

  return new Promise(() => {
    const url = "https://docs.google.com/spreadsheets/d/";
    const query = `/gviz/tq?gid=${sheetData.sheets[index].properties.sheetId}`;
    const endPoint = `${url}${ssid}${query}`;

    https
      .get(endPoint, (resp: any) => {
        resp.setEncoding("utf8");
        let data = "";
        resp.on("data", (chunk: any) => {
          data += chunk;
        });
        resp.on("end", () => {
          const table = JSON.parse(data.substr(47).slice(0, -2)).table;
          for (let i = 1; i < table.rows.length; i++) {
            const row = table.rows[i].c.slice(0, 5);
            // filter 4 first cols
            const rowWithData = row.map((cell: any) =>
              cell !== null ? cell.v : null
            );
            for (let j = 1; j < rowWithData.length; j++) {
              if (rowWithData[j] !== null)
                Object.assign(locales[j - 1], {
                  [rowWithData[0]]: rowWithData[j],
                });
            }
          }

          // read and update content each locale file
          fileNames.forEach((fileName, index) => {
            fs.readFile(
              `locale/${fileName}`,
              "utf8",
              function readFileCallback(err: any, data: any) {
                if (err) {
                  console.log(err);
                } else {
                  var obj = JSON.parse(data);

                  Object.assign(obj, locales[index]);

                  const json = JSON.stringify(obj);
                  fs.writeFile(
                    `locale/${fileName}`,
                    json,
                    "utf8",
                    function (err: any) {
                      if (err) throw err;
                      console.log("complete");
                    }
                  );
                }
              }
            );
          });
        });
      })
      .on("error", (err: any) => {
        console.log("Error: " + err.message);
      });
  });
};

const loadListSheet = async ({ ssid = "", apiKey = "" }) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${ssid}?key=${apiKey}`;

  https
    .get(url, (resp: any) => {
      let data = "";
      resp.on("data", (chunk: any) => {
        data += chunk;
      });

      resp.on("end", () => {
        // change sheet Id
        loadDataSheet(JSON.parse(data), 3);
      });
    })
    .on("error", (err: any) => {
      console.log(err.message.error.code);
    });
};

loadListSheet({ ssid, apiKey });
