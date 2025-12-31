import { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Config API called');
  console.log('MAPBOX_ACCESS_TOKEN:', process.env.MAPBOX_ACCESS_TOKEN ? 'Set' : 'Not set');
  
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const response = {
    mapboxToken: process.env.MAPBOX_ACCESS_TOKEN || '',
    debug: {
      hasToken: !!process.env.MAPBOX_ACCESS_TOKEN,
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    }
  };
  
  console.log('Sending response:', response);
  
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json(response);
}
