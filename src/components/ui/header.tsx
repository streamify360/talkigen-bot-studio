
import { Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  showNavigation?: boolean;
}

const Header = ({ showNavigation = true }: HeaderProps) => {
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

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Bot className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Talkigen
          </span>
        </Link>
        
        {showNavigation && (
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="/#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
            <a href="/#faq" className="text-gray-600 hover:text-blue-600 transition-colors">FAQ</a>
            <a href="/#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">Reviews</a>
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
        )}

        {!showNavigation && (
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/">Home</Link>
            </Button>
            <button onClick={() => handleAuthAction('register')}>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Get Started
              </Button>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
