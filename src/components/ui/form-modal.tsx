import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planType: string;
  price: number;
  stripeLink: string;
}

export function FormModal({ isOpen, onClose, planName, planType, price, stripeLink }: FormModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    empresa: "",
    telefone: "",
    cnpj: "",
    observacoes: ""
  });

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
    console.log("Plano selecionado:", { planName, planType, price });
    
    // Fechar o modal e redirecionar para Stripe
    onClose();
    window.open(stripeLink, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#575756]">
            Dados para Assinatura
          </DialogTitle>
          <DialogDescription className="text-[#575756]">
            Preencha os dados abaixo para finalizar sua assinatura do plano {planName} {planType}
          </DialogDescription>
        </DialogHeader>
        
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pb-4">
            <div className="bg-[#084D6C]/5 p-4 rounded-lg">
              <CardTitle className="text-lg text-[#084D6C] mb-1">
                {planName} - {planType}
              </CardTitle>
              <CardDescription className="text-[#575756] font-medium">
                R$ {price}/mês
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="px-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="border-gray-300 focus:border-[#084D6C] focus:ring-[#084D6C] min-h-[80px]"
                  placeholder="Alguma informação adicional..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-gray-300 text-[#575756] hover:bg-gray-50"
                >
                  Cancelar
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
      </DialogContent>
    </Dialog>
  );
}