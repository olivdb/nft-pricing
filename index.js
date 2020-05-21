const express = require("express");
const path = require("path");
const axios = require("axios").default;
const math = require("mathjs");

const PORT = process.env.PORT || 5000;

const app = express()
  .set("port", PORT)
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs");

app.get("/api/pricing", async function (req, res) {
  const { contract, startTime } = req.query;

  const opensea = axios.create({
    baseURL: "https://api.opensea.io/api/v1",
    timeout: 10000,
  });

  const prices = await opensea
    .get("/events", {
      params: {
        only_opensea: false,
        offset: 0,
        limit: 300,
        asset_contract_address: contract,
        event_type: "successful",
        occurred_after: startTime || 0,
      },
    })
    .then((resp) =>
      resp.data.asset_events
        .filter((e) => ["ETH", "WETH"].includes(e.payment_token.symbol))
        .map((e) => e.total_price)
    );

  let data;
  if (prices.length > 0) {
    const [mean, median, std] = [
      math.mean(prices),
      math.median(prices),
      math.std(prices),
    ];
    const [min, max] = [Math.min(...prices), Math.max(...prices)];
    data = {
      mean,
      median,
      std,
      min,
      max,
      currency: "ETH",
      sample_size: prices.length,
    };
  } else {
    data = { error: "no data" };
  }

  res.send(data);
});

app.listen(app.get("port"), function () {
  console.log("Node app is running on port", app.get("port"));
});
