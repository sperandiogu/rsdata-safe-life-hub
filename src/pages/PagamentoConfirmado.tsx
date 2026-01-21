import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, XCircle, Home, Mail, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type PaymentStatus = "approved" | "pending" | "rejected" | "unknown";

interface StatusConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const statusConfigs: Record<PaymentStatus, StatusConfig> = {
  approved: {
    icon: <CheckCircle2 className="w-16 h-16 text-green-500" />,
    title: "Pagamento Aprovado!",
    description: "Seu pagamento foi processado com sucesso. Você receberá um e-mail com as instruções de acesso à plataforma RSData.",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  pending: {
    icon: <Clock className="w-16 h-16 text-amber-500" />,
    title: "Pagamento Pendente",
    description: "Seu pagamento está sendo processado. Se você escolheu Pix ou boleto, aguarde a confirmação. Você receberá um e-mail assim que o pagamento for confirmado.",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  rejected: {
    icon: <XCircle className="w-16 h-16 text-red-500" />,
    title: "Pagamento Não Aprovado",
    description: "Infelizmente seu pagamento não foi aprovado. Por favor, verifique os dados do cartão ou tente outra forma de pagamento.",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  unknown: {
    icon: <Clock className="w-16 h-16 text-gray-500" />,
    title: "Verificando Pagamento",
    description: "Estamos verificando o status do seu pagamento. Aguarde alguns instantes.",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  },
};

export default function PagamentoConfirmado() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus>("unknown");

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam === "approved" || statusParam === "pending" || statusParam === "rejected") {
      setStatus(statusParam);
    }
  }, [searchParams]);

  const config = statusConfigs[status];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-16 md:h-20">
            <img
              src="https://cadastro.rsdata.com.br/rsdata-logo.png"
              alt="RSData Logo"
              className="h-9 md:h-10 w-auto"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          <Card className={`${config.bgColor} border-0`}>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                {config.icon}
              </div>
              <CardTitle className={`text-2xl ${config.color}`}>
                {config.title}
              </CardTitle>
              <CardDescription className="text-base text-gray-600 mt-2">
                {config.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {status === "approved" && (
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-[#575756]">Proximos Passos:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Verifique seu e-mail para as credenciais de acesso</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Acesse a plataforma RSData com seu login</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Configure sua empresa e comece a usar</span>
                    </li>
                  </ul>
                </div>
              )}

              {status === "pending" && (
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-[#575756]">Importante:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>Pagamentos via Pix sao confirmados em ate 30 minutos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>Boletos podem levar ate 3 dias uteis para compensar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>Voce recebera um e-mail quando o pagamento for confirmado</span>
                    </li>
                  </ul>
                </div>
              )}

              {status === "rejected" && (
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-[#575756]">O que fazer:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Verifique se os dados do cartao estao corretos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Tente usar outro cartao ou forma de pagamento</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Entre em contato com seu banco se o problema persistir</span>
                    </li>
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={() => navigate("/")}
                  className="w-full bg-[#084D6C] hover:bg-[#084D6C]/90"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Voltar para o Inicio
                </Button>

                {status === "rejected" && (
                  <Button
                    onClick={() => navigate("/")}
                    variant="outline"
                    className="w-full border-[#084D6C] text-[#084D6C] hover:bg-[#084D6C] hover:text-white"
                  >
                    Tentar Novamente
                  </Button>
                )}
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Precisa de ajuda?</p>
                <a
                  href="https://wa.me/555137201416"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#084D6C] hover:underline text-sm font-medium"
                >
                  Fale conosco pelo WhatsApp
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
