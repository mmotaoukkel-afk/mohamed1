const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

function findKeytool() {
    // Common paths for keytool on Windows
    const commonPaths = [
        process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'keytool.exe') : null,
        'C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\keytool.exe',
        'C:\\Program Files\\Android\\Android Studio\\jre\\bin\\keytool.exe',
        'C:\\Program Files\\Java\\jdk-17\\bin\\keytool.exe',
        'C:\\Program Files\\Java\\jdk-11\\bin\\keytool.exe',
        'C:\\Program Files\\Java\\jdk1.8.0_202\\bin\\keytool.exe',
        'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.8.101-hotspot\\bin\\keytool.exe'
    ];

    console.log('🔍 Searching for keytool...');

    for (const p of commonPaths) {
        if (p && fs.existsSync(p)) {
            console.log('✅ Found keytool at:', p);
            return p;
        }
    }

    // Try finding any jdk folder in Program Files
    try {
        const javaRoot = 'C:\\Program Files\\Java';
        if (fs.existsSync(javaRoot)) {
            const dirs = fs.readdirSync(javaRoot);
            for (const dir of dirs) {
                const p = path.join(javaRoot, dir, 'bin', 'keytool.exe');
                if (fs.existsSync(p)) {
                    console.log('✅ Found keytool at:', p);
                    return p;
                }
            }
        }
    } catch (e) { }

    return 'keytool'; // Hope it's in PATH
}

function getSHA1() {
    const keytool = findKeytool();
    const keystorePath = path.join(os.homedir(), '.android', 'debug.keystore');

    if (!fs.existsSync(keystorePath)) {
        console.error('❌ Debug keystore not found at:', keystorePath);
        return;
    }

    const cmd = `"${keytool}" -list -v -keystore "${keystorePath}" -alias androiddebugkey -storepass android -keypass android`;

    try {
        console.log('🏃 Running command to get SHA-1...');
        const output = execSync(cmd, { encoding: 'utf8' });

        // Extract SHA1
        const sha1Match = output.match(/SHA1: ([A-Fa-f0-9:]+)/);
        if (sha1Match) {
            console.log('\n=======================================');
            console.log('🎉 SUCCESS! HERE IS YOUR SHA-1:');
            console.log(sha1Match[1]);
            console.log('=======================================\n');
            console.log('👉 Copy this code and add it to Firebase Console -> Project Settings -> Your Apps (Android) -> Add Fingerprint');
        } else {
            console.log('⚠️ Command ran but could not find SHA1 in output.');
            console.log(output);
        }
    } catch (e) {
        console.error('❌ Failed to run keytool:', e.message);
        if (keytool === 'keytool') {
            console.log('💡 Tip: keytool is not in your PATH and could not be auto-located. Please install Java JDK.');
        }
    }
}

getSHA1();
