require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MIN_FORM_TIME_MS = 2000;

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.SITE_ORIGIN,
  'https://petruha19.ru',
  'https://www.petruha19.ru',
].filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS blocked'));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }),
);

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/site', express.static(path.join(__dirname, 'site')));

const requiredEnv = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'TO_EMAIL',
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length) {
  console.error(`Отсутствуют переменные окружения: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: String(process.env.SMTP_SECURE) === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Слишком много заявок. Попробуйте чуть позже.',
  },
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PETRUHA19 server is running',
  });
});

function checkOrigin(req, res, next) {
  const origin = req.headers.origin;

  if (!origin) return next();

  if (allowedOrigins.includes(origin)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied',
  });
}

app.post('/api/send', checkOrigin, sendLimiter, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Некорректный запрос.',
      });
    }

    const formTime = Number(req.body.form_time || 0);

    if (!formTime || Date.now() - formTime < MIN_FORM_TIME_MS) {
      return res.status(400).json({
        success: false,
        message: 'Попробуйте отправить форму чуть позже.',
      });
    }

    const website = cleanText(req.body.website, 100);

    if (website) {
      return res.status(200).json({
        success: true,
        message: 'Заявка отправлена.',
      });
    }

    const name = cleanText(req.body.name, 80);
    const phone = cleanText(req.body.phone, 40);
    const service = cleanText(req.body.service, 120);
    const car = cleanText(req.body.car, 120);
    const message = cleanText(req.body.message, 900);
    const page = cleanText(req.body.page, 200);

    const phoneDigits = normalizePhoneDigits(phone);

    if (!name || name.length < 2 || name.length > 80) {
      return res.status(400).json({
        success: false,
        message: 'Введите корректное имя.',
      });
    }

    if (phoneDigits.length !== 11 || !/^7\d{10}$/.test(phoneDigits)) {
      return res.status(400).json({
        success: false,
        message: 'Введите корректный номер телефона в формате +7.',
      });
    }

    if (!service || service.length < 2 || service.length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Выберите услугу.',
      });
    }

    if (car.length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Название автомобиля слишком длинное.',
      });
    }

    if (message.length > 900) {
      return res.status(400).json({
        success: false,
        message: 'Комментарий слишком длинный. Максимум 900 символов.',
      });
    }

    const formattedPhone = formatPhone(phoneDigits);
    const telLink = makeTelLink(phoneDigits);

    const createdAt = new Date().toLocaleString('ru-RU', {
      timeZone: 'Asia/Krasnoyarsk',
    });

    const text = `
Новая заявка с сайта PETRUHA19

Имя: ${name}
Телефон: ${formattedPhone}
Услуга: ${service}
Автомобиль: ${car || '—'}
Комментарий: ${message || '—'}
Страница: ${page || '—'}
Дата заявки: ${createdAt}
        `.trim();

    const html = buildEmailTemplate({
      name,
      formattedPhone,
      telLink,
      service,
      car: car || '—',
      message: message || '—',
      page: page || '—',
      createdAt,
    });

    await transporter.sendMail({
      from: `"PETRUHA19 сайт" <${process.env.SMTP_USER}>`,
      to: process.env.TO_EMAIL,
      subject: `Заявка PETRUHA19: ${service}`,
      text,
      html,
    });

    return res.status(200).json({
      success: true,
      message: 'Спасибо! Заявка отправлена, мы скоро свяжемся с вами.',
    });
  } catch (error) {
    console.error('Ошибка отправки заявки:', error);

    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера. Попробуйте ещё раз чуть позже.',
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/portfolio.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portfolio.html'));
});

app.get('/contacts.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contacts.html'));
});

app.get('/privacy-policy.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy-policy.html'));
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

transporter.verify((error) => {
  if (error) {
    console.error('Ошибка подключения к SMTP:', error);
  } else {
    console.log('SMTP готов к отправке писем');
  }
});

app.listen(PORT, () => {
  console.log(`PETRUHA19 server started: http://localhost:${PORT}`);
});

