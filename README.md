# WeatherFrame

## Overview
WeatherFrame is a web-based application that integrates a Google Slideshow along with real-time local weather information, forecasts, and alerts. The application aggregates data from both the National Weather Service (NWS) and OpenWeatherMap (OWM) APIs to provide a comprehensive weather dashboard.
The application is ideal for lobby displays, showing real-time weather updates alongside a Google Slideshow.

## Features
- Embeds a Google Slideshow on the same page.
- Displays local current weather conditions, forecasts, and alerts.
- Utilizes both NWS and OpenWeatherMap APIs for data collection.
- Allows configuration of latitude, longitude, OWM API key, data refresh rate, and Google Slideshow address.

## Configuration
Place your configuration settings such as latitude, longitude, and OWM API key in the `config.js` file.

## Rate Limitations
- **OpenWeatherMap**: The application is configured to make API requests once every five minutes to adhere to the free tier limit of 1,000 requests per day. Adjust this setting based on your user/display count.
  
- **NWS**: Retrieves alerts every 30 seconds at no cost.

## Data Prioritization
- **Current Weather**: OpenWeatherMap data is prioritized for displaying current weather conditions. This is because NWS data is inconsistenly updated and often with a delay, often resulting in stale data. However, if an OWM API key is invalid or unauthorized, NWS data will be used.
  
- **Forecasts**: NWS data is used for hourly and daily forecasts, as it is updated more frequently than current conditions.

## Installation
To get started with WeatherFrame, follow these simple steps:

1. Download all the files into a single directory on your local machine.
2. Open the config.sample.js and adjust the settings for your needs. Save as config.js OR save and rename the file to config.js
3. Open the HTML file with a web browser of your choice. The application has been tested on Chrome, Firefox, and Edge.

