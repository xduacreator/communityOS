const fs = require('fs');
let code = fs.readFileSync('apps/web/src/app/[slug]/admin/settings/page.tsx', 'utf8');

if (!code.includes('import ConfirmModal from')) {
  code = code.replace(
    "import { Plus, Trash2, Save, CreditCard, Image as ImageIcon, Banknote, HelpCircle, FileText } from 'lucide-react';",
    "import { Plus, Trash2, Save, CreditCard, Image as ImageIcon, Banknote, HelpCircle, FileText } from 'lucide-react';\nimport ConfirmModal from '../../../components/ui/ConfirmModal';"
  );
}

if (!code.includes('confirmModalConfig')) {
  code = code.replace(
    "  const [loading, setLoading] = useState(true);",
    "  const [loading, setLoading] = useState(true);\n  const [confirmModalConfig, setConfirmModalConfig] = useState({ isOpen: false, title: '', message: '', confirmText: 'Hapus', isDestructive: false, onConfirm: () => {} });"
  );
}

const oldConfirm = `                            onClick={async () => {
                              if (!confirm('Apakah Anda yakin ingin menghapus paket membership ini?')) return;
                              try {`;
const newConfirm = `                            onClick={() => {
                              setConfirmModalConfig({
                                isOpen: true,
                                title: 'Hapus Paket',
                                message: 'Apakah Anda yakin ingin menghapus paket membership ini? Tindakan ini tidak dapat dibatalkan.',
                                confirmText: 'Hapus',
                                isDestructive: true,
                                onConfirm: async () => {
                                  try {`;
code = code.replace(oldConfirm, newConfirm);

const oldCatch = `                              } catch (err) {
                                alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
                              }
                            }}`;
const newCatch = `                              } catch (err) {
                                alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
                              }
                                }
                              });
                            }}`;
code = code.replace(oldCatch, newCatch);

if (!code.includes('<ConfirmModal')) {
  code = code.replace(
    "    </div>\n  );\n}",
    "      <ConfirmModal\n        isOpen={confirmModalConfig.isOpen}\n        title={confirmModalConfig.title}\n        message={confirmModalConfig.message}\n        confirmText={confirmModalConfig.confirmText}\n        isDestructive={confirmModalConfig.isDestructive}\n        onConfirm={confirmModalConfig.onConfirm}\n        onCancel={() => setConfirmModalConfig({ ...confirmModalConfig, isOpen: false })}\n      />\n    </div>\n  );\n}"
  );
}

fs.writeFileSync('apps/web/src/app/[slug]/admin/settings/page.tsx', code);
