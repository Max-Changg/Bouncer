import Image from 'next/image';
import Header from '@/components/header';
import ClientHome from '@/components/client-home';

export default function Home() {
  return (
    <div>
      <Header />

      <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
        <main className="row-start-2">
          <h1 className="text-6xl font-bold">
            Welcome to the Future of Party Check-Ins
          </h1>
          <p className="text-lg">
            Say goodbye to long lines and say hello to hassle-free check-ins
            with our automated system.
          </p>
          <ClientHome />
        </main>
        <footer className="row-start-3 flex flex-wrap items-center justify-center gap-[24px]">
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/file.svg"
              alt="File icon"
              width={16}
              height={16}
            />
            Learn
          </a>
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/window.svg"
              alt="Window icon"
              width={16}
              height={16}
            />
            Examples
          </a>
        </footer>
      </div>
    </div>
  );
}
