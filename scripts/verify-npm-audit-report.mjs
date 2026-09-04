let input = '';

for await (const chunk of process.stdin) {
  input += chunk;
}

let report;
try {
  report = JSON.parse(input);
} catch {
  console.error('npm ci did not return valid JSON.');
  process.exit(1);
}

const vulnerabilities = report.audit?.vulnerabilities;

if (!vulnerabilities || !Number.isInteger(vulnerabilities.critical)) {
  console.error('npm ci did not return a complete audit report.');
  process.exit(1);
}

console.log('npm audit summary:', JSON.stringify(vulnerabilities));

if (vulnerabilities.critical > 0) {
  console.error(`${vulnerabilities.critical} critical vulnerabilities found.`);
  process.exit(1);
}
