'use client';

import Image from 'next/image';
import Header from '@/components/header';
import ClientHome from '@/components/client-home';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Static Light Beams Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Tilted spotlight beams */}
        <div className="absolute top-0 left-1/4 w-96 h-full bg-gradient-to-b from-purple-500/50 via-purple-500/25 to-transparent transform -skew-x-12"></div>
        <div className="absolute top-0 right-1/4 w-96 h-full bg-gradient-to-b from-orange-500/50 via-orange-500/25 to-transparent transform skew-x-12"></div>
        <div className="absolute top-0 left-1/2 w-80 h-full bg-gradient-to-b from-purple-600/40 via-purple-600/20 to-transparent transform -skew-x-6"></div>
        <div className="absolute top-0 right-1/3 w-72 h-full bg-gradient-to-b from-orange-600/40 via-orange-600/20 to-transparent transform skew-x-6"></div>
        
        {/* Additional tilted beams */}
        <div className="absolute top-0 left-1/6 w-64 h-full bg-gradient-to-b from-purple-400/35 via-purple-400/18 to-transparent transform -skew-x-8"></div>
        <div className="absolute top-0 right-1/6 w-64 h-full bg-gradient-to-b from-orange-400/35 via-orange-400/18 to-transparent transform skew-x-8"></div>
        <div className="absolute top-0 left-3/4 w-56 h-full bg-gradient-to-b from-purple-500/30 via-purple-500/15 to-transparent transform -skew-x-4"></div>
        <div className="absolute top-0 right-1/2 w-48 h-full bg-gradient-to-b from-orange-500/30 via-orange-500/15 to-transparent transform skew-x-4"></div>
        
        {/* Circular spotlights */}
        <div className="absolute top-1/4 left-1/5 w-80 h-80 bg-purple-500/30 rounded-full blur-xl"></div>
        <div className="absolute top-1/3 right-1/5 w-72 h-72 bg-orange-500/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-1/4 left-2/5 w-64 h-64 bg-purple-600/25 rounded-full blur-xl"></div>
        <div className="absolute bottom-1/3 right-2/5 w-56 h-56 bg-orange-600/25 rounded-full blur-xl"></div>
        
        {/* Center light */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-500/20 rounded-full blur-2xl"></div>
      </div>

      {/* Header with transparency and higher z-index */}
      <div className="relative z-20">
        <Header />
      </div>

      <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 sm:p-20 relative z-10">
        <main className="row-start-2 w-full max-w-7xl">
          <div className="flex flex-col lg:flex-row items-start gap-12">
            {/* Left side - Text content */}
            <div className="text-gray-200 flex-1 text-left order-2 lg:order-1">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in-up leading-tight">
                <span className="block sm:inline">Welcome to the</span>
                <span className="block sm:inline"> Future of</span>
                <span className="block sm:inline"> Party Check-Ins</span>
              </h1>
              <div className="max-w-[600px]">
                <p className="text-lg mb-8 animate-fade-in-up-delay-1" style={{ fontFamily: 'Newsreader, serif' }}>
                  Streamline your event management with our comprehensive check-in 
                  solution designed for modern parties and events.                </p>
              </div>
              <div className="animate-fade-in-up-delay-2">
                <ClientHome />
              </div>
            </div>
            
            {/* Right side - QR Code Image */}
            <div className="flex-1 flex justify-center -mt-2 order-1 lg:order-2">
              <Image
                src="/qr-code-hands.jpg"
                alt="Two hands holding smartphones with QR codes"
                width={600}
                height={400}
                className="rounded-lg shadow-lg animate-fade-in-up-delay-3"
                priority
              />
            </div>
          </div>
        </main>
      </div>

      {/* Benefits Section */}
      <section className="relative z-10 py-20 px-8 sm:px-20">
        {/* Additional spotlights for the benefits section */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Spotlight over the "Why Choose Bouncer?" heading */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-32 bg-gradient-to-b from-purple-500/30 via-purple-500/15 to-transparent rounded-full blur-xl"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-80 h-28 bg-gradient-to-b from-orange-500/30 via-orange-500/15 to-transparent rounded-full blur-xl"></div>
          
          {/* Spotlights over the feature cards */}
          <div className="absolute top-1/4 left-1/4 w-64 h-48 bg-gradient-to-b from-purple-500/25 via-purple-500/12 to-transparent rounded-full blur-lg"></div>
          <div className="absolute top-1/4 right-1/4 w-64 h-48 bg-gradient-to-b from-orange-500/25 via-orange-500/12 to-transparent rounded-full blur-lg"></div>
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-64 h-48 bg-gradient-to-b from-purple-600/25 via-purple-600/12 to-transparent rounded-full blur-lg"></div>
          
          {/* Spotlight over the cost advantage section */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-32 bg-gradient-to-t from-orange-500/20 via-orange-500/10 to-transparent"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-24 bg-gradient-to-t from-purple-500/20 via-purple-500/10 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Why Choose Bouncer?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20 animate-fade-in-up-delay-1">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Secure Check-ins</h3>
              <p className="text-gray-300">QR code-based verification ensures only authorized guests can enter your event.</p>
            </div>

            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6 border border-orange-500/20 animate-fade-in-up-delay-2">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Payment Verification</h3>
              <p className="text-gray-300">Automatically cross-check payments with Venmo and Zelle statements for seamless verification.</p>
            </div>

            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20 animate-fade-in-up-delay-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Real-time Updates</h3>
              <p className="text-gray-300">Live guest tracking and instant notifications keep you informed throughout your event.</p>
            </div>
          </div>

          {/* Cost Advantage Section */}
          <div className="bg-gradient-to-r from-purple-500/10 to-orange-500/10 rounded-lg p-8 border border-purple-500/20 animate-fade-in-up-delay-4">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Save Money on Every Transaction
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-semibold text-white mb-4">Traditional Platforms</h4>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <span className="text-red-400 mr-2">✗</span>
                    Eventbrite: 2.9% + $0.79 per ticket
                  </li>
                  <li className="flex items-center">
                    <span className="text-red-400 mr-2">✗</span>
                    RSVPify: 2.9% + $0.30 per transaction
                  </li>
                  <li className="flex items-center">
                    <span className="text-red-400 mr-2">✗</span>
                    Hidden fees and processing charges
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-4">Bouncer Advantage</h4>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Direct Venmo/Zelle verification
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    No transaction fees on payments
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Transparent pricing structure
                  </li>
                </ul>
              </div>
            </div>
            <div className="text-center mt-6">
              <p className="text-lg text-white font-semibold">
                Keep more of your money with direct payment verification!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
