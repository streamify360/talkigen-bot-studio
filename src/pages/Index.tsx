import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, MessageSquare, Database, Settings, Globe, Facebook, Send, CheckCircle, Star, Users, TrendingUp, Plus, Minus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  // Handle login/register button clicks for authenticated users
  const handleAuthAction = (action: 'login' | 'register') => {
    if (user) {
      // User is logged in, redirect based on onboarding status
      if (profile?.onboarding_completed) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    } else {
      // User not logged in, go to login/register page
      navigate(`/${action}`);
    }
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const features = [
    {
      icon: Bot,
      title: "AI-Powered Chatbots",
      description: "Create intelligent chatbots that understand and respond naturally to your customers"
    },
    {
      icon: Database,
      title: "Knowledge Base Integration",
      description: "Upload files and documents to create comprehensive knowledge bases for your bots"
    },
    {
      icon: Globe,
      title: "Multi-Platform Deployment",
      description: "Deploy your chatbots on websites, Facebook Messenger, and Telegram seamlessly"
    },
    {
      icon: Settings,
      title: "Easy Configuration",
      description: "Customize bot behavior, appearance, and responses with our intuitive interface"
    },
    {
      icon: TrendingUp,
      title: "Analytics & Insights",
      description: "Track performance, user engagement, and bot effectiveness with detailed analytics"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together with your team to build and manage chatbots efficiently"
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: isAnnual ? 19 : 29,
      description: "Perfect for small businesses getting started",
      features: [
        "Up to 2 chatbots",
        "1 knowledge base",
        "1,000 messages/month",
        "Website integration",
        "Basic analytics",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: isAnnual ? 49 : 59,
      description: "Ideal for growing businesses",
      features: [
        "Up to 10 chatbots",
        "5 knowledge bases",
        "10,000 messages/month",
        "All platform integrations",
        "Advanced analytics",
        "Priority support",
        "Custom branding"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: isAnnual ? 99 : 119,
      description: "For large organizations with advanced needs",
      features: [
        "Unlimited chatbots",
        "Unlimited knowledge bases",
        "100,000 messages/month",
        "All platform integrations",
        "Advanced analytics",
        "24/7 dedicated support",
        "Custom branding",
        "API access",
        "White-label solution"
      ],
      popular: false
    }
  ];

  const faqs = [
    {
      question: "How quickly can I set up my first chatbot?",
      answer: "You can have your first chatbot up and running in under 10 minutes! Our intuitive setup wizard guides you through creating your bot, uploading knowledge base content, and deploying it to your preferred platform."
    },
    {
      question: "Do I need technical knowledge to use Talkigen?",
      answer: "Not at all! Talkigen is designed for non-technical users. Our drag-and-drop interface, pre-built templates, and step-by-step guides make it easy for anyone to create professional chatbots without coding."
    },
    {
      question: "What file formats can I upload to my knowledge base?",
      answer: "We support PDF, DOC, DOCX, and TXT files up to 10MB each. You can upload product manuals, FAQs, policies, and any other documents that will help your chatbot provide accurate responses to customer questions."
    },
    {
      question: "Can I integrate my chatbot with multiple platforms?",
      answer: "Yes! You can deploy the same chatbot across your website, Facebook Messenger, and Telegram. Each integration maintains consistent responses while adapting to the platform's specific features and user experience."
    },
    {
      question: "How accurate are the AI responses?",
      answer: "Our AI is trained on your specific content and continuously learns from interactions. Accuracy typically ranges from 85-95% depending on the quality and comprehensiveness of your knowledge base. You can always review and improve responses through our analytics dashboard."
    },
    {
      question: "What happens if I exceed my plan limits?",
      answer: "Your chatbots will continue to work normally. However, you won't be able to create new bots or upload additional content until you upgrade your plan. We'll notify you before you reach your limits so you can upgrade seamlessly."
    },
    {
      question: "Is there a free trial available?",
      answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required to start. You can create chatbots, upload content, and test integrations to see how Talkigen works for your business."
    },
    {
      question: "How secure is my data?",
      answer: "We take security seriously. All data is encrypted in transit and at rest, stored in secure data centers, and we follow industry-standard security practices. We're SOC 2 compliant and regularly undergo security audits."
    },
    {
      question: "Can I customize the appearance of my chatbot?",
      answer: "Absolutely! You can customize colors, welcome messages, bot personality, and branding to match your company's style. Professional and Enterprise plans also include white-label options for complete brand customization."
    },
    {
      question: "What kind of support do you provide?",
      answer: "We offer email support for all plans, priority support for Professional users, and 24/7 dedicated support for Enterprise customers. We also provide comprehensive documentation, video tutorials, and a knowledge base to help you succeed."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Marketing Director",
      company: "TechFlow",
      content: "Talkigen transformed our customer support. Our response time decreased by 80% and customer satisfaction increased significantly.",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "CEO",
      company: "GrowthStart",
      content: "The easiest chatbot platform I've ever used. We had our first bot live in under 30 minutes.",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "Operations Manager",
      company: "ServicePro",
      content: "The multi-platform deployment is a game-changer. One bot, everywhere our customers are.",
      rating: 5
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Talkigen
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#faq" className="text-gray-600 hover:text-blue-600 transition-colors">FAQ</a>
            <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">Reviews</a>
            <button 
              onClick={() => handleAuthAction('login')}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Sign In
            </button>
            <button onClick={() => handleAuthAction('register')}>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Get Started
              </Button>
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
            Build Intelligent Chatbots in Minutes
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create, customize, and deploy AI-powered chatbots across your website, Facebook Messenger, and Telegram. No coding required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button onClick={() => handleAuthAction('register')}>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4">
                Start Free Trial
              </Button>
            </button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              Watch Demo
            </Button>
          </div>
          <div className="mt-12 flex justify-center items-center space-x-8 text-gray-500">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Website</span>
            </div>
            <div className="flex items-center space-x-2">
              <Facebook className="h-5 w-5" />
              <span>Messenger</span>
            </div>
            <div className="flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <span>Telegram</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help you create and deploy chatbots that truly understand your customers
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 mb-8">Choose the plan that's right for your business</p>
            <div className="flex items-center justify-center space-x-4">
              <span className={`${!isAnnual ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>Monthly</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAnnual ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`${isAnnual ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                Annual <Badge variant="secondary" className="ml-2">Save 30%</Badge>
              </span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-blue-600 shadow-xl scale-105' : 'shadow-lg'}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    ${plan.price}
                    <span className="text-sm font-normal text-gray-500">/{isAnnual ? 'year' : 'month'}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <button onClick={() => handleAuthAction('register')}>
                    <Button 
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                          : 'bg-gray-900 hover:bg-gray-800'
                      }`}
                    >
                      Get Started
                    </Button>
                  </button>
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about Talkigen and our AI chatbot platform
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => toggleFAQ(index)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-left">
                      {faq.question}
                    </CardTitle>
                    {openFAQ === index ? (
                      <Minus className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <Plus className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                {openFAQ === index && (
                  <CardContent className="pt-0">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <Button variant="outline" asChild>
              <Link to="/contact">Contact Our Support Team</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Loved by Thousands of Businesses</h2>
            <p className="text-xl text-gray-600">See what our customers have to say about Talkigen</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Customer Experience?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using Talkigen to provide exceptional customer support
          </p>
          <button onClick={() => handleAuthAction('register')}>
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              Start Your Free Trial Today
            </Button>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Bot className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">Talkigen</span>
              </div>
              <p className="text-gray-400">
                Building the future of customer communication with AI-powered chatbots.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link to="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Talkigen. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;