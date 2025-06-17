
import { Bot, Github, Twitter, Linkedin, Mail, ExternalLink, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const DashboardFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Talkigen
              </span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Build intelligent chatbots that understand your business and engage your customers 24/7.
            </p>
            <div className="flex space-x-3">
              <a 
                href="https://twitter.com/talkigen" 
                className="text-gray-400 hover:text-blue-600 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://linkedin.com/company/talkigen" 
                className="text-gray-400 hover:text-blue-600 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="https://github.com/talkigen" 
                className="text-gray-400 hover:text-blue-600 transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="mailto:support@talkigen.com" 
                className="text-gray-400 hover:text-blue-600 transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/docs" 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link 
                  to="/pricing" 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link 
                  to="/blog" 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Blog
                </Link>
              </li>
              <li>
                <a 
                  href="https://status.talkigen.com" 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm inline-flex items-center"
                >
                  Status Page
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/docs" 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Contact Support
                </Link>
              </li>
              <li>
                <a 
                  href="https://community.talkigen.com" 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm inline-flex items-center"
                >
                  Community Forum
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/privacy" 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Contact
                </Link>
              </li>
              <li>
                <a 
                  href="https://security.talkigen.com" 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm inline-flex items-center"
                >
                  Security
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-gray-600 text-sm">
                © {currentYear} Talkigen. All rights reserved.
              </p>
              <div className="flex items-center space-x-4">
                <Link 
                  to="/privacy" 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
                <Link 
                  to="/terms" 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Terms of Service
                </Link>
                <a 
                  href="https://help.talkigen.com/cookies" 
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Cookie Policy
                </a>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 text-gray-600 text-sm">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span>for businesses worldwide</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;
