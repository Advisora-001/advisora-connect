import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LegalDocument from './models/LegalDocument';

dotenv.config();

const TERMS_OF_USE = `TERMS OF USE
Effective Date: {Insert Date}
Last Updated: {Insert Date}
These Terms of Use ("Terms") govern access to and use of the Advisora Connect Africa Ltd. platform,
website, applications, and related services (collectively, the "Platform").
By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree to these
Terms, you must not use the Platform.
1. ABOUT THE PLATFORM
Advisora Connect Africa Ltd. ("Company," "we," "our," or "us") operates a professional services
marketplace that connects businesses, organizations, and individuals ("Clients") with independent legal
professionals, accountants, and related professionals ("Professionals") across Africa.
For purposes of these Terms, words including but not limited to "you" and "your" refer to any person or
entity accessing or using the Platform, including Clients, Professionals, visitors, representatives, or
account holders.
The Platform facilitates introductions, communication, workflow management, document exchange,
payment processing, and related professional support services.
The Company is not a law firm, accounting firm, tax advisory firm, or fiduciary service provider unless
expressly stated otherwise.
2. ELIGIBILITY
To use the Platform, you must:
• Be at least 18 years old;
• Have the legal capacity to enter into binding agreements;
• Provide accurate and complete registration information;
• Comply with all applicable laws and professional regulations in your jurisdiction.
If you are using the Platform on behalf of an organization, you represent that you have authority to bind
that organization to these Terms.
3. USER ACCOUNTS
You may be required to create an account to access certain services.
You are responsible for:
• Maintaining the confidentiality of your login credentials;
• All activity conducted through your account;
• Promptly notifying us of unauthorized use or security breaches.
We reserve the right to suspend or terminate accounts that violate these Terms or applicable laws.
4. PROFESSIONAL SERVICES DISCLAIMER
The Company provides a technology platform only.
We do not:
• Provide legal advice, accounting advice, tax advice, or financial advice;
• Guarantee the quality, legality, accuracy, or suitability of services provided by Professionals;
• Act as an agent, employer, partner, or representative of any Professional;
• Control or supervise the professional judgment of Professionals.
All professional engagements are entered into directly between Clients and Professionals.
Professionals are solely responsible for:
• Their professional conduct;
• Regulatory compliance;
• Licensing and certifications;
• Advice and services provided to Clients.
Clients are responsible for independently evaluating the suitability of any Professional.
5. PROFESSIONAL VERIFICATION
We may conduct verification checks on Professionals, including identity verification, licensing
verification, qualifications review, and compliance checks.
However, verification does not constitute:
• An endorsement;
• A guarantee of competence;
• A guarantee of continued licensing status;
• A certification by the Company.
Professionals must immediately notify the Company of any suspension, disciplinary action, criminal
investigation, or regulatory issue affecting their ability to provide services.
6. SCOPE OF SERVICES
The Platform may enable:
• Professional matchmaking;
• Engagement management;
• Messaging and collaboration;
• File and document sharing;
• Billing and invoicing;
• Payment processing;
• Subscription services;
• Educational and informational resources.
We may modify, suspend, or discontinue any feature of the Platform at any time.
7. FEES AND PAYMENTS
7.1 Client Payments
Clients agree to pay all fees associated with services obtained through the Platform.
Fees may include:
• Professional fees;
• Platform service fees;
• Subscription fees;
• Processing fees;
• Applicable taxes.
7.2 Professional Fees
Professionals authorize the Company or its payment partners to process payments on their behalf where
applicable.
The Company may deduct commissions, service fees, or other agreed amounts before remitting payments.
7.3 Taxes
Users are responsible for determining and fulfilling their own tax obligations under applicable local laws.
7.4 Refunds
Refund policies may vary depending on the nature of the service and applicable laws. Unless otherwise
stated, fees paid are non-refundable.
8. INDEPENDENT CONTRACTOR RELATIONSHIP
Professionals using the Platform are independent contractors and not employees, agents, partners, or
representatives of the Company.
Nothing in these Terms creates:
• An employment relationship;
• A partnership;
• A joint venture;
• An agency relationship.
Professionals are solely responsible for:
• Their taxes;
• Insurance;
• Regulatory compliance;
• Professional licensing;
• Employee obligations.
9. USER CONDUCT
You agree not to:
• Violate any applicable law or regulation;
• Infringe intellectual property rights;
• Upload unlawful, fraudulent, defamatory, or misleading content;
• Interfere with Platform security or operations;
• Circumvent payment systems or fees;
• Use the Platform for money laundering, fraud, or prohibited transactions;
• Harass, abuse, or threaten other users;
• Introduce malware or harmful code.
We may investigate violations and cooperate with law enforcement authorities.
10. PROFESSIONAL OBLIGATIONS
Professionals agree to:
• Maintain all required licenses and certifications;
• Comply with professional ethical obligations;
• Maintain client confidentiality;
• Avoid conflicts of interest;
• Deliver services competently and lawfully;
• Maintain required insurance where applicable.
Professionals must not misrepresent qualifications, experience, or authority.
11. CLIENT RESPONSIBILITIES
Clients agree to:
• Provide accurate information;
• Cooperate reasonably with Professionals;
• Make timely payments;
• Refrain from unlawful or abusive conduct;
• Independently assess professional advice before acting.
Clients remain responsible for decisions made based on professional services.
12. CONFIDENTIALITY
Users may receive confidential or sensitive information through the Platform.
You agree to:
• Keep confidential information secure;
• Use such information only for authorized purposes;
• Comply with applicable privacy and data protection laws.
Confidentiality obligations survive termination of these Terms.
13. DATA PROTECTION AND PRIVACY
We process personal data in accordance with our Privacy Policy and applicable data protection laws,
depending on the jurisdiction, this includes but is not limited to compliance with:
• The Nigeria Data Protection Act;
• South Africa's POPIA;
• Kenya's Data Protection Act;
• Ghana's Data Protection Act;
• Other applicable African and international privacy laws.
By using the Platform, you consent to the collection, processing, transfer, and storage of your information
as described in our Privacy Policy.
14. INTELLECTUAL PROPERTY
The Platform, including all software, branding, content, designs, graphics, trademarks, and materials, is
owned by or licensed to the Company.
You may not:
• Copy;
• Modify;
• Reverse engineer;
• Distribute;
• Commercially exploit;
• Reproduce Platform materials without written permission.
Users retain ownership of content they upload but grant the Company a worldwide, non-exclusive,
royalty-free license to host, process, display, and use such content for operating the Platform.
15. THIRD-PARTY SERVICES
The Platform may integrate with third-party services including payment processors, cloud storage
providers, communication tools, and identity verification providers.
We are not responsible for:
• Third-party services;
• Third-party outages;
• Third-party security incidents;
• Third-party policies or actions.
Use of third-party services may be subject to separate terms.
16. NO GUARANTEE OF OUTCOMES
The Company does not guarantee:
• Professional availability;
• Engagement opportunities;
• Financial results;
• Legal or tax outcomes;
• Business success;
• Continuous Platform availability.
Any ratings, reviews, or recommendations are informational only.
17. PLATFORM AVAILABILITY
We aim to maintain reliable service but do not guarantee uninterrupted or error-free operation.
The Platform may experience:
• Maintenance interruptions;
• Technical failures;
• Security incidents;
• Network outages.
We may suspend access temporarily for maintenance, upgrades, investigations, or security reasons.
18. LIMITATION OF LIABILITY
To the fullest extent permitted by law, the Company and its affiliates, directors, officers, employees, and
partners shall not be liable for:
• Indirect or consequential damages;
• Lost profits or revenue;
• Data loss;
• Business interruption;
• Professional malpractice by users;
• Reliance on information obtained through the Platform.
Our total liability arising from or related to the Platform shall not exceed the greater of:
• The amount paid by you to the Company in the preceding 12 months; or
• USD $75.
Some jurisdictions may not permit certain liability limitations, so portions of this section may not apply.
19. INDEMNIFICATION
You agree to indemnify and hold harmless the Company and its affiliates from any claims, liabilities,
damages, losses, costs, or expenses arising from:
• Your use of the Platform;
• Your breach of these Terms;
• Your violation of law;
• Professional services you provide or receive;
• Content you submit.
20. SUSPENSION AND TERMINATION
We may suspend or terminate your access to the Platform at any time if:
• You violate these Terms;
• We suspect unlawful activity;
• Required by law or regulators;
• Necessary to protect users or the Platform.
You may stop using the Platform at any time.
Termination does not affect accrued rights, payment obligations, or provisions intended to survive
termination.
21. DISPUTE RESOLUTION
21.1 Informal Resolution
Before initiating formal proceedings, parties agree to attempt good-faith resolution of disputes.
21.2 Arbitration
Unless prohibited by applicable law, disputes arising from these Terms may be resolved through
confidential arbitration in:
[Insert Jurisdiction and Arbitration Rules]
21.3 Court Jurisdiction
Where arbitration is not applicable, disputes shall be subject to the exclusive jurisdiction of the courts of
Lagos State, Nigeria.
22. COMPLIANCE WITH LAWS
Users agree to comply with:
• Anti-money laundering laws;
• Anti-corruption laws;
• Sanctions regulations;
• Professional licensing laws;
• Tax regulations;
• Consumer protection laws;
• Data protection laws.
The Company reserves the right to conduct compliance checks and report suspicious activity where
legally required.
23. Electronic Communications
By using the Platform, you consent to receive electronic communications from us, including:
• Notices;
• Agreements;
• Invoices;
• Security alerts;
• Marketing communications (subject to applicable consent requirements).
24. MODIFICATIONS TO TERMS
We may modify these Terms at any time, without prior notice.
Updated Terms will be posted on the Platform with a revised effective date.
Continued use of the Platform after changes become effective constitutes acceptance of the updated
Terms.
25. GOVERNING LAW
These Terms shall be governed by and interpreted in accordance with the laws of Nigeria, Africa. Without
regard to conflict of law principles.
26. SEVERABILITY
If any provision of these Terms is found unenforceable, the remaining provisions shall remain in full
force and effect.
27. ENTIRE AGREEMENT
These Terms, together with the Privacy Policy and any additional agreements, constitute the entire
agreement between you and the Company regarding use of the Platform.
28. CONTACT INFORMATION
For questions regarding these Terms, contact:
Advisora Connect Africa
[Business Address]
[Email Address]
[Phone Number]
www.advisoraconnect.com
29. ADDITIONAL CLAUSES FOR AFRICAN CROSS-BORDER SERVICES
{TO BE INSERTED}
• Cross-border data transfers;
• Regional regulatory cooperation;
• Foreign exchange and payment controls;
• Local licensing restrictions;
• Choice of language;
• Cross-border tax compliance;
• Regional dispute enforcement.
30. MARKETPLACE-SPECIFIC RISK DISCLOSURE
Users acknowledge that:
• Professional standards may differ by jurisdiction;
• Licensing rules vary across African countries;
• Cross-border legal and tax services may have regulatory limitations;
• Certain services may require local counsel or locally licensed professionals.
Clients are responsible for verifying whether a Professional is authorized to provide services in the
relevant jurisdiction.
31. BETA FEATURES
We may release beta or experimental features.
Beta features are provided "as is" without warranties and may be modified or discontinued at any time.
32. FORCE MAJEURE
We are not liable for delays or failures caused by events beyond our reasonable control, including:
• Natural disasters;
• Internet failures;
• Government actions;
• Civil unrest;
• Power outages;
• Cyberattacks;
• Labor disputes.
33. LANGUAGE
These Terms may be translated into multiple languages. In the event of conflict, the English version shall
prevail unless otherwise required by law.`;

