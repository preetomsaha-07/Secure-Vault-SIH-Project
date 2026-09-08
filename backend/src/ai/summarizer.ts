import { SensitiveInfoDetector } from './sensitiveDetector.js';
import { DocumentClassifier } from './classifier.js';

export interface DocumentSummary {
  executiveSummary: string;
  documentType: string;
  caseReference: string | null;
  keyEntities: Array<{ type: string; value: string }>;
  keyDates: string[];
  keyKeywords: string[];
  analyzedAt: string;
}

export class DocumentSummarizer {
  /**
   * Generates structured executive summary from document text
   */
  public static summarize(text: string, filename: string, caseNumber?: string): DocumentSummary {
    const classification = DocumentClassifier.classify(text, filename);
    const entities = SensitiveInfoDetector.detectEntities(text);

    // Extract dates
    const dateEntities = entities.filter((e) => e.type === 'DATE').map((e) => e.value);
    const keyDates = dateEntities.length > 0 ? Array.from(new Set(dateEntities)).slice(0, 5) : [new Date().toISOString().split('T')[0]];

    // Extract key entities for summary
    const priorityEntities = entities
      .filter((e) => ['CASE_ID', 'VEHICLE_NO', 'LEGAL_SECTION', 'NAME', 'LOCATION'].includes(e.type))
      .map((e) => ({ type: e.type, value: e.value }))
      .slice(0, 8);

    // Detect case reference
    const foundCase = entities.find((e) => e.type === 'CASE_ID')?.value || caseNumber || 'Unassigned';

    // Formulate structured executive summary
    const cleanSentences = text
      .split(/[.\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25 && !s.includes('---'));

    let summaryBody = '';
    if (cleanSentences.length >= 2) {
      summaryBody = cleanSentences.slice(0, 3).join('. ') + '.';
    } else {
      summaryBody = `Official ${classification.classification} document registered under ${foundCase}. Pertains to evidence verification, investigative findings, and procedural documentation with cryptographic integrity safeguards.`;
    }

    const executiveSummary = `[${classification.classification.toUpperCase()}] ${summaryBody}`;

    return {
      executiveSummary,
      documentType: classification.classification,
      caseReference: foundCase !== 'Unassigned' ? foundCase : null,
      keyEntities: priorityEntities,
      keyDates,
      keyKeywords: classification.keywords,
      analyzedAt: new Date().toISOString(),
    };
  }
}
