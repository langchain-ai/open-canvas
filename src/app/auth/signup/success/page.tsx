"use client";

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Successfully Signed Up!</h1>
        <p className="text-gray-600 mb-4">
          Please check your email for a confirmation link. That link will
          redirect you to Open Canvas.
        </p>
        <p className="text-sm text-gray-500">
          If you don&apos;t see the email, please check your spam folder.
        </p>
      </div>
    </div>
  );
}
