import { Link, useLocation } from "wouter";
import { Menu, UserCircle2 } from "lucide-react";

function AuthButton() {
  // Implement your authentication logic here.  This is a placeholder.
  return (
    <button type="button" className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
      <span className="sr-only">Login/Logout</span>
      <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
        <UserCircle2 className="h-5 w-5" />
      </div>
    </button>
  );
}

export default function Navbar() {
  const [location] = useLocation();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Menu className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-gray-900">WorkXP</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  location === "/" 
                    ? "border-primary text-gray-900" 
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}>
                  Experiences
              </Link>
              <Link href="/columns" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  location === "/columns" 
                    ? "border-primary text-gray-900" 
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}>
                  Column Configuration
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="ml-3 relative">
              <div>
                <AuthButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}