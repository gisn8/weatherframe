// Setting global variables
    let testing = 0;

    let cwa; // County Warning Area - the station responsisble for issuing alerts to your county
    let observationURL;
    let forecastURL;
    let countyCode;
    let countyAlertsURL;


// Run on page launch
    document.addEventListener('DOMContentLoaded', async function() {

        // Setting sources
        let data = await fetchNWSData(CONFIG.lat, CONFIG.lon);

        document.getElementById('slideshow').src = CONFIG.googleSlideshowLink;

        // There is a zoom setting difference
        document.getElementById('radar-lg').src = `https://www.rainviewer.com/map.html?loc=${CONFIG.lat},${CONFIG.lon},8&oFa=1&oC=0&oU=0&oCS=1&oF=0&oAP=1&c=3&o=50&lm=1&layer=radar&sm=1&sn=1&hu=false`;
        
        document.getElementById('radar-sm').src = `https://www.rainviewer.com/map.html?loc=${CONFIG.lat},${CONFIG.lon},7&oFa=1&oC=0&oU=0&oCS=1&oF=0&oAP=1&c=3&o=50&lm=1&layer=radar&sm=1&sn=1&hu=false`;

        console.log("RADAR: " + `https://www.rainviewer.com/map.html?loc=${CONFIG.lat},${CONFIG.lon},7&oFa=1&oC=0&oU=0&oCS=1&oF=0&oAP=1&c=3&o=50&lm=1&layer=radar&sm=1&sn=1&hu=false`)


        alertsFromNOAA();

        // // Fetch Alerts
        // if (testing == 0) {
        //     alertsFromNOAA();
        // } else {
        //     mockAlertsFromNOAA();
        // }

        // Fetch Wx Data
        getCurrentWxData();

        console.log("Page event finished.")
    }); // End event listener


// Fetch user forecast and alert URLs.
    async function fetchNWSData(latitude, longitude) {
      
      let url = `https://api.weather.gov/points/${latitude},${longitude}`;
      console.log("Fetching user location URLs from " + url)

      try {
        let response = await fetch(url);
        let data = await response.json();

        cwa = data.properties.cwa;
        observationURL = `https://api.weather.gov/stations/K${cwa}/observations/latest`;
        forecastURL = data.properties.forecast;
        
        // Extract county code from the county URL
        let countyURL = data.properties.county;
        countyCode = countyURL.split('/').pop();
        countyAlertsURL = `https://api.weather.gov/alerts?zone=${countyCode}`;
        
        return {
          cwa,
          observationURL,
          forecastURL,
          countyAlertsURL
        };

      } catch (error) {
        console.error("Failed to fetch NWS data:", error);
        return null;
      }
    }


// Begin clock and handle timestamps
    function formatDateTime(datetime = null, format = "full") {
        let dt = datetime ? new Date(datetime) : new Date();
        let options;

        switch(format) {
            case "full":
                // For the Time and Date clock
                options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', second:'2-digit'};
                break;
            case "dts":
                // For dated timestamps
                options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second:'2-digit'};
                break;
            case "tss":
                // For timestamps w/ seconds
                options = { hour: 'numeric', minute: '2-digit', second:'2-digit' };
                break;
            case "time":
                // For alerts and last updated
                options = { hour: 'numeric', minute: '2-digit' };
                break;
            case "dow":
                // For day of the week
                options = { weekday: 'short' };
                break;
            default:
                throw new Error("Invalid format type");
        }

        return dt.toLocaleString('en-US', options).replace(' at ', ' ');
    }

    function displayDateTime() {
        const dateTimeDiv = document.getElementById('date-time');
        dateTimeDiv.innerHTML = formatDateTime();  // This will include seconds
    }

    displayDateTime();
    setInterval(displayDateTime, 0.02 * 1000); // Updates 50x per second


