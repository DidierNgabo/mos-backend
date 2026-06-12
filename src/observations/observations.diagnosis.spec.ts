import { BadRequestException } from '@nestjs/common';
import { DiagnosisCatalogService } from './diagnosis-catalog.service';
import { ObservationsService } from './observations.service';

describe('ObservationsService diagnosis handling', () => {
  const mapper = {
    fromCreateDto: jest.fn((dto) => ({ id: 'observation-id', ...dto })),
  };
  const repository = {} as any;
  const entityManager = {
    persist: jest.fn().mockReturnThis(),
    flush: jest.fn().mockResolvedValue(undefined),
  } as any;
  const userRepository = {
    findOne: jest.fn().mockResolvedValue({ id: 'user-id' }),
  } as any;
  const catalog = new DiagnosisCatalogService();
  const service = new ObservationsService(
    mapper as any,
    repository,
    entityManager,
    userRepository,
    catalog,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(service, 'find')
      .mockResolvedValue({ id: 'observation-id' } as any);
  });

  it('replaces a submitted title with the canonical catalog title', async () => {
    await service.createObservation(
      {
        queueEntryId: '45b7b260-8331-4d6b-9e05-61203ae8c10b',
        patientId: '45b7b260-8331-4d6b-9e05-61203ae8c10c',
        stationId: '45b7b260-8331-4d6b-9e05-61203ae8c10d',
        outreachId: '45b7b260-8331-4d6b-9e05-61203ae8c10e',
        chiefComplaint: 'Vomiting',
        diagnosisCode: '1a00',
        diagnosis: 'Untrusted client title',
      },
      'user-id',
    );

    expect(mapper.fromCreateDto).toHaveBeenCalledWith(
      expect.objectContaining({
        diagnosisCode: '1A00',
        diagnosis: 'Cholera',
      }),
    );
  });

  it('keeps a custom diagnosis and clears its code', async () => {
    await service.createObservation(
      {
        queueEntryId: '45b7b260-8331-4d6b-9e05-61203ae8c10b',
        patientId: '45b7b260-8331-4d6b-9e05-61203ae8c10c',
        stationId: '45b7b260-8331-4d6b-9e05-61203ae8c10d',
        outreachId: '45b7b260-8331-4d6b-9e05-61203ae8c10e',
        chiefComplaint: 'Pain',
        diagnosisCode: null,
        diagnosis: '  Local clinical diagnosis  ',
      },
      'user-id',
    );

    expect(mapper.fromCreateDto).toHaveBeenCalledWith(
      expect.objectContaining({
        diagnosisCode: null,
        diagnosis: 'Local clinical diagnosis',
      }),
    );
  });

  it('rejects an unknown ICD-11 code', async () => {
    await expect(
      service.createObservation(
        {
          queueEntryId: '45b7b260-8331-4d6b-9e05-61203ae8c10b',
          patientId: '45b7b260-8331-4d6b-9e05-61203ae8c10c',
          stationId: '45b7b260-8331-4d6b-9e05-61203ae8c10d',
          outreachId: '45b7b260-8331-4d6b-9e05-61203ae8c10e',
          chiefComplaint: 'Pain',
          diagnosisCode: 'NOT-A-CODE',
          diagnosis: 'Unknown',
        },
        'user-id',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an empty custom diagnosis', async () => {
    await expect(
      service.createObservation(
        {
          queueEntryId: '45b7b260-8331-4d6b-9e05-61203ae8c10b',
          patientId: '45b7b260-8331-4d6b-9e05-61203ae8c10c',
          stationId: '45b7b260-8331-4d6b-9e05-61203ae8c10d',
          outreachId: '45b7b260-8331-4d6b-9e05-61203ae8c10e',
          chiefComplaint: 'Pain',
          diagnosisCode: null,
          diagnosis: '   ',
        },
        'user-id',
      ),
    ).rejects.toThrow('Diagnosis is required');
  });
});
