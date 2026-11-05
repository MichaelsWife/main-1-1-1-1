import Link from "next/link";
import AuthForm from "@/components/auth-form";
export default function SignupPage() { return <main className="content-page narrow"><p className="eyebrow">JOIN US</p><h1>Create an account.</h1><p>Save your details and keep track of your orders.</p><AuthForm mode="signup" /><p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p></main>; }
