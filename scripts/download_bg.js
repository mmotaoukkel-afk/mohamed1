const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream('assets/background-pattern.png');
https.get('https://storage.googleapis.com/workplace-assets/2bd002aa-d477-44df-be9e-def7927515ee/919998/images/a8326a19-90d5-4720-94f7-af3175c276cd.png', function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close(() => console.log('Download complete'));
  });
}).on('error', function(err) {
  fs.unlink('assets/background-pattern.png', () => {});
  console.error('Error downloading:', err.message);
});
