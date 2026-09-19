import { defaultSchema } from 'rehype-sanitize';

// Preserve only Horizon's prefixed anchors, avoiding arbitrary DOM names/IDs.
export const newsMarkdownSchema = {
  ...defaultSchema,
  clobberPrefix: '',
  tagNames: [...(defaultSchema.tagNames || []), 'details', 'summary'],
  attributes: {
    ...defaultSchema.attributes,
    '*': (defaultSchema.attributes?.['*'] || []).filter(attribute => !['id', 'name'].includes(typeof attribute === 'string' ? attribute : attribute[0])),
    a: [...(defaultSchema.attributes?.a || []).filter(attribute => !['id', 'name'].includes(typeof attribute === 'string' ? attribute : attribute[0])), ['id', /^item-[a-z0-9-]+$/] as [string, RegExp]],
  },
};