const PRIVACY_POLICY = `PRIVACY POLICY
Advisora Connect Africa Ltd
Effective Date
____________
Last Updated
____________
Introduction
Welcome to Advisora Connect Africa Ltd ('Advisora', 'we', 'our', or 'us'). We are committed to protecting your privacy and ensuring that your personal information is collected, used, stored, and processed responsibly. This Privacy Policy explains how we collect, use, disclose, and protect your information when you visit our website, mobile applications, marketplace platform, and related services.

1. Information We Collect
Personal Information: Full name, email address, telephone number, address, company details, payment information and identification documents.

Advisor Information: Professional licenses, certifications, CV/resume, areas of specialization and references.

Technical Information: IP address, browser type, device information, cookies and website usage data.

Communication Information: Emails, chats, surveys and feedback.

2. How We Use Information
Create and manage accounts; verify advisor qualifications; match clients and advisors; process payments; improve services; prevent fraud; comply with legal obligations.

3. Legal Basis for Processing
User consent; contractual necessity; legal obligations; legitimate business interests.

4. Cookies and Tracking
We may use cookies and related technologies to improve website functionality and analyze website performance.

5. Sharing Information
We do not sell personal information. Information may be shared with service providers, advisors, clients, regulators and successors in business transactions.

6. International Data Transfers
Data may be transferred outside a user's country where appropriate safeguards exist.

7. Data Retention
Information is retained only for periods reasonably necessary to provide services and comply with legal obligations.

8. Security
We implement security measures including encryption, access restrictions and secure systems.

9. User Rights
Users may request access, correction, deletion, restriction of processing and withdrawal of consent.

10. Children's Privacy
Services are not intended for persons under 18 years.

11. Changes
This Privacy Policy may be updated periodically.

12. Contact Information
Advisora Connect Africa Ltd
Email: ____________
Website: ____________
Address: ____________`;

