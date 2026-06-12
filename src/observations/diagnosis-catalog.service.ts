import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface DiagnosisCatalogItem {
  code: string;
  title: string;
}

interface DiagnosisCatalog {
  metadata: {
    source: string;
    sheet: string;
    version: string;
    generatedAt: string;
    count: number;
  };
  diagnoses: DiagnosisCatalogItem[];
}

@Injectable()
export class DiagnosisCatalogService {
  private readonly catalog: DiagnosisCatalog;
  private readonly diagnosesByCode: Map<string, DiagnosisCatalogItem>;

  constructor() {
    this.catalog = this.loadCatalog();
    this.diagnosesByCode = new Map(
      this.catalog.diagnoses.map((diagnosis) => [
        diagnosis.code.toUpperCase(),
        diagnosis,
      ]),
    );
  }

  findByCode(code: string): DiagnosisCatalogItem | undefined {
    return this.diagnosesByCode.get(code.trim().toUpperCase());
  }

  search(query: string, limit = 30) {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedLimit = Math.min(Math.max(limit, 1), 50);

    const ranked = this.catalog.diagnoses
      .map((diagnosis) => {
        const code = diagnosis.code.toLowerCase();
        const title = diagnosis.title.toLowerCase();
        let rank = -1;

        if (code === normalizedQuery) rank = 0;
        else if (code.startsWith(normalizedQuery)) rank = 1;
        else if (title.startsWith(normalizedQuery)) rank = 2;
        else if (code.includes(normalizedQuery)) rank = 3;
        else if (title.includes(normalizedQuery)) rank = 4;

        return { diagnosis, rank };
      })
      .filter(({ rank }) => rank >= 0)
      .sort(
        (a, b) =>
          a.rank - b.rank || a.diagnosis.title.localeCompare(b.diagnosis.title),
      )
      .slice(0, normalizedLimit)
      .map(({ diagnosis }) => diagnosis);

    return {
      items: ranked,
      query: query.trim(),
      limit: normalizedLimit,
      version: this.catalog.metadata.version,
    };
  }

  private loadCatalog(): DiagnosisCatalog {
    const candidates = [
      join(__dirname, '../assets/icd-11-mms-en.json'),
      join(process.cwd(), 'src/assets/icd-11-mms-en.json'),
      join(process.cwd(), 'dist/assets/icd-11-mms-en.json'),
    ];
    const catalogPath = candidates.find((candidate) => existsSync(candidate));

    if (!catalogPath) {
      throw new InternalServerErrorException(
        'ICD-11 diagnosis catalog is missing',
      );
    }

    return JSON.parse(readFileSync(catalogPath, 'utf8')) as DiagnosisCatalog;
  }
}
