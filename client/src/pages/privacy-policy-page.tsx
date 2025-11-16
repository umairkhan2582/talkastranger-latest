import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { FileText, ShieldCheck } from "lucide-react";

const PrivacyPolicyPage = () => {
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
              <ShieldCheck className="w-3 h-3 mr-1" />
              Legal Document
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-lg text-slate-600 mb-8">
              At talkastranger.com, we are committed to protecting your privacy
            </p>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border p-6 md:p-8">
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl font-bold">Privacy Policy for talkastranger.com: Protecting People and Strangers' Privacy</h2>
              
              <p>
                At talkastranger.com, we are committed to safeguarding your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform.
              </p>

              <h3 className="text-xl font-semibold mt-6">1. Information We Collect</h3>
              <p>
                When you use talkastranger.com, we may collect the following types of information:
              </p>
              <ul>
                <li>
                  <strong>Profile Information:</strong> When you create an account, we collect your username, email, and wallet address.
                </li>
                <li>
                  <strong>Communication Data:</strong> Messages, attachments, and other content shared during conversations.
                </li>
                <li>
                  <strong>Transaction Information:</strong> Details of token swaps, cryptocurrency transactions, and token creation.
                </li>
                <li>
                  <strong>Device Information:</strong> IP address, device type, browser information, and operating system.
                </li>
                <li>
                  <strong>Usage Data:</strong> How you interact with our platform, including features used and time spent.
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">2. How We Use Your Information</h3>
              <p>
                We use your information for the following purposes:
              </p>
              <ul>
                <li>To provide and maintain our services</li>
                <li>To process and complete token swaps and transactions</li>
                <li>To match you with other users based on your preferences</li>
                <li>To communicate with you about your account and activities</li>
                <li>To improve our platform and develop new features</li>
                <li>To ensure platform security and prevent fraud</li>
                <li>To comply with legal and regulatory requirements</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">3. Information Sharing and Disclosure</h3>
              <p>
                We do not sell your personal information to third parties. We may share your information in the following circumstances:
              </p>
              <ul>
                <li>
                  <strong>With Other Users:</strong> When you engage in conversations or transactions, some information may be visible to other users.
                </li>
                <li>
                  <strong>Service Providers:</strong> We work with trusted third-party service providers who help us operate our platform.
                </li>
                <li>
                  <strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety.
                </li>
                <li>
                  <strong>Business Transfers:</strong> If talkastranger.com is involved in a merger, acquisition, or asset sale, your information may be transferred.
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">4. Blockchain Transactions</h3>
              <p>
                Please note that blockchain transactions are public by nature. When you create tokens or engage in token swaps on our platform, certain information (including wallet addresses and transaction details) becomes part of a public blockchain and cannot be deleted.
              </p>

              <h3 className="text-xl font-semibold mt-6">5. Data Security</h3>
              <p>
                We implement appropriate security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. However, no online platform can guarantee absolute security, so we encourage you to help us by maintaining the confidentiality of your account credentials.
              </p>

              <h3 className="text-xl font-semibold mt-6">6. Your Rights and Choices</h3>
              <p>
                Depending on your location, you may have rights regarding your personal information, including:
              </p>
              <ul>
                <li>Accessing, correcting, or deleting your personal information</li>
                <li>Objecting to or restricting certain processing activities</li>
                <li>Data portability</li>
                <li>Withdrawing consent where applicable</li>
              </ul>
              <p>
                To exercise these rights, please contact us using the information provided below.
              </p>

              <h3 className="text-xl font-semibold mt-6">7. Children's Privacy</h3>
              <p>
                talkastranger.com is not intended for children under 18, and we do not knowingly collect information from individuals under 18. If we discover we have collected information from a child under 18, we will delete that information promptly.
              </p>

              <h3 className="text-xl font-semibold mt-6">8. International Data Transfers</h3>
              <p>
                Your information may be stored and processed in countries where talkastranger.com operates or where our service providers are located. By using our platform, you consent to the transfer of your information to countries that may have different data protection rules than your country.
              </p>

              <h3 className="text-xl font-semibold mt-6">9. Changes to This Privacy Policy</h3>
              <p>
                We may update this Privacy Policy periodically to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes through the platform or via email.
              </p>

              <h3 className="text-xl font-semibold mt-6">10. Contact Us</h3>
              <p>
                If you have questions or concerns about this Privacy Policy or our privacy practices, please contact us at:
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
                  By using talkastranger.com, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicyPage;