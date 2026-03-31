export const ruMessages = {
  app: {
    title: "ArtSite",
    description: "Редакционный арт-сайт со встроенным визуальным редактированием."
  },
  locale: {
    label: "Язык",
    switchTo: "Переключить язык на {language}"
  },
  header: {
    kicker: "Raw editorial / live publishing",
    primaryNav: "Основная навигация"
  },
  auth: {
    eyebrow: "Доступ администратора",
    title: "Режим редактора открывается только после входа администратора.",
    description: "Используйте пароль из .env, чтобы открыть inline-редактирование прямо на живой странице.",
    passwordLabel: "пароль администратора",
    passwordPlaceholder: "Введите пароль администратора",
    submit: "Войти в редактор",
    missingSetup:
      "Добавьте ADMIN_PASSWORD в .env, перезапустите Docker и попробуйте войти снова.",
    passwordRequired: "Введите пароль администратора, чтобы продолжить.",
    invalidPassword: "Неверный пароль.",
    missingPassword: "Переменная ADMIN_PASSWORD еще не настроена в окружении."
  },
  notFound: {
    title: "Этой страницы нет в архиве.",
    description:
      "Позже живая система будет открывать реальные страницы из базы данных. Пока вернитесь на главную.",
    returnHome: "Вернуться на главную"
  },
  editor: {
    mode: "Режим редактора",
    published: "Опубликовано",
    dirty: "Есть черновые изменения",
    ready: "Можно редактировать",
    draftReady: "Черновик готов.",
    unpublishedChanges: "Изменения не опубликованы",
    createPage: "Создать страницу",
    saveDraft: "Сохранить черновик",
    publish: "Опубликовать",
    signOut: "Выйти",
    leaveEditor: "Выйти из редактора",
    pageLabel: "Страница: {title}",
    savedAt: "Сохранено в {time}",
    creatingPage: "Создаем страницу...",
    pageCreateFailed: "Не удалось создать страницу.",
    pageCreated: 'Страница "{title}" создана.',
    savingDraft: "Сохраняем черновик...",
    draftSaveFailed: "Не удалось сохранить черновик.",
    draftSaved: "Черновик сохранен.",
    publishing: "Публикуем...",
    publishFailed: "Не удалось опубликовать.",
    publishedDone: "Опубликовано.",
    uploadingImage: "Загружаем изображение...",
    uploadFailed: "Не удалось загрузить изображение.",
    imageUploaded: "Изображение загружено. Сохраните черновик, чтобы закрепить изменения.",
    newPageTitle: "Новая страница"
  },
  editorPanel: {
    title: "Редактор",
    emptyDescription:
      "Выберите блок, чтобы изменить его структурированные поля. Шаблоны контролируют композицию и сохраняют визуальную стабильность.",
    pages: "Страницы",
    dataOnly:
      "Редактируются только данные. Шаблон блока и композиция остаются под контролем дизайна."
  },
  blockActions: {
    edit: "Редактировать",
    moveUp: "Переместить вверх",
    moveDown: "Переместить вниз",
    duplicate: "Дублировать",
    hide: "Скрыть",
    show: "Показать",
    remove: "Удалить",
    replaceImage: "Заменить изображение",
    hiddenInPublishedView: "Этот блок скрыт в опубликованной версии."
  },
  insert: {
    addAbove: "Добавить блок выше"
  },
  quickInsert: {
    sectionHeader: "Секция",
    richText: "Текст",
    image: "Изображение",
    imageText: "Изображение + текст",
    gallery: "Галерея",
    worksGrid: "Работы",
    seriesGrid: "Серии",
    quote: "Цитата",
    linksList: "Ссылки",
    cta: "CTA",
    contact: "Контакты",
    divider: "Разделитель"
  },
  blockLabels: {
    hero: "Hero",
    richText: "Текстовый блок",
    image: "Изображение",
    imageText: "Изображение + текст",
    gallery: "Галерея",
    quote: "Цитата",
    sectionHeader: "Заголовок секции",
    divider: "Разделитель",
    about: "О проекте",
    contact: "Контакты",
    worksGrid: "Сетка работ",
    seriesGrid: "Сетка серий",
    linksList: "Список ссылок",
    cta: "CTA"
  },
  fieldLabels: {
    title: "Заголовок",
    text: "Текст",
    subtitle: "Подзаголовок",
    eyebrow: "Надзаголовок",
    image: "Изображение",
    buttonText: "Текст кнопки",
    buttonLink: "Ссылка кнопки",
    caption: "Подпись",
    alt: "Alt-текст",
    displayMode: "Режим отображения",
    imagePosition: "Позиция изображения",
    items: "Элементы",
    layout: "Макет",
    quote: "Цитата",
    author: "Автор",
    description: "Описание",
    style: "Стиль",
    spacing: "Интервал",
    email: "Email",
    phone: "Телефон",
    socialLinks: "Соцсети",
    sourceMode: "Источник",
    itemIds: "Элементы",
    columns: "Колонки",
    align: "Выравнивание",
    width: "Ширина",
    links: "Ссылки"
  },
  fieldOptions: {
    left: "Слева",
    center: "По центру",
    right: "Справа",
    content: "По контенту",
    wide: "Широкий",
    fit: "Вписать",
    cover: "Заполнить",
    original: "Оригинал",
    grid: "Сетка",
    masonry: "Masonry",
    carousel: "Карусель",
    line: "Линия",
    space: "Пустое пространство",
    ornament: "Орнамент",
    compact: "Компактный",
    normal: "Нормальный",
    loose: "Свободный",
    manual: "Вручную",
    query: "По запросу"
  },
  media: {
    heroImage: "Главное изображение",
    image: "Изображение",
    galleryItem: "Элемент галереи"
  }
} as const;
