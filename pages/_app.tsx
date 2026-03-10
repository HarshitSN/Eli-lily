import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function App({ Component, pageProps }: AppProps) {
    return (
        <AuthProvider>
            <>
                <Head>
                    <title>Eli Lilly AI Playground</title>
                    <meta name="description" content="Eli Lilly AI Solutions Showcase" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                </Head>
                <main className="font-sans">
                    <ProtectedRoute>
                        <Component {...pageProps} />
                    </ProtectedRoute>
                </main>
            </>
        </AuthProvider>
    );
}
