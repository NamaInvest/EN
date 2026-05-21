import React from 'react';

export default function TrustCenterPage() {
    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            <div className="bg-teal-900 text-white py-16">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-4xl font-bold mb-4">Namasoft Trust Center</h1>
                    <p className="text-xl text-teal-100">Security, Privacy, and Compliance at our core.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 mt-12 space-y-12">
                
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <span className="text-3xl mr-3">🛡️</span> Compliance & Certifications
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border border-gray-100 p-4 rounded-xl">
                            <h3 className="font-bold text-lg">ZATCA Phase 2</h3>
                            <p className="text-gray-600 text-sm mt-2">Fully compliant with the Saudi Arabian Tax Authority E-Invoicing mandate.</p>
                            <span className="inline-block mt-3 bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-semibold">Verified</span>
                        </div>
                        <div className="border border-gray-100 p-4 rounded-xl">
                            <h3 className="font-bold text-lg">PDPL Compliant</h3>
                            <p className="text-gray-600 text-sm mt-2">Adheres to the Saudi Personal Data Protection Law (Royal Decree M/19).</p>
                            <span className="inline-block mt-3 bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-semibold">Verified</span>
                        </div>
                    </div>
                </section>

                <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <span className="text-3xl mr-3">📜</span> Legal Documents
                    </h2>
                    <ul className="space-y-4">
                        <li>
                            <a href="/legal/terms" className="text-teal-700 hover:underline font-medium text-lg">Terms of Service</a>
                            <p className="text-gray-500 text-sm">Rules and guidelines for using Namasoft.</p>
                        </li>
                        <li>
                            <a href="/legal/privacy" className="text-teal-700 hover:underline font-medium text-lg">Privacy Policy</a>
                            <p className="text-gray-500 text-sm">How we collect, use, and protect your data.</p>
                        </li>
                        <li>
                            <a href="/legal/dpa" className="text-teal-700 hover:underline font-medium text-lg">Data Processing Agreement (DPA)</a>
                            <p className="text-gray-500 text-sm">For enterprise customers requiring strict data processing terms.</p>
                        </li>
                    </ul>
                </section>

                <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <span className="text-3xl mr-3">☁️</span> Subprocessors
                    </h2>
                    <p className="text-gray-600 mb-4">To deliver our services, we use the following vetted third-party subprocessors:</p>
                    <table className="min-w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Purpose</th>
                                <th className="px-6 py-3">Location</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="px-6 py-4 font-medium text-gray-900">Hetzner Online GmbH</td>
                                <td className="px-6 py-4">Cloud Hosting & Database</td>
                                <td className="px-6 py-4">Germany / Finland</td>
                            </tr>
                            <tr className="border-b">
                                <td className="px-6 py-4 font-medium text-gray-900">Cloudflare</td>
                                <td className="px-6 py-4">CDN & Web Application Firewall</td>
                                <td className="px-6 py-4">Global</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            </div>
        </div>
    );
}
