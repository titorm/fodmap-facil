/**
 * PDFService - Generates and shares PDF reports
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  createReportError,
  categorizeError,
  ReportErrorType,
  isStorageError,
  isPermissionError,
} from './errors';
import type { FullReportData } from '../../features/reports/types';

export class PDFService {
  /**
   * Generate and share PDF report
   */
  async generateAndSharePDF(reportData: FullReportData): Promise<void> {
    try {
      // Check available storage before generation
      await this.checkAvailableStorage();

      // Generate HTML markup
      const html = this.generateHTMLMarkup(reportData);

      // Generate PDF from HTML
      let uri: string;
      try {
        const result = await Print.printToFileAsync({
          html,
          base64: false,
        });
        uri = result.uri;
      } catch (printError) {
        console.error('PDF generation failed:', printError);

        if (isStorageError(printError)) {
          throw createReportError(
            ReportErrorType.STORAGE_ERROR,
            'Insufficient storage for PDF generation',
            printError instanceof Error ? printError : undefined
          );
        }

        throw createReportError(
          ReportErrorType.PDF_GENERATION_ERROR,
          'Failed to generate PDF',
          printError instanceof Error ? printError : undefined
        );
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        console.error('Sharing not available on this device');
        throw createReportError(
          ReportErrorType.PERMISSION_ERROR,
          'Sharing not available',
          undefined,
          false
        );
      }

      // Open native share dialog
      try {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar Relatório FODMAP',
          UTI: 'com.adobe.pdf',
        });
      } catch (shareError) {
        console.error('Sharing failed:', shareError);

        if (isPermissionError(shareError)) {
          throw createReportError(
            ReportErrorType.PERMISSION_ERROR,
            'Permission denied for sharing',
            shareError instanceof Error ? shareError : undefined
          );
        }

        // Don't throw error if user cancelled sharing
        if (shareError instanceof Error && shareError.message.toLowerCase().includes('cancel')) {
          console.log('User cancelled sharing');
          return;
        }

        throw createReportError(
          ReportErrorType.PDF_GENERATION_ERROR,
          'Failed to share PDF',
          shareError instanceof Error ? shareError : undefined
        );
      }
    } catch (error) {
      console.error('Error in generateAndSharePDF:', error);

      // If it's already a ReportError, rethrow it
      if (error && typeof error === 'object' && 'type' in error && 'userMessage' in error) {
        throw error;
      }

      // Otherwise, categorize and wrap it
      const errorType = categorizeError(error);
      throw createReportError(
        errorType,
        'Failed to generate and share PDF',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if there's enough storage available for PDF generation
   * Requires at least 10MB of free space
   */
  private async checkAvailableStorage(): Promise<void> {
    try {
      const freeDiskStorage = await FileSystem.getFreeDiskStorageAsync();
      const requiredBytes = 10 * 1024 * 1024; // 10MB

      if (freeDiskStorage < requiredBytes) {
        console.error(
          `Insufficient storage: ${freeDiskStorage} bytes available, ${requiredBytes} required`
        );
        throw createReportError(
          ReportErrorType.STORAGE_ERROR,
          'Insufficient storage space',
          undefined,
          false
        );
      }
    } catch (error) {
      // If it's already a ReportError, rethrow it
      if (error && typeof error === 'object' && 'type' in error) {
        throw error;
      }

      // If we can't check storage, log warning but continue
      console.warn('Could not check available storage:', error);
    }
  }

  /**
   * Generate HTML markup for PDF
   */
  generateHTMLMarkup(reportData: FullReportData): string {
    const styles = this.getStyles();
    const header = this.generateHeader(reportData);
    const toleranceSection = this.generateToleranceSection(reportData);
    const historySection = this.generateHistorySection(reportData);
    const timelineSection = this.generateTimelineSection(reportData);
    const metricsSection = this.generateMetricsSection(reportData);
    const footer = this.generateFooter();

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${styles}</style>
        </head>
        <body>
          ${header}
          ${metricsSection}
          ${toleranceSection}
          ${historySection}
          ${timelineSection}
          ${footer}
        </body>
      </html>
    `;
  }

  /**
   * Format date in pt-BR format
   */
  formatDate(date: Date): string {
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  }

  /**
   * Get disclaimer text in Portuguese
   */
  getDisclaimers(): string[] {
    return [
      'Este relatório é apenas para fins informativos e educacionais.',
      'As informações contidas neste relatório não substituem o aconselhamento médico profissional.',
      'Consulte sempre um profissional de saúde qualificado antes de fazer mudanças significativas na sua dieta.',
      'Este aplicativo não é um dispositivo médico e não deve ser usado para diagnóstico ou tratamento de condições médicas.',
    ];
  }

  // Private helper methods for HTML generation

  private getStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #000000;
        background: #FFFFFF;
        padding: 40px;
      }

      h1 {
        font-size: 24pt;
        font-weight: bold;
        color: #333333;
        margin-bottom: 10px;
      }

      h2 {
        font-size: 18pt;
        font-weight: bold;
        color: #333333;
        margin-top: 30px;
        margin-bottom: 15px;
        border-bottom: 2px solid #4CAF50;
        padding-bottom: 5px;
      }

      h3 {
        font-size: 14pt;
        font-weight: bold;
        color: #555555;
        margin-top: 20px;
        margin-bottom: 10px;
      }

      p {
        margin-bottom: 10px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }

      th {
        background-color: #4CAF50;
        color: white;
        font-weight: bold;
        padding: 12px 8px;
        text-align: left;
        border: 1px solid #CCCCCC;
      }

      td {
        padding: 10px 8px;
        border: 1px solid #CCCCCC;
      }

      tr:nth-child(even) {
        background-color: #F9F9F9;
      }

      .header {
        text-align: center;
        margin-bottom: 40px;
        padding-bottom: 20px;
        border-bottom: 3px solid #4CAF50;
      }

      .report-date {
        font-size: 12pt;
        color: #666666;
        margin-top: 5px;
      }

      .user-info {
        font-size: 11pt;
        color: #666666;
        margin-top: 10px;
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin: 20px 0;
      }

      .metric-card {
        background: #F5F5F5;
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid #4CAF50;
      }

      .metric-label {
        font-size: 10pt;
        color: #666666;
        margin-bottom: 5px;
      }

      .metric-value {
        font-size: 18pt;
        font-weight: bold;
        color: #333333;
      }

      .tolerance-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 9pt;
        font-weight: bold;
      }

      .tolerance-tolerated {
        background-color: #C8E6C9;
        color: #2E7D32;
      }

      .tolerance-moderate {
        background-color: #FFE0B2;
        color: #E65100;
      }

      .tolerance-trigger {
        background-color: #FFCDD2;
        color: #C62828;
      }

      .tolerance-untested {
        background-color: #E0E0E0;
        color: #616161;
      }

      .legend {
        margin: 20px 0;
        padding: 15px;
        background: #F5F5F5;
        border-radius: 8px;
      }

      .legend-title {
        font-weight: bold;
        margin-bottom: 10px;
      }

      .legend-item {
        display: inline-block;
        margin-right: 20px;
        margin-bottom: 5px;
      }

      .footer {
        margin-top: 50px;
        padding-top: 20px;
        border-top: 2px solid #CCCCCC;
      }

      .disclaimers {
        background: #FFF9C4;
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid #FBC02D;
        margin-bottom: 20px;
      }

      .disclaimers h3 {
        color: #F57F17;
        margin-top: 0;
      }

      .disclaimer-item {
        margin-bottom: 10px;
        padding-left: 20px;
        position: relative;
      }

      .disclaimer-item:before {
        content: "⚠";
        position: absolute;
        left: 0;
        color: #F57F17;
      }

      .generation-info {
        text-align: center;
        font-size: 9pt;
        color: #999999;
        margin-top: 20px;
      }

      .page-break {
        page-break-after: always;
      }

      .no-data {
        text-align: center;
        padding: 40px;
        color: #999999;
        font-style: italic;
      }
    `;
  }

  private generateHeader(reportData: FullReportData): string {
    return `
      <div class="header">
        <h1>Relatório de Reintrodução FODMAP</h1>
        <p class="report-date">Data de Geração: ${this.formatDate(reportData.reportDate)}</p>
        <p class="user-info">${reportData.userInfo.name}</p>
      </div>
    `;
  }

  private generateToleranceSection(reportData: FullReportData): string {
    const { toleranceProfile } = reportData;

    if (toleranceProfile.summary.testedGroups === 0) {
      return `
        <section id="tolerance-profile">
          <h2>Perfil de Tolerância</h2>
          <div class="no-data">Nenhum grupo FODMAP foi testado ainda.</div>
        </section>
      `;
    }

    const groupNameMap: Record<string, string> = {
      oligosaccharides: 'Oligossacarídeos',
      disaccharides: 'Dissacarídeos',
      monosaccharides: 'Monossacarídeos',
      polyols: 'Polióis',
    };

    const toleranceLabelMap: Record<string, string> = {
      high: 'Tolerado',
      moderate: 'Moderado',
      low: 'Gatilho',
      none: 'Gatilho',
    };

    const toleranceClassMap: Record<string, string> = {
      high: 'tolerance-tolerated',
      moderate: 'tolerance-moderate',
      low: 'tolerance-trigger',
      none: 'tolerance-trigger',
    };

    const tableRows = toleranceProfile.groups
      .map((group) => {
        const groupName = groupNameMap[group.fodmapGroup] || group.fodmapGroup;
        const status = group.status === 'tested' ? 'Testado' : 'Não Testado';

        let toleranceBadge = '';
        if (group.toleranceLevel) {
          const label = toleranceLabelMap[group.toleranceLevel] || 'Desconhecido';
          const cssClass = toleranceClassMap[group.toleranceLevel] || 'tolerance-untested';
          toleranceBadge = `<span class="tolerance-badge ${cssClass}">${label}</span>`;
        } else {
          toleranceBadge = '<span class="tolerance-badge tolerance-untested">Não Testado</span>';
        }

        const testedFoodsList =
          group.testedFoods.length > 0 ? group.testedFoods.map((f) => f.name).join(', ') : '-';

        return `
          <tr>
            <td>${groupName}</td>
            <td>${status}</td>
            <td>${toleranceBadge}</td>
            <td>${testedFoodsList}</td>
          </tr>
        `;
      })
      .join('');

    const legend = `
      <div class="legend">
        <div class="legend-title">Legenda:</div>
        <div class="legend-item">
          <span class="tolerance-badge tolerance-tolerated">Tolerado</span> - Sintomas mínimos ou ausentes
        </div>
        <div class="legend-item">
          <span class="tolerance-badge tolerance-moderate">Moderado</span> - Sintomas leves a moderados
        </div>
        <div class="legend-item">
          <span class="tolerance-badge tolerance-trigger">Gatilho</span> - Sintomas significativos
        </div>
        <div class="legend-item">
          <span class="tolerance-badge tolerance-untested">Não Testado</span> - Ainda não avaliado
        </div>
      </div>
    `;

    return `
      <section id="tolerance-profile">
        <h2>Perfil de Tolerância</h2>
        <p>Resumo dos grupos FODMAP testados e seus níveis de tolerância.</p>
        
        <table>
          <thead>
            <tr>
              <th>Grupo FODMAP</th>
              <th>Status</th>
              <th>Tolerância</th>
              <th>Alimentos Testados</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        ${legend}
      </section>
    `;
  }

  private generateHistorySection(reportData: FullReportData): string {
    const { testHistory } = reportData;

    if (testHistory.length === 0) {
      return `
        <section id="test-history">
          <h2>Histórico de Testes</h2>
          <div class="no-data">Nenhum teste foi realizado ainda.</div>
        </section>
      `;
    }

    const groupNameMap: Record<string, string> = {
      oligosaccharides: 'Oligossacarídeos',
      disaccharides: 'Dissacarídeos',
      monosaccharides: 'Monossacarídeos',
      polyols: 'Polióis',
    };

    const statusLabelMap: Record<string, string> = {
      completed: 'Concluído',
      in_progress: 'Em Andamento',
      scheduled: 'Agendado',
      skipped: 'Ignorado',
    };

    const toleranceLabelMap: Record<string, string> = {
      high: 'Tolerado',
      moderate: 'Moderado',
      low: 'Gatilho',
      none: 'Gatilho',
    };

    const toleranceClassMap: Record<string, string> = {
      high: 'tolerance-tolerated',
      moderate: 'tolerance-moderate',
      low: 'tolerance-trigger',
      none: 'tolerance-trigger',
    };

    const tableRows = testHistory
      .map((test) => {
        const testDate = this.formatDate(test.testDate);
        const groupName = groupNameMap[test.fodmapGroup] || test.fodmapGroup;
        const status = statusLabelMap[test.status] || test.status;

        let resultBadge = '-';
        if (test.toleranceOutcome) {
          const label = toleranceLabelMap[test.toleranceOutcome] || 'Desconhecido';
          const cssClass = toleranceClassMap[test.toleranceOutcome] || 'tolerance-untested';
          resultBadge = `<span class="tolerance-badge ${cssClass}">${label}</span>`;
        }

        const symptomInfo =
          test.symptomCount > 0
            ? `${test.symptomCount} sintoma(s), severidade média: ${test.averageSeverity.toFixed(1)}`
            : 'Sem sintomas';

        const notesRow = test.notes
          ? `
            <tr>
              <td colspan="6" style="background-color: #F5F5F5; font-style: italic; padding-left: 30px;">
                <strong>Observações:</strong> ${test.notes}
              </td>
            </tr>
          `
          : '';

        return `
          <tr>
            <td>${testDate}</td>
            <td>${test.foodName}</td>
            <td>${groupName}</td>
            <td>${status}</td>
            <td>${resultBadge}</td>
            <td>${symptomInfo}</td>
          </tr>
          ${notesRow}
        `;
      })
      .join('');

    return `
      <section id="test-history">
        <h2>Histórico de Testes</h2>
        <p>Registro cronológico de todos os testes de reintrodução realizados.</p>
        
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Alimento</th>
              <th>Grupo FODMAP</th>
              <th>Status</th>
              <th>Resultado</th>
              <th>Sintomas</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </section>
    `;
  }

  private generateTimelineSection(reportData: FullReportData): string {
    const { symptomTimeline } = reportData;

    if (symptomTimeline.entries.length === 0) {
      return `
        <section id="symptom-timeline">
          <h2>Linha do Tempo de Sintomas</h2>
          <div class="no-data">Nenhum sintoma foi registrado ainda.</div>
        </section>
      `;
    }

    const symptomTypeMap: Record<string, string> = {
      abdominal_pain: 'Dor Abdominal',
      bloating: 'Inchaço',
      gas: 'Gases',
      diarrhea: 'Diarreia',
      constipation: 'Constipação',
      nausea: 'Náusea',
      fatigue: 'Fadiga',
      headache: 'Dor de Cabeça',
      other: 'Outro',
    };

    // Generate a simple text-based timeline representation
    const timelineRows = symptomTimeline.entries
      .slice(0, 50) // Limit to 50 entries for PDF readability
      .map((entry) => {
        const date = this.formatDate(entry.date);
        const symptomsText = entry.symptoms
          .map((s) => {
            const symptomName = symptomTypeMap[s.type] || s.type;
            const context = s.testContext ? ` (${s.testContext})` : '';
            return `${symptomName}: ${s.severity}/10${context}`;
          })
          .join(', ');

        return `
          <tr>
            <td>${date}</td>
            <td>${symptomsText}</td>
          </tr>
        `;
      })
      .join('');

    // Generate test markers summary
    const markersHtml =
      symptomTimeline.testMarkers.length > 0
        ? `
        <h3>Marcos de Testes</h3>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Evento</th>
              <th>Alimento</th>
            </tr>
          </thead>
          <tbody>
            ${symptomTimeline.testMarkers
              .map((marker) => {
                const date = this.formatDate(marker.date);
                const eventType =
                  marker.type === 'test_start'
                    ? 'Início do Teste'
                    : marker.type === 'test_end'
                      ? 'Fim do Teste'
                      : 'Período de Washout';
                return `
                  <tr>
                    <td>${date}</td>
                    <td>${eventType}</td>
                    <td>${marker.foodName}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      `
        : '';

    const severityLegend = `
      <div class="legend">
        <div class="legend-title">Escala de Severidade:</div>
        <p>1-3: Leve | 4-6: Moderado | 7-10: Severo</p>
      </div>
    `;

    return `
      <section id="symptom-timeline">
        <h2>Linha do Tempo de Sintomas</h2>
        <p>Registro temporal dos sintomas experimentados durante o protocolo de reintrodução.</p>
        
        ${severityLegend}

        <h3>Sintomas Registrados</h3>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Sintomas e Severidade</th>
            </tr>
          </thead>
          <tbody>
            ${timelineRows}
          </tbody>
        </table>

        ${markersHtml}
      </section>
    `;
  }

  private generateMetricsSection(reportData: FullReportData): string {
    const { metrics } = reportData;

    const startDate = this.formatDate(metrics.protocolStartDate);
    const totalTests = metrics.totalTestsCompleted + metrics.totalTestsInProgress;

    return `
      <section id="metrics">
        <h2>Métricas Gerais</h2>
        <p>Resumo estatístico do seu progresso no protocolo de reintrodução FODMAP.</p>
        
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Testes Concluídos</div>
            <div class="metric-value">${metrics.totalTestsCompleted}</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Testes em Andamento</div>
            <div class="metric-value">${metrics.totalTestsInProgress}</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Grupos Testados</div>
            <div class="metric-value">${metrics.groupsTestedPercentage.toFixed(0)}%</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Severidade Média</div>
            <div class="metric-value">${metrics.averageSymptomSeverity.toFixed(1)}/10</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Duração do Protocolo</div>
            <div class="metric-value">${metrics.protocolDuration} dias</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Data de Início</div>
            <div class="metric-value" style="font-size: 14pt;">${startDate}</div>
          </div>
        </div>

        <h3>Distribuição de Tolerância</h3>
        <table>
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Quantidade</th>
              <th>Percentual</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="tolerance-badge tolerance-tolerated">Tolerado</span></td>
              <td>${metrics.toleratedFoodsCount}</td>
              <td>${totalTests > 0 ? ((metrics.toleratedFoodsCount / totalTests) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td><span class="tolerance-badge tolerance-moderate">Moderado</span></td>
              <td>${metrics.moderateFoodsCount}</td>
              <td>${totalTests > 0 ? ((metrics.moderateFoodsCount / totalTests) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td><span class="tolerance-badge tolerance-trigger">Gatilho</span></td>
              <td>${metrics.triggerFoodsCount}</td>
              <td>${totalTests > 0 ? ((metrics.triggerFoodsCount / totalTests) * 100).toFixed(1) : 0}%</td>
            </tr>
          </tbody>
        </table>
      </section>
    `;
  }

  private generateFooter(): string {
    const disclaimers = this.getDisclaimers();
    const timestamp = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

    const disclaimerItems = disclaimers
      .map(
        (disclaimer) => `
        <div class="disclaimer-item">${disclaimer}</div>
      `
      )
      .join('');

    return `
      <footer class="footer">
        <div class="disclaimers">
          <h3>⚠ Avisos Importantes</h3>
          ${disclaimerItems}
        </div>

        <div class="generation-info">
          <p>Relatório gerado em ${timestamp}</p>
          <p>FODMAP Reintrodução App - Ferramenta de Apoio Nutricional</p>
        </div>
      </footer>
    `;
  }
}

// Export singleton instance
export const pdfService = new PDFService();
