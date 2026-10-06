import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAdminEnabled, isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAuthenticated()) redirect("/admin");

  return (
    <div className="mx-auto max-w-sm px-5 py-16 text-center">
      <Image
        src="/logo.jpg"
        alt="Jéssica & Jennifer — Nosso Dia"
        width={1008}
        height={1063}
        priority
        className="mx-auto h-14 w-auto"
      />
      <h1 className="mt-5 font-display text-2xl text-navy-900">Área das noivas</h1>
      <p className="mt-2 text-sm text-navy-800/65">Presentes, pagamentos e fotos do casamento.</p>

      {isAdminEnabled() ? (
        <LoginForm />
      ) : (
        <div className="mt-8 rounded-xl border border-gold-500/40 bg-gold-100/60 p-5 text-left text-sm leading-relaxed text-navy-900">
          <p className="font-medium">O painel precisa de uma configuração inicial.</p>
          <p className="mt-2 text-navy-800/80">Prepare uma senha de acesso para começar:</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-navy-800/80">
            <li>
              Gere a senha com <code>npm run admin:password -- &quot;sua senha&quot;</code>.
            </li>
            <li>
              Adicione o resultado ao campo <code>ADMIN_PASSWORD_HASH</code> no arquivo{" "}
              <code>.env.local</code>.
            </li>
            <li>Reinicie o servidor e volte a esta página.</li>
          </ol>
        </div>
      )}
    </div>
  );
}
