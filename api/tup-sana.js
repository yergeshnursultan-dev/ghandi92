const OPENAI_API_URL = 'https://api.openai.com/v1';

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function clean(value, limit = 1200) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function extractText(data) {
  if (!data) return '';

  if (typeof data.output_text === 'string') {
    return data.output_text.trim();
  }

  const parts = [];

  function walk(node) {
    if (!node) return;

    if (typeof node === 'string') {
      parts.push(node);
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    if (typeof node === 'object') {
      if (typeof node.text === 'string') parts.push(node.text);
      if (typeof node.output_text === 'string') parts.push(node.output_text);
      if (node.content) walk(node.content);
      if (node.output) walk(node.output);
    }
  }

  walk(data.output || data);
  return parts.join('\n').trim();
}

async function callOpenAI(path, payload) {
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    throw new Error('OPENAI_API_KEY Vercel Environment Variables ішінде қойылмаған');
  }

  const response = await fetch(`${OPENAI_API_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `OpenAI API қатесі: ${response.status}`;

    throw new Error(message);
  }

  return data;
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    return send(res, 200, {
      ok: true,
      message: 'Tup Sana API жұмыс істеп тұр. Сурет жасау үшін POST сұраныс керек.',
    });
  }

  if (req.method !== 'POST') {
    return send(res, 405, {
      ok: false,
      message: 'POST әдісі қажет',
    });
  }

  try {
    const body =
      typeof req.body === 'object' && req.body
        ? req.body
        : JSON.parse(req.body || '{}');

    const imagination = clean(body.imagination, 1500);
    const mood = clean(body.mood, 120);
    const palette = clean(body.palette, 120);
    const world = clean(body.world, 120);
    const character = clean(body.character, 120);
    const details = clean(body.details, 350);

    if (!imagination || imagination.length < 8) {
      return send(res, 400, {
        ok: false,
        message: 'Қиялдағы бейнені толығырақ жазыңыз',
      });
    }

    const imageModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1-mini';
    const imageSize = process.env.OPENAI_IMAGE_SIZE || '1024x1024';
    const imageQuality = process.env.OPENAI_IMAGE_QUALITY || 'low';
    const textModel = process.env.OPENAI_TEXT_MODEL || 'gpt-5.5';

    const imagePrompt = `
Create a highly aesthetic dreamy fantasy illustration.

Main idea:
${imagination}

Mood:
${mood}

Color palette:
${palette}

World:
${world}

Character:
${character}

Extra details:
${details}

Style requirements:
- school-safe visual
- no text
- no letters
- no logo
- no watermark
- soft light
- dreamy atmosphere
- gentle composition
- pastel colors
- fantasy concept art
- beautiful, emotional, high quality
`;

    const imageData = await callOpenAI('/images/generations', {
      model: imageModel,
      prompt: imagePrompt,
      size: imageSize,
      quality: imageQuality,
      output_format: 'webp',
      output_compression: 70,
      n: 1,
    });

    const b64 = imageData?.data?.[0]?.b64_json;

    if (!b64) {
      throw new Error('OpenAI суретті base64 форматында қайтармады');
    }

    let description =
      'Бұл бейне адамның қиялындағы жұмсақ, арманшыл және шығармашылық ішкі көріністі сипаттайды. Түстер мен образдар көңіл күйді көркем түрде жеткізеді.';

    try {
      const textPrompt = `
Пайдаланушы қиялындағы бейнені сипаттады. 
Қазақ тілінде қысқа, жылы, шығармашылық сипаттама жаз.

Маңызды:
- медициналық диагноз жазба
- ауыр психологиялық қорытынды жасама
- тек шығармашылық рефлексия ретінде түсіндір
- мектепке қауіпсіз стиль болсын

Бөлімдер:
1) Қиялдағы негізгі образ
2) Түстер мен көңіл күй
3) Шығармашылық мінездеме
4) Қысқа шабытты қорытынды

Қиял мәтіні: ${imagination}
Көңіл күйі: ${mood}
Түс: ${palette}
Әлем: ${world}
Кейіпкер: ${character}
Деталь: ${details}
`;

      const textData = await callOpenAI('/responses', {
        model: textModel,
        input: textPrompt,
        max_output_tokens: 650,
      });

      const generatedText = extractText(textData);

      if (generatedText) {
        description = generatedText;
      }
    } catch (textError) {
      description =
        'Сурет сәтті жасалды. Сипаттама генерациясында шағын қате болды, бірақ қиял бейнесі жұмсақ, арманшыл және шығармашылық бағытта көрінеді.';
    }

    return send(res, 200, {
      ok: true,
      imageDataUrl: `data:image/webp;base64,${b64}`,
      description: description.replace(/\n/g, '<br>'),
    });
  } catch (error) {
    return send(res, 500, {
      ok: false,
      message: error.message || 'Қате пайда болды',
    });
  }
};
