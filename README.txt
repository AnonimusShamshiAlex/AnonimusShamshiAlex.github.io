TAKLIFNOMA — Samandarhon & Zilolahon (22.11.2026, 18:00, Sulola to'yxonasi)

ДЛЯ NETLIFY (рекомендуется, бесплатно):
  1) Залейте ВСЮ папку проекта на GitHub (вместе с папкой netlify, файлами
     netlify.toml, build.js, package.json) и подключите репозиторий в Netlify.
     Настройки сборки Netlify возьмёт из netlify.toml сам.
     ВАЖНО: перетаскивание папки (drag & drop) НЕ подходит — функции не заработают.
  2) Сайт: https://ваш-сайт.netlify.app      Админка: https://ваш-сайт.netlify.app/admin
     Пароль: 1729. Сменить: Site configuration -> Environment variables ->
     ADMIN_PASSWORD, затем сделайте новый деплой.
  3) Ответы гостей хранятся в Netlify Blobs (ничего настраивать не нужно).
  4) Адрес для превью ссылки (картинка в Telegram) подставляется при сборке из
     адреса сайта Netlify. Свой домен: переменная SITE_URL=https://ваш-домен.uz.

ИЛИ НА СВОЁМ СЕРВЕРЕ (Node.js):
ЗАПУСК (нужен Node.js 18+, больше ничего устанавливать не надо):
  1) node server.js          (или: npm start)
  2) Сайт:         http://localhost:3000
     Админ-панель: http://localhost:3000/admin     ПАРОЛЬ: 1729

В АДМИН-ПАНЕЛИ: сколько гостей придёт, кто придёт / не придёт, пожелания,
поиск по имени, фильтр, выгрузка в CSV (Excel), удаление ответа.
Ответы хранятся в файле data/rsvp.json (не удаляйте папку data).

СМЕНИТЬ ПАРОЛЬ (рекомендуется на настоящем хостинге):
  задайте переменную окружения ADMIN_PASSWORD, например:
  ADMIN_PASSWORD=мойпароль node server.js

ХОСТИНГ: нужен хостинг с Node.js (Render, Railway, Fly.io, VPS и т.п.).
  Команда запуска: node server.js   (порт берётся из переменной PORT автоматически).
  Если на хостинге диск стирается при перезапуске, подключите постоянный диск
  и укажите его папку: DATA_DIR=/путь/к/диску
  ВАЖНО: на статическом хостинге (Netlify, GitHub Pages) сайт откроется,
  но ответы гостей и /admin работать НЕ будут — им нужен server.js.

ЧТО МЕНЯТЬ: index.html -> window.INVITE = {...} (тексты, дата, программа,
  Telegram rsvp.telegram = "https://t.me/USERNAME").
  music/muzika.m4a — музыка. styles/maktub/media/ — картинки и видео.

ПРЕВЬЮ ССЫЛКИ (Telegram, WhatsApp и др.):
  при отправке ссылки показывается картинка с конвертом S&Z, заголовок
  «Samandarhon & Zilolahon — Taklifnoma» и подпись «Sizga maktub bor. Muhrni bosib oching.»
  Картинка-открытка (имена, дата, место): styles/maktub/media/og.jpg, размер 1200x630. Адрес сайта в превью подставляется
  автоматически. Если сайт стоит за прокси и адрес неверный, задайте
  SITE_URL=https://ваш-домен.uz
  Если Telegram показывает старое превью, напишите боту @WebpageBot ссылку
  на сайт, он обновит кэш.
