import Link from "next/link";

export default function Submitted() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-[#ed5f74]">
          Thanks for submitting your identity document.
        </h1>
        <p className="text-gray-600 mb-6">We are processing your verification.</p>

        <Link
          href="/"
          className="text-[#ed5f74] hover:opacity-80 transition-all"
        >
          Restart demo
        </Link>
      </div>
    </main>
  );
}
