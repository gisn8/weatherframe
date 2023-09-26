var CONFIG = {
  api_key: 'YOUR_API_KEY', // From OpenWeatherMap. No API key needed for NWS data.
  wxRefreshRate: 5, // minutes See note below.
  lat: 'YOUR_LATITUDE',
  lon: 'YOUR_LONGITUDE',
  googleSlideshowLink: "https://docs.google.com/presentation/d/e/2PACX-1vQLulCTr9Rmv0cQx9jqqmsA75G8IFG0t9glwclEfNWAb8bxnRAv7aYTeTq5JR9TMjYmNZMI92rr64ga/embed?start=true&loop=true&delayms=10000&rm=minimal"
};

// Provided link is an example. Replace with your own.
// You will need to share your Google Slideshow by making public. It will provide you with your unique link.

// Be sure the google slideshow link ends with: embed?start=true&loop=true&delayms=10000&rm=minimal
	// These are settings to modify appearance and behavior as you like.
	// start=true to automatically start the slideshow
	// loop=true to restart the slideshow automatically
	// delayms=10000 to show each slide for 10 seconds (10000 milliseconds)
	// rm=minimal to hide the control bar

// The free API key from OpenWeatherMap begins charging above 1,000 calls per day. 
// Consider the number of displays that will be using this application at any given time.
