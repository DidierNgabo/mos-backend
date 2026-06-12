import { DiagnosisCatalogService } from './diagnosis-catalog.service';

describe('DiagnosisCatalogService', () => {
  let service: DiagnosisCatalogService;

  beforeAll(() => {
    service = new DiagnosisCatalogService();
  });

  it('loads the generated ICD-11 catalog', () => {
    expect(service.findByCode('1A00')).toEqual({
      code: '1A00',
      title: 'Cholera',
    });
  });

  it('matches codes case-insensitively', () => {
    expect(service.findByCode('1a00')?.title).toBe('Cholera');
  });

  it('ranks exact and prefix code matches before title matches', () => {
    const result = service.search('1A00', 10);

    expect(result.items[0]).toEqual({ code: '1A00', title: 'Cholera' });
  });

  it('searches titles case-insensitively', () => {
    const result = service.search('cholera', 10);

    expect(result.items).toContainEqual({ code: '1A00', title: 'Cholera' });
  });

  it('caps results at 50', () => {
    expect(service.search('infection', 100).items).toHaveLength(50);
  });
});
