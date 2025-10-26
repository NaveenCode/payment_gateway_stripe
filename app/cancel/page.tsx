export default function Cancel() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">
          Payment Cancelled
        </h1>
        <p className="mb-4">Your payment was cancelled.</p>
        <a
          href="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
        >
          Go Back Home
        </a>
      </div>
    </div>
  );
}
