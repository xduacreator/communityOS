const fs = require('fs');

// --- UPDATE LOGIN PAGE ---
let login = fs.readFileSync('apps/web/src/app/[slug]/login/page.tsx', 'utf8');

// Add useEffect import
if (!login.includes('useEffect')) {
  login = login.replace("import React, { useState } from 'react';", "import React, { useState, useEffect } from 'react';");
}

// Add state and fetch
if (!login.includes('setCommunity')) {
  login = login.replace(
    "const [loading, setLoading] = useState(false);",
    `const [loading, setLoading] = useState(false);
  const [community, setCommunity] = useState<any>(null);

  useEffect(() => {
    fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/communities/\${resolvedParams.slug}\`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if(data) setCommunity(data) })
      .catch(console.error);
  }, [resolvedParams.slug]);`
  );
}

// Replace logo and text
const loginOldHeader = `<div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
          <p className="text-slate-500 mt-2 font-medium">Log in to join events and sessions.</p>`;

const loginNewHeader = `{community?.logoUrl ? (
            <img src={community.logoUrl} alt={community.name} className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 border border-slate-200 shadow-sm" />
          ) : (
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-black text-indigo-600">{community?.name?.[0] || 'C'}</span>
            </div>
          )}
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Selamat Datang</h2>
          <p className="text-slate-500 mt-2 font-medium">Masuk untuk mengikuti event dan sesi di {community?.name || 'Komunitas'}.</p>`;

login = login.replace(loginOldHeader, loginNewHeader);

// Translate other texts in login
login = login.replace(/>Email Address</g, '>Alamat Email<');
login = login.replace(/>Password</g, '>Kata Sandi<');
login = login.replace(/'Logging in\.\.\.' : 'Sign In'/g, "'Masuk...' : 'Masuk'");
login = login.replace(/Don&apos;t have an account\? /g, "Belum punya akun? ");
login = login.replace(/>\s*Sign up here\s*</g, '>Daftar di sini<');
login = login.replace(/&larr; Back to Community/g, '&larr; Kembali ke Komunitas');
fs.writeFileSync('apps/web/src/app/[slug]/login/page.tsx', login);

// --- UPDATE REGISTER PAGE ---
let register = fs.readFileSync('apps/web/src/app/[slug]/register/page.tsx', 'utf8');

const regOldHeader = `<div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Join the Community</h2>
          <p className="text-slate-500 mt-2 font-medium">Create an account to participate in events.</p>`;

const regNewHeader = `{community?.logoUrl ? (
            <img src={community.logoUrl} alt={community.name} className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 border border-slate-200 shadow-sm" />
          ) : (
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-black text-emerald-600">{community?.name?.[0] || 'C'}</span>
            </div>
          )}
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Bergabung ke Komunitas</h2>
          <p className="text-slate-500 mt-2 font-medium">Buat akun untuk berpartisipasi di event {community?.name}.</p>`;

register = register.replace(regOldHeader, regNewHeader);

// Translate other texts in register
register = register.replace(/>Full Name</g, '>Nama Lengkap<');
register = register.replace(/>Email Address</g, '>Alamat Email<');
register = register.replace(/>Password</g, '>Kata Sandi<');
register = register.replace(/>Phone Number</g, '>Nomor HP / WhatsApp<');
register = register.replace(/>Select Membership Tier</g, '>Pilih Paket Membership<');
register = register.replace(/'Creating account\.\.\.' : 'Create Account'/g, "'Membuat akun...' : 'Buat Akun'");
register = register.replace(/Already have an account\? /g, "Sudah punya akun? ");
register = register.replace(/>\s*Sign in here\s*</g, '>Masuk di sini<');
register = register.replace(/&larr; Back to Community/g, '&larr; Kembali ke Komunitas');

fs.writeFileSync('apps/web/src/app/[slug]/register/page.tsx', register);
