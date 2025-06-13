"use client";

import { Button } from "@/components/ui/button"; // Assuming this path is correct

export default function Home() {
  return (
    <main>
      <nav className="bg-white shadow-md p-4 sticky top-0 z-50"> {/* Added sticky and z-index for visibility */}
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">LegalEase Africa</div>
          <div className="space-x-4">
            <a href="#" className="hover:text-secondary">Home</a>
            <a href="#features" className="hover:text-secondary">Features</a>
            <a href="#countries" className="hover:text-secondary">Countries</a>
            <a href="#pricing" className="hover:text-secondary">Pricing</a>
            <a href="/auth/login" className="hover:text-secondary">Login</a>
          </div>
        </div>
      </nav>

      <section className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-4xl font-bold text-primary">LegalEase Africa</h1>
        <p className="mt-4 text-lg text-muted">
          Affordable, localized legal help for startups and SMEs across Africa.
        </p>
        <Button className="mt-6">Get Started</Button>
      </section>

      <section id="features" className="py-16 bg-gray-100"> {/* Placeholder background */}
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8 text-left"> {/* Changed text-center to text-left for card content */}
            <div className="p-6 shadow-lg rounded-lg bg-white">
              <h3 className="text-xl font-semibold mb-2">Legal Document Templates</h3>
              <p className="text-gray-600">Access a library of lawyer-vetted legal documents tailored for African startups.</p>
            </div>
            <div className="p-6 shadow-lg rounded-lg bg-white">
              <h3 className="text-xl font-semibold mb-2">Compliance Checklists</h3>
              <p className="text-gray-600">Navigate regulatory requirements with country-specific compliance guides.</p>
            </div>
            <div className="p-6 shadow-lg rounded-lg bg-white">
              <h3 className="text-xl font-semibold mb-2">Monthly Legal Access</h3>
              <p className="text-gray-600">Get dedicated time with legal experts for advice and document review.</p>
            </div>
            <div className="p-6 shadow-lg rounded-lg bg-white">
              <h3 className="text-xl font-semibold mb-2">Real-Time Alerts</h3>
              <p className="text-gray-600">Stay updated on new laws and regulations affecting your business.</p>
            </div>
            <div className="p-6 shadow-lg rounded-lg bg-white">
              <h3 className="text-xl font-semibold mb-2">Legal Q&A by Country</h3>
              <p className="text-gray-600">Find answers to common legal questions for your specific jurisdiction.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Subscription Tiers</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6 shadow-lg rounded-lg bg-white border border-gray-200">
              <h3 className="text-2xl font-semibold mb-3">Basic Tier</h3>
              <p className="text-gray-700 mb-4">Templates + Alerts</p>
              {/* <Button variant="outline">Choose Basic</Button> */}
            </div>
            <div className="p-6 shadow-lg rounded-lg bg-white border border-gray-200">
              <h3 className="text-2xl font-semibold mb-3">Growth Tier</h3>
              <p className="text-gray-700 mb-4">Consultations + Vetting</p>
              {/* <Button variant="outline">Choose Growth</Button> */}
            </div>
            <div className="p-6 shadow-lg rounded-lg bg-white border border-gray-200">
              <h3 className="text-2xl font-semibold mb-3">Premium Tier</h3>
              <p className="text-gray-700 mb-4">Concierge + Representation</p>
              {/* <Button variant="outline">Choose Premium</Button> */}
            </div>
          </div>
        </div>
      </section>

      <section id="countries" className="py-16 bg-gray-100"> {/* Placeholder background */}
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Supported Countries</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
            <div className="p-4 border rounded-md bg-white shadow">Kenya</div>
            <div className="p-4 border rounded-md bg-white shadow">Nigeria</div>
            <div className="p-4 border rounded-md bg-white shadow">South Africa</div>
            <div className="p-4 border rounded-md bg-white shadow">Uganda</div>
            <div className="p-4 border rounded-md bg-white shadow">Ghana</div>
          </div>
        </div>
      </section>

      <footer className="text-center p-4 mt-12 border-t text-muted">
        <p className="text-sm">
          © {new Date().getFullYear()} LegalEase Africa. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
