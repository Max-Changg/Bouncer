'use client';

import Image from 'next/image';
import Header from '@/components/header';
import ClientHome from '@/components/client-home';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const benefitsTitleRef = useRef<HTMLDivElement>(null);
  const benefitCard1Ref = useRef<HTMLDivElement>(null);
  const benefitCard2Ref = useRef<HTMLDivElement>(null);
  const benefitCard3Ref = useRef<HTMLDivElement>(null);
  const costAdvantageRef = useRef<HTMLDivElement>(null);
  const clientHomeRef = useRef<HTMLDivElement>(null);
  const whyBouncerSectionRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(true);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1, // Lower threshold to make it easier to trigger
      rootMargin: '0px 0px -50px 0px', // Smaller margin
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const element = entry.target as HTMLElement;
        console.log('Intersection detected:', {
          element: element.textContent?.slice(0, 20),
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
        });

        if (entry.isIntersecting) {
          // Add animate class to trigger the transition
          element.classList.add('animate');
          console.log(
            'Added animate class to:',
            element.textContent?.slice(0, 20)
          );
        } else {
          // Remove animate class to reset
          element.classList.remove('animate');
          console.log(
            'Removed animate class from:',
            element.textContent?.slice(0, 20)
          );
        }
      });
    }, observerOptions);

    // Try both refs and direct element selection as fallback
    const elementsToObserve = [
      headingRef.current,
      descRef.current,
      buttonsRef.current,
      benefitsTitleRef.current,
      benefitCard1Ref.current,
      benefitCard2Ref.current,
      benefitCard3Ref.current,
      costAdvantageRef.current,
      clientHomeRef.current,
    ];

    console.log(
      'Elements to observe:',
      elementsToObserve.map(el => el?.textContent?.slice(0, 20))
    );

    elementsToObserve.forEach(element => {
      if (element) {
        observer.observe(element);
        console.log('Observing element:', element.textContent?.slice(0, 20));
      }
    });

    // Fallback: also try to observe by class if refs don't work
    setTimeout(() => {
      const fallbackElements = document.querySelectorAll(
        '.opacity-0.transform.translate-y-8'
      );
      console.log('Fallback elements found:', fallbackElements.length);
      fallbackElements.forEach(element => {
        observer.observe(element);
        console.log(
          'Observing fallback element:',
          element.textContent?.slice(0, 20)
        );
      });
    }, 1000);

    // Observer for Why Bouncer section
    const sectionObserver = new window.IntersectionObserver(
      ([entry]) => {
        setShowScrollButton(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (whyBouncerSectionRef.current) {
      sectionObserver.observe(whyBouncerSectionRef.current);
    }
    return () => {
      sectionObserver.disconnect();
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-black via-black to-gray-700  overflow-hidden"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Static Light Beams Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Tilted spotlight beams - using center-anchored positioning */}
        <div
          className="absolute top-0 left-1/2 w-96 h-full bg-gradient-to-b from-purple-400/50 via-purple-500/25 to-transparent transform -translate-x-[200px] "
          style={{ clipPath: 'polygon(60% 0%, 80% 0%, 100% 100%, 0% 100%)' }}
        ></div>
        <div
          className="absolute top-0 left-1/2 w-96 h-full bg-gradient-to-b from-orange-400/50 via-orange-500/25 to-transparent transform -skew-x-12 static-beam"
          style={{ clipPath: 'polygon(70% 0%, 80% 0%, 100% 100%, 0% 100%)' }}
        ></div>
        <div
          className="absolute top-0 left-1/2 w-80 h-full bg-gradient-to-b from-purple-600/40 via-purple-600/20 to-transparent transform -translate-x-[400px] skew-x-22"
          style={{ clipPath: 'polygon(50% 0%, 80% 0%, 100% 100%, 0% 80%)' }}
        ></div>
        {/* <div
          className="absolute top-0 left-1/2 w-72 h-full bg-gradient-to-b from-orange-600/40 via-orange-600/20 to-transparent transform translate-x-[400px] skew-x-6 static-beam"
          style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}
        ></div> */}

        {/* <div
          className="absolute top-0 left-1/2 w-64 h-full bg-gradient-to-b from-purple-400/35 via-purple-400/18 to-transparent transform -translate-x-[600px] -skew-x-8"
          style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}
        ></div> */}
        {/* <div
          className="absolute top-0 left-1/2 w-64 h-full bg-gradient-to-b from-orange-400/35 via-orange-400/18 to-transparent transform translate-x-[600px] skew-x-8 static-beam"
          style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}
        ></div> */}
        {/* <div
          className="absolute top-0 left-1/2 w-56 h-full bg-gradient-to-b from-purple-500/30 via-purple-500/15 to-transparent transform -translate-x-[800px] -skew-x-4"
          style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}
        ></div> */}
        {/* <div
          className="absolute top-0 left-1/2 w-48 h-full bg-gradient-to-b from-orange-500/30 via-orange-500/15 to-transparent transform translate-x-[800px] skew-x-4 static-beam"
          style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}
        ></div> */}
      </div>

      {/* Header with transparency and higher z-index */}
      <div className="relative z-20">
        <Header />
      </div>

      <div className="grid min-h-screen grid-rows-[0px_1fr_20px] items-start justify-items-center gap-16 p-8 pb-20 sm:p-20 relative z-10">
        <main className="row-start-1 w-full max-w-7xl flex flex-col items-center justify-center mt-40">
          <div className="flex flex-col items-center text-center gap-8 w-full">
            {/* Left side - Text content */}
            <div className="text-gray-200 text-center w-full">
              <h1
                ref={headingRef}
                className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold mb-8 opacity-0 animate-fade-in-only leading-tight moving-gradient-text"
                style={{ animationDelay: '0.5s' }}
              >
                <span className="block lg:inline">Optimize </span>
                <span className="block lg:inline whitespace-nowrap">
                  Check-Ins
                </span>
              </h1>
              <div className="max-w-[800px] mx-auto">
                <p
                  ref={descRef}
                  className="text-2xl mb-8 opacity-0 animate-fade-in-only"
                >
                  Streamline your event management with our comprehensive
                  check-in solution designed for modern parties and events.
                </p>
              </div>
              <div
                ref={buttonsRef}
                className="opacity-0 animate-fade-in-only flex justify-center"
              >
                <ClientHome />
              </div>
            </div>

            {/* Right side - QR Code Image
            <div className="flex-1 flex justify-center -mt-2 order-1 lg:order-2">
              <Image
                src="/qr-code-hands.jpg"
                alt="Two hands holding smartphones with QR codes"
                width={600}
                height={400}
                className="rounded-lg shadow-lg animate-fade-in-up-delay-2"
                priority
              />
            </div> */}
          </div>
        </main>
      </div>

      {/* Benefits Section - moved higher up */}
      <section
        id="why-bouncer-section"
        className="relative z-10 py-12 px-8 sm:px-20"
        ref={whyBouncerSectionRef}
      >
        <div className="max-w-7xl mx-auto">
          <div
            className="text-center mb-16 opacity-0 transform translate-y-8 transition-all duration-800 ease-out"
            ref={benefitsTitleRef}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Why Choose Bouncer?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div
              className="bg-black/30 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20 opacity-0 transform translate-y-8 transition-all duration-800 ease-out"
              ref={benefitCard1Ref}
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Secure Check-ins
              </h3>
              <p className="text-gray-300">
                QR code-based verification ensures only authorized guests can
                enter your event.
              </p>
            </div>

            <div
              className="bg-black/30 backdrop-blur-sm rounded-lg p-6 border border-orange-500/20 opacity-0 transform translate-y-8 transition-all duration-800 ease-out"
              ref={benefitCard2Ref}
            >
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Payment Verification
              </h3>
              <p className="text-gray-300">
                Automatically cross-check payments with Venmo and Zelle
                statements for seamless verification.
              </p>
            </div>

            <div
              className="bg-black/30 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20 opacity-0 transform translate-y-8 transition-all duration-800 ease-out"
              ref={benefitCard3Ref}
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Real-time Updates
              </h3>
              <p className="text-gray-300">
                Live guest tracking and instant notifications keep you informed
                throughout your event.
              </p>
            </div>
          </div>

          {/* Cost Advantage Section */}
          <div
            className="bg-gradient-to-r from-purple-500/10 to-orange-500/10 rounded-lg p-8 border border-purple-500/20 opacity-0 transform translate-y-8 transition-all duration-800 ease-out"
            ref={costAdvantageRef}
          >
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Save Money on Every Transaction
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-semibold text-white mb-4">
                  Traditional Platforms
                </h4>
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
                <h4 className="text-xl font-semibold text-white mb-4">
                  Bouncer Advantage
                </h4>
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

      {/* Bouncing scroll-down button, only show if not at Why Bouncer section */}
      {showScrollButton && (
        <button
          onClick={() => {
            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: 'smooth',
            });
          }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/70 rounded-full p-3 shadow-lg animate-bounce hover:bg-black/90 transition-colors"
          aria-label="Scroll to bottom"
        >
          <svg
            className="size-8 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
