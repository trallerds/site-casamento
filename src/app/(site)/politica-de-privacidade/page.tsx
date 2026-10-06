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
            que este site funcione, o servidor anota o endereço IP e o horário do envio, de forma
            temporária, apenas para limitar envios repetidos e abuso.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-navy-900">Para que servem as fotos</h2>
          <p className="mt-2">
            As fotos enviadas ficam armazenadas na conta de Google Drive das noivas, em uma pasta
            privada. Elas não são publicadas neste site nem em redes sociais. As noivas decidem, depois,
            o que desejam compartilhar. Fotos podem ser excluídas a qualquer momento, a pedido de quem
            aparece nelas.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-navy-900">Presentes e Pix</h2>
          <p className="mt-2">
            Para presentear, o site gera um código Pix Copia e Cola para você pagar no aplicativo do
            seu banco. Não armazenamos dados de conta bancária, senha, cartão ou CPF de ninguém. O
            pagamento acontece inteiramente entre você e o seu banco. O site não precisa saber quem
            pagou, não confirma pagamento e não controla estoque ou cotas de presentes.
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