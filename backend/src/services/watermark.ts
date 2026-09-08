import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export interface WatermarkOptions {
  userName: string;
  userId: string;
  documentId: string;
  timestamp?: string;
  classification?: string;
}

export class WatermarkService {
  /**
   * Overlays dynamic security watermark on PDF document
   */
  public static async applyPdfWatermark(pdfBuffer: Buffer, options: WatermarkOptions): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      const timeStr = options.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
      const watermarkText = `CONFIDENTIAL - SECUREVAULT EVIDENCE\nUSER: ${options.userName} (${options.userId.slice(0, 8)})\nDOC: ${options.documentId.slice(0, 8)} | ${timeStr}`;

      for (const page of pages) {
        const { width, height } = page.getSize();
        page.drawText(watermarkText, {
          x: width * 0.15,
          y: height * 0.45,
          size: Math.max(14, Math.floor(width / 35)),
          font: helveticaFont,
          color: rgb(0.85, 0.2, 0.2), // Subtle warning crimson
          opacity: 0.18,
          rotate: degrees(35),
          lineHeight: 22,
        });
      }

      const watermarkedBytes = await pdfDoc.save();
      return Buffer.from(watermarkedBytes);
    } catch (err: any) {
      console.warn(`[WATERMARK WARNING] PDF watermark overlay failed (${err.message}). Returning original buffer.`);
      return pdfBuffer;
    }
  }

  /**
   * Generates a dynamic visual watermark header/footer string for text or metadata previews
   */
  public static generateTextWatermarkHeader(options: WatermarkOptions): string {
    const timeStr = options.timestamp || new Date().toISOString();
    return (
      `================================================================================\n` +
      `[RESTRICTED EVIDENCE - SECUREVAULT SECURE ACCESS]\n` +
      `ACCESSED BY: ${options.userName} (UID: ${options.userId})\n` +
      `DOCUMENT ID: ${options.documentId}\n` +
      `VERIFICATION TIMESTAMP: ${timeStr}\n` +
      `UNAUTHORIZED COPYING, DISTRIBUTION OR TAMPERING IS STRICTLY PROHIBITED\n` +
      `================================================================================\n\n`
    );
  }
}
