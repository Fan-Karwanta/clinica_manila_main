import React from 'react'

const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Terms and Conditions</h1>
      <div className="space-y-6 text-gray-600">
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">1. Introduction</h2>
          <p className="mb-3">
            Welcome to Clinica Manila's appointment setting platform. These Terms and Conditions govern your use of our website
            and services. By accessing or using our platform, you agree to be bound by these terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">2. Service Description</h2>
          <p className="mb-3">
            Clinica Manila provides an online platform for scheduling medical appointments. Our services include:
          </p>
          <ul className="list-disc ml-6 mb-3">
            <li>Online appointment booking with healthcare providers</li>
            <li>User account management</li>
            <li>Medical appointment scheduling and rescheduling</li>
            <li>Digital storage of basic medical information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">3. User Registration and Account</h2>
          <p className="mb-3">
            To use our services, you must:
          </p>
          <ul className="list-disc ml-6 mb-3">
            <li>Provide accurate, current, and complete information</li>
            <li>Submit a valid government-issued ID for verification</li>
            <li>Ensure all provided information is consistent with your government-issued valid ID</li>
            <li>Maintain and update your information as needed</li>
            <li>Keep your account credentials secure</li>
            <li>Be at least 18 years old or have guardian consent</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">4. Privacy and Data Protection</h2>
          <p className="mb-3">
            We are committed to protecting your privacy and personal information. By using our services, you consent to:
          </p>
          <ul className="list-disc ml-6 mb-3">
            <li>Collection and storage of personal information</li>
            <li>Processing of medical appointment data</li>
            <li>Communication regarding appointments and services</li>
            <li>Secure sharing of information with healthcare providers</li>
          </ul>
          <p className="mb-3">
            All data collection and processing comply with relevant privacy laws and regulations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">5. Appointment Policies</h2>
          <p className="mb-3">
            When booking appointments through our platform:
          </p>
          <ul className="list-disc ml-6 mb-3">
            <li>Provide accurate information about your medical concerns</li>
            <li>Arrive at least 15 minutes before your scheduled appointment</li>
            <li>Cancel or reschedule at least 24 hours in advance</li>
            <li>Follow clinic-specific guidelines and requirements</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">6. User Responsibilities</h2>
          <p className="mb-3">
            Users of our platform must:
          </p>
          <ul className="list-disc ml-6 mb-3">
            <li>Provide accurate medical and personal information</li>
            <li>Ensure all personal information provided matches exactly with your government-issued valid ID</li>
            <li>Keep appointments or provide timely notice of cancellation</li>
            <li>Respect healthcare providers and staff</li>
            <li>Pay any applicable fees according to clinic policies</li>
            <li>Follow medical advice and treatment plans as prescribed</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">7. Limitation of Liability</h2>
          <p className="mb-3">
            Clinica Manila strives to provide reliable services but:
          </p>
          <ul className="list-disc ml-6 mb-3">
            <li>Is not responsible for medical outcomes or advice</li>
            <li>Does not guarantee appointment availability</li>
            <li>May experience technical difficulties or maintenance downtimes</li>
            <li>Reserves the right to modify or discontinue services</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">8. Changes to Terms</h2>
          <p className="mb-3">
            We reserve the right to modify these terms at any time. Users will be notified of significant changes,
            and continued use of our services constitutes acceptance of modified terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">9. Contact Information</h2>
          <p className="mb-3">
            For questions or concerns about these terms, please contact us at:
          </p>
          <ul className="list-none mb-3">
            <li>Email: support@clinicamanila.com</li>
            <li>Phone: 09123456789</li>
            <li>Address: General Santos City</li>
          </ul>
        </section>

        <section className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Last updated: February 15, 2025
          </p>
        </section>
      </div>
    </div>
  )
}

export default Terms
