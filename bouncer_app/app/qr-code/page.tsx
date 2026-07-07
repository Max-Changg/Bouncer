'use client';

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import QRCode from 'react-qr-code';
import type { Database } from '@/lib/database.types';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Button } from '@/components/ui/button';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function QRCodePage() {
  const [session, setSession] = useState<User | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const qrContainerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchQRCodeData = useCallback(
    async (userId: string) => {
      setLoading(true);
      setError(null);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('qr_code_data')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // Ignore no rows found error
        console.error('Error fetching profile:', profileError);
        setError(profileError.message);
      } else if (profileData && profileData.qr_code_data) {
        setQrCodeData(profileData.qr_code_data);
      } else {
        const newQrCodeData = userId;
        setQrCodeData(newQrCodeData);
        const { error: upsertError } = await supabase.from('profiles').upsert(
          {
            id: userId,
            qr_code_data: newQrCodeData,
          },
          {
            onConflict: 'id',
          }
        );

        if (upsertError) {
          console.error('Error upserting QR code data:', upsertError);
          setError(upsertError.message);
        }
      }
      setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user ?? null);
      if (!session) {
        router.push('/api/auth/direct-google');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session.user);
      } else {
        router.push('/api/auth/direct-google');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  useEffect(() => {
    if (session) {
      fetchQRCodeData(session.id);
    }
  }, [session, fetchQRCodeData]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
          aria-hidden="true"
        ></div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Loading QR Code...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md rounded-xl border border-border bg-white p-6 text-center shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Something went wrong
          </p>
          <p className="mt-2 text-sm text-foreground">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Redirecting...
  }

  const handleDownloadQr = async () => {
    try {
      const container = qrContainerRef.current;
      if (!container) return;
      const svg = container.querySelector('svg');
      if (!svg) return;

      // Serialize SVG
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      // Draw onto canvas for PNG export
      const image = new Image();
      const scale = 4; // improve resolution
      const size = (svg.getAttribute('width') || svg.getAttribute('height') || '256').replace('px', '');
      const baseSize = Number(size) || 256;
      const canvas = document.createElement('canvas');
      canvas.width = baseSize * scale;
      canvas.height = baseSize * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      image.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = 'bouncer-qr-code.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      image.onerror = () => {
        // Fallback: download SVG directly
        const fallbackLink = document.createElement('a');
        fallbackLink.href = url;
        fallbackLink.download = 'bouncer-qr-code.svg';
        document.body.appendChild(fallbackLink);
        fallbackLink.click();
        document.body.removeChild(fallbackLink);
        URL.revokeObjectURL(url);
      };

      image.src = url;
    } catch (e) {
      console.error('Failed to download QR code', e);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <Header />

      {/* Content */}
      <div className="flex-1">
        <div className="mx-auto max-w-2xl px-6 pb-16 pt-10 sm:px-8">
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              Check-in
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Your QR Code
            </h1>
          </div>

          {qrCodeData ? (
            <div className="mt-10 flex flex-col items-center">
              {/* Pass card */}
              <div className="relative w-full max-w-[340px] rounded-2xl border border-border bg-white p-6 text-left shadow-sm">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="text-primary">BOUNCER PASS</span>
                  <span>№ {session.id.slice(0, 4).toUpperCase()}</span>
                </div>

                <div
                  ref={qrContainerRef}
                  className="mt-4 flex justify-center rounded-xl bg-accent px-4 py-5 [&_svg]:h-auto [&_svg]:max-w-full"
                >
                  <QRCode value={qrCodeData} size={256} level="H" title="Event QR Code" />
                </div>

                {/* Perforation divider with punched side notches */}
                <div className="relative mt-5">
                  <div className="border-t border-dashed border-border" />
                  <span className="absolute -left-[34px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-border bg-background" />
                  <span className="absolute -right-[34px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-border bg-background" />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                      GUEST
                    </div>
                    <div className="truncate text-sm font-semibold text-foreground">
                      {session.user_metadata?.full_name ?? session.email}
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    ENTRY
                  </span>
                </div>
              </div>

              <p className="mt-6 max-w-sm text-center text-sm text-muted-foreground">
                After rsvping and filling out necessary payments, use this QR code to check in!
              </p>
              <div className="mt-6">
                <Button onClick={handleDownloadQr}>
                  <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-10 text-center text-sm text-muted-foreground">
              No QR code available.
            </p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
