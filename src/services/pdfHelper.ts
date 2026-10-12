import jsPDF from 'jspdf';
import { GARUDA_REGULAR_BASE64, GARUDA_BOLD_BASE64 } from './thaiFontBase64';

/**
 * Registers and activates the Garuda Thai Unicode font in a jsPDF document.
 * This ensures Thai characters render properly without becoming mojibake / "alien language" (+ l - 1, etc.).
 */
export const applyThaiFontToDoc = (doc: jsPDF): void => {
  try {
    doc.addFileToVFS('Garuda-Regular.ttf', GARUDA_REGULAR_BASE64);
    doc.addFont('Garuda-Regular.ttf', 'Garuda', 'normal');

    doc.addFileToVFS('Garuda-Bold.ttf', GARUDA_BOLD_BASE64);
    doc.addFont('Garuda-Bold.ttf', 'Garuda', 'bold');

    doc.setFont('Garuda', 'normal');
  } catch (err) {
    console.error('Error applying Thai font to jsPDF:', err);
  }
};

/**
 * Common table styles helper for jspdf-autotable to ensure Thai font is used on all headers and cells
 */
export const thaiTableStyles = {
  styles: {
    font: 'Garuda',
    fontStyle: 'normal' as const
  },
  headStyles: {
    font: 'Garuda',
    fontStyle: 'bold' as const
  },
  bodyStyles: {
    font: 'Garuda',
    fontStyle: 'normal' as const
  },
  alternateRowStyles: {
    font: 'Garuda',
    fontStyle: 'normal' as const
  }
};
