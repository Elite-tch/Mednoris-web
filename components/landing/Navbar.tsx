"use client";

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';

export default function Navbar() {
  const { login, logout, authenticated, user } = usePrivy();

  return (
    <nav className="w-full  text-brand-primary bg-[#f8f7fb] px-8 flex justify-between items-center shadow-lg sticky top-0 z-50">
      <div className=" h-20 sm:h-20">
        <Link href='/'>
        <Image src='/logo.png' alt='logo'  width={80} height={42}  /> </Link>   
        </div>
      
      <div className="hidden md:flex gap-8 text-sm uppercase tracking-wide">
        <Link href="/" className="hover:text-brand-accent transition-colors">Home</Link>
        <Link href="#about" className="hover:text-brand-accent transition-colors">About Us</Link>
        <Link href="#features" className="hover:text-brand-accent transition-colors">Features</Link>
        <Link href="#marketplace" className="hover:text-brand-accent transition-colors">Doctors</Link>
        <Link href="#contact" className="hover:text-brand-accent transition-colors">Contact</Link>
      </div>

      <div className="flex gap-4">
        {authenticated ? (
          <>
            <span className="flex items-center text-sm font-medium mr-4">
              {user?.email?.address || user?.wallet?.address?.slice(0, 6) + "..."}
            </span>
            <button 
              onClick={logout} 
              className="px-5 py-2 text-sm font-semibold rounded-full border border-white hover:bg-white hover:text-brand-primary transition-colors cursor-pointer"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={login} 
              className="px-5 py-2 text-sm font-semibold rounded-full border border-brand-primary hover:bg-white hover:text-brand-primary transition-colors cursor-pointer"
            >
              Login
            </button>
            <button 
              onClick={login} 
              className="px-5 py-2 text-sm font-semibold rounded-full bg-brand-primary text-[#f8f7fb]  hover:opacity-90 transition-opacity cursor-pointer"
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
