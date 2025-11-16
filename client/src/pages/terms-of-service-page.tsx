import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { FileText, Scale } from "lucide-react";

const TermsOfServicePage = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen pb-20">
      {/* Hero section */}
      <section className="bg-gradient-to-b from-primary/10 to-white py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/50">
              <Scale className="w-3 h-3 mr-1" />
              Legal Document
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-lg text-slate-600 mb-8">
              Please review these terms carefully before using talkastranger.com
            </p>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border p-6 md:p-8">
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl font-bold">Terms of Service for talkastranger.com</h2>
              
              <p>
                Welcome to talkastranger.com, a platform for exploring and connecting with people and tokens from 
                different places around the world. These Terms of Service govern your use of talkastranger.com and 
                all related services, features, and content offered by us.
              </p>
              
              <p>
                By accessing or using the talkastranger.com website, mobile applications, or any other services 
                provided by talkastranger.com (collectively, the "Services"), you agree to be bound by these Terms. 
                If you do not agree to these Terms, please do not use our Services.
              </p>

              <h3 className="text-xl font-semibold mt-6">1. Acceptance of Terms</h3>
              <p>
                By creating an account or using any part of our Services, you acknowledge that you have read, 
                understood, and agree to be bound by these Terms, as well as our Privacy Policy.
              </p>

              <h3 className="text-xl font-semibold mt-6">2. Eligibility</h3>
              <p>
                You must be at least 18 years old to use our Services. By using talkastranger.com, you represent 
                and warrant that you are at least 18 years of age and have the legal capacity to enter into these Terms.
              </p>

              <h3 className="text-xl font-semibold mt-6">3. Account Registration and Security</h3>
              <p>
                To access certain features of talkastranger.com, you may need to create an account and connect a cryptocurrency wallet.
              </p>
              <ul>
                <li>
                  You are responsible for maintaining the confidentiality of your account credentials and wallet private keys.
                </li>
                <li>
                  You agree to provide accurate and complete information when creating your account.
                </li>
                <li>
                  You are solely responsible for all activities that occur under your account.
                </li>
                <li>
                  You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">4. User Conduct</h3>
              <p>
                When using talkastranger.com, you agree not to:
              </p>
              <ul>
                <li>
                  Violate any applicable laws, regulations, or third-party rights.
                </li>
                <li>
                  Post, upload, or share content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, 
                  obscene, invasive of privacy, or otherwise objectionable.
                </li>
                <li>
                  Impersonate any person or entity or falsely state or misrepresent your affiliation with a person or entity.
                </li>
                <li>
                  Engage in any activity that could disable, overburden, damage, or impair the functionality of talkastranger.com.
                </li>
                <li>
                  Use the platform to conduct fraudulent transactions or engage in illegal financial activities.
                </li>
                <li>
                  Attempt to access any other user's account or private information without authorization.
                </li>
                <li>
                  Use the Services to distribute malware, viruses, or other malicious code.
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">5. Cryptocurrency Transactions and Token Swaps</h3>
              <p>
                talkastranger.com facilitates peer-to-peer token swaps and other cryptocurrency transactions.
              </p>
              <ul>
                <li>
                  <strong>Responsibility:</strong> You are solely responsible for understanding the nature, risks, and details 
                  of all transactions you engage in on our platform.
                </li>
                <li>
                  <strong>No Guarantees:</strong> We do not guarantee the value or liquidity of any cryptocurrency or token traded 
                  on our platform. The value of cryptocurrencies can be volatile, and you could lose all or part of your investment.
                </li>
                <li>
                  <strong>Irreversibility:</strong> Blockchain transactions are generally irreversible. We cannot reverse or recover 
                  cryptocurrency transactions once they have been initiated.
                </li>
                <li>
                  <strong>Tax Obligations:</strong> You are responsible for determining what, if any, taxes apply to your cryptocurrency 
                  transactions and for reporting and remitting the correct tax to the appropriate tax authority.
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">6. Token Creation and TAS Chain</h3>
              <p>
                Our platform allows users to create custom tokens on the TAS Chain.
              </p>
              <ul>
                <li>
                  You are solely responsible for any tokens you create on the platform.
                </li>
                <li>
                  You agree not to create tokens that infringe on intellectual property rights, promote illegal activities, 
                  or otherwise violate any laws or regulations.
                </li>
                <li>
                  We reserve the right to remove any tokens from our platform that we determine, in our sole discretion, 
                  violate these Terms or applicable laws.
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">7. Intellectual Property</h3>
              <p>
                talkastranger.com and its original content, features, and functionality are owned by us and are protected by 
                international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
              </p>

              <h3 className="text-xl font-semibold mt-6">8. User Content</h3>
              <p>
                You retain ownership of any content you submit, post, or display on or through talkastranger.com. By posting content, 
                you grant us a non-exclusive, worldwide, royalty-free license to use, copy, modify, and display your content in 
                connection with the operation of our Services.
              </p>

              <h3 className="text-xl font-semibold mt-6">9. Termination</h3>
              <p>
                We reserve the right to suspend or terminate your access to talkastranger.com, without prior notice or liability, 
                for any reason, including if you breach these Terms.
              </p>

              <h3 className="text-xl font-semibold mt-6">10. Disclaimer of Warranties</h3>
              <p>
                THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. 
                WE DISCLAIM ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
                TITLE, AND NON-INFRINGEMENT.
              </p>

              <h3 className="text-xl font-semibold mt-6">11. Limitation of Liability</h3>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL TALKASTRANGER.COM, ITS DIRECTORS, EMPLOYEES, 
                PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR 
                PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, 
                RESULTING FROM YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES.
              </p>

              <h3 className="text-xl font-semibold mt-6">12. Changes to Terms</h3>
              <p>
                We reserve the right to modify or replace these Terms at any time. If we make material changes to these Terms, 
                we will notify you by posting the new Terms on the platform or by sending you an email. Your continued use of 
                talkastranger.com after such modifications will constitute your acknowledgment of the modified Terms and agreement 
                to abide and be bound by them.
              </p>

              <h3 className="text-xl font-semibold mt-6">13. Governing Law</h3>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the United Arab Emirates, 
                without regard to its conflict of law provisions.
              </p>

              <h3 className="text-xl font-semibold mt-6">14. Contact Us</h3>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <p>
                Email: info@talkastranger.com
              </p>
              <p>
                Address: 4th avenue - Ibn Battuta st - Al-furjan, Dubai, UAE
              </p>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mt-8">
                <p className="font-semibold">Last Updated: April 17, 2024</p>
                <p className="text-sm mt-2">
                  By using talkastranger.com, you acknowledge that you have read and understood these Terms of Service and agree to be bound by them.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsOfServicePage;