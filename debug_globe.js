// Simple test to see if mapbox works
const script = document.createElement('script');
script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.16.0/mapbox-gl.js';
script.onload = () => {
  const link = document.createElement('link');
  link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.16.0/mapbox-gl.css';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
  
  fetch('/api/config')
    .then(r => r.json())
    .then(config => {
      console.log('Token received:', config.mapboxToken ? 'YES' : 'NO');
      mapboxgl.accessToken = config.mapboxToken;
      
      const container = document.createElement('div');
      container.style.cssText = 'width: 400px; height: 300px; position: fixed; top: 0; left: 0; z-index: 9999; background: red;';
      document.body.appendChild(container);
      
      const map = new mapboxgl.Map({
        container: container,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [0, 0],
        zoom: 2
      });
      
      map.on('load', () => {
        console.log('Mapbox loaded successfully!');
      });
      
      map.on('error', (e) => {
        console.error('Mapbox error:', e);
      });
    })
    .catch(err => console.error('API error:', err));
};
document.head.appendChild(script);