// Load Alerts!

    function alertsFromNOAA(){
        let url = countyAlertsURL;
        let alerts;
        console.log("County Alerts URL: " + countyAlertsURL)
        
        if (testing == 1) {
            console.log("ALERT Testing Mode: ON")
            alerts = mockData.features
        } else {
            fetchData(url).then(data => {
                alerts = data.features;
            })
        }

        if (alerts) {
            console.log("Alerts found!")

            let formatted_texts = [];
            let currentTime = new Date(); // Current time

            alerts.forEach(alert => {
                let event = alert.properties.event;
                let severity = alert.properties.severity;
                let description = alert.properties.description;
                let alertstart = formatDateTime(alert.properties.onset,"time").toLowerCase();
                let alertexpires = formatDateTime(alert.properties.expires,"time").toLowerCase();
                let alertexpiresDate = new Date(alert.properties.expires); // Convert to Date object for comparison
                let headline = alert.properties.parameters.NWSheadline[0];
                
                // Check if the alert is still active
                if (alertexpiresDate > currentTime) {
                    formatted_texts.push(`<div class="alert-item ${severity.toLowerCase()}-alert">${alertstart} - ${alertexpires} &nbsp &nbsp<b>${headline}</b><br>${description}</div>`);
                    alert.isActive = true;
                } else {
                    alert.isActive = false;
                }
            });

            popAlert(formatted_texts);
            toggleAlertMode(alerts)
        }  
    }

    setInterval(alertsFromNOAA, 30 * 1000); // Refresh data every 30 seconds

    function popAlert(texts) {
        console.log("Populating Alerts")
        // Get a reference to the alerts div
        let alertsDiv = document.querySelector('.alerts');
        alertsDiv.innerHTML = texts.join(""); // Add all the alerts to the div
        
        // Initialize the carousel
        initAlertCarousel(alertsDiv);
    }

    function initAlertCarousel(alertsDiv) {
        let index = 0;
        let alerts = document.querySelectorAll('.alert-item');

        if (!alerts.length) {
            alertsDiv.style.display = 'none';
        } else {
            alertsDiv.style.display = 'block';
            // Display the first alert
            alerts[0].style.display = 'block';

            // Set an interval to cycle through alerts
            setInterval(() => {
                alerts[index].style.display = 'none';
                index = (index + 1) % alerts.length; // Move to the next alert or wrap around
                alerts[index].style.display = 'block';
            }, 5000); // Change alert every 5 seconds. Adjust as needed.
        }
    }

    function toggleAlertMode(alerts) {
        let radar_lg = document.getElementById('radar-lg')
        let slideshow = document.getElementById('slideshow')
        let radar_sm = document.getElementById('radar-sm-container');

        let alertModeOn = false;

        if(alerts.find((alert) => (alert.properties.severity === "Severe" || alert.properties.severity === "Extreme") && alert.isActive == true)) {
            alertModeOn = true;
        }
        
        if (alertModeOn == true) {
            
            radar_lg.style.display = 'block';
            slideshow.style.display = 'none';
            radar_sm.style.display = 'none'
            radar_sm.setAttribute("data-interval", "0");
            radar_sm.setAttribute("include", "false");
            
        } else {

            radar_lg.style.display = 'none';
            slideshow.style.display = 'block';
            radar_sm.style.display = 'block'
            radar_sm.setAttribute("data-interval", "15000");
            radar_sm.setAttribute("include", "true");

        }
    }

    

