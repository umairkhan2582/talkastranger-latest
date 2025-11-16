import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "What is Talk A Stranger?",
    answer: "Talk A Stranger is a free random video chat platform where you can meet and talk with strangers from around the world. Connect instantly with girls and boys through live video conversations without any registration required."
  },
  {
    question: "Is Talk A Stranger really free?",
    answer: "Yes! Talk A Stranger is completely free to use. You can start video chatting with strangers immediately without any cost. We offer premium features for TAS token holders, but the core video chat functionality is 100% free forever."
  },
  {
    question: "Do I need to create an account to use Talk A Stranger?",
    answer: "No registration is required! Simply click 'Start Talking' and you'll be connected instantly. Your privacy is important to us - you can chat completely anonymously without providing any personal information."
  },
  {
    question: "How does the random video chat work?",
    answer: "Our smart matching system connects you with random strangers based on your preferences. You can filter by gender (available to everyone) or use advanced location filters if you have TAS tokens. Once matched, you'll be in a live video call where you can chat, share messages, and make new friends."
  },
  {
    question: "Can I choose who I want to talk with?",
    answer: "Yes! Everyone can use our gender filter to choose whether you want to talk with males, females, or anyone. TAS token holders get access to premium location filters to connect with people from specific countries, cities, or areas."
  },
  {
    question: "Is Talk A Stranger safe and private?",
    answer: "Absolutely! We take your safety and privacy seriously. All chats are anonymous, and you can skip to the next person at any time. We recommend following basic online safety practices: don't share personal information, and report any inappropriate behavior."
  },
  {
    question: "What are TAS tokens and why do I need them?",
    answer: "TAS tokens are optional premium features that unlock advanced location filters, allowing you to connect with people from specific countries, cities, or areas. The basic video chat with gender filtering is completely free without any tokens."
  },
  {
    question: "Can I use Talk A Stranger on mobile?",
    answer: "Yes! Talk A Stranger works perfectly on mobile devices, tablets, and desktops. Our platform is fully responsive and optimized for all screen sizes, so you can chat with strangers anywhere, anytime."
  },
  {
    question: "What languages are supported?",
    answer: "Talk A Stranger connects you with people from all over the world who speak different languages. While the interface is in English, you can chat with strangers in any language you both understand. It's a great way to practice foreign languages!"
  },
  {
    question: "How do I report inappropriate behavior?",
    answer: "If you encounter any inappropriate behavior, simply click 'Next' to skip to another person. We have systems in place to monitor and prevent abuse. Your safety and comfort are our top priorities."
  },
  {
    question: "Can I chat with people from specific countries or cities?",
    answer: "TAS token holders can use our premium location filters to connect with people from over 50 countries, 50 cities, and 50 areas worldwide. Free users can use gender filters and will be matched with strangers from anywhere in the world."
  },
  {
    question: "What makes Talk A Stranger different from other chat sites?",
    answer: "Talk A Stranger combines instant video chat with blockchain technology for enhanced privacy and security. We offer free gender filtering for everyone, high-quality video calls, and the ability to connect with people from specific locations. Plus, we're built on the TAS Chain for added transparency and trust."
  }
];

export default function FAQSection() {
  return (
    <div className="py-16 bg-white">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need to know about talking with strangers online
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border rounded-xl px-6 bg-gradient-to-r from-purple-50/50 to-pink-50/50 hover:from-purple-50 hover:to-pink-50 transition-all"
            >
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 pb-6 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
