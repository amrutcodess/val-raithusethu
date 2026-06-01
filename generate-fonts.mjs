import fs from 'fs';
import https from 'https';
import path from 'path';

const fonts = [
  {
    name: 'NotoSansTelugu-Regular',
    url: 'https://github.com/googlefonts/noto-fonts/raw/HEAD/hinted/ttf/NotoSansTelugu/NotoSansTelugu-Regular.ttf',
    dest: 'src/assets/fonts/NotoSansTelugu-Regular.base64'
  },
  {
    name: 'NotoSansDevanagari-Regular',
    url: 'https://github.com/googlefonts/noto-fonts/raw/HEAD/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf',
    dest: 'src/assets/fonts/NotoSansDevanagari-Regular.base64'
  }
];

const download = (url, callback) => {
  https.get(url, (res) => {
    // Handle Redirects (GitHub uses 302 redirects for raw content)
    if (res.statusCode === 301 || res.statusCode === 302) {
      return download(res.headers.location, callback);
    }
    
    if (res.statusCode !== 200) {
      console.error(`❌ Failed: Status ${res.statusCode} for ${url}`);
      return;
    }

    const data = [];
    res.on('data', (chunk) => data.push(chunk));
    res.on('end', () => callback(Buffer.concat(data)));
  }).on('error', (err) => {
    console.error(`❌ Error: ${err.message}`);
  });
};

const processFont = (font) => {
  console.log(`⏳ Downloading ${font.name}...`);
  
  download(font.url, (buffer) => {
    // Convert to Base64
    const base64 = buffer.toString('base64');
    
    // Ensure directory exists
    const dir = path.dirname(font.dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(font.dest, base64);
    
    // Verify file size
    const stats = fs.statSync(font.dest);
    if (stats.size > 0) {
      console.log(`✅ Generated: ${font.dest} (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
      console.error(`❌ Error: File is empty - ${font.dest}`);
    }
  });
};

console.log('🚀 Starting font generation...');
fonts.forEach(processFont);