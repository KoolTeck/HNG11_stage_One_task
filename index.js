require("dotenv").config();
const express = require("express");
const app = express();
const axios = require("axios");

function getClientIp(req) {
  return (
    req.connection.remoteAddress || // Direct connection
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress
  );
}

const IpgeolocationKey = process.env.IpgeolocationKey;
const url = `https://api.ipgeolocation.io/ipgeo`;

const OpenWeatherKey = process.env.OpenWeatherKey;

const weatherUrl = `https://api.openweathermap.org/data/2.5/weather`;

/**
 * 
 * @param {*} ipAddress 
 * @returns users location details based on there IP
 */
async function getLocation(ipAddress) {
  try {
    const response = await axios.get(url, {
      params: {
        apiKey: IpgeolocationKey,
        ipAddress: ipAddress,
        fields: "geo",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching location and weather:", error);
  }
}

/**
 * 
 * @param {*} latitude  
 * @param {*} longitude 
 * @returns weather infomation based on latitude and longitude
 */
async function getWeather(latitude, longitude) {
  try {
    const response = await axios.get(weatherUrl, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: OpenWeatherKey,
        units: "metric", 
      },
    });

    const { main, weather } = response.data;
    const temperature = main.temp;
    const weatherDescription = weather[0].description;
    return { temperature, weatherDescription };
  } catch (error) {
    console.error("Error fetching weather:", error);
    return null;
  }
}

const SERVER_PORT = 3000;
app.get("/app/hello", async (req, res) => {
  const clientIp = getClientIp(req);
  const visitorName = req.query.visitor_name || "anonymous";
  const locationDetails = await getLocation(clientIp);

  const weatherDetails = await getWeather(
    locationDetails.latitude,
    locationDetails.longitude
  );

  const data = {
    client_ip: locationDetails.ip,
    location: locationDetails.city,
    greeting: `Hello, ${visitorName}!, the temperature is ${weatherDetails.temperature} degrees Celcius in ${locationDetails.city}`,
  };

  res.status(200).json(data);
});

app.listen(SERVER_PORT, () => {
  console.log("app listening on port " + SERVER_PORT);
});