// Fetch Weather Data
    async function getCurrentWxData() {
        console.log("Fetching Current Weather Data!")

        const now = new Date();
        const minute = now.getMinutes();
        const hour = now.getHours();
        const dow = now.getDay();

        var variables = getVariables();
        
        nws_latest = await fetchData(observationURL)
        
        
        owm_full = await fetchData(`https://api.openweathermap.org/data/3.0/onecall?lat=${variables.lat}&lon=${variables.lon}&appid=${variables.api_key}&units=imperial&lang=en&units=imperial&exclude=minutely`)

        getCurrentConditions(nws_latest, owm_full);
        
        nws_hourly = await fetchData(`${forecastURL}/hourly`)
        getHourlyForecast(nws_hourly, owm_full);
        
        nws_daily = await fetchData(`${forecastURL}`)
        getDailyForecast(nws_daily, owm_full);

    } // End getCurrentWxData

    setInterval(getCurrentWxData, CONFIG.wxRefreshRate * 60 * 1000); // Based on the user settings above.

        // Get API data from URL with retries
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            async function fetchData(apiURL, attempts = 3) {
                let resJSON;
                console.log("Fetching data from " + apiURL);

                for (let i = 0; i < attempts; i++) {
                    try {
                        const response = await fetch(apiURL);
                        if (!response.ok) {
                            if (response.status == 401) {
                                console.log(`Probable API token error`)
                            } else {
                                throw new Error(`HTTP error! Status: ${response.status}`);
                            }                        
                            return null
                        }

                        resJSON = await response.json();
                        return resJSON; // If the response is okay, return the result immediately

                    } catch (error) {
                        console.warn('Attempt', i + 1, 'Error fetching data:', error);

                        // If it's not the last attempt, sleep for 2 seconds before retrying
                        if (i < attempts - 1) {
                            console.log('Retrying in 2 seconds...');
                            await sleep(2000);
                        }
                    }
                }

                console.error('Failed after', attempts, 'attempts.');
                return null;
            }

    // Current Conditions
        function getCurrentConditions(nws, owm) {
            console.log("Refreshed at: " + formatDateTime(new Date(),"dts"))
            // Icon
                //Handled at Hourly; current just hasn't been reliable

            // Temperature
                processWeatherData(
                    nwsValue = nws.properties.temperature.value, 
                    owmValue = owm ? owm["current"]["temp"] : null, 
                    nws_xform = xCtoF, 
                    owm_xform = null,
                    precision = 0,
                    units = "°F", 
                    elementId = 'current_temperature',
                    priority = "owm"
                );

            // Description
                // Handled by Hourly

            // Updated At
            processWeatherData(
                    nwsValue = formatDateTime(nws.properties.timestamp,"tss"), 
                    owmValue = owm ? formatDateTime(new Date(),"tss") : null, 
                    nws_xform = null, 
                    owm_xform = null,
                    precision = null,
                    units = "", 
                    elementId = 'last_updated',
                    priority = "owm"
                );


            // Feels Like
                // console.log("NWS WindChill: " + xCtoF(nws.properties.windChill.value))
                // console.log("NWS HeatIndex: " + xCtoF(nws.properties.heatIndex.value))
                // console.log("OWM FeelsLike: " + owm["current"]["feels_like"])
                processWeatherData(
                    nwsValue = 
                        nws.properties.windChill.value ? nws.properties.windChill.value :
                        nws.properties.heatIndex.value ? nws.properties.heatIndex.value :
                        nws.properties.temperature.value ? nws.properties.temperature.value :
                        null, 
                    owmValue = owm ? owm["current"]["feels_like"] : owm ? owm["current"]["temp"] : null, 
                    nws_xform = xCtoF, 
                    owm_xform = null,
                    precision = 0,
                    units = "°F", 
                    elementId = 'current_feels',
                    priority = "owm"
                );

            // Humidity
                processWeatherData(
                    nwsValue = nws.properties.relativeHumidity.value, 
                    owmValue = owm ? owm["current"]["humidity"] : null, 
                    nws_xform = null, 
                    owm_xform = null,
                    precision = 0,
                    units = "%", 
                    elementId = 'current_humidity',
                    priority = "owm"
                );

            // Clouds
                document.getElementById('current_clouds').innerHTML = owm ? owm["current"]["clouds"]+"%" : "n/a";

            // UV Index
                // document.getElementById('current_uvi').innerHTML = uviLevels(owm["current"]["uvi"]);
                updateUviDisplay(owm ? owm["current"]["uvi"] : "n/a");
                console.log("UVI: " + (owm ? owm["current"]["uvi"] : "n/a"))

            // Visibility
                processWeatherData(
                    nwsValue = nws.properties.visibility.value, 
                    owmValue = owm ? owm["current"]["visibility"] : null, 
                    nws_xform = xMtoMi, 
                    owm_xform = xKMtoMi,
                    precision = 2,
                    units = " mi.", 
                    elementId = 'current_visibility'
                );

            // Wind Speed
                processWeatherData(
                    nwsValue = nws.properties.windSpeed.value, 
                    owmValue = owm ? owm["current"]["wind_speed"] : null, 
                    nws_xform = xKMtoMi, 
                    owm_xform = null,
                    precision = 0,
                    units = "", 
                    elementId = 'current_wind_speed'
                );

            // Wind Gust
                processWeatherData(
                    nwsValue = nws.properties.windGust.value, 
                    owmValue = owm ? owm["current"]["wind_gust"] : null, 
                    nws_xform = xKMtoMi, 
                    owm_xform = null,
                    precision = 0,
                    units = " mph", 
                    elementId = 'current_wind_gust'
                );

            // Wind Direction
                let value;

                // Log the raw wind direction values from each source for debugging purposes
                console.log("NWS Wind Dir: " + nws.properties.windDirection.value);
                console.log("OWM Wind Dir: " + (owm ? owm["current"]["wind_deg"] : "n/a"));

                // Determine the wind direction value source (NWS or OWM)
                value = nws.properties.windDirection.value !== null ? nws.properties.windDirection.value : owm["current"]["wind_deg"], null;

                if (value !== null) {
                    // Convert the degree value to its cardinal direction representation
                    let card = xDegtoCard(value);

                    // Adjust the wind direction to the CSS rotation system.
                    // In the system's convention, 0° points to the right and rotates counter-clockwise.
                    // The CSS rotation system starts from the top, so we adjust for this difference.
                    let cssRotation = 90 - value;
                    if (cssRotation < 0) { cssRotation += 360; }

                    // Update the page with the calculated values
                    document.getElementById("card").innerHTML = card;
                    document.querySelector('.rotate').style.transform = `rotate(${cssRotation}deg)`;
                }

                // Log the final degree value used for debugging purposes
                console.log("Wind Deg: " + value);


            // Rain
            // Rain 1hr
                // NWS makes no distinction on rain and snow. Just precipitation. Very annoying.
            // Snow
            // Snow 1hr
            // Condition ID
            // Main
            
            // Icon
            // Image
            // Image URL
        }

    // Hourly
        function getHourlyForecast(nws, owm) {
            console.log("Loading Current Data")
                // Icon
                    if (nws.properties !== null) {
                        let icon = nws.properties.periods[0].icon.replace("small","large").replace("medium","large").replace(",0","")
                        console.log("  Icon: " + icon)

                        document.getElementById("weather-icon").src = icon;
                    }

                // Description
                    console.log("OWM Desc: " + owm["current"]["weather"][0]["main"])
                    processWeatherData(
                        nwsValue = nws.properties.periods[0].shortForecast, 
                        owmValue = owm ? owm["current"]["weather"][0]["main"] : "n/a", 
                        nws_xform = null, 
                        owm_xform = null,
                        precision = null,
                        units = "", 
                        elementId = 'current_description',
                        priority = 'owm'
                    );
            console.log("Loading Hourly Data")
                let i;
                
                // Probabilty of Precipitation is shown on the icon
                console.log("  Icon")
                    for (i = 1; i < 9; i+=1) {
                        // console.log(i)
                        icon = nws.properties.periods[(i)].icon.replace("medium","small").replace("large","small").replace(",0","")
                        document.getElementById('h' + i + '_icon').src = icon;
                    }
                
                console.log("  Hour")
                    let d;
                    for (i = 1; i < 9; i+=1) {
                        d = new Date(new Date().getTime() + ((60 * 60 * 1000) * i));
                        processWeatherData(
                            nwsValue = formatDateTime(nws.properties.periods[i].startTime,"time"),
                            owmValue = owm ? formatDateTime(d,"time") : "n/a",
                            nws_xform = null, 
                            owm_xform = null,
                            precision = null,
                            units = "", 
                            elementId = 'h' + i + '_hr'
                        );
                    }

                console.log("  Desc")
                    for (i = 1; i < 9; i+=1) {
                        processWeatherData(
                            nwsValue = nws.properties.periods[i].shortForecast,
                            owmValue = owm ? owm["hourly"][i]["weather"][0]["main"] : "n/a",
                            nws_xform = null, 
                            owm_xform = null,
                            precision = null,
                            units = "", 
                            elementId = 'h' + i + '_desc'
                        );
                    }
                
                console.log("  Temp")
                    for (i = 1; i < 9; i+=1) {
                        processWeatherData(
                            nwsValue = nws.properties.periods[i].temperature, // Already in °F
                            owmValue = owm ? owm["hourly"][i]["temp"]["max"] : "n/a",
                            nws_xform = null, 
                            owm_xform = null,
                            precision = 0,
                            units = "", 
                            elementId = 'h' + i + '_temp'
                        );
                    }

                
                
        }

    // Daily
        function getDailyForecast(nws, owm) {
            console.log("Today's High: " + nws.properties.periods[0].temperature)    
            // Today's
                // Hi Temp
                    day0_high_temp = processWeatherData(
                        nwsValue = nws.properties.periods[0].temperature, // Already in °F unlike the current
                        owmValue = owm ? owm["daily"][0]["temp"]["max"] : null, 
                        nws_xform = null, 
                        owm_xform = null,
                        precision = null,
                        units = "°F", 
                        elementId = 'day0_temp_max'
                    );
                // Lo Temp
                    day0_low_temp = processWeatherData(
                        nwsValue = nws.properties.periods[1].temperature, // Already in °F unlike the current
                        owmValue = owm ? owm["daily"][0]["temp"]["min"] : null, 
                        nws_xform = null, 
                        owm_xform = null,
                        precision = null,
                        units = "°F", 
                        elementId = 'day0_temp_min'
                    );
                // Current Outlook
                    current_outlook_timing = processWeatherData(
                        nwsValue = nws.properties.periods[0].name,
                        owmValue = owm ? "Today" : "n/a", 
                        nws_xform = null, 
                        owm_xform = null,
                        precision = null,
                        units = "", 
                        elementId = 'current_outlook_timing'
                    );

                    current_outlook_desc = processWeatherData(
                        nwsValue = nws.properties.periods[0].detailedForecast.replace('.','.<br>'),
                        owmValue = owm ? owm["daily"][0]["summary"] : "n/a", 
                        nws_xform = null, 
                        owm_xform = null,
                        precision = null,
                        units = "", 
                        elementId = 'current_outlook_desc'
                    );


                // Sunrise
                    document.getElementById("day0_sunrise").innerHTML = owm ? formatDateTime(owm["daily"][0]["sunrise"]*1000,"time") : "n/a";
                // Sunset
                    document.getElementById("day0_sunset").innerHTML = owm ? formatDateTime(owm["daily"][0]["sunset"]*1000,"time") : "n/a";
                // Moonrise
                // Moonset
                // Moon Phase
                    document.getElementById("day0_moon_phase").innerHTML = owm ? getMoonPhaseTextWithEmoji(owm["daily"][0]["moon_phase"]) : "n/a";

            console.log("Loading Daily Outlook")
                let i;
                let icon;
                
                
                // Probabilty of Precipitation is shown on the icon
                console.log("  Icon")
                    for (i = 2; i < 12; i+=2) {
                        //console.log(i)
                        icon = nws.properties.periods[(i)].icon.replace("medium","small").replace("large","small").replace(",0","")
                        document.getElementById('d' + (i/2) + '_icon').src = icon;
                    }
                
                console.log("  DOW")
                    let d;
                    for (i = 2; i < 12; i+=2) {
                        d = new Date(new Date().getTime() + ((24 * 60 * 60 * 1000) * (i/2)));

                        processWeatherData(
                            nwsValue = formatDateTime(nws.properties.periods[i].startTime,"dow"),
                            owmValue = owm ? formatDateTime(d,"dow") : "n/a",
                            nws_xform = null, 
                            owm_xform = null,
                            precision = null,
                            units = "", 
                            elementId = 'd' + i/2 + '_dow'
                        );
                    }

                console.log("  Desc")
                    for (i = 2; i < 12; i+=2) {
                        //console.log(owm["daily"][i/2]["weather"][0]["main"])
                        processWeatherData(
                            nwsValue = nws.properties.periods[i].shortForecast,
                            owmValue = owm ? owm["daily"][i/2]["weather"][0]["main"] : "n/a",
                            nws_xform = null, 
                            owm_xform = null,
                            precision = null,
                            units = "", 
                            elementId = 'd' + (i/2) + '_desc'
                        );
                    }
                
                console.log("  Hi Temp")
                    for (i = 2; i < 12; i+=2) {
                        processWeatherData(
                            nwsValue = nws.properties.periods[i].temperature, // Already in °F
                            owmValue = owm ? owm["daily"][i/2]["temp"]["max"] : "n/a",
                            nws_xform = null, 
                            owm_xform = null,
                            precision = 0,
                            units = "", 
                            elementId = 'd' + (i/2) + '_hi'
                        );
                    }
                 
                console.log("  Lo Temp")
                    for (i = 3; i < 12; i+=2) {
                        processWeatherData(
                            nwsValue = nws.properties.periods[i].temperature, // Already in °F
                            owmValue = owm ? owm["daily"][(i-1)/2]["temp"]["min"] : "n/a",
                            nws_xform = null, 
                            owm_xform = null,
                            precision = 0,
                            units = "", 
                            elementId = 'd' + ((i-1)/2) + '_lo'
                        );
                    }
                
                

                console.log("  Name")
                    for (i = 2; i < 12; i++) {
                        processWeatherData(
                            nwsValue = nws.properties.periods[i].name,
                            owmValue = "", 
                            nws_xform = null, 
                            owm_xform = null,
                            precision = null,
                            units = "", 
                            elementId = 'p' + i + '_name'
                        );
                    }

                console.log("  Description")
                    for (i = 2; i < 12; i++) {
                        processWeatherData(
                            nwsValue = nws.properties.periods[i].detailedForecast,
                            owmValue = "", 
                            nws_xform = null, 
                            owm_xform = null,
                            precision = null,
                            units = "", 
                            elementId = 'p' + i + '_desc'
                        );
                    }

        }

    // Process Weather Data
    function processWeatherData(nwsValue, owmValue, nws_xform, owm_xform, precision, units, elementId, priority = "nws") {
        let value;
        if (nwsValue !== null && priority == "nws") {
            value = nws_xform ? nws_xform(nwsValue) : nwsValue;
            value = (precision!== null) ? value.toFixed(precision) + units : value + units;
        } else if (owmValue !== null) {
            value = owm_xform ? owm_xform(owmValue) : owmValue;
            value = (precision!== null && owmValue !== "n/a") ? value.toFixed(precision) + units : value + units;
        } else if (nwsValue !== null) {
            value = nws_xform ? nws_xform(nwsValue) : nwsValue;
            value = (precision!== null) ? value.toFixed(precision) + units : value + units;
        } else {
            value = 'n/a';
        }
        
        document.getElementById(elementId).innerHTML = value;

        return value
    }


