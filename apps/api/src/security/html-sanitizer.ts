import sanitizeHtmlLibrary from 'sanitize-html';

const richTextOptions: sanitizeHtmlLibrary.IOptions = {
  allowedTags: [
    ...sanitizeHtmlLibrary.defaults.allowedTags,
    'h1',
    'h2',
    'img',
    'figure',
    'figcaption',
    'span',
  ],
  allowedAttributes: {
    '*': ['class'],
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  transformTags: {
    a: (_tagName, attribs) => ({
      tagName: 'a',
      attribs: {
        ...attribs,
        ...(attribs.target === '_blank' ? { rel: 'noopener noreferrer' } : {}),
      },
    }),
  },
};

const headlineOptions: sanitizeHtmlLibrary.IOptions = {
  allowedTags: ['br', 'span'],
  allowedAttributes: { span: ['class'] },
  disallowedTagsMode: 'discard',
};

export function sanitizeRichHtml(value: string): string {
  return sanitizeHtmlLibrary(value, richTextOptions);
}

export function sanitizeHeadlineHtml(value: string): string {
  return sanitizeHtmlLibrary(value, headlineOptions);
}
