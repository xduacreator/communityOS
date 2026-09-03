const {
  sanitizeHeadlineHtml,
  sanitizeRichHtml,
} = require('../dist/security/html-sanitizer');

const richResult = sanitizeRichHtml(
  '<h2 onclick="steal()">Title</h2><script>alert(1)</script><a href="javascript:alert(1)">click</a>',
);
if (
  richResult.includes('script') ||
  richResult.includes('onclick') ||
  richResult.includes('javascript:')
) {
  throw new Error('Rich HTML sanitizer allowed an unsafe payload');
}

const headlineResult = sanitizeHeadlineHtml(
  'Safe<br><span class="text-indigo-600" onclick="steal()">Headline</span><img src=x>',
);
if (headlineResult !== 'Safe<br /><span class="text-indigo-600">Headline</span>') {
  throw new Error(`Unexpected headline sanitization result: ${headlineResult}`);
}

console.log('Security sanitizer smoke test passed');
