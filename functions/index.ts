import { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // More robust URL checking for the config endpoint
  const urlPath = req.url || '';
  const isConfigRequest = urlPath.includes('/api/config') || urlPath.includes('/config') || urlPath.endsWith('/config');
  
  if (isConfigRequest) {
    console.log('Config requested, MAPBOX_ACCESS_TOKEN:', process.env.MAPBOX_ACCESS_TOKEN ? 'Set' : 'Not set');
    
    const response = {
      mapboxToken: process.env.MAPBOX_ACCESS_TOKEN || '',
      debug: {
        hasToken: !!process.env.MAPBOX_ACCESS_TOKEN,
        env: process.env.NODE_ENV || 'development',
        url: req.url,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('Sending config response:', response);
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(response);
  }

  // For all other routes, serve a simple HTML response
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Love Letters Globe</title>
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.js"></script>
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css" rel="stylesheet">
    <style>
        body { margin: 0; font-family: Arial, sans-serif; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
        #debug { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px; max-width: 300px; z-index: 1000; font-size: 12px; }
    </style>
</head>
<body>
    <div id="map"></div>
    <div id="debug">Loading...</div>
    
    <script>
        async function initMap() {
            const debugEl = document.getElementById('debug');
            
            try {
                debugEl.innerHTML = 'Fetching config from /api/config...';
                const response = await fetch('/api/config');
                
                console.log('Response status:', response.status);
                console.log('Response headers:', [...response.headers.entries()]);
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const config = await response.json();
                
                debugEl.innerHTML = 'Config received:<br><pre>' + JSON.stringify(config, null, 2) + '</pre>';
                
                if (!config.mapboxToken) {
                    debugEl.innerHTML += '<br><br><strong>ERROR: No Mapbox token found!</strong>';
                    return;
                }
                
                mapboxgl.accessToken = config.mapboxToken;
                
                const map = new mapboxgl.Map({
                    container: 'map',
                    style: 'mapbox://styles/mapbox/dark-v11',
                    projection: 'globe',
                    center: [-30, 30],
                    zoom: 2.5
                });
                
                map.on('load', () => {
                    debugEl.innerHTML += '<br><br><strong>Map loaded successfully!</strong>';
                });
                
                map.on('error', (error) => {
                    debugEl.innerHTML += '<br><br><strong>Map error:</strong> ' + JSON.stringify(error);
                });
                
            } catch (error) {
                console.error('Error:', error);
                debugEl.innerHTML = '<strong>Error:</strong> ' + error.message + '<br><br>Check the browser console for details.';
            }
        }
        
        initMap();
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
}
