import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Shield } from "lucide-react";

interface PlanData {
  planName: string;
  planType: string;
  price: number;
  stripeLink: string;
}

export default function FormularioAssinatura() {
  const location = useLocation();
  const navigate = useNavigate();
  const planData = location.state as PlanData;

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    empresa: "",
    telefone: "",
    cnpj: "",
    observacoes: ""
  });

  // Redireciona para home se não houver dados do plano
  useEffect(() => {
    if (!planData) {
      navigate("/");
    }
  }, [planData, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aqui você pode salvar os dados em um banco de dados ou enviar por email
    console.log("Dados do formulário:", formData);
    console.log("Plano selecionado:", planData);
    
    // Redirecionar para Stripe
    window.open(planData.stripeLink, "_blank");
  };

  const handleGoBack = () => {
    navigate("/");
  };

  if (!planData) {
    return null; // ou um loading spinner
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center">
              <img
                src="https://cadastro.rsdata.com.br/rsdata-logo.png"
                alt="RSData Logo"
                className="h-9 md:h-10 w-auto"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="border-[#084D6C] text-[#084D6C] hover:bg-[#084D6C] hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-[#084D6C] mr-2" />
              <h1 className="text-3xl font-bold text-[#575756]">
                Dados para Assinatura
              </h1>
            </div>
            <p className="text-lg text-[#575756]">
              Preencha os dados abaixo para finalizar sua assinatura
            </p>
          </div>

          {/* Plan Summary Card */}
          <Card className="mb-8 border-[#084D6C]/20">
            <CardHeader className="bg-[#084D6C]/5">
              <CardTitle className="text-xl text-[#084D6C] flex items-center justify-between">
                <span>Plano Selecionado</span>
                <span className="text-sm font-normal bg-[#084D6C] text-white px-3 py-1 rounded-full">
                  {planData.planType}
                </span>
              </CardTitle>
              <CardDescription className="text-[#575756] text-lg">
                {planData.planName} - R$ {planData.price}/mês
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-[#575756]">
                Informações do Cliente
              </CardTitle>
              <CardDescription className="text-[#575756]">
                Todos os campos marcados com * são obrigatórios
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-[#575756] font-medium">
                      Nome Completo *
                    </Label>
                    <Input
                      id="nome"
                      name="nome"
                      type="text"
                      value={formData.nome}
                      onChange={handleInputChange}
                      required
                      className="border-gray-300 focus:border-[#084D6C] focus:ring-[#084D6C]"
                      placeholder="Seu nome completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#575756] font-medium">
                      E-mail *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="border-gray-300 focus:border-[#084D6C] focus:ring-[#084D6C]"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="empresa" className="text-[#575756] font-medium">
                    Nome da Empresa *
                  </Label>
                  <Input
                    id="empresa"
                    name="empresa"
                    type="text"
                    value={formData.empresa}
                    onChange={handleInputChange}
                    required
                    className="border-gray-300 focus:border-[#084D6C] focus:ring-[#084D6C]"
                    placeholder="Nome da sua empresa"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="text-[#575756] font-medium">
                      Telefone *
                    </Label>
                    <Input
                      id="telefone"
                      name="telefone"
                      type="tel"
                      value={formData.telefone}
                      onChange={handleInputChange}
                      required
                      className="border-gray-300 focus:border-[#084D6C] focus:ring-[#084D6C]"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cnpj" className="text-[#575756] font-medium">
                      CNPJ
                    </Label>
                    <Input
                      id="cnpj"
                      name="cnpj"
                      type="text"
                      value={formData.cnpj}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:border-[#084D6C] focus:ring-[#084D6C]"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="observacoes" className="text-[#575756] font-medium">
                    Observações (opcional)
                  </Label>
                  <Textarea
                    id="observacoes"
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleInputChange}
                    className="border-gray-300 focus:border-[#084D6C] focus:ring-[#084D6C] min-h-[100px]"
                    placeholder="Alguma informação adicional que gostaria de compartilhar..."
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoBack}
                    className="flex-1 border-gray-300 text-[#575756] hover:bg-gray-50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar aos Planos
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#084D6C] hover:bg-[#084D6C]/90 text-white"
                  >
                    Continuar para Pagamento
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security Info */}
          <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-center text-center">
              <Shield className="h-5 w-5 text-[#084D6C] mr-2" />
              <span className="text-sm text-[#575756]">
                Seus dados estão seguros e protegidos conosco
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}