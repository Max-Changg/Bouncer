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
        router.push('/login');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session.user);
      } else {
        router.push('/login');
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
    return <div>Loading QR Code...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden flex flex-col">
      {/* Neon arcs & dotted grid */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-[-120px] w-[520px] h-[520px] rounded-full bg-purple-700/25 blur-3xl mix-blend-screen"></div>
        <div className="absolute bottom-[-140px] -left-24 w-[560px] h-[560px] rounded-full bg-indigo-600/20 blur-3xl mix-blend-screen"></div>
        <div className="absolute inset-0 opacity-[0.14]"
             style={{
               backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
               color: '#ffffff',
               backgroundSize: '22px 22px',
               backgroundPosition: '0 0, 11px 11px',
             }}></div>
      </div>

      {/* Header */}
      <div className="relative z-20">
        <Header />
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="relative max-w-7xl mx-auto px-6 pb-16 sm:px-8 lg:px-12">
          <h1 className="text-5xl font-bold mb-12 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Your QR Code
          </h1>

          <div className="bg-gray-800/90 backdrop-blur-sm rounded-3xl border border-gray-700/50 shadow-xl shadow-black/50 p-6 sm:p-8">
            {qrCodeData ? (
              <div className="flex flex-col items-center">
                <div ref={qrContainerRef} className="p-4 bg-white rounded-xl">
                  <QRCode value={qrCodeData} size={256} level="H" title="Event QR Code" />
                </div>
                <p className="mt-4 text-gray-300">Scan this code at the event entrance.</p>
                <div className="mt-6">
                  <Button onClick={handleDownloadQr} className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 shadow-lg hover:shadow-purple-800/40 transition-all duration-200">
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-300">No QR code available.</p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
