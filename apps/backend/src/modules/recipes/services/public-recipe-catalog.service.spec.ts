import { PublicRecipeCatalogService } from './public-recipe-catalog.service';

describe('PublicRecipeCatalogService', () => {
  const rows = [
    {
      filename: 'recipes/test.html',
      recipe_data: {
        title: 'Test Pasta',
        url: 'https://en.wikibooks.org/wiki/Cookbook:Test_Pasta',
        infobox: { servings: '4', category: '/wiki/Category:Pasta_recipes' },
        text_lines: [
          { line_type: 'p', section: null, text: 'A simple pasta.' },
          { line_type: 'ul', section: 'Ingredients', text: '2 cups pasta' },
          { line_type: 'ul', section: 'Ingredients', text: '1 tbsp olive oil' },
          { line_type: 'ol', section: 'Directions', text: 'Boil the pasta until tender.' },
          { line_type: 'ol', section: 'Directions', text: 'Drain well and toss with olive oil.' },
        ],
      },
    },
  ];

  afterEach(() => jest.restoreAllMocks());

  it('lists parsed public recipes with stable IDs and pagination', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => rows,
    } as Response);

    const service = new PublicRecipeCatalogService();
    const result = await service.list({ page: 1, pageSize: 24 });

    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      id: 'public-recipe-test-pasta',
      name: 'Test Pasta',
      servings: 4,
      verified: true,
      publicSource: 'Wikibooks Cookbook',
    });
  });

  it('returns recipe media from license-allowed Wikibooks files', async () => {
    jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => rows } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ query: { pages: [{ images: [{ title: 'File:Test.jpg' }] }] } }) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: {
            pages: [{
              imageinfo: [{
                url: 'https://example.test/Test.jpg',
                thumburl: 'https://example.test/Test-1200.jpg',
                descriptionurl: 'https://commons.wikimedia.org/wiki/File:Test.jpg',
                mime: 'image/jpeg',
                extmetadata: { LicenseShortName: { value: 'CC BY-SA 4.0' }, Artist: { value: 'Test Artist' } },
              }],
            }],
          },
        }),
      } as Response);

    const service = new PublicRecipeCatalogService();
    const result = await service.get('public-recipe-test-pasta');

    expect(result?.media).toHaveLength(1);
    expect(result?.media[0]).toMatchObject({
      url: 'https://example.test/Test-1200.jpg',
      license: 'CC BY-SA',
      sourceProvider: 'Wikimedia Commons/Wikibooks',
    });
    expect(result?.imageUrl).toBe('https://example.test/Test-1200.jpg');
  });
});
