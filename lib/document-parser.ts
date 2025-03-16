import "server-only"; // Mark this module as server-only
import { createCanvas } from 'canvas';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
// Don't import the worker directly, we'll configure it differently
// import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry';

// Import types for TypeScript
import type { Worker } from 'tesseract.js';
import type { PDFPageProxy, TextContent, TextItem, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
// Import the worker directly
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';

// Configure worker path - must be done before any PDF is loaded
if (typeof window === 'undefined') {
  // Server-side
  const path = require('path');
  const pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.entry');
  // Use workerSrc instead of workerPort
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  
  // We'll configure font paths when creating the document instead of globally
  console.log('PDF.js worker configured for server-side');
}

/**
 * Verifies that the code is running in a Node.js environment.
 * Throws an error if it's not.
 */
function ensureServerEnvironment(operation: string): void {
  const isServer = typeof window === 'undefined' && typeof process !== 'undefined' && process.versions && !!process.versions.node;
  if (!isServer) {
    throw new Error(
      `${operation} can only be performed on the server. ` +
      'This error indicates that server-side code is being executed in a browser environment. ' +
      'Make sure you are using the "use server" directive or Server Components.'
    );
  }
}

/**
 * Converts a PDF page to an image using PDF.js
 */
async function pdfPageToImage(page: PDFPageProxy, scale = 2): Promise<string> {
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  return canvas.toDataURL('image/png');
}

/**
 * Initialize Tesseract worker with English language
 */
async function initTesseract(): Promise<Worker> {
  // Configure Tesseract.js for Node.js environment
  return await createWorker('eng', 1, {
    // Minimal logging to reduce noise
    logger: m => {
      if (m.status === 'recognizing text') {
        console.log(`OCR Progress: ${Math.floor(m.progress * 100)}%`);
      }
    },
    // Don't specify workerPath as it will be auto-configured
  });
}

/**
 * Alternative method to parse PDFs if the primary method fails
 * This uses pdf-lib to get basic information about the PDF
 */
async function fallbackPdfParse(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Falling back to pdf-lib for text extraction...');
    // Import pdf-lib
    const PDFLib = await import('pdf-lib');
    
    // Use pdf-lib to load the document with Uint8Array instead of Buffer
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdfDoc = await PDFLib.PDFDocument.load(uint8Array, { 
      ignoreEncryption: true  // Try to bypass encryption
    });
    
    const numPages = pdfDoc.getPageCount();
    console.log(`PDF document has ${numPages} pages`);
    
    // Get basic metadata
    const title = pdfDoc.getTitle() || 'Untitled';
    const author = pdfDoc.getAuthor() || 'Unknown';
    const subject = pdfDoc.getSubject() || '';
    const keywords = pdfDoc.getKeywords() || '';
    
    // Since pdf-lib doesn't have direct text extraction capabilities,
    // we'll construct a basic representation with available metadata
    const metadata = `
    Document Title: ${title}
    Author: ${author}
    Subject: ${subject}
    Keywords: ${keywords}
    Page Count: ${numPages}
    `;
    
    // Return both metadata and a note about extraction limitations
    return `
PDF Document Analysis:
${metadata}

Content Summary:
This document contains ${numPages} pages.
${subject ? `It appears to be related to: ${subject}` : ''}
${keywords ? `Key terms may include: ${keywords}` : ''}

Note: Full text extraction is limited in fallback mode. The document appears to be a PDF that requires processing to extract educational content and learning objectives.
    `;
  } catch (error) {
    console.error('Fallback PDF parsing failed:', error);
    throw new Error('PDF could not be processed even with fallback method.');
  }
}

// Try to get standard font data paths
function getPdfJsDataPaths() {
  try {
    const path = require('path');
    const fs = require('fs');
    let pdfjsDistPath = '';
    
    // Try different possible locations for pdfjs-dist
    const possiblePaths = [
      path.dirname(require.resolve('pdfjs-dist/package.json')),
      path.resolve(process.cwd(), 'node_modules/pdfjs-dist'),
      path.resolve(__dirname, '../node_modules/pdfjs-dist')
    ];
    
    // Find the first path that exists
    for (const potentialPath of possiblePaths) {
      try {
        if (fs.existsSync(potentialPath)) {
          pdfjsDistPath = potentialPath;
          break;
        }
      } catch (e) {
        // Ignore errors and try next path
      }
    }
    
    if (!pdfjsDistPath) {
      console.error('Could not find pdfjs-dist path');
      return null;
    }
    
    const standardFontDataPath = path.join(pdfjsDistPath, 'standard_fonts');
    const cMapPath = path.join(pdfjsDistPath, 'cmaps');
    
    // Verify paths exist
    if (!fs.existsSync(standardFontDataPath)) {
      console.error(`Standard fonts path not found: ${standardFontDataPath}`);
      return null;
    }
    
    if (!fs.existsSync(cMapPath)) {
      console.error(`CMap path not found: ${cMapPath}`);
      return null;
    }
    
    return {
      standardFontDataUrl: `file://${standardFontDataPath}/`,
      cMapUrl: `file://${cMapPath}/`
    };
  } catch (error) {
    console.error('Error getting PDF.js data paths:', error);
    return null;
  }
}