// Carousel Controls

    // Radar carousel
        let rd_index = 0;
        let rd_items = document.querySelectorAll('.radar-details-item');

        function initRadarDetailsCarousel() {
            // Hide all items
            rd_items.forEach(item => {
                item.style.display = 'none';
            });

            // Show the current item
            if (rd_items[rd_index].getAttribute('include') == "true") {
                rd_items[rd_index].style.display = 'block';
            }

            // Get the display interval for the current item
            let interval = parseInt(rd_items[rd_index].getAttribute('data-interval'), 10);

            // Update index for the next item, wrap if necessary
            rd_index = (rd_index + 1) % rd_items.length;

            // Set timeout for the next item based on the current item's interval
            setTimeout(initRadarDetailsCarousel, interval);

        }


    // Outlook Carousel
        
        function initOutlookCarousel() {
            let index = 0;
            let outlook_items = document.querySelectorAll('.outlook-item');
            console.log("Outlook items: " + outlook_items.length)
            if (!outlook_items.length) return; // If there are no outlook_items, exit

            // Display the first item
            outlook_items[0].style.display = 'block';

            let carousel = document.getElementById("outlook-cards-carousel");

            // Set an interval to cycle through outlook_items
            setInterval(() => {
                outlook_items[index].style.display = 'none';
                index = (index + 1) % outlook_items.length; // Move to the next item or wrap around
                outlook_items[index].style.display = 'block';                
            }, 8 * 1000); // Change item every x seconds. Adjust as needed.
            


        }


    // Daily Details Carousel
        
        function initDailiesCarousel() {
            let index = 0;
            let dailies = document.querySelectorAll('.dailies-item');

            if (!dailies.length) return; // If there are no dailies, exit

            // Display the first item
            dailies[0].style.display = 'block';

            // Set an interval to cycle through dailies
            setInterval(() => {
                dailies[index].style.display = 'none';
                index = (index + 1) % dailies.length; // Move to the next item or wrap around
                dailies[index].style.display = 'block';
            }, 8 * 1000); // Change item every x seconds. Adjust as needed.
        }


    // Start the carousels
        initRadarDetailsCarousel();
        initOutlookCarousel();
        initDailiesCarousel();

        
