export default function CancelPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-xl text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Checkout canceled</h1>
        <p className="text-gray-600 mb-8">No worries—your cart is saved if you want to try again.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/merch" className="px-5 py-3 rounded bg-red-600 text-white hover:bg-red-700">
            Try Again
          </a>
          <a href="/register" className="px-5 py-3 rounded border border-gray-300 hover:bg-gray-100">
            Reserve My Spot
          </a>
        </div>
      </div>
    </main>
  );
}