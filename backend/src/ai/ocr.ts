import { createWorker } from 'tesseract.js';

export class OcrEngine {
  private static isInitialized = false;

  /**
   * Performs optical character recognition on image buffer
   */
  public static async extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    try {
      const worker = await createWorker('eng');
      const {
        data: { text },
      } = await worker.recognize(imageBuffer);
      await worker.terminate();
      return text.trim();
    } catch (err: any) {
      console.warn(`[OCR WARNING] Tesseract OCR extraction failed: ${err.message}. Using text fallback.`);
      return '';
    }
  }

  /**
   * Extracts text from document based on mime type
   */
  public static async processDocument(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
    if (mimeType.startsWith('image/')) {
      return await this.extractTextFromImage(buffer);
    }

    if (mimeType === 'text/plain') {
      return buffer.toString('utf8');
    }

    // For PDF/DOC/binary documents in prototype: extract embedded text strings
    const raw = buffer.toString('utf8');
    const printableMatches = raw.match(/[a-zA-Z0-9.,;:!?@#%&*()\-_+=\[\]{}'"/\s]{4,}/g);
    if (printableMatches && printableMatches.length > 5) {
      const filtered = printableMatches.filter(
        (s) => !s.includes('obj') && !s.includes('endobj') && !s.includes('xref') && s.length > 10
      );
      return filtered.slice(0, 50).join('\n').trim();
    }

    return `Document metadata indexed for ${filename}`;
  }
}