// Function to parse PDF files
export async function parsePdf(file: File): Promise<string> {
  ensureServerEnvironment('PDF parsing');

  try {
    console.log(`Processing PDF file: ${file.name}, size: ${file.size} bytes`);
    
    // Read the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // First try the pdfjs-dist approach for better text extraction
    try {
      console.log('Using pdfjs-dist for enhanced text extraction...');
      
      // Get font paths
      const paths = getPdfJsDataPaths();
      
      // Create document loading options
      let docOptions: any = {
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true, // Try using system fonts for better extraction
        disableFontFace: false, // Enable font face for better character recognition
        cMapPacked: true,
      };
      
      // Add font paths if available
      if (paths) {
        docOptions.standardFontDataUrl = paths.standardFontDataUrl;
        docOptions.cMapUrl = paths.cMapUrl;
        console.log('Using font paths:', paths);
      } else {
        console.log('Font paths not found, using defaults');
      }
      
      // Load the PDF document with configurations
      const loadingTask = pdfjs.getDocument(docOptions);
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('PDF loading timed out after 45 seconds')), 45000); // Increased timeout
      });
      
      console.log('Waiting for PDF document to load...');
      // Race the promises to prevent hanging indefinitely
      const pdfDoc = await Promise.race([loadingTask.promise, timeoutPromise]);
      console.log(`PDF document loaded with ${pdfDoc.numPages} pages`);

      // Log available info for debugging
      try {
        console.log('PDF fingerprints:', pdfDoc.fingerprints);
      } catch (e) {
        console.log('Could not get PDF fingerprints');
      }
      
      // Extract text from all pages
      let fullText = '';
      let tableOfContents = '';
      let learningObjectives = '';
      let keyTermsAndConcepts = '';
      let syllabusSections = '';
      let assessmentInfo = '';
      
      // Process the first few pages to extract structural information
      const structuralPages = Math.min(pdfDoc.numPages, 8); // Process up to first 8 pages for structure (increased)
      
      console.log(`Extracting structure from first ${structuralPages} pages...`);
      for (let i = 1; i <= structuralPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        
        // Extract text while preserving some layout information
        let pageText = '';
        let lastY = null;
        let lastFontSize = null;
        
        // Sort items by y position (top to bottom) then x position (left to right)
        const sortedItems = [...content.items]
          .filter((item: any) => 'str' in item)
          .sort((a: any, b: any) => {
            if (Math.abs(a.transform[5] - b.transform[5]) > 5) {
              return b.transform[5] - a.transform[5]; // Higher y value first
            }
            return a.transform[4] - b.transform[4]; // Then sort by x
          });
        
        // Process items with better layout preservation
        for (const item of sortedItems) {
          if ('str' in item && item.str.trim()) {
            const y = item.transform[5];
            const fontSize = item.height;
            
            // Add line break if significant y position change
            if (lastY !== null && Math.abs(y - lastY) > 5) {
              pageText += '\n';
            }
            
            // Add emphasis for headings (larger fonts)
            if (lastFontSize !== null && fontSize > lastFontSize * 1.2) {
              pageText += '\n## '; // Mark as heading
            }
            
            pageText += item.str + ' ';
            lastY = y;
            lastFontSize = fontSize;
          }
        }
        
        // Clean up the text
        pageText = pageText.replace(/\s+/g, ' ')
                          .replace(/\n\s+/g, '\n')
                          .replace(/\n{3,}/g, '\n\n');
        
        // Add to full text
        fullText += `\n--- PAGE ${i} ---\n${pageText}\n`;
        
        // Look for table of contents
        if (pageText.toLowerCase().includes('table of contents') || 
            pageText.toLowerCase().includes('contents') ||
            pageText.toLowerCase().includes('index') ||
            pageText.toLowerCase().match(/\b(toc)\b/)) {
          tableOfContents += pageText;
        }
        
        // Look for learning objectives with more patterns
        if (pageText.toLowerCase().includes('learning objective') || 
            pageText.toLowerCase().includes('course objective') ||
            pageText.toLowerCase().includes('student will') ||
            pageText.toLowerCase().includes('learning outcome') ||
            pageText.toLowerCase().includes('by the end of this course') ||
            pageText.toLowerCase().includes('students should be able to') ||
            pageText.toLowerCase().includes('upon completion') ||
            pageText.toLowerCase().match(/\b(objectives|outcomes|goals)\b/)) {
          learningObjectives += pageText;
        }
        
        // Look for key terms with more patterns
        if (pageText.toLowerCase().includes('key term') || 
            pageText.toLowerCase().includes('glossary') ||
            pageText.toLowerCase().includes('definition') ||
            pageText.toLowerCase().includes('vocabulary') ||
            pageText.toLowerCase().includes('terminology') ||
            pageText.toLowerCase().includes('important concept') ||
            pageText.toLowerCase().match(/\b(terms|concepts)\b/)) {
          keyTermsAndConcepts += pageText;
        }
        
        // Look for syllabus structure
        if (pageText.toLowerCase().includes('syllabus') || 
            pageText.toLowerCase().includes('course schedule') ||
            pageText.toLowerCase().includes('course outline') ||
            pageText.toLowerCase().includes('week') ||
            pageText.toLowerCase().includes('module') ||
            pageText.toLowerCase().includes('unit') ||
            pageText.toLowerCase().includes('session')) {
          syllabusSections += pageText;
        }
        
        // Look for assessment information
        if (pageText.toLowerCase().includes('assessment') || 
            pageText.toLowerCase().includes('grading') ||
            pageText.toLowerCase().includes('evaluation') ||
            pageText.toLowerCase().includes('exam') ||
            pageText.toLowerCase().includes('quiz') ||
            pageText.toLowerCase().includes('test') ||
            pageText.toLowerCase().includes('assignment')) {
          assessmentInfo += pageText;
        }
      }
      
      // Process remaining pages to extract content - increased page limit
      const contentToProcess = Math.min(pdfDoc.numPages, 40); // Process up to 40 pages for content
      
      console.log(`Extracting content from up to ${contentToProcess} pages...`);
      for (let i = structuralPages + 1; i <= contentToProcess; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        
        // Extract text while preserving some layout information
        let pageText = '';
        let lastY = null;
        
        // Sort items by y position (top to bottom) then x position (left to right)
        const sortedItems = [...content.items]
          .filter((item: any) => 'str' in item)
          .sort((a: any, b: any) => {
            if (Math.abs(a.transform[5] - b.transform[5]) > 5) {
              return b.transform[5] - a.transform[5]; // Higher y value first
            }
            return a.transform[4] - b.transform[4]; // Then sort by x
          });
        
        // Process items with better layout preservation
        for (const item of sortedItems) {
          if ('str' in item && item.str.trim()) {
            const y = item.transform[5];
            
            // Add line break if significant y position change
            if (lastY !== null && Math.abs(y - lastY) > 5) {
              pageText += '\n';
            }
            
            pageText += item.str + ' ';
            lastY = y;
          }
        }
        
        // Clean up the text
        pageText = pageText.replace(/\s+/g, ' ')
                          .replace(/\n\s+/g, '\n')
                          .replace(/\n{3,}/g, '\n\n');
        
        // Add to full text
        fullText += `\n--- PAGE ${i} ---\n${pageText}\n`;
        
        // Continue looking for important content
        if (pageText.toLowerCase().includes('learning objective') || 
            pageText.toLowerCase().includes('course objective') ||
            pageText.toLowerCase().includes('student will') ||
            pageText.toLowerCase().includes('by the end of this course') ||
            pageText.toLowerCase().includes('students should be able to')) {
          learningObjectives += pageText;
        }
        
        if (pageText.toLowerCase().includes('key term') || 
            pageText.toLowerCase().includes('glossary') ||
            pageText.toLowerCase().includes('definition') ||
            pageText.toLowerCase().includes('terminology') ||
            pageText.toLowerCase().includes('important concept')) {
          keyTermsAndConcepts += pageText;
        }
        
        if (pageText.toLowerCase().includes('syllabus') || 
            pageText.toLowerCase().includes('course schedule') ||
            pageText.toLowerCase().includes('course outline')) {
          syllabusSections += pageText;
        }
        
        if (pageText.toLowerCase().includes('assessment') || 
            pageText.toLowerCase().includes('grading') ||
            pageText.toLowerCase().includes('evaluation')) {
          assessmentInfo += pageText;
        }
      }
      
      // Extract the title from the document
      let documentTitle = file.name.replace(/\.pdf$/i, '');
      try {
        const metadata = await pdfDoc.getMetadata();
        // Use a type assertion to handle the metadata more safely
        const metadataInfo = metadata?.info as Record<string, unknown>;
        if (metadataInfo && typeof metadataInfo['Title'] === 'string') {
          documentTitle = metadataInfo['Title'];
        }
      } catch (e) {
        console.log('Could not extract PDF title from metadata');
      }
      
      // Try to extract course/subject name from text
      let subjectName = "";
      const courseMatch = fullText.match(/course(?:\s+title|\s+name)?:\s*([^\n\.]+)/i) ||
                           fullText.match(/subject(?:\s+title|\s+name)?:\s*([^\n\.]+)/i) ||
                           fullText.match(/^\s*([A-Z][A-Za-z\s&]{10,50})\s*$/m);
      
      if (courseMatch && courseMatch[1]) {
        subjectName = courseMatch[1].trim();
      }
      
      // Construct a comprehensive document analysis summary
      let extractedText = `
Document Analysis Summary

Title: ${documentTitle}
${subjectName ? `Subject/Course: ${subjectName}` : ''}
Pages: ${pdfDoc.numPages}
Content Type: Educational/Syllabus

DOCUMENT STRUCTURE ANALYSIS:
--------------------------
${tableOfContents ? `Table of Contents Found:\n${tableOfContents.slice(0, 800)}...\n\n` : 'No clear table of contents found.\n\n'}
${syllabusSections ? `Course Structure Information Found:\n${syllabusSections.slice(0, 800)}...\n\n` : ''}

LEARNING OBJECTIVES:
--------------------------
${learningObjectives ? `${learningObjectives.slice(0, 1500)}` : 'No explicit learning objectives found. Content analysis will be used to determine educational goals.\n\n'}

KEY TERMS AND CONCEPTS:
--------------------------
${keyTermsAndConcepts ? `${keyTermsAndConcepts.slice(0, 1500)}` : 'No explicit key terms section found. Content analysis will be used to extract important terminology.\n\n'}

${assessmentInfo ? `ASSESSMENT INFORMATION:\n--------------------------\n${assessmentInfo.slice(0, 800)}\n\n` : ''}

FULL CONTENT:
--------------------------
${fullText.slice(0, 20000)}
${pdfDoc.numPages > contentToProcess ? `\n...[Content from remaining ${pdfDoc.numPages - contentToProcess} pages not processed]` : ''}

This document appears to be an educational syllabus or course material containing specific learning objectives, key concepts, and teaching content.
The extracted content should be used to create learning modules that:
1. Directly map to the specific learning objectives identified
2. Focus on the key terms and technical concepts present in the document
3. Maintain the original structure and progression of the course content
4. Provide simplified explanations of complex terminology
5. Include assessment components that align with the document's evaluation criteria
`;
      
      return extractedText;
    } 
    catch (pdfjsError) {
      console.error("pdfjs-dist processing failed:", pdfjsError);
      
      // Fall back to pdf-lib approach with enhanced extraction attempt
      try {
        console.log('Falling back to pdf-lib for text extraction with OCR attempt...');
        
        // First try pdf-lib for metadata
        const PDFLib = await import('pdf-lib');
        
        // Use pdf-lib to load the document with Uint8Array instead of Buffer
        const uint8Array = new Uint8Array(arrayBuffer);
        const pdfDoc = await PDFLib.PDFDocument.load(uint8Array, { 
          ignoreEncryption: true  // Try to bypass encryption
        });
        
        const numPages = pdfDoc.getPageCount();
        console.log(`PDF document has ${numPages} pages`);
        
        // Get basic metadata
        const title = pdfDoc.getTitle() || 'Untitled';
        const author = pdfDoc.getAuthor() || 'Unknown';
        const subject = pdfDoc.getSubject() || '';
        const keywords = pdfDoc.getKeywords() || '';
        
        // Try basic OCR if the document appears to be image-based
        // This section won't actually run OCR but is prepared for when we add that capability
        let ocrText = '';
        let ocrAttempted = false;
        
        // Even without OCR, provide a more detailed analysis
        const fileBase = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        
        // For PDFs with few pages, try to extract something useful
        let extractedText = `
Document Analysis Summary

Title: ${title || file.name}
Author: ${author}
Subject: ${subject || fileBase}
Keywords: ${keywords}
Pages: ${numPages}
Content Type: Educational/Syllabus

DOCUMENT STRUCTURE ANALYSIS:
--------------------------
${ocrAttempted ? 'Document appears to be image-based. OCR extraction attempted.\n\n' : 'Text extraction limited. Document may be image-based or have restricted text access.\n\n'}

POTENTIAL SUBJECT MATTER:
--------------------------
This document appears to be related to: ${subject || fileBase}
${keywords ? `Relevant concepts may include: ${keywords}` : ''}

SUGGESTED LEARNING OBJECTIVES:
--------------------------
Based on the document title and available metadata, students should be able to:
1. Understand core concepts of ${subject || fileBase}
2. Apply key principles from ${subject || fileBase} in practical contexts
3. Analyze problems using frameworks from ${subject || fileBase}
4. Evaluate scenarios using knowledge gained from the course

RECOMMENDED STRUCTURE:
--------------------------
This educational content should be organized into modules covering:
1. Introduction to ${subject || fileBase}
2. Core concepts and terminology
3. Practical applications
4. Advanced topics and extensions
5. Assessment and review

EXTRACTED TEXT CONTENT:
--------------------------
${ocrText || 'Limited text content could be extracted from this document.'}

This document appears to be educational material that should be processed to extract learning objectives, key terms, and content structure.
The AI processing should identify specific subject matter and generate appropriate learning modules.
`;
        
        return extractedText;
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        
        // Even more resilient fallback that extracts information from filename
        const fileBase = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        
        return `
Educational Document Analysis

Document Filename: ${file.name}
Potential Subject: ${fileBase}

This document appears to be educational material that can be organized into learning modules.
Based on the filename, this appears to be related to: ${fileBase}

Each module should include:
- A clear topic title related to ${fileBase}
- Step-by-step learning objectives
- Key terminology related to the subject
- Practical examples and applications
- Assessment components to test understanding

Suggested module structure:
1. Introduction to ${fileBase}
2. Core Concepts and Principles of ${fileBase}
3. Practical Applications of ${fileBase}
4. Advanced Topics in ${fileBase}
5. Review and Assessment of ${fileBase} Knowledge

Due to limitations in text extraction, the AI should create modules based on common aspects of ${fileBase}
and standard educational structure, ensuring content is relevant to the document topic.
`;
      }
    }
  } catch (error: any) {
    console.error("Error processing PDF:", error);
    
    // Provide specific error messages but always return something
    let errorMessage = "Failed to process PDF: " + (error.message || "Unknown error");
    
    if (error.message?.includes("encrypted")) {
      errorMessage = "The PDF file is encrypted or password-protected. Please provide an unprotected PDF.";
    } else if (error.message?.includes("malformed") || error.message?.includes("invalid")) {
      errorMessage = "The PDF file appears to be damaged or corrupted. Please try a different file.";
    } else if (error.name === 'TypeError') {
      errorMessage = "PDF parsing error: The file might be in an unsupported format.";
    } else if (error.message?.includes("timed out")) {
      errorMessage = "PDF processing timed out. The file may be too large or complex.";
    }
    
    console.error(errorMessage);
    
    // Create a recovery response based on the filename
    const fileBase = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    
    // Instead of throwing, return a minimal result that allows the process to continue
    return `
Educational Content Analysis:

This document couldn't be processed due to the following issue:
${errorMessage}

Document Filename: ${file.name}
Potential Subject: ${fileBase}

Based on the filename, this document appears to be related to: ${fileBase}

Suggested educational topics include:
- Introduction to ${fileBase}
- Core concepts and fundamentals of ${fileBase}
- Practical applications of ${fileBase}
- Advanced topics in ${fileBase}
- Assessment methods for ${fileBase}

Each topic should be organized into a learning module with clear steps and terminology
relevant to ${fileBase} as an educational subject.
`;
  }
}

// Function to parse DOCX files
export async function parseDocx(file: File): Promise<string> {
  // Ensure we're on the server
  ensureServerEnvironment('DOCX parsing');
  
  try {
    // Dynamically import mammoth only when needed and only on the server
    const mammoth = await import("mammoth");
    
    // Read the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Parse the DOCX file using mammoth.js
    const result = await mammoth.extractRawText({ arrayBuffer });

    // Return the extracted text
    return result.value;
  } catch (error: any) {
    console.error("Error parsing DOCX:", error);
    throw new Error("Failed to parse DOCX: " + (error.message || "Unknown error"));
  }
}