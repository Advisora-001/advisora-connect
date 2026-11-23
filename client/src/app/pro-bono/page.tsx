import Link from 'next/link';

export default function ProBonoPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Hero Banner */}
      <section className="bg-[#1B2A4A] text-white py-20 md:py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-block bg-[#00A6A6]/10 text-[#00A6A6] px-4 py-1.5 rounded-full text-sm font-semibold mb-6 tracking-wide uppercase">
              Advisora Impact
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6">
              Free Legal Assistance for Those Who Need It Most
            </h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl mx-auto">
              Advisora Impact is the pro bono and access-to-justice initiative of Advisora Connect Africa. It provides eligible individuals who cannot reasonably afford legal services with access to free, limited-scope legal assistance through our network of volunteer legal professionals.
            </p>
          </div>
        </div>
      </section>

      {/* What Legal Assistance */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B2A4A] tracking-tight mb-4">
              What Legal Assistance Do We Provide?
            </h2>
            <p className="text-[#667085] text-lg">
              Advisora Impact offers free, limited-scope legal assistance to eligible individuals who cannot reasonably afford legal services.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                number: '1',
                title: 'Free Initial Legal Consultation',
                desc: 'A one-off consultation to understand your legal problem, explain your rights and discuss available options and next steps.',
              },
              {
                number: '2',
                title: 'Legal Advice and Guidance',
                desc: 'Practical legal guidance on specific issues, including your rights, obligations, remedies and available legal processes.',
              },
              {
                number: '3',
                title: 'Legal Document Review',
                desc: 'Review of relevant legal documents and explanation of their legal implications.',
              },
              {
                number: '4',
                title: 'Basic Legal Document Preparation',
                desc: 'Assistance with selected legal letters, complaints, responses and other agreed documents.',
              },
              {
                number: '5',
                title: 'Limited-Scope Representation',
                desc: 'In selected cases, a volunteer lawyer may assist with negotiations, mediation, meetings or court proceedings.',
              },
            ].map((item) => (
              <div
                key={item.number}
                className="bg-[#F5F7FA] border border-[#E5EAF0] rounded-xl p-6 hover:border-[#00A6A6]/30 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-[#1B2A4A] rounded-lg flex items-center justify-center text-white font-bold text-lg mb-4 flex-shrink-0">
                  {item.number}
                </div>
                <h3 className="text-lg font-semibold text-[#1B2A4A] mb-2">{item.title}</h3>
                <p className="text-[#667085] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Priority Areas */}
      <section className="py-20 md:py-28 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B2A4A] tracking-tight mb-4">
              Our Priority Areas
            </h2>
            <p className="text-[#667085] text-lg">
              We prioritize legal assistance for individuals and groups facing the greatest vulnerability and hardship.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-[#E5EAF0] rounded-xl p-8 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-[#00A6A6]/10 text-[#00A6A6] rounded-lg flex items-center justify-center text-xl font-bold mb-4">
                ⚖️
              </div>
              <h3 className="text-xl font-semibold text-[#1B2A4A] mb-4">Women and Children</h3>
              <ul className="space-y-3 text-[#667085]">
                <li className="flex items-start">
                  <span className="text-[#00A6A6] mt-0.5">•</span>
                  <span className="ml-2">Domestic violence and abuse.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00A6A6] mt-0.5">•</span>
                  <span className="ml-2">Sexual abuse, harassment and exploitation.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00A6A6] mt-0.5">•</span>
                  <span className="ml-2">Child abuse, neglect and safeguarding.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00A6A6] mt-0.5">•</span>
                  <span className="ml-2">Child custody, maintenance and welfare matters involving genuine vulnerability or hardship.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00A6A6] mt-0.5">•</span>
                  <span className="ml-2">Protection of the rights of women and children.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-[#E5EAF0] rounded-xl p-8 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-[#00A6A6]/10 text-[#00A6A6] rounded-lg flex items-center justify-center text-xl font-bold mb-4">
                🆘
              </div>
              <h3 className="text-xl font-semibold text-[#1B2A4A] mb-4">Exceptional Hardship</h3>
              <ul className="space-y-3 text-[#667085]">
                <li className="flex items-start">
                  <span className="text-[#00A6A6] mt-0.5">•</span>
                  <span className="ml-2">Individuals facing exceptional hardship or urgent violations of their legal rights.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Cost */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#F5F7FA] border border-[#E5EAF0] rounded-xl p-8 md:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1B2A4A] tracking-tight mb-4">
                How Much Will It Cost?
              </h2>
              <p className="text-[#667085] text-lg">
                Approved assistance under Advisora Impact is provided without professional fees to the eligible applicant.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
              <div className="flex-1">
                <p className="text-[#667085] text-lg leading-relaxed">
                  Approved assistance under Advisora Impact will be provided without professional fees to the eligible applicant, within the scope agreed for that assignment.
                </p>
              </div>
              <div className="flex-1">
                <p className="text-[#667085] text-sm leading-relaxed">
                  However, any external expenses, statutory charges, filing fees, transport, expert fees or other disbursements must be disclosed and agreed in advance. Advisora Impact does not automatically undertake to fund these expenses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Apply */}
      <section className="py-20 md:py-28 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B2A4A] tracking-tight mb-4">
              How Do I Apply?
            </h2>
            <p className="text-[#667085] text-lg">
              Complete our Pro Bono Support Application Form and provide sufficient information about your circumstances and the legal assistance you require.
            </p>
          </div>

          <div className="bg-white border border-[#E5EAF0] rounded-xl p-8 md:p-12 max-w-2xl mx-auto">
            <ul className="space-y-4 text-[#667085]">
              <li className="flex items-start">
                <span className="text-[#00A6A6] mt-0.5">1.</span>
                <span className="ml-3">Complete the Pro Bono Support Application Form with details about your circumstances and the legal assistance you require.</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00A6A6] mt-0.5">2.</span>
                <span className="ml-3">Every application will be assessed individually, taking into account financial circumstances, urgency, vulnerability, the nature and merits of the legal issue, and the availability of an appropriate volunteer lawyer.</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00A6A6] mt-0.5">3.</span>
                <span className="ml-3">Approval for an initial consultation does not automatically guarantee further legal assistance or full representation.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-[#1B2A4A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Apply for Pro Bono Support?
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">
            If you cannot reasonably afford legal services and meet our eligibility criteria, complete our application form to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-block bg-[#00A6A6] text-white px-8 py-3.5 rounded-lg hover:bg-[#008F8F] transition-colors font-semibold text-base shadow-lg shadow-[#00A6A6]/20">
              Apply Now
            </Link>
            <Link href="/lawyers" className="inline-block border border-white text-white px-8 py-3.5 rounded-lg hover:bg-white hover:text-[#1B2A4A] transition-colors font-semibold text-base">
              Find a Lawyer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}