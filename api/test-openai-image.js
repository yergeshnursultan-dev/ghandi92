const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

module.exports = async function handler(req, res) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.end(`
        <h1>OPENAI_API_KEY табылмады</h1>
        <p>Vercel Environment Variables ішіне OPENAI_API_KEY қойылмаған.</p>
      `);
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1-mini',
        prompt: 'A small cute blue robot standing on a white background, clean digital illustration, no text, no logo',
        size: process.env.OPENAI_IMAGE_SIZE || '1024x1024',
        quality: process.env.OPENAI_IMAGE_QUALITY || 'low',
        output_format: 'webp',
        output_compression: 70,
        n: 1
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      res.statusCode = response.status;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.end(`
        <h1>OpenAI API қатесі</h1>
        <p><b>Status:</b> ${response.status}</p>
        <pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>
      `);
    }

    const b64 = data?.data?.[0]?.b64_json;

    if (!b64) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.end(`
        <h1>Сурет келмеді</h1>
        <p>OpenAI жауап берді, бірақ b64_json жоқ.</p>
        <pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>
      `);
    }

    const imageDataUrl = `data:image/webp;base64,${b64}`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    return res.end(`
      <!DOCTYPE html>
      <html lang="kk">
      <head>
        <meta charset="UTF-8">
        <title>OpenAI Image Test</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f8fafc;
            padding: 30px;
            color: #0f172a;
          }
          .card {
            max-width: 720px;
            margin: 0 auto;
            background: white;
            border-radius: 24px;
            padding: 24px;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          }
          img {
            width: 100%;
            max-width: 520px;
            border-radius: 20px;
            display: block;
            margin-top: 20px;
          }
          .ok {
            color: #16a34a;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1 class="ok">OpenAI API жұмыс істеп тұр ✅</h1>
          <p>Егер төменде робот суреті шықса, OpenAI key, billing және Vercel env дұрыс.</p>
          <img src="${imageDataUrl}" alt="OpenAI generated test image">
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(`
      <h1>Server error</h1>
      <pre>${escapeHtml(error.message || String(error))}</pre>
    `);
  }
};

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