const DATA_PROTECTION = `ADVISORA CONNECT
DATA PROTECTION AND PRIVACY POLICY

1. Introduction

Advisora Connect Africa Ltd ("Advisora," "we," "our," or "us") is committed to protecting the privacy and personal data of all users, professionals, partners, employees, and visitors to our platform.

This Policy explains how we collect, use, store, protect, and process personal information.

---

2. Scope

This Policy applies to:

- Website visitors
- Platform users
- Clients
- Professionals
- Employees
- Contractors
- Business partners

---

3. Information We Collect

We may collect:

Personal Information

- Full name
- Email address
- Phone number
- Residential or business address
- Date of birth (where applicable)
- Government-issued identification

Professional Information

- Qualifications
- Certifications
- Licenses
- Professional memberships
- Employment information

Transaction Information

- Payment records
- Service bookings
- Subscription information

Technical Information

- Device information
- Browser type
- IP address
- Login information
- Usage analytics

---

4. Purpose of Processing

We process personal information to:

- Verify user identity
- Facilitate professional engagements
- Process payments
- Improve platform functionality
- Provide customer support
- Meet legal and regulatory obligations
- Prevent fraud and abuse
- Communicate platform updates

---

5. Legal Basis for Processing

We process personal information based on:

- User consent
- Contractual necessity
- Legal obligations
- Legitimate business interests

---

6. Information Sharing

Advisora may share information with:

- Verified professionals engaged by users
- Payment service providers
- Technology service providers
- Regulatory authorities where required by law

We do not sell personal information to third parties.

---

7. Data Security

Advisora implements appropriate technical and organizational measures including:

- Secure servers
- Access controls
- Password protection
- Data encryption where appropriate
- Regular security reviews

---

8. Data Retention

Personal information shall be retained only for as long as necessary to:

- Fulfill the purposes outlined in this Policy
- Meet legal obligations
- Resolve disputes
- Enforce agreements

---

9. User Rights

Subject to applicable laws, users may:

- Request access to their information
- Request correction of inaccurate information
- Request deletion of personal information
- Withdraw consent where applicable
- Object to certain processing activities

Requests may be submitted through designated support channels.

---

10. Cookies and Analytics

Advisora may use cookies and similar technologies to:

- Improve user experience
- Analyze platform performance
- Maintain security
- Personalize content

Users may manage cookie preferences through browser settings.

---

11. Cross-Border Data Transfers

Where information is transferred across jurisdictions, Advisora shall take reasonable measures to ensure adequate protection of personal data.

---

12. Children's Privacy

Advisora services are intended for adults and businesses unless expressly stated otherwise.

We do not knowingly collect personal information from children without appropriate consent and legal authorization.

---

13. Data Breach Management

In the event of a data breach, Advisora shall:

- Investigate promptly
- Mitigate risks
- Notify affected parties where required by law
- Take corrective actions

---

14. Policy Updates

This Policy may be updated periodically to reflect changes in operations, technology, or legal requirements.

The latest version shall be published on the Advisora platform.

---

15. Contact Information

For privacy-related inquiries, requests, or complaints, users may contact:

Privacy Officer
Advisora Connect

Email: privacy@advisoraconnect.com

Website: www.advisoraconnect.com

---

16. Effective Date

This Policy takes effect from the date of publication and applies to all users and professionals using the Advisora platform.`;

