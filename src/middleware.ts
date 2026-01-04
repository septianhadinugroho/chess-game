// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Cek apakah mode maintenance aktif via Environment Variable
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  // Jika mode maintenance AKTIF
  if (isMaintenanceMode) {
    // Jangan blokir akses ke halaman maintenance itu sendiri
    if (request.nextUrl.pathname === '/maintenance') {
      return NextResponse.next();
    }

    // Jangan blokir file statis (gambar, ikon, css, js)
    // Ini penting agar halaman maintenance tetap punya styling & gambar
    const isStaticAsset = 
      request.nextUrl.pathname.startsWith('/_next') || 
      request.nextUrl.pathname.includes('.') || // mendeteksi file extension (.png, .css, dll)
      request.nextUrl.pathname.startsWith('/api'); // Opsional: jika API mau tetap jalan

    if (isStaticAsset) {
      return NextResponse.next();
    }

    // Rewrite URL lain ke halaman maintenance (URL di browser tetap sama, tapi isinya halaman maintenance)
    return NextResponse.rewrite(new URL('/maintenance', request.url));
  }

  // Jika mode maintenance MATI, tapi user mencoba akses /maintenance secara manual,
  // redirect mereka kembali ke home
  if (!isMaintenanceMode && request.nextUrl.pathname === '/maintenance') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Konfigurasi path mana saja yang kena middleware
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};