import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MercadoPagoCheckout } from "@/components/MercadoPagoCheckout";
import { createPaymentPreference, generateExternalReference } from "@/lib/mercadopago";
import { validateDocument } from "@/lib/validators";
import {
  findOrCreateCustomer,
  createOrUpdateAddress,
  getPlanByPlanId,
  createSubscription,
  createPayment
} from "@/lib/supabase-db";
import { ArrowLeft, FileText, Loader2, Shield, CreditCard, AlertCircle } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface PlanData {
  planName: string;
  planType: string;
  price: number;
  planId: string;
}

type CheckoutStep = "form" | "payment";

export default function FormularioAssinatura() {
  const location = useLocation();
  const navigate = useNavigate();
  const planData = location.state as PlanData;

  const [currentStep, setCurrentStep] = useState<CheckoutStep>("form");
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [externalReference, setExternalReference] = useState<string>("");
  const [subscriptionId, setSubscriptionId] = useState<string>("");
  const [isCreatingPreference, setIsCreatingPreference] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<"one_time" | "subscription" | null>(null);

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
  const [documentError, setDocumentError] = useState<string | null>(null);

  useEffect(() => {
    console.log("🔄 Estado currentStep mudou para:", currentStep);
    console.log("🔑 preferenceId:", preferenceId);
    console.log("💳 paymentType:", paymentType);
  }, [currentStep, preferenceId, paymentType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

  const formatCNPJ = (value: string) => {
    const clean = value.replace(/\D/g, '');
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatCPF = (value: string) => {
    const clean = value.replace(/\D/g, '');
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCEP = (value: string) => {
    const clean = value.replace(/\D/g, '');
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handleFormattedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cpfCnpj') {
      setDocumentError(null);
      const clean = value.replace(/\D/g, '');
      if (clean.length <= 11) {
        formattedValue = formatCPF(value);
      } else {
        formattedValue = formatCNPJ(value);
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

  const createDatabaseRecords = async (externalReference: string) => {
    try {
      const customerId = await findOrCreateCustomer({
        name: formData.nomeRazaoSocial,
        document: formData.cpfCnpj,
        email: formData.email,
        phone: formData.telefone,
      });

      await createOrUpdateAddress(customerId, {
        cep: formData.cep,
        street: formData.rua,
        number: formData.numero,
        complement: formData.complemento || null,
        neighborhood: formData.bairro,
        city: formData.cidade,
        state: formData.estado,
      });

      const planUuid = await getPlanByPlanId(planData.planId);

      const billingPeriod = planData.planType.toLowerCase() === 'anual' ? 'anual' : 'mensal';
      const subscriptionId = await createSubscription(customerId, planUuid, billingPeriod);

      return { customerId, subscriptionId };
    } catch (error) {
      console.error("Error creating database records:", error);
      throw error;
    }
  };

  const savePaymentToDatabase = async (
    externalReference: string,
    mpPreferenceId: string,
    customerId: string,
    subscriptionId: string
  ) => {
    try {
      await createPayment({
        externalReference,
        mpPreferenceId,
        customerId,
        subscriptionId,
        amount: planData.price,
      });
    } catch (error) {
      console.error("Error saving payment to database:", error);
      throw error;
    }
  };

  const sendToMakeWebhook = async () => {
    const cleanDocument = formData.cpfCnpj.replace(/\D/g, '');
    const isCompany = cleanDocument.length === 14;

    const webhookData = {
      lead: {
        tipoCliente: isCompany ? "PJ" : "PF",
        documento: formData.cpfCnpj,
        documentoLimpo: cleanDocument,
        nome: formData.nomeRazaoSocial,
        telefone: formData.telefone,
        email: formData.email.toLowerCase(),
        observacoes: formData.observacoes || null
      },
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
      plano: {
        nome: planData.planName,
        tipo: planData.planType,
        valor: planData.price,
        valorFormatado: `R$ ${planData.price.toFixed(2).replace('.', ',')}`,
        categoria: planData.planType === "Anual" ? "ANUAL" : "MENSAL"
      },
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
      status: {
        etapa: "FORMULARIO_PREENCHIDO",
        proximaEtapa: "PAGAMENTO_MERCADOPAGO",
        fonte: "LANDING_PAGE_RSDATA"
      }
    };

    try {
      await fetch("https://hook.us2.make.com/0itcp73mvrj2gh4pke27jxoc2xkfqt1h", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify(webhookData),
      });
    } catch (error) {
      console.error("Erro ao enviar dados para webhook:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      alert("Você deve aceitar os termos e condições para continuar.");
      return;
    }

    if (!planData) {
      navigate("/");
      return;
    }

    const docValidation = validateDocument(formData.cpfCnpj);
    if (!docValidation.valid) {
      setDocumentError(docValidation.error || 'Documento inválido');
      return;
    }
    setDocumentError(null);

    setIsCreatingPreference(true);
    setPaymentError(null);

    try {
      console.log("🔄 Iniciando processo de assinatura...");
      console.log("📋 Tipo de plano:", planData.planType);

      await sendToMakeWebhook();
      console.log("✅ Webhook enviado");

      const externalReference = generateExternalReference(planData.planId);
      console.log("🔑 Referência externa gerada:", externalReference);

      console.log("👤 Criando registros no banco...");
      const { customerId, subscriptionId: dbSubscriptionId } = await createDatabaseRecords(externalReference);
      console.log("✅ Cliente criado:", customerId);
      console.log("✅ Assinatura criada:", dbSubscriptionId);

      const isMonthly = planData.planType.toLowerCase() === "mensal";
      console.log("📅 É plano mensal?", isMonthly);

      if (isMonthly) {
        console.log("💳 Configurando pagamento recorrente...");
        await savePaymentToDatabase(
          externalReference,
          "",
          customerId,
          dbSubscriptionId
        );
        console.log("✅ Pagamento salvo no banco");

        setPaymentType("subscription");
        setPreferenceId(externalReference);
        setExternalReference(externalReference);
        setSubscriptionId(dbSubscriptionId);
        console.log("🎯 Mudando para tela de pagamento...");
        setCurrentStep("payment");
      } else {
        console.log("💰 Criando preferência de pagamento único...");
        const preferenceResponse = await createPaymentPreference({
          plan: {
            name: planData.planName,
            type: planData.planType,
            price: planData.price,
            planId: planData.planId,
          },
          customer: {
            email: formData.email.toLowerCase(),
            name: formData.nomeRazaoSocial,
            document: formData.cpfCnpj,
            phone: formData.telefone,
            address: {
              cep: formData.cep,
              street: formData.rua,
              number: formData.numero,
              complement: formData.complemento || null,
              neighborhood: formData.bairro,
              city: formData.cidade,
              state: formData.estado.toUpperCase(),
            },
          },
          externalReference,
          subscriptionId: dbSubscriptionId,
        });
        console.log("✅ Preferência criada:", preferenceResponse);

        await savePaymentToDatabase(
          externalReference,
          preferenceResponse.preferenceId || "",
          customerId,
          dbSubscriptionId
        );
        console.log("✅ Pagamento salvo no banco");

        setPaymentType("one_time");
        setPreferenceId(preferenceResponse.preferenceId || "");
        setExternalReference(externalReference);
        console.log("🎯 Mudando para tela de pagamento...");
        setCurrentStep("payment");
      }
      console.log("✅ Processo concluído com sucesso!");
    } catch (error) {
      console.error("❌ Erro detalhado:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("❌ Mensagem de erro:", errorMessage);
      setPaymentError(`Ocorreu um erro ao processar seu pedido: ${errorMessage}. Por favor, tente novamente.`);
    } finally {
      setIsCreatingPreference(false);
    }
  };

  const handleGoBack = () => {
    if (currentStep === "payment") {
      setCurrentStep("form");
      setPreferenceId(null);
      setExternalReference("");
      setSubscriptionId("");
      setPaymentError(null);
      setPaymentType(null);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              {currentStep === "form" ? (
                <Shield className="w-8 h-8 text-[#084D6C] mr-2" />
              ) : (
                <CreditCard className="w-8 h-8 text-[#084D6C] mr-2" />
              )}
              <h1 className="text-3xl font-bold text-[#575756]">
                {currentStep === "form" ? "Dados para Assinatura" : "Finalizar Pagamento"}
              </h1>
            </div>
            <p className="text-lg text-[#575756]">
              {currentStep === "form"
                ? "Preencha os dados abaixo para finalizar sua assinatura"
                : "Escolha a forma de pagamento de sua preferência"}
            </p>

            <div className="flex justify-center mt-6">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === "form" ? "bg-[#084D6C] text-white" : "bg-green-500 text-white"
                }`}>
                  {currentStep === "payment" ? "✓" : "1"}
                </div>
                <div className={`w-16 h-1 ${currentStep === "payment" ? "bg-[#084D6C]" : "bg-gray-300"}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === "payment" ? "bg-[#084D6C] text-white" : "bg-gray-300 text-gray-500"
                }`}>
                  2
                </div>
              </div>
            </div>
          </div>

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
                  {planData.planName} - R$ {planData.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  {planData.planType === "Anual" ? "/ano" : "/mês"}
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
                  Volte para a página inicial e selecione um plano.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {currentStep === "form" ? (
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
                          className={`${documentError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-[#084D6C] focus:ring-[#084D6C]'}`}
                          placeholder="000.000.000-00 ou 00.000.000/0000-00"
                          maxLength={18}
                        />
                        {isLoadingCNPJ && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#084D6C]"></div>
                          </div>
                        )}
                      </div>
                      {documentError ? (
                        <p className="text-xs text-red-500">{documentError}</p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Para CNPJ, os dados da empresa serão preenchidos automaticamente
                        </p>
                      )}
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

                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <div className="space-y-3">
                      <Label className="text-[#575756] font-medium flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Termos e Condições
                      </Label>

                      <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                        <object
                          data="https://store.rsdata.com.br/termo-aceite-rsdata.pdf#toolbar=1&navpanes=1&scrollbar=1"
                          type="application/pdf"
                          width="100%"
                          height="500"
                          className="border-0"
                        >
                          <div className="p-6 text-center">
                            <FileText className="w-12 h-12 text-[#084D6C] mx-auto mb-4" />
                            <p className="text-[#575756] mb-4">
                              Não foi possível exibir o PDF aqui.
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => window.open('https://store.rsdata.com.br/termo-aceite-rsdata.pdf', '_blank')}
                              className="border-[#084D6C] text-[#084D6C] hover:bg-[#084D6C] hover:text-white"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Abrir PDF em Nova Aba
                            </Button>
                          </div>
                        </object>
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
                            href="https://store.rsdata.com.br/termo-aceite-rsdata.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#084D6C] hover:underline font-medium"
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
                      disabled={!termsAccepted || !planData || isCreatingPreference}
                    >
                      {isCreatingPreference ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        "Continuar para Pagamento"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-[#575756]">
                  Escolha a Forma de Pagamento
                </CardTitle>
                <CardDescription className="text-[#575756]">
                  Pague com cartão de crédito ou débito
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {paymentError && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-sm text-red-700">{paymentError}</p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-[#575756] mb-2">Resumo do Pedido</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-[#575756]">{planData?.planName} ({planData?.planType})</span>
                    <span className="font-semibold text-[#084D6C]">
                      R$ {planData?.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {preferenceId && planData && (
                  <MercadoPagoCheckout
                    preferenceId={preferenceId}
                    amount={planData.price}
                    planName={planData.planName}
                    planType={planData.planType}
                    customerEmail={formData.email}
                    customerDocument={formData.cpfCnpj}
                    customerName={formData.nomeRazaoSocial}
                    externalReference={externalReference}
                    subscriptionId={subscriptionId}
                    isSubscription={paymentType === "subscription"}
                    onReady={() => console.log("MercadoPago checkout ready")}
                    onError={(error) => {
                      console.error("MercadoPago error:", error);
                      setPaymentError("Erro ao carregar opcoes de pagamento. Tente novamente.");
                    }}
                  />
                )}

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoBack}
                    className="flex-1 border-gray-300 text-[#575756] hover:bg-gray-50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar aos Dados
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
