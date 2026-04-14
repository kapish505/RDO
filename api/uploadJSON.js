export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { PINATA_API_KEY, PINATA_SECRET_API_KEY } = process.env;

  if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: Missing Pinata credentials' });
  }

  try {
    const payload = req.body;

    // We expect the frontend to pass the exact JSON structure for Pinata's pinJSONToIPFS
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_API_KEY
      },
      body: typeof payload === 'string' ? payload : JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Pinata Error Payload:", data);
      return res.status(response.status).json({ error: data.error || 'Failed to upload to Pinata' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying to Pinata:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
