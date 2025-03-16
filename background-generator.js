const fs = require('fs');
const path = require('path');

// Create a simple SVG with gradients and paths
const width = 1920;
const height = 1080;

// Start SVG document
let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg-gradient" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
      <stop offset="0%" stop-color="#171717" />
      <stop offset="30%" stop-color="#1a1a1a" />
      <stop offset="60%" stop-color="#252525" />
      <stop offset="90%" stop-color="#0e0e0e" />
    </radialGradient>
  </defs>
  
  <!-- Background rectangle -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bg-gradient)" />
`;

// Generate random paths for flowing lines
const generateRandomPaths = (count, color, opacity, strokeWidth) => {
  let paths = '';
  
  for (let i = 0; i < count; i++) {
    // Start point
    let x = Math.random() * width;
    let y = Math.random() * height;
    
    let path = `M${x},${y} `;
    
    // Create bezier curves
    for (let j = 0; j < 4; j++) {
      const cpx1 = x + (Math.random() * 200 - 100);
      const cpy1 = y + (Math.random() * 200 - 100);
      const cpx2 = x + (Math.random() * 400 - 200);
      const cpy2 = y + (Math.random() * 400 - 200);
      x = x + (Math.random() * 500 - 250);
      y = y + (Math.random() * 500 - 250);
      
      path += `C${cpx1},${cpy1} ${cpx2},${cpy2} ${x},${y} `;
    }
    
    const actualOpacity = Math.random() * opacity[1] + opacity[0];
    const actualWidth = Math.random() * strokeWidth[1] + strokeWidth[0];
    
    paths += `  <path d="${path}" stroke="${color}" stroke-width="${actualWidth}" fill="none" opacity="${actualOpacity}" />\n`;
  }
  
  return paths;
};

// Add reddish flowing lines
svg += generateRandomPaths(50, '#781e1e', [0.1, 0.4], [0.5, 2.5]);

// Add subtle white flowing lines
svg += generateRandomPaths(80, '#ffffff', [0.02, 0.15], [0.2, 1.5]);

// Close SVG
svg += '</svg>';

// Ensure directory exists
const dir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Write SVG to file
const outputPath = path.join(dir, 'dashboard-background.svg');
fs.writeFileSync(outputPath, svg);

console.log(`Background image created at: ${outputPath}`); 