import Link from "next/link";

export default function Submitted() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">
            Thanks for submitting your identity document.
          </h1>
          <p className="text-gray-600 mb-8">
            We are processing your verification.
          </p>

          <Link
            href="/"
            className="text-stripe-purple hover:underline font-semibold"
          >
            Restart demo
          </Link>
        </div>
      </div>
    </main>
  );
}
