export type CanonicalBlockSeed = {
  type: string;
  data: Record<string, unknown>;
};

export type CanonicalPageSeed = {
  slug: string;
  title: string;
  isHomepage?: boolean;
  blocks: CanonicalBlockSeed[];
};

export const canonicalHomePage: CanonicalPageSeed = {
  slug: 'home',
  title: 'Atelier Notes',
  isHomepage: true,
  blocks: [
    {
      type: 'hero',
      data: {
        eyebrow: 'Editorial practice',
        title: 'Raw surfaces, quiet structure',
        subtitle: 'A minimal, image-led art journal with inline editing for one calm editor.',
        button_text: 'See latest work',
        button_link: '/works',
      },
    },
    {
      type: 'section_header',
      data: {
        eyebrow: 'Featured',
        title: 'Selected pieces',
        description: 'The first fold of the homepage should feel like a cover spread, not a dashboard.',
      },
    },
    {
      type: 'works_grid',
      data: {
        title: 'New works',
        columns: 3,
        works: ['work-001', 'work-002', 'work-003'],
      },
    },
  ],
};

export const canonicalEditorialPage: CanonicalPageSeed = {
  slug: 'journal',
  title: 'Journal',
  blocks: [
    {
      type: 'section_header',
      data: {
        eyebrow: 'Journal',
        title: 'Thoughts, process, references',
        description: 'Shorter text, fewer controls, and a clear editorial hierarchy.',
      },
    },
    {
      type: 'rich_text',
      data: {
        title: 'Studio note',
        text: 'This is the kind of block an editor can safely change in place without touching layout.',
        align: 'left',
        width: 'narrow',
      },
    },
    {
      type: 'image',
      data: {
        image: 'media-001',
        caption: 'Documentary crop for the first post',
        alt: 'Black and white studio photograph',
        displayMode: 'full',
      },
    },
  ],
};
