const fs = require('fs');
let code = fs.readFileSync('apps/web/src/app/[slug]/admin/page.tsx', 'utf8');

// Add import if missing (It might be there on line 7)
if (!code.includes('import ConfirmModal from')) {
  code = code.replace(
    "import { Users, CheckCircle, XCircle, Edit2, Trash2, Mail, Hash } from 'lucide-react';",
    "import { Users, CheckCircle, XCircle, Edit2, Trash2, Mail, Hash } from 'lucide-react';\nimport ConfirmModal from '../../../components/ui/ConfirmModal';"
  );
}

// Add confirmModalConfig state
if (!code.includes('confirmModalConfig')) {
  code = code.replace(
    "  const [members, setMembers] = useState<CommunityMember[]>([]);",
    "  const [members, setMembers] = useState<CommunityMember[]>([]);\n  const [confirmModalConfig, setConfirmModalConfig] = useState({ isOpen: false, title: '', message: '', confirmText: 'Konfirmasi', onConfirm: () => {} });"
  );
}

// Replace confirm 1
const oldConfirm1 = `                          onClick={async () => {
                            if (!confirm(\`Apakah Anda yakin ingin menyetujui perpanjangan membership untuk \${renewal.user?.name}?\`)) return;
                            try {`;
const newConfirm1 = `                          onClick={() => {
                            setConfirmModalConfig({
                              isOpen: true,
                              title: 'Setujui Perpanjangan',
                              message: \`Apakah Anda yakin ingin menyetujui perpanjangan membership untuk \${renewal.user?.name}?\`,
                              confirmText: 'Setujui',
                              onConfirm: async () => {
                                try {`;

code = code.replace(oldConfirm1, newConfirm1);

// Close the try/catch for confirm 1
const oldCatch1 = `                            } catch (err) {
                              alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
                            }
                          }}`;
const newCatch1 = `                            } catch (err) {
                              alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
                            }
                              }
                            });
                          }}`;
code = code.replace(oldCatch1, newCatch1);

// Replace confirm 2
const oldConfirm2 = `                        onClick={async () => {
                          if (!confirm(\`Apakah Anda yakin ingin menyetujui pembelian paket sesi untuk \${pkg.user?.name}?\`)) return;
                          try {`;
const newConfirm2 = `                        onClick={() => {
                          setConfirmModalConfig({
                            isOpen: true,
                            title: 'Setujui Pembelian',
                            message: \`Apakah Anda yakin ingin menyetujui pembelian paket sesi untuk \${pkg.user?.name}?\`,
                            confirmText: 'Setujui',
                            onConfirm: async () => {
                              try {`;

code = code.replace(oldConfirm2, newConfirm2);

// Close the try/catch for confirm 2
const oldCatch2 = `                          } catch (err) {
                            alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
                          }
                        }}`;
const newCatch2 = `                          } catch (err) {
                            alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
                          }
                            }
                          });
                        }}`;
code = code.replace(oldCatch2, newCatch2);

// Inject modal at the end
if (!code.includes('<ConfirmModal')) {
  code = code.replace(
    "    </div>\n  );\n}",
    "      <ConfirmModal\n        isOpen={confirmModalConfig.isOpen}\n        title={confirmModalConfig.title}\n        message={confirmModalConfig.message}\n        confirmText={confirmModalConfig.confirmText}\n        onConfirm={confirmModalConfig.onConfirm}\n        onCancel={() => setConfirmModalConfig({ ...confirmModalConfig, isOpen: false })}\n      />\n    </div>\n  );\n}"
  );
}

fs.writeFileSync('apps/web/src/app/[slug]/admin/page.tsx', code);