function cleanText(value, maxLength = 500) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizePhoneDigits(phone) {
  let digits = String(phone || '')
    .replace(/\D/g, '')
    .slice(0, 11);

  if (digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  }

  if (!digits.startsWith('7') && digits.length > 0) {
    digits = '7' + digits.slice(0, 10);
  }

  return digits;
}

function formatPhone(phoneDigits) {
  return `+7 (${phoneDigits.slice(1, 4)}) ${phoneDigits.slice(4, 7)}-${phoneDigits.slice(7, 9)}-${phoneDigits.slice(9, 11)}`;
}

function makeTelLink(phoneDigits) {
  return `+7${phoneDigits.slice(1)}`;
}

function emailRow(label, value) {
  return `
<tr>
<td style="padding:12px 0 4px; color:#8a8a8a; font-size:12px; text-transform:uppercase; letter-spacing:1px;">
${escapeHtml(label)}
</td>
</tr>
<tr>
<td style="padding:4px 0 16px; font-size:18px; font-weight:700; color:#ffffff; line-height:1.5;">
${value}
</td>
</tr>
`;
}

function buildEmailTemplate({
  name,
  formattedPhone,
  telLink,
  service,
  car,
  message,
  page,
  createdAt,
}) {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Новая заявка PETRUHA19</title>
</head>

<body style="margin:0; padding:0; background:#050505; font-family:Arial, sans-serif; color:#ffffff;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#050505; padding:32px 12px;">
<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0" style="
  max-width:640px;
  background:#111111;
  border:1px solid rgba(245,180,0,0.24);
  border-radius:20px;
  overflow:hidden;
">

<tr>
<td style="
  padding:32px;
  background:linear-gradient(135deg,#181818 0%,#070707 100%);
  border-bottom:3px solid #f5b400;
">

<div style="
  font-size:12px;
  letter-spacing:3px;
  text-transform:uppercase;
  color:#f5b400;
  margin-bottom:10px;
">
PETRUHA19 / ЗАЯВКА
</div>

<h1 style="
  margin:0;
  font-size:28px;
  line-height:1.2;
  text-transform:uppercase;
">
Новая заявка<br>
<span style="color:#f5b400;">на кузовные работы</span>
</h1>

<p style="
  margin:14px 0 0;
  color:#a0a0a0;
  font-size:14px;
  line-height:1.6;
">
Клиент оставил заявку с формы на сайте PETRUHA19.
</p>

</td>
</tr>

<tr>
<td style="padding:28px 32px;">

<table width="100%" cellpadding="0" cellspacing="0">

${emailRow('Имя', escapeHtml(name))}

${emailRow(
  'Телефон',
  `<a href="tel:${escapeHtml(telLink)}" style="color:#f5b400; text-decoration:none;">${escapeHtml(formattedPhone)}</a>`,
)}

${emailRow('Услуга', escapeHtml(service))}

${emailRow('Автомобиль', escapeHtml(car))}

${emailRow('Комментарий', escapeHtml(message))}

${emailRow('Страница', escapeHtml(page))}

${emailRow('Дата заявки', escapeHtml(createdAt))}

</table>

</td>
</tr>

<tr>
<td style="
  padding:24px 32px;
  background:#0b0b0b;
  border-top:1px solid rgba(255,255,255,0.06);
">

<a href="tel:${escapeHtml(telLink)}" style="
  display:inline-block;
  padding:14px 22px;
  background:#f5b400;
  color:#ffffff;
  text-decoration:none;
  border-radius:10px;
  font-weight:700;
  text-transform:uppercase;
">
Позвонить клиенту
</a>

<p style="
  margin:16px 0 0;
  color:#666666;
  font-size:12px;
  line-height:1.5;
">
Письмо автоматически отправлено с сайта PETRUHA19.
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;
}
