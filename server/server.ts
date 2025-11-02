import express from "express";
import cors from "cors";
import * as pkg from "./tests/getFuelPrice.ts";
const { getFuelPrices } = pkg;

const app = express();
app.use(cors());

app.get("/scrape", async (req, res) => {
  try {
    console.log("Fetching fuel prices...");
    const prices = await getFuelPrices();
    console.log("Fetched fuel prices:", prices);
    res.json(prices);
  } catch (error) {
    res.status(500).json({
      error: "An error occurred while fetching Real Time Data.",
      message: `Error details: ${error}`,
    });
  }
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API listening on port ${PORT}`);
});