const CODE_OF_CONDUCT = `ADVISORA CONNECT
PROFESSIONAL CODE OF CONDUCT

1. Purpose
The Advisora Professional Code of Conduct establishes the ethical, professional, and service
standards expected of all professionals listed on the Advisora platform.
By joining Advisora, every professional agrees to uphold these standards and conduct
themselves in a manner that promotes trust, integrity, professionalism, and excellence.

---

2. Scope
This Code applies to all professionals using the Advisora platform, including but not limited to:
- Lawyers
- Accountants
- Tax Advisors
- Compliance Professionals
- Consultants
- Financial Advisors
- Business Advisors
- Other approved professionals

---

3. Core Principles
Professionals on Advisora shall conduct themselves according to the following principles:

Integrity
Act honestly, ethically, and in good faith at all times.

Competence
Provide services only within areas of qualification, expertise, and professional competence.

Professionalism
Maintain the highest standards of professional behavior in all dealings.

Confidentiality
Protect client information and maintain confidentiality except where disclosure is required by
law.

Accountability
Accept responsibility for services rendered and communications made.

Respect
Treat clients, colleagues, and platform users with dignity, fairness, and respect.

---

4. Professional Obligations
Professionals shall:
- Maintain valid licenses, certifications, or professional memberships where required.
- Provide accurate and current information on their profile.
- Respond to client inquiries professionally and within reasonable timeframes.
- Deliver services diligently and competently.
- Comply with all applicable laws, regulations, and professional rules.
- Disclose any limitations affecting service delivery.

---

5. Client Relationships
Professionals shall:
- Act in the best interests of their clients.
- Provide clear information regarding fees, timelines, and scope of work.
- Avoid misleading representations.
- Maintain professional boundaries.
- Obtain informed consent where applicable.

Professionals shall not:
- Exploit clients financially or otherwise.
- Engage in harassment, discrimination, or abusive conduct.
- Make false guarantees regarding outcomes.

---

6. Confidentiality
Professionals shall:
- Safeguard all confidential client information.
- Use client information only for authorized purposes.
- Implement reasonable measures to prevent unauthorized access.

Confidentiality obligations continue even after termination of services.

---

7. Conflict of Interest
Professionals must:
- Disclose actual, potential, or perceived conflicts of interest.
- Avoid situations that may compromise professional judgment.
- Refrain from acting where conflicts cannot be properly managed.

---

8. Platform Conduct
Professionals shall not:
- Misrepresent qualifications or experience.
- Circumvent platform policies.
- Engage in fraudulent conduct.
- Use the platform for unlawful activities.
- Post false, misleading, or deceptive information.

---

9. Compliance
Professionals must comply with:
- Applicable laws and regulations.
- Professional body requirements.
- Advisora policies and procedures.

---

10. Enforcement
Violation of this Code may result in:
- Warning
- Suspension
- Removal from the platform
- Reporting to relevant authorities or professional bodies where appropriate

---

11. Acknowledgement
All professionals joining Advisora shall acknowledge and agree to comply with this Code of
Conduct as a condition of participation on the platform.

Approved by:
Advisora Connect`;

