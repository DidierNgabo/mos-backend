import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';
import { ImpactReportQueryDto, PatientHistoryReportQueryDto, ReportQueryDto, StationReportQueryDto } from './dto/report-query.dto';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private parseDate(s?: string): Date | undefined {
    return s ? new Date(s) : undefined;
  }

  @Get('summary')
  @Roles('SUPER_ADMIN')
  async getSummaryReport(@Query() query: ReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportsService.generateSummaryReport(query.outreachId, query.outreachId);
    this.sendFile(res, buffer, `summary-${query.outreachId}`, 'pdf');
  }

  @Get('disease')
  @Roles('SUPER_ADMIN')
  async getDiseaseReport(@Query() query: ReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportsService.generateDiseaseReport(
      query.outreachId,
      query.outreachId,
      query.format,
      this.parseDate(query.startDate),
      this.parseDate(query.endDate),
    );
    this.sendFile(res, buffer, `disease-${query.outreachId}`, query.format);
  }

  @Get('mental-health')
  @Roles('SUPER_ADMIN')
  async getMentalHealthReport(@Query() query: ReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportsService.generateMentalHealthReport(
      query.outreachId,
      query.outreachId,
      this.parseDate(query.startDate),
      this.parseDate(query.endDate),
    );
    this.sendFile(res, buffer, `mental-health-${query.outreachId}`, 'pdf');
  }

  @Get('labs')
  @Roles('SUPER_ADMIN')
  async getLabsReport(@Query() query: ReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportsService.generateLabsReport(
      query.outreachId,
      query.outreachId,
      query.format,
      this.parseDate(query.startDate),
      this.parseDate(query.endDate),
    );
    this.sendFile(res, buffer, `labs-${query.outreachId}`, query.format);
  }

  @Get('doctors')
  @Roles('SUPER_ADMIN')
  async getDoctorsReport(@Query() query: ReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportsService.generateDoctorsReport(
      query.outreachId,
      query.outreachId,
      this.parseDate(query.startDate),
      this.parseDate(query.endDate),
    );
    this.sendFile(res, buffer, `doctors-${query.outreachId}`, 'pdf');
  }

  @Get('pharmacy')
  @Roles('SUPER_ADMIN')
  async getPharmacyReport(@Query() query: ReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportsService.generatePharmacyReport(
      query.outreachId,
      query.outreachId,
      query.format,
      this.parseDate(query.startDate),
      this.parseDate(query.endDate),
    );
    this.sendFile(res, buffer, `pharmacy-${query.outreachId}`, query.format);
  }

  @Get('transfers')
  @Roles('SUPER_ADMIN')
  async getTransfersReport(@Query() query: ReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportsService.generateTransfersReport(
      query.outreachId,
      this.parseDate(query.startDate),
      this.parseDate(query.endDate),
    );
    this.sendFile(res, buffer, `transfers-${query.outreachId}`, 'csv');
  }

  @Get('vitals')
  @Roles('SUPER_ADMIN')
  async getVitalsReport(@Query() query: ReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportsService.generateVitalsReport(
      query.outreachId,
      query.outreachId,
      this.parseDate(query.startDate),
      this.parseDate(query.endDate),
    );
    this.sendFile(res, buffer, `vitals-${query.outreachId}`, 'pdf');
  }

  @Get('impact')
  @Roles('SUPER_ADMIN')
  async getImpactReport(@Query() query: ImpactReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportsService.generateImpactReport(
      query.outreachId,
      this.parseDate(query.startDate),
      this.parseDate(query.endDate),
    );
    this.sendFile(res, buffer, `impact-${query.outreachId}`, 'pdf');
  }

  @Get('screenings')
  @Roles('SUPER_ADMIN', 'OUTREACH_ADMIN')
  async getScreeningsReport(@Query() query: ReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportsService.generateScreeningsReport(
      query.outreachId,
      query.outreachId,
      query.format,
      this.parseDate(query.startDate),
      this.parseDate(query.endDate),
    );
    this.sendFile(res, buffer, `screenings-${query.outreachId}`, query.format);
  }

  @Get('outreach-users')
  @Roles('SUPER_ADMIN', 'OUTREACH_ADMIN')
  async getOutreachUsersReport(@Query() query: ImpactReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportsService.generateOutreachUsersReport(
      query.outreachId,
      this.parseDate(query.startDate),
      this.parseDate(query.endDate),
    );
    this.sendFile(res, buffer, `outreach-users-${query.outreachId}`, 'pdf');
  }

  @Get('station')
  @Roles('SUPER_ADMIN', 'OUTREACH_ADMIN')
  async getStationReport(@Query() query: StationReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportsService.generateStationReport(
      query.stationId,
      query.format,
      this.parseDate(query.startDate),
      this.parseDate(query.endDate),
    );
    this.sendFile(res, buffer, `station-${query.stationId}`, query.format);
  }

  @Get('patient-history')
  @Roles(
    'SUPER_ADMIN',
    'OUTREACH_ADMIN',
    'NURSE',
    'DOCTOR',
    'PHARMACIST',
    'PSYCHOLOGIST',
    'DATA_CLERK',
  )
  async getPatientHistoryReport(
    @Query() query: PatientHistoryReportQueryDto,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generatePatientHistoryReport(
      query.patientId,
    );
    this.sendFile(res, buffer, `patient-history-${query.patientId}`, 'pdf');
  }

  private sendFile(res: Response, buffer: Buffer, filename: string, format: 'pdf' | 'csv') {
    const mime = format === 'csv' ? 'text/csv' : 'application/pdf';
    res.set({
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${filename}.${format}"`,
      'Content-Length': buffer.length,
      'X-Report-Generated-At': new Date().toISOString(),
    });
    res.end(buffer);
  }
}
