const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, parentPath = 'src') {
  let results = [];
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const relativePath = path.join(parentPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, relativePath));
    } else {
      const code = fs.readFileSync(filePath, 'utf-8');
      results.push({ path: relativePath, code });
    }
  }
  return results;
}

function generateCodeFile(folderPath, outputFilePath) {
  const filesData = getAllFiles(folderPath, 'src/' + path.basename(folderPath));

  let content = '';
  for (const file of filesData) {
    content += `${file.path}\n`;
    content += `${file.code}\n\n`;
  }

  fs.writeFileSync(outputFilePath, content, 'utf-8');
  console.log(`Code file generated: ${outputFilePath}`);
}

// Example usage:
const folderPath = path.join(__dirname, 'app');
const outputFilePath = path.join(__dirname, 'code-dump.txt');
generateCodeFile(folderPath, outputFilePath);
