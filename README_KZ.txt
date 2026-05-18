SPAI92 платформасы — Түп сана + Әсер Толқыны

Ішінде не бар:
1) index.html — басты бет
2) tools.html — цифрлық құралдар беті
3) tup-sana.html — Түп сана, қиялдағы бейнені AI-суретке айналдыру құралы
4) feedback-reactions.html — Әсер Толқыны, пікірлерді emoji реакцияға айналдыру
5) api/tup-sana.js — Vercel үшін серверсіз API функция
6) login.html — Басты бет сілтемесі түзетілді

МАҢЫЗДЫ:
GitHub Pages тек HTML/CSS/JS ашады. Онда OpenAI API key қауіпсіз сақталмайды.
Сондықтан нақты AI сурет жасау үшін ең оңай жол: GitHub + Vercel.

Қосу тәртібі:
1. Осы папканы GitHub repository-ге салыңыз.
2. Vercel.com сайтына GitHub арқылы кіріңіз.
3. Add New Project → осы repository-ді таңдаңыз.
4. Project Settings → Environment Variables бөліміне кіріңіз.
5. Мына мәнді қосыңыз:
   Name: OPENAI_API_KEY
   Value: өзіңіздің OpenAI API key
6. Deploy басыңыз.
7. Сайт ашылған соң tup-sana.html бетіне кіріңіз.

Қосымша баптаулар:
OPENAI_TEXT_MODEL=gpt-5.5
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_IMAGE_SIZE=1024x1024
OPENAI_IMAGE_QUALITY=low

Ескерту:
API key-ді ешқашан HTML, JS немесе GitHub ішіне жазбаңыз.
Оны тек Vercel Environment Variables ішіне қойыңыз.

Егер API key қойылмаса:
Түп сана беті бұзылмайды, демо визуал шығарады. Бірақ нақты AI сурет болмайды.
