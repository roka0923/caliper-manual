const fs = require('fs');
const https = require('https');

// Firebase Config from user
const firebaseConfig = {
    apiKey: "AIzaSyDCEeOsgMDzwrMPmnYWVJIzYA3GuRQQ65Y",
    projectId: "daehansa-workflow"
};

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1uKzRa__0utdtOA3jOr0YxxKeFkJ_0Dztw7ZeAVNn9O8/gviz/tq?tqx=out:csv&gid=0';

function downloadCSV(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', (err) => reject(err));
    });
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());

    return lines.slice(1).filter(line => line.trim() !== '').map(line => {
        // Simple regex to handle commas inside quotes
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const obj = {};
        headers.forEach((header, i) => {
            let val = values[i] ? values[i].replace(/^"|"$/g, '').trim() : '';
            obj[header] = val;
        });
        return obj;
    });
}

async function run() {
    console.log('Fetching spreadsheet data...');
    const csvData = await downloadCSV(SHEET_URL);
    const parts = parseCSV(csvData);

    console.log(`Parsed ${parts.length} parts.`);

    // Save to a local JSON file for reference or manual import
    fs.writeFileSync('parts_data.json', JSON.stringify(parts, null, 2));
    console.log('Saved to parts_data.json');

    console.log('\n--- MIGRATION INSTRUCTIONS ---');
    console.log('Firestore does not allow writes via API Key alone without a Service Account.');
    console.log('To upload this data, please follow one of these steps:');
    console.log('1. Use Firebase Console "Import JSON" (if available via extensions).');
    console.log('2. Provide a serviceAccountKey.json for me to run a direct migration script.');
    console.log('3. I can add a "Migration" button to your web app that you can click to upload everything.');
}

run().catch(console.error);
