export interface ClassificationResult {
  classification:
    | 'FIR'
    | 'Investigation Report'
    | 'Evidence'
    | 'Court Order'
    | 'Legal Document'
    | 'Identity Document'
    | 'Forensic Report'
    | 'Confidential Report'
    | 'Administrative Document'
    | 'Other';
  confidence: number;
  keywords: string[];
  suggestedTags: string[];
}

export class DocumentClassifier {
  private static categoryRules = [
    {
      type: 'FIR' as const,
      keywords: ['first information report', 'fir', 'crpc 154', 'complainant', 'cognizable offence', 'police station'],
      baseTags: ['FIR', 'Police', 'Criminal-Procedure'],
    },
    {
      type: 'Investigation Report' as const,
      keywords: ['investigation report', 'investigating officer', 'case summary', 'suspect', 'interrogation', 'witness statement', 'investigation division'],
      baseTags: ['Investigation', 'Report', 'Active-Case'],
    },
    {
      type: 'Forensic Report' as const,
      keywords: ['forensic', 'ballistics', 'dna analysis', 'digital forensic', 'hash verification', 'memory dump', 'chain of custody', 'disk image'],
      baseTags: ['Forensics', 'Digital-Evidence', 'Lab-Report'],
    },
    {
      type: 'Court Order' as const,
      keywords: ['court order', 'honorable judge', 'bench', 'in the court of', 'writ petition', 'bail application', 'order dated', 'injunction'],
      baseTags: ['Court-Order', 'Judicial', 'Legal'],
    },
    {
      type: 'Evidence' as const,
      keywords: ['evidence item', 'seizure memo', 'panchnama', 'recovered item', 'custody transfer', 'exhibit', 'property room'],
      baseTags: ['Evidence', 'Custody', 'Exhibits'],
    },
    {
      type: 'Legal Document' as const,
      keywords: ['affidavit', 'vakalatnama', 'power of attorney', 'legal notice', 'memorandum of understanding', 'contract', 'statute'],
      baseTags: ['Legal', 'Affidavit', 'Documentation'],
    },
    {
      type: 'Identity Document' as const,
      keywords: ['aadhaar', 'pan card', 'passport', 'driver license', 'voter id', 'identification', 'date of birth'],
      baseTags: ['KYC', 'Identity', 'Confidential'],
    },
    {
      type: 'Confidential Report' as const,
      keywords: ['strictly confidential', 'secret', 'classified', 'internal affairs', 'intelligence bureau', 'eyes only'],
      baseTags: ['Confidential', 'Restricted', 'Intelligence'],
    },
    {
      type: 'Administrative Document' as const,
      keywords: ['department circular', 'office order', 'transfer order', 'memorandum', 'duty roster', 'administrative record'],
      baseTags: ['Administrative', 'Internal', 'Governance'],
    },
  ];

  /**
   * Classifies document based on text content and filename
   */
  public static classify(text: string, filename: string): ClassificationResult {
    const combinedContent = `${filename} ${text}`.toLowerCase();
    let bestMatch: (typeof this.categoryRules)[0] | null = null;
    let maxScore = 0;
    const foundKeywords: string[] = [];

    for (const rule of this.categoryRules) {
      let score = 0;
      for (const kw of rule.keywords) {
        if (combinedContent.includes(kw)) {
          score += 1;
          if (!foundKeywords.includes(kw)) {
            foundKeywords.push(kw);
          }
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = rule;
      }
    }

    if (!bestMatch || maxScore === 0) {
      return {
        classification: 'Other',
        confidence: 0.5,
        keywords: ['General Document'],
        suggestedTags: ['Document', 'Unclassified'],
      };
    }

    // Confidence normalized between 0.72 and 0.98 based on match density
    const confidence = Math.min(0.72 + maxScore * 0.08, 0.98);

    // Extract dynamic tags from filename or case
    const caseMatch = filename.match(/10[1-9]/);
    const dynamicTags = [...bestMatch.baseTags];
    if (caseMatch) {
      dynamicTags.push(`Case-${caseMatch[0]}`);
    }

    return {
      classification: bestMatch.type,
      confidence: Number(confidence.toFixed(2)),
      keywords: foundKeywords.slice(0, 6),
      suggestedTags: dynamicTags,
    };
  }
}
