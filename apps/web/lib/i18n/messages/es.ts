export const esMessages = {
  app: {
    title: "ArtSite",
    description: "Sitio editorial de arte con edición visual inline."
  },
  locale: {
    label: "Idioma",
    switchTo: "Cambiar idioma a {language}"
  },
  header: {
    kicker: "Raw editorial / live publishing",
    primaryNav: "Navegación principal"
  },
  auth: {
    eyebrow: "Acceso admin",
    title: "El modo editor se abre solo después del inicio de sesión del administrador.",
    description: "Usa la contraseña de .env para desbloquear la edición inline directamente en la página en vivo.",
    passwordLabel: "contraseña de admin",
    passwordPlaceholder: "Introduce la contraseña de admin",
    submit: "Entrar al editor",
    missingSetup:
      "Añade ADMIN_PASSWORD a .env, reinicia Docker y vuelve a iniciar sesión.",
    passwordRequired: "Introduce la contraseña de administrador para continuar.",
    invalidPassword: "La contraseña es incorrecta.",
    missingPassword: "ADMIN_PASSWORD todavía no está configurada en el entorno."
  },
  notFound: {
    title: "Esta página no está en el archivo.",
    description:
      "Más adelante, el sistema en vivo cargará las páginas reales desde la base de datos. Por ahora, vuelve a la página principal.",
    returnHome: "Volver al inicio"
  },
  editor: {
    mode: "Modo editor",
    published: "Publicado",
    dirty: "Cambios de borrador sin publicar",
    ready: "Listo para editar",
    draftReady: "Borrador listo.",
    unpublishedChanges: "Cambios sin publicar",
    createPage: "Crear página",
    saveDraft: "Guardar borrador",
    publish: "Publicar",
    signOut: "Cerrar sesión",
    leaveEditor: "Salir del editor",
    pageLabel: "Página: {title}",
    savedAt: "Guardado a las {time}",
    creatingPage: "Creando página...",
    pageCreateFailed: "No se pudo crear la página.",
    pageCreated: 'Página "{title}" creada.',
    savingDraft: "Guardando borrador...",
    draftSaveFailed: "No se pudo guardar el borrador.",
    draftSaved: "Borrador guardado.",
    publishing: "Publicando...",
    publishFailed: "No se pudo publicar.",
    publishedDone: "Publicado.",
    uploadingImage: "Subiendo imagen...",
    uploadFailed: "No se pudo subir la imagen.",
    imageUploaded: "Imagen subida. Guarda el borrador para conservar el cambio.",
    newPageTitle: "Nueva página"
  },
  editorPanel: {
    title: "Editor",
    emptyDescription:
      "Selecciona un bloque para editar sus campos estructurados. Las plantillas mantienen la página visualmente estable.",
    pages: "Páginas",
    dataOnly:
      "Solo editas los datos. La plantilla del bloque y su lógica visual siguen bajo control del diseño."
  },
  blockActions: {
    edit: "Editar",
    moveUp: "Subir",
    moveDown: "Bajar",
    duplicate: "Duplicar",
    hide: "Ocultar",
    show: "Mostrar",
    remove: "Eliminar",
    replaceImage: "Reemplazar imagen",
    hiddenInPublishedView: "Este bloque está oculto en la vista publicada."
  },
  insert: {
    addAbove: "Añadir bloque arriba"
  },
  quickInsert: {
    sectionHeader: "Sección",
    richText: "Texto",
    image: "Imagen",
    imageText: "Imagen + texto",
    gallery: "Galería",
    worksGrid: "Obras",
    seriesGrid: "Series",
    quote: "Cita",
    linksList: "Enlaces",
    cta: "CTA",
    contact: "Contacto",
    divider: "Divisor"
  },
  blockLabels: {
    hero: "Hero",
    richText: "Texto enriquecido",
    image: "Imagen",
    imageText: "Imagen + texto",
    gallery: "Galería",
    quote: "Cita",
    sectionHeader: "Encabezado de sección",
    divider: "Divisor",
    about: "Acerca de",
    contact: "Contacto",
    worksGrid: "Cuadrícula de obras",
    seriesGrid: "Cuadrícula de series",
    linksList: "Lista de enlaces",
    cta: "CTA"
  },
  fieldLabels: {
    title: "Título",
    text: "Texto",
    subtitle: "Subtítulo",
    eyebrow: "Eyebrow",
    image: "Imagen",
    buttonText: "Texto del botón",
    buttonLink: "Enlace del botón",
    caption: "Pie",
    alt: "Texto alt",
    displayMode: "Modo de visualización",
    imagePosition: "Posición de la imagen",
    items: "Elementos",
    layout: "Layout",
    quote: "Cita",
    author: "Autor",
    description: "Descripción",
    style: "Estilo",
    spacing: "Espaciado",
    email: "Email",
    phone: "Teléfono",
    socialLinks: "Redes sociales",
    sourceMode: "Fuente",
    itemIds: "Elementos",
    columns: "Columnas",
    align: "Alineación",
    width: "Ancho",
    links: "Enlaces"
  },
  fieldOptions: {
    left: "Izquierda",
    center: "Centro",
    right: "Derecha",
    content: "Contenido",
    wide: "Ancho",
    fit: "Ajustar",
    cover: "Cubrir",
    original: "Original",
    grid: "Cuadrícula",
    masonry: "Masonry",
    carousel: "Carrusel",
    line: "Línea",
    space: "Espacio",
    ornament: "Ornamento",
    compact: "Compacto",
    normal: "Normal",
    loose: "Amplio",
    manual: "Manual",
    query: "Consulta"
  },
  media: {
    heroImage: "Imagen principal",
    image: "Imagen",
    galleryItem: "Elemento de galería"
  }
} as const;