// Conversions
    function xCtoF(cTemp) {
        if (cTemp !== null) {
            fTemp = (cTemp * 9/5) + 32;
            return fTemp
        }
        return null
    }

    function xMtoMi(mDist) {
        miDist = (mDist / 1609.34);
        return miDist
    }

    function xKMtoMi(kmDist) {
        mDist = (kmDist / 1000);
        return xMtoMi(mDist)
    }

    function xMMtoIn(mmDist) {
        inDist = (mmDist / 25.4);
        return inDist
    }

    function xDegtoCard(deg) {
        if (deg >= 348.75 || deg < 11.25) return "N";
        if (deg >= 11.25 && deg < 33.75) return "NNE";
        if (deg >= 33.75 && deg < 56.25) return "NE";
        if (deg >= 56.25 && deg < 78.75) return "ENE";
        if (deg >= 78.75 && deg < 101.25) return "E";
        if (deg >= 101.25 && deg < 123.75) return "ESE";
        if (deg >= 123.75 && deg < 146.25) return "SE";
        if (deg >= 146.25 && deg < 168.75) return "SSE";
        if (deg >= 168.75 && deg < 191.25) return "S";
        if (deg >= 191.25 && deg < 213.75) return "SSW";
        if (deg >= 213.75 && deg < 236.25) return "SW";
        if (deg >= 236.25 && deg < 258.75) return "WSW";
        if (deg >= 258.75 && deg < 281.25) return "W";
        if (deg >= 281.25 && deg < 303.75) return "WNW";
        if (deg >= 303.75 && deg < 326.25) return "NW";
        return "NNW";
    }

    function xOWMTimetoLocal(timecode, offset) {
        newtimecode = ((timecode + offset)/86400)+25569
        //return formatDateTime(newtimecode)
        return newtimecode
    }


