export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const KEY_ID     = process.env.RAZORPAY_KEY_ID;
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  if (!KEY_ID || !KEY_SECRET) {
    return res.status(500).json({ error: 'Razorpay credentials not configured on server.' });
  }

  const { amount } = req.body || {};

  if (!amount || Number(amount) < 100) {
    return res.status(400).json({ error: 'Amount must be at least ₹1 (100 paise).' });
  }

  try {
    const auth    = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
    const receipt = `rcpt_${Date.now()}`;

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method:  'POST',
      headers: {
        Authorization:  `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount:   Number(amount),
        currency: 'INR',
        receipt,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.description || 'Failed to create Razorpay order.' });
    }

    return res.status(200).json({
      order_id: data.id,
      amount:   data.amount,
      currency: data.currency,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
