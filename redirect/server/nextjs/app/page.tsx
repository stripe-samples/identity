export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-[#ed5f74]">
          Verify your identity to book
        </h1>
        <h4 className="text-sm text-gray-500 mb-8">
          Get ready to take a photo of your ID and a selfie
        </h4>

        <form action="/api/create-verification-session" method="POST">
          <button
            type="submit"
            className="w-full bg-[#ed5f74] text-white py-3 px-4 rounded-md font-semibold hover:opacity-90 transition-all"
          >
            Verify me
          </button>
        </form>
      </div>
    </main>
  );
}
