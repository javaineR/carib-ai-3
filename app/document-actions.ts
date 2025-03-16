"use server"

/**
 * This file contains server actions specifically for document processing.
 * It's intentionally separated from other server actions to avoid bundling issues.
 */

// Function to parse a PDF or DOCX document
export async function parseDocument(file: File): Promise<string> {
  if (!file) {
    throw new Error("No file provided")
  }
  
  try {
    // Check file type and size
    if (!file.name.endsWith(".pdf") && !file.name.endsWith(".docx")) {
      throw new Error("Unsupported file format. Only PDF and DOCX files are supported.")
    }
    
    const maxFileSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxFileSize) {
      throw new Error("File size exceeds the maximum limit of 16MB")
    }

    // Verify file is not empty
    if (file.size === 0) {
      throw new Error("The file is empty. Please upload a valid document.")
    }
    
    console.log(`Starting to process ${file.name.endsWith('.pdf') ? 'PDF' : 'DOCX'} file: ${file.name}`);
    
    // Only import the document parser modules when needed to avoid bundling issues
    if (file.name.endsWith(".pdf")) {
      try {
        // Dynamic import of PDF parser
        const { parsePdf } = await import("@/lib/document-parser")
        const text = await parsePdf(file)
        
        // Check if text was successfully extracted
        if (!text || text.trim().length === 0) {
          throw new Error("No text could be extracted from the PDF. The file might be image-based, protected, or corrupted.")
        }
        
        console.log(`Successfully processed PDF file: ${file.name}`);
        return text
      } catch (pdfError: any) {
        console.error("PDF processing specific error:", pdfError);
        // Enhance error message with PDF-specific details
        throw new Error(`PDF processing error: ${pdfError.message}`)
      }
    } else {
      try {
        // Dynamic import of DOCX parser
        const { parseDocx } = await import("@/lib/document-parser")
        const text = await parseDocx(file)
        
        // Check if text was successfully extracted
        if (!text || text.trim().length === 0) {
          throw new Error("No text could be extracted from the DOCX. The file might be corrupted or in an unsupported format.")
        }
        
        console.log(`Successfully processed DOCX file: ${file.name}`);
        return text
      } catch (docxError: any) {
        console.error("DOCX parsing specific error:", docxError)
        throw new Error(`DOCX processing error: ${docxError.message}`)
      }
    }
  } catch (error: any) {
    console.error("Error parsing document:", error)
    if (error instanceof Error) {
      // If it's already a processed error from our catch blocks above, just rethrow it
      throw error
    }
    throw new Error("Document parsing failed with an unknown error")
  }
} 