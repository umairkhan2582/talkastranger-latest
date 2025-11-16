import { useWallet } from "@/contexts/WalletContext";
import { useLanguage } from "@/contexts/LanguageContext";
import ChatInterface from "@/components/ChatInterface";

const Messages = () => {
  const { isConnected } = useWallet();
  const { translate } = useLanguage();
  
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-12 text-center">
          <h2 className="text-2xl font-heading font-semibold text-dark-800 mb-4">
            {translate("connect_wallet_prompt")}
          </h2>
          <p className="text-dark-600 mb-6">
            {translate("connect_wallet_to_see_messages")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm mb-12">
        <div className="p-6">
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-dark-800 leading-tight mb-4">
            {translate("your_messages")}
          </h1>
          <p className="text-lg text-dark-600">
            {translate("messages_description")}
          </p>
        </div>
      </div>
      <ChatInterface fullpage={true} />
    </div>
  );
};

export default Messages;
