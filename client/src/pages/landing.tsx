
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Helmet } from "react-helmet";

export default function Landing() {
  return (
    <>
      <Helmet>
        <title>WorkXP - Track Your Professional Experience</title>
        <meta name="description" content="WorkXP helps you track and manage your professional experiences efficiently. Document your career journey, manage projects, and track achievements all in one place." />
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Track Your Professional Journey
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Document your career experiences, manage projects, and track achievements in one centralized platform.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <Link href="/register">
                <Button className="w-full sm:w-auto sm:mr-4 mb-3 sm:mb-0">Get Started</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full sm:w-auto">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