const seedLegalDocuments = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('MongoDB connected for seeding legal documents...');

    const documents = [
      { slug: 'terms-of-use', title: 'Terms of Use', content: TERMS_OF_USE },
      { slug: 'privacy-policy', title: 'Privacy Policy', content: PRIVACY_POLICY },
      { slug: 'data-protection', title: 'Data Protection and Privacy Policy', content: DATA_PROTECTION },
      { slug: 'code-of-conduct', title: 'Professional Code of Conduct', content: CODE_OF_CONDUCT },
    ];

    for (const doc of documents) {
      const existing = await LegalDocument.findOne({ slug: doc.slug });
      if (existing) {
        console.log(`Updating: ${doc.title}`);
        await LegalDocument.findByIdAndUpdate(existing._id, {
          content: doc.content,
          title: doc.title,
          isActive: true,
        });
      } else {
        console.log(`Creating: ${doc.title}`);
        await LegalDocument.create({
          slug: doc.slug,
          title: doc.title,
          content: doc.content,
          isActive: true,
          effectiveDate: new Date(),
        });
      }
    }

    console.log('\n✅ Legal documents seeded successfully!');
    console.log('Documents created/updated:');
    documents.forEach((doc) => console.log(`  - ${doc.title} (${doc.slug})`));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedLegalDocuments();