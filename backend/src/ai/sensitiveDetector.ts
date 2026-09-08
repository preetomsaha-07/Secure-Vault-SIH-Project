export interface SensitiveEntity {
  type: 'NAME' | 'PHONE' | 'EMAIL' | 'CASE_ID' | 'VEHICLE_NO' | 'LOCATION' | 'DATE' | 'LEGAL_SECTION' | 'ID_NUMBER';
  value: string;
  startIndex?: number;
  confidence: number;
}

export class SensitiveInfoDetector {
  /**
   * Scans text and extracts sensitive and forensic entities
   */
  public static detectEntities(text: string): SensitiveEntity[] {
    const entities: SensitiveEntity[] = [];
    if (!text) return entities;

    // 1. Email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
    let match: RegExpExecArray | null;
    while ((match = emailRegex.exec(text)) !== null) {
      entities.push({ type: 'EMAIL', value: match[0], startIndex: match.index, confidence: 0.98 });
    }

    // 2. Case IDs (e.g. CASE-2026-104, CR-892/2026, FIR-104)
    const caseRegex = /\b(CASE-\d{4}-\d{3,6}|FIR-\d+|CR-\d+\/\d{4})\b/gi;
    while ((match = caseRegex.exec(text)) !== null) {
      entities.push({ type: 'CASE_ID', value: match[0].toUpperCase(), startIndex: match.index, confidence: 0.99 });
    }

    // 3. Vehicle Numbers (e.g., DL-01-AB-1234, MH 12 CD 5678, KA05MB9999)
    const vehicleRegex = /\b[A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{3,4}\b/g;
    while ((match = vehicleRegex.exec(text)) !== null) {
      entities.push({ type: 'VEHICLE_NO', value: match[0], startIndex: match.index, confidence: 0.92 });
    }

    // 4. Phone Numbers (e.g. +91 9876543210, (555) 123-4567, 98765-43210)
    const phoneRegex = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    while ((match = phoneRegex.exec(text)) !== null) {
      entities.push({ type: 'PHONE', value: match[0], startIndex: match.index, confidence: 0.88 });
    }

    // 5. Legal Sections (e.g. Section 420 IPC, Section 66 IT Act, CrPC 154, 437 CrPC)
    const legalRegex = /\b(?:Section\s+\d+[A-Za-z]?\s+(?:IPC|IT\s+Act|CrPC|IEA)|CrPC\s+\d+|IPC\s+\d+)\b/gi;
    while ((match = legalRegex.exec(text)) !== null) {
      entities.push({ type: 'LEGAL_SECTION', value: match[0], startIndex: match.index, confidence: 0.95 });
    }

    // 6. Identification Numbers (e.g. Aadhaar XXXX-XXXX-XXXX, PAN [A-Z]{5}[0-9]{4}[A-Z], SSN \d{3}-\d{2}-\d{4})
    const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;
    while ((match = panRegex.exec(text)) !== null) {
      entities.push({ type: 'ID_NUMBER', value: match[0], startIndex: match.index, confidence: 0.94 });
    }

    const aadhaarRegex = /\b\d{4}\s\d{4}\s\d{4}\b/g;
    while ((match = aadhaarRegex.exec(text)) !== null) {
      entities.push({ type: 'ID_NUMBER', value: match[0], startIndex: match.index, confidence: 0.91 });
    }

    // 7. Dates (e.g. 2026-09-08, 08/09/2026, 12th August 2026)
    const dateRegex = /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/gi;
    while ((match = dateRegex.exec(text)) !== null) {
      entities.push({ type: 'DATE', value: match[0], startIndex: match.index, confidence: 0.89 });
    }

    // 8. Locations / Police Stations / Courts
    const locRegex = /\b(?:Cyber Cell|Police Station|District Court|Forensic Science Lab|Sector\s+\d+|High Court|Supreme Court)\b/gi;
    while ((match = locRegex.exec(text)) !== null) {
      entities.push({ type: 'LOCATION', value: match[0], startIndex: match.index, confidence: 0.87 });
    }

    // Deduplicate by value and type
    const uniqueMap = new Map<string, SensitiveEntity>();
    for (const e of entities) {
      const key = `${e.type}:${e.value.toLowerCase()}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, e);
      }
    }

    return Array.from(uniqueMap.values());
  }
}
