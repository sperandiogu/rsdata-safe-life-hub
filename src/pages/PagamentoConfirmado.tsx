import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Home, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PagamentoConfirmado() {
  const navigate = useNavigate();

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
          <Card className="bg-green-50 border-0">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                Obrigado!
              </CardTitle>
              <CardDescription className="text-base text-gray-600 mt-2">
                Recebemos seu pedido com sucesso.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-white rounded-lg p-5 text-center">
                <Mail className="w-10 h-10 text-[#084D6C] mx-auto mb-3" />
                <p className="text-gray-700">
                  Entraremos em contato por e-mail em ate <strong>7 dias</strong> para enviar seu acesso.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={() => navigate("/")}
                  className="w-full bg-[#084D6C] hover:bg-[#084D6C]/90"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Voltar para o Inicio
                </Button>
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
