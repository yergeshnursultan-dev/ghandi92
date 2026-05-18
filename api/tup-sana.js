const OPENAI_API_URL = 'https://api.openai.com/v1';

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function clean(value, limit = 1200) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function extractText(data) {
  if (!data) return '';
  if (typeof data.output_text === 'string') return data.output_text.trim();
  const parts = [];
  const walk = (node) => {
    if (!node) return;
    if (typeof node === 'string') return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (typeof node === 'object') {
      if (typeof node.text === 'string') parts.push(node.text);
      if (typeof node.output_text === 'string') parts.push(node.output_text);
      if (node.content) walk(node.content);
      if (node.output) walk(node.output);
    }
  };
  walk(data.output || data);
  return parts.join('\n').trim();
}

async function callOpenAI(path, payload) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY қойылмаған');
  const response = await fetch(`${OPENAI_API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = data?.error?.message || `OpenAI API error: ${response.status}`;
    throw new Error(msg);
  }
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, message: 'POST әдісі қажет' });

  try {
    const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const imagination = clean(body.imagination, 1500);
    const mood = clean(body.mood, 120);
    const palette = clean(body.palette, 120);
    const world = clean(body.world, 120);
    const character = clean(body.character, 120);
    const details = clean(body.details, 350);

    if (!imagination || imagination.length < 8) {
      return send(res, 400, { ok: false, message: 'Қиялдағы бейнені толығырақ жазыңыз' });
    }

    const imagePrompt = `Create a highly aesthetic dreamy fantasy illustration, soft pink clouds, luminous pastel atmosphere, elegant school-safe surreal concept art. No text, no letters, no logo, no watermark. Main imagination: ${imagination}. Mood: ${mood}. Color palette: ${palette}. World: ${world}. Character preference: ${character}. Extra details: ${details}. Style: cinematic soft light, glassy glow, magical clouds, gentle composition, beautiful emotional visual, high quality.`;

    const textPrompt = `Пайдаланушы қиялындағы бейнені сипаттады. Сипаттаманы қазақ тілінде бер. Стиль: жылы, жұмсақ, шабыттандыратын, мектепке қауіпсіз. Ешқандай диагноз, медициналық қорытынды, ауыр психологиялық болжам жасама. Тек шығармашылық рефлексия ретінде түсіндір. Міндетті бөлімдер: 1) Қиялдағы негізгі образ, 2) Түстер мен көңіл күй, 3) Шығармашылық мінездеме, 4) Қысқа шабытты қорытынды.\n\nҚиял мәтіні: ${imagination}\nКөңіл күйі: ${mood}\nТүс: ${palette}\nӘлем: ${world}\nКейіпкер: ${character}\nДеталь: ${details}`;

    const textModel = process.env.OPENAI_TEXT_MODEL || 'gpt-5.5';
    const imageModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
    const imageSize = process.env.OPENAI_IMAGE_SIZE || '1024x1024';
    const imageQuality = process.env.OPENAI_IMAGE_QUALITY || 'low';

    const [imageData, textData] = await Promise.all([
      callOpenAI('/images/generations', {
        model: imageModel,
        prompt: imagePrompt,
        size: imageSize,
        quality: imageQuality,
        output_format: 'png',
        n: 1
      }),
      callOpenAI('/responses', {
        model: textModel,
        input: textPrompt,
        max_output_tokens: 650
      })
    ]);

    const b64 = imageData?.data?.[0]?.b64_json;
    const description = extractText(textData) || 'Қиял бейнесі жұмсақ, арманшыл және шығармашылық бағытта сипатталады.';

    if (!b64) throw new Error('Сурет base64 форматында келмеді');

    return send(res, 200, {
      ok: true,
      imageDataUrl: `data:image/png;base64,${b64}`,
      description: description.replace(/\n/g, '<br>')
    });
  } catch (error) {
    return send(res, 500, { ok: false, message: error.message || 'Қате пайда болды' });
  }
};
