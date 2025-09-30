import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FileText, Shield } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
    nomeRazaoSocial: "",
    cpfCnpj: "",
    telefone: "",
    email: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    observacoes: ""
  });

  const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Caso não haja dados do plano, não redireciona automaticamente.
  // Permite preencher o formulário mesmo acessando a URL diretamente.
  useEffect(() => {
    // Mantido vazio intencionalmente para não redirecionar.
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para buscar dados da empresa por CNPJ
  const searchByCNPJ = async (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return;

    setIsLoadingCNPJ(true);
    try {
      const response = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCNPJ}`);
      const data = await response.json();

      if (response.ok && data.razao_social) {
        setFormData(prev => ({
          ...prev,
          nomeRazaoSocial: data.razao_social,
          telefone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1}) ${data.telefone_1}` : prev.telefone,
          email: data.email || prev.email,
          rua: data.logradouro || prev.rua,
          numero: data.numero || prev.numero,
          complemento: data.complemento || prev.complemento,
          bairro: data.bairro || prev.bairro,
          cidade: data.municipio || prev.cidade,
          estado: data.uf || prev.estado,
          cep: data.cep || prev.cep
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error);
    }
    setIsLoadingCNPJ(false);
  };

  // Função para buscar endereço por CEP
  const searchByCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;

    setIsLoadingCEP(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();

      if (response.ok && !data.erro) {
        setFormData(prev => ({
          ...prev,
          rua: data.logradouro || prev.rua,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
    setIsLoadingCEP(false);
  };

  // Função para formatar CNPJ
  const formatCNPJ = (value: string) => {
    const clean = value.replace(/\D/g, '');
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    const clean = value.replace(/\D/g, '');
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Função para formatar CEP
  const formatCEP = (value: string) => {
    const clean = value.replace(/\D/g, '');
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  // Handle change com formatação e busca automática
  const handleFormattedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cpfCnpj') {
      const clean = value.replace(/\D/g, '');
      if (clean.length <= 11) {
        formattedValue = formatCPF(value);
      } else {
        formattedValue = formatCNPJ(value);
        // Busca automática por CNPJ quando completo
        if (clean.length === 14) {
          searchByCNPJ(clean);
        }
      }
    } else if (name === 'cep') {
      formattedValue = formatCEP(value);
      const clean = value.replace(/\D/g, '');
      if (clean.length === 8) {
        searchByCEP(clean);
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar se os termos foram aceitos
    if (!termsAccepted) {
      alert("Você deve aceitar os termos e condições para continuar.");
      return;
    }

    // Identificar tipo de documento
    const cleanDocument = formData.cpfCnpj.replace(/\D/g, '');
    const isCompany = cleanDocument.length === 14;

    // Estruturar JSON de forma organizada
    const webhookData = {
      // Informações do lead/cliente
      lead: {
        tipoCliente: isCompany ? "PJ" : "PF",
        documento: formData.cpfCnpj,
        documentoLimpo: cleanDocument,
        nome: formData.nomeRazaoSocial,
        telefone: formData.telefone,
        email: formData.email.toLowerCase(),
        observacoes: formData.observacoes || null
      },

      // Endereço completo
      endereco: {
        cep: formData.cep,
        rua: formData.rua,
        numero: formData.numero,
        complemento: formData.complemento || null,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado.toUpperCase(),
        enderecoCompleto: `${formData.rua}, ${formData.numero}${formData.complemento ? `, ${formData.complemento}` : ''}, ${formData.bairro}, ${formData.cidade}/${formData.estado}, CEP: ${formData.cep}`
      },

      // Informações do plano selecionado
      plano: {
        nome: planData.planName,
        tipo: planData.planType,
        valor: planData.price,
        valorFormatado: `R$ ${planData.price.toFixed(2).replace('.', ',')}`,
        stripeCheckoutUrl: planData.stripeLink,
        categoria: planData.planType === "Anual" ? "ANUAL" : "MENSAL"
      },

      // Metadados da sessão
      sessao: {
        timestamp: new Date().toISOString(),
        timestampBrasil: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        origem: window.location.origin,
        userAgent: navigator.userAgent,
        referrer: document.referrer || null,
        idioma: navigator.language,
        fusoHorario: Intl.DateTimeFormat().resolvedOptions().timeZone,
        resolucaoTela: `${screen.width}x${screen.height}`,
        url: window.location.href
      },

      // Status do processo
      status: {
        etapa: "FORMULARIO_PREENCHIDO",
        proximaEtapa: "PAGAMENTO_STRIPE",
        fonte: "LANDING_PAGE_RSDATA"
      }
    };

    console.log("Dados preparados para envio:", webhookData);

    try {
      // Enviar dados para o webhook do Make.com
      const response = await fetch("https://hook.us2.make.com/0itcp73mvrj2gh4pke27jxoc2xkfqt1h", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors", // Para lidar com CORS
        body: JSON.stringify(webhookData),
      });

      console.log("Dados enviados com sucesso para o webhook");

      // Pequeno delay para garantir que o webhook foi processado
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirecionar para Stripe quando houver dados de plano
      if (planData?.stripeLink) {
        window.open(planData.stripeLink, "_blank");
      } else {
        // Sem plano: volta para página inicial para seleção de plano
        navigate("/", { replace: true });
      }

    } catch (error) {
      console.error("Erro ao enviar dados para webhook:", error);

      // Mesmo em caso de erro no webhook, continua para o Stripe se houver link
      if (planData?.stripeLink) {
        window.open(planData.stripeLink, "_blank");
      } else {
        navigate("/", { replace: true });
      }
    }
  };

  const handleGoBack = () => {
    navigate("/");
  };

  // Mesmo sem planData, renderizamos a página para permitir o preenchimento.

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

          {/* Plan Summary Card (condicional) */}
          {planData ? (
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
          ) : (
            <Card className="mb-8 border-amber-300">
              <CardHeader className="bg-amber-50">
                <CardTitle className="text-base text-amber-800">
                  Nenhum plano selecionado
                </CardTitle>
                <CardDescription className="text-amber-700">
                  Você pode preencher seus dados agora e escolher o plano na etapa seguinte.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

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
              {/* CPF/CNPJ e Nome/Razão Social */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cpfCnpj" className="text-[#575756] font-medium">
                    CPF / CNPJ *
                  </Label>
                  <div className="relative">
                    <Input
                      id="cpfCnpj"
                      name="cpfCnpj"
                      type="text"
                      value={formData.cpfCnpj}
                      onChange={handleFormattedChange}
                      required
                      className="border-gray-300 focus:border-[#084D6C] focus:ring-[#084D6C]"
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      maxLength={18}
                    />
                    {isLoadingCNPJ && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#084D6C]"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Para CNPJ, os dados da empresa serão preenchidos automaticamente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nomeRazaoSocial" className="text-[#575756] font-medium">
                    Nome / Razão Social *
                  </Label>
                  <Input
                    id="nomeRazaoSocial"
                    name="nomeRazaoSocial"
                    type="text"
                    value={formData.nomeRazaoSocial}
                    onChange={handleInputChange}
                    required
                    className="border-gray-300 focus:border-[#084D6C] focus:ring-[#084D6C]"
                    placeholder="Nome completo ou razão social"
                  />
                </div>
              </div>

              {/* Telefone e Email */}
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

              {/* CEP */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cep" className="text-[#575756] font-medium">
                    CEP *
                  </Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      name="cep"
                      type="text"
                      value={formData.cep}
                      onChange={handleFormattedChange}
                      required
                      className="border-gray-300 focus:border-[#084D6C] focus:ring-[#084D6C]"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {isLoadingCEP && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#084D6C]"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    O endereço será preenchido automaticamente
                  </p>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="rua" className="text-[#575756] font-medium">
                      Rua *
                    </Label>
                    <Input
                      id="rua"
                      name="rua"
                      type="text"
                      value={formData.rua}
                      onChange={handleInputChange}
                      required
                      className="border-gray-300 focus:border-[#084D6C] focus:ring-[#084D6C]"
                      placeholder="Nome da rua"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero" className="text-[#575756] font-medium">
                      Número *
                    </Label>
                    <Input
                      id="numero"
                      name="numero"
                      type="text"
                      value={formData.numero}
                      onChange={handleInputChange}
                      required
                      className="border-gray-300 focus:border-[#084D6C] focus:ring-[#084D6C]"
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="complemento" className="text-[#575756] font-medium">
                      Complemento
                    </Label>
                    <Input
                      id="complemento"
                      name="complemento"
                      type="text"
                      value={formData.complemento}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:border-[#084D6C] focus:ring-[#084D6C]"
                      placeholder="Apto, sala, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bairro" className="text-[#575756] font-medium">
                      Bairro *
                    </Label>
                    <Input
                      id="bairro"
                      name="bairro"
                      type="text"
                      value={formData.bairro}
                      onChange={handleInputChange}
                      required
                      className="border-gray-300 focus:border-[#084D6C] focus:ring-[#084D6C]"
                      placeholder="Nome do bairro"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cidade" className="text-[#575756] font-medium">
                      Cidade *
                    </Label>
                    <Input
                      id="cidade"
                      name="cidade"
                      type="text"
                      value={formData.cidade}
                      onChange={handleInputChange}
                      required
                      className="border-gray-300 focus:border-[#084D6C] focus:ring-[#084D6C]"
                      placeholder="Nome da cidade"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="estado" className="text-[#575756] font-medium">
                      Estado *
                    </Label>
                    <Input
                      id="estado"
                      name="estado"
                      type="text"
                      value={formData.estado}
                      onChange={handleInputChange}
                      required
                      className="border-gray-300 focus:border-[#084D6C] focus:ring-[#084D6C]"
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
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

                {/* Termos e Condições */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="space-y-3">
                    <Label className="text-[#575756] font-medium flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Termos e Condições
                    </Label>

                    {/* PDF Embed */}
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <iframe
                        src="https://store.rsdata.com.br/atualizado%20-%20termo%20ADES%C3%83O%20E-COMMERCE%20-%20plano%20consultoria.pdf"
                        width="100%"
                        height="400"
                        className="border-0"
                        title="Termos e Condições RSData"
                      />
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                        className="mt-1"
                      />
                      <Label
                        htmlFor="terms"
                        className="text-sm text-[#575756] cursor-pointer leading-relaxed"
                      >
                        Li e aceito os{" "}
                        <a
                          href="https://store.rsdata.com.br/atualizado%20-%20termo%20ADES%C3%83O%20E-COMMERCE%20-%20plano%20consultoria.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#084D6C] hover:underline"
                        >
                          termos e condições
                        </a>{" "}
                        do RSData. *
                      </Label>
                    </div>
                  </div>
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
                    className="flex-1 bg-[#084D6C] hover:bg-[#084D6C]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!termsAccepted}
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
