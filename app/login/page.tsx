import Link from "next/link";
import AuthForm from "@/components/auth-form";
export default function LoginPage() { return <main className="content-page narrow"><p className="eyebrow">WELCOME BACK</p><h1>Sign in.</h1><p>Access your account and orders.</p><AuthForm mode="login" /><p className="auth-switch">New here? <Link href="/signup">Create an account</Link></p></main>; }
