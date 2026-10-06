import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como tratamos as fotos enviadas por você.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl pt-6">
      <h1 className="font-display text-3xl text-navy-900 sm:text-4xl">Política de privacidade</h1>
      <div className="rule-gold mt-5 w-24" />

      <div className="mt-8 space-y-8 text-[0.95rem] leading-relaxed text-navy-800/80">
        <section>
          <h2 className="font-display text-xl text-navy-900">O que coletamos</h2>
          <p className="mt-2">
            Para enviar uma foto, o site não pede nome, e-mail, telefone, CPF nem qualquer conta. Não
            criamos login para convidados e não usamos cookies de publicidade ou de rastreamento. Para
            que fotos e confirmações funcionem, o servidor usa o endereço IP e a janela de horário de
            forma temporária para limitar envios repetidos e abuso.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-navy-900">Para que servem as fotos</h2>
          <p className="mt-2">
            O destino das fotos é a conta privada de Google Drive das noivas. Se o Drive estiver
            temporariamente indisponível, a foto permanece no aparelho para uma nova tentativa. Em
            ambientes que permitem, uma cópia temporária e privada também pode ficar no servidor
            para que as noivas tentem o envio novamente. As fotos não são publicadas neste site nem em
            redes sociais. Quem aparece em uma foto pode pedir sua exclusão a qualquer momento.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-navy-900">Presentes e Pix</h2>
          <p className="mt-2">
            Para iniciar uma contribuição, o site registra uma cobrança vinculada ao presente e gera
            um código Pix Copia e Cola. Não recebemos nem armazenamos dados de conta bancária, senha,
            cartão ou CPF. Quando o provedor Pix está configurado para confirmação automática, o site
            registra o estado informado pelo provedor; no fluxo manual, as noivas podem conciliar a
            confirmação no painel. O pagamento só é considerado confirmado após essa verificação.
            A lista não limita presentes por quantidade nem controla disponibilidade.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-navy-900">Confirmação de presença</h2>
          <p className="mt-2">
            Se você confirmar presença, o nome informado e os nomes dos acompanhantes serão enviados
            ao Google Docs das noivas para organização do evento. O site não pede login nem contato
            para essa confirmação. Esses dados ficam acessíveis às noivas e podem ser corrigidos ou
            removidos mediante solicitação.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-navy-900">Crianças e adolescentes</h2>
          <p className="mt-2">
            É possível que apareçam crianças nas fotos enviadas. O tratamento considera o melhor
            interesse de crianças e adolescentes e segue o consentimento de quem é responsável por
            elas. Não usamos fotos de crianças para fins de divulgação sem autorização.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-navy-900">Seus direitos</h2>
          <p className="mt-2">
            Você pode pedir confirmação do uso, correção ou eliminação das imagens em que aparece,
            bem como informações sobre os dados tratados. Para isso, fale com as noivas pelo canal que
            usaram para convidar você: elas são as responsáveis por este site e pelo armazenamento das
            fotos.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-navy-900">Alterações</h2>
          <p className="mt-2">
            Este texto pode ser ajustado conforme o site ganhar novas funções. A versão válida é sempre
            a que está publicada aqui.
          </p>
        </section>
      </div>
    </article>
  );
}