// Data Display functions
    function getMoonPhaseTextWithEmoji(moonPhase) {

        /* 
        From documentation:

        Moon phase. 
        0 is 'new moon', 
        >0 and <0.25 is 'waxing crescent'
        0.25 is 'first quarter moon' 
        >0.25 and <0.5 is 'waxing gibous'
        0.5 is 'full moon' 
        >0.5 and <0.75 is 'waning gibous'
        0.75 is 'last quarter moon'
        >0.75 and <1 is 'waning crescent'
        1 is 'new moon' 
        */
        
        /*
        if      (moonPhase == 0 || moonPhase == 1)      {return '🌑 new moon 0%';} 
        else if (moonPhase > 0 && moonPhase < 0.25)     {return '🌒 waxing crescent '    + (moonPhase * 2 * 100).toFixed(0) + "%⬆";} 
        else if (moonPhase == 0.25)                     {return '🌓 first quarter moon ' + (moonPhase * 2 * 100).toFixed(0) + "%⬆";} 
        else if (moonPhase > 0.25 && moonPhase < 0.5)   {return '🌔 waxing gibous '      + (moonPhase * 2 * 100).toFixed(0) + "%⬆";}
        else if (moonPhase == 0.5)                      {return '🌕 full moon '          + (moonPhase * 2 * 100).toFixed(0) + "%";} 
        else if (moonPhase > 0.5 && moonPhase < 0.75)   {return '🌖 waning gibous '      + ((1 - moonPhase) * 2 * 100).toFixed(0) + "%⬇";} 
        else if (moonPhase == 0.75)                     {return '🌗 last quarter moon '  + ((1 - moonPhase) * 2 * 100).toFixed(0) + "%⬇";} 
        else if (moonPhase > 0.75)                      {return '🌘 waning crescent '    + ((1 - moonPhase) * 2 * 100).toFixed(0) + "%⬇";}
        */

        if      (moonPhase == 0 || moonPhase == 1)      {return '🌑 0%';} 
        else if (moonPhase > 0 && moonPhase < 0.25)     {return '🌒 ' + (moonPhase * 2 * 100).toFixed(0) + "%⬆";} 
        else if (moonPhase == 0.25)                     {return '🌓 ' + (moonPhase * 2 * 100).toFixed(0) + "%⬆";} 
        else if (moonPhase > 0.25 && moonPhase < 0.5)   {return '🌔 ' + (moonPhase * 2 * 100).toFixed(0) + "%⬆";}
        else if (moonPhase == 0.5)                      {return '🌕 ' + (moonPhase * 2 * 100).toFixed(0) + "%";} 
        else if (moonPhase > 0.5 && moonPhase < 0.75)   {return '🌖 ' + ((1 - moonPhase) * 2 * 100).toFixed(0) + "%⬇";} 
        else if (moonPhase == 0.75)                     {return '🌗 ' + ((1 - moonPhase) * 2 * 100).toFixed(0) + "%⬇";} 
        else if (moonPhase > 0.75)                      {return '🌘 ' + ((1 - moonPhase) * 2 * 100).toFixed(0) + "%⬇";}
    }

    function updateUviDisplay(uvi) {
        // https://www.epa.gov/enviro/uv-index-overview
        
        //if (testing == 1) {uvi = 1;}

        const uviContainer = document.getElementById("uviContainer");
        const uviValue = document.getElementById("uviValue");

        if (uvi == "n/a") {
            uviContainer.style.backgroundColor =  "transparent";
            uviValue.style.color = "white";
        }

        else if (uvi < 2) {
            uviContainer.style.backgroundColor = "green";
            uviValue.style.color = "white";
        } 

        else if (uvi >= 2 && uvi < 3) {
            uviContainer.style.backgroundColor = "greenyellow";
            uviValue.style.color = "black";
        } 

        else if (uvi >= 3 && uvi < 5) {
            uviContainer.style.backgroundColor = "yellow";
            uviValue.style.color = "black";
        } 

        else if (uvi >= 5 && uvi < 6) {
            uviContainer.style.backgroundColor = "gold";
            uviValue.style.color = "black";
        } 

        else if (uvi >= 6 && uvi < 7) {
            uviContainer.style.backgroundColor = "orange";
            uviValue.style.color = "black";
        } 

        else if (uvi >= 7 && uvi < 8) {
            uviContainer.style.backgroundColor = "orangered";
            uviValue.style.color = "white";
        } 

        else if (uvi >= 8 && uvi < 10) {
            uviContainer.style.backgroundColor = "red";
            uviValue.style.color = "white";
        } 

        else if (uvi >= 10 && uvi < 11) {
            uviContainer.style.backgroundColor = "maroon";
            uviValue.style.color = "white";
        } 

        else {
            uviContainer.style.backgroundColor = "darkmagenta";
            uviValue.style.color = "white";
        }

        uviValue.innerHTML = uvi;
    }


// Bringing in sensitive variables from config file.
    function getVariables() {
      var variables = {
        lat: CONFIG.lat,
        lon: CONFIG.lon,
        api_key: CONFIG.api_key
      };
      return variables
    }
