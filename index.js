require("dotenv").config();
const express = require("express");
const app = express();
const axios = require("axios");

app.set("trust proxy", true);

const proxyDepth = parseInt(process.env.ADAPTABLE_TRUST_PROXY_DEPTH, 10);
if (proxyDepth > 0) {
  // 'trust proxy' is the number of IP addresses to trust in the
  // X-Forwarded-For header, so set to the number of proxies plus one for the
  // client IP address.
  app.set("trust proxy", proxyDepth + 1);
}
function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "8.8.8.8"
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

const SERVER_PORT = process.env.PORT || 3000;
app.get("/app/hello", async (req, res) => {
  const clientIp = getClientIp(req);

  const visitorName = req.query.visitor_name;
  if (!visitorName) {
    res.status(400).json({
      error: "query parameter visitor_name required",
    });
    return;
  } else {
    const locationDetails = await getLocation(clientIp);
    const weatherDetails = await getWeather(
      locationDetails.latitude,
      locationDetails.longitude
    );
    console.log(weatherDetails);

    const data = {
      client_ip: locationDetails.ip,
      location: locationDetails.city,
      greeting: `Hello, ${visitorName}!, the temperature is ${weatherDetails.temperature} degrees Celcius in ${locationDetails.city} seems like ${weatherDetails.weatherDescription}`,
    };

    res.status(200).json(data);
  }
});

app.listen(SERVER_PORT, () => {
  console.log("app listening on port " + SERVER_PORT);
});

module.exports = app;
