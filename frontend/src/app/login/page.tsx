import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import LoginForm from "./loginForm";
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
