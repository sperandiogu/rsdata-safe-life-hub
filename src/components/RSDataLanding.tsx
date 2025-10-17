import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Check, Heart, Menu, Shield, Star } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// Animation component for scroll-triggered animations
function AnimateOnScroll({
  children,
  animation = "fade-up",
  duration = 0.6,
  delay = 0,
  threshold = 0.1,
  className = "",
}: {
  children: React.ReactNode;
  animation?: "fade-up" | "fade-down" | "fade-left" | "fade-right" | "zoom-in" | "zoom-out";
  duration?: number;
  delay?: number;
  threshold?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: threshold,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  // Define animation classes
  const animationClasses = {
    "fade-up": "opacity-0 translate-y-10",
    "fade-down": "opacity-0 -translate-y-10",
    "fade-left": "opacity-0 translate-x-10",
    "fade-right": "opacity-0 -translate-x-10",
    "zoom-in": "opacity-0 scale-95",
    "zoom-out": "opacity-0 scale-105",
  };

  const visibleClass = "opacity-100 translate-y-0 translate-x-0 scale-100";

  const style = {
    transition: `opacity ${duration}s ease-out, transform ${duration}s ease-out`,
    transitionDelay: `${delay}s`,
  };

  return (
    <div
      ref={ref}
      className={`${className} ${isVisible ? visibleClass : animationClasses[animation]}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function RSDataLanding() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("hero");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "premium" | "plus" | "enterprise">("premium");
  const [periodSelected, setPeriodSelected] = useState<"mensal" | "anual">("anual");

  // Define prices and information for each plan
  const planData = {
    basic: {
      name: "BASIC",
      lives: "Até 100 vidas",
      users: "Para equipes de até 2 usuários",
      storage: "3 Gb de Espaço em Disco",
      color: "#084D6C",
      prices: {
        mensal: { price: 97, originalPrice: null, link: "https://seguro.rsdata.com.br/b/6oUcN58Y28RFeyGdQ19ws0i"},
        anual: { price: 997, originalPrice: 1164, totalPrice: 997, link: "https://seguro.rsdata.com.br/b/14A00j5LQ3xl9emcLX9ws0h" },
      },
    },
    premium: {
      name: "PREMIUM",
      lives: "Até 300 vidas",
      users: "Para equipes de até 3 usuários",
      storage: "5 Gb de Espaço em Disco",
      color: "#084D6C",
      prices: {
        mensal: { price: 197, originalPrice: null, link: "https://seguro.rsdata.com.br/b/fZu4gz7TYaZNbmuh2d9ws0l"},
        anual: { price: 1997, originalPrice: 2364, totalPrice: 1997, link: "https://seguro.rsdata.com.br/b/fZu14ndei2th76e13f9ws0k"},
      },
    },
    plus: {
      name: "PLUS",
      lives: "Até 500 vidas",
      users: "Para equipes de até 3 usuários",
      storage: "3 Gb de Espaço em Disco",
      color: "#084D6C",
      prices: {
        mensal: { price: 267, originalPrice: null, link: "https://seguro.rsdata.com.br/b/14AcN5b6aebZaiqcLX9ws0g"},
        anual: { price: 2697, originalPrice: 3204, totalPrice: 2697, link: "https://seguro.rsdata.com.br/b/3cI8wP4HMc3RgGOfY99ws0j"},
      },
    },
    enterprise: {
      name: "ENTERPRISE",
      lives: "Mais de 500 vidas",
      users: "Para empresas com mais de 500 vidas",
      storage: "Consulte nosso time",
      color: "#084D6C",
      prices: {
        mensal: { price: null, originalPrice: null, link: "https://wa.me/555137201416?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20o%20plano%20Enterprise%20mensal%20para%20empresas%20com%20mais%20de%20500%20vidas"},
        anual: { price: null, originalPrice: null, link: "https://wa.me/555137201416?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20o%20plano%20Enterprise%20anual%20para%20empresas%20com%20mais%20de%20500%20vidas"},
      },
    },
  };

  // Function for smooth scroll
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80; // header height
      const elementPosition = element.offsetTop - headerHeight;

      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
    setMobileMenuOpen(false); // close mobile menu if open
  };

  // Function to detect active section during scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "como-funciona", "planos", "depoimentos", "faq"];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentPlan = planData[selectedPlan];

  // Function to navigate to form page
  const navigateToForm = (planName: string, planType: string, price: number, stripeLink: string) => {
    navigate("/formulario-assinatura", {
      state: { planName, planType, price, stripeLink }
    });
  };

  // Function to handle Enterprise plan redirect to WhatsApp
  const handleEnterprisePlan = (whatsappLink: string) => {
    window.open(whatsappLink, "_blank");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Redesigned to be more professional */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <img
                src="https://cadastro.rsdata.com.br/rsdata-logo.png"
                alt="RSData Logo"
                className="h-9 md:h-10 w-auto"
              />
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden flex items-center text-[#575756]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => scrollToSection("como-funciona")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "como-funciona"
                    ? "text-[#084D6C] bg-[#084D6C]/5"
                    : "text-[#575756] hover:text-[#084D6C] hover:bg-gray-50"
                }`}
              >
                Como Funciona
              </button>
              <button
                onClick={() => scrollToSection("planos")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "planos"
                    ? "text-[#084D6C] bg-[#084D6C]/5"
                    : "text-[#575756] hover:text-[#084D6C] hover:bg-gray-50"
                }`}
              >
                Planos
              </button>
              <button
                onClick={() => scrollToSection("depoimentos")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "depoimentos"
                    ? "text-[#084D6C] bg-[#084D6C]/5"
                    : "text-[#575756] hover:text-[#084D6C] hover:bg-gray-50"
                }`}
              >
                Depoimentos
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "faq"
                    ? "text-[#084D6C] bg-[#084D6C]/5"
                    : "text-[#575756] hover:text-[#084D6C] hover:bg-gray-50"
                }`}
              >
                FAQ
              </button>
            </nav>

            {/* CTA Button */}
            <div className="hidden md:block">
              <Button
                className="bg-[#084D6C] hover:bg-[#084D6C]/90 text-white font-medium px-5 py-2 h-10 shadow-sm"
                onClick={() => scrollToSection("planos")}
              >
                ASSINE AGORA
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t">
              <nav className="flex flex-col space-y-1 pb-3">
                <button
                  onClick={() => scrollToSection("como-funciona")}
                  className="px-4 py-2 text-[#575756] hover:text-[#084D6C] hover:bg-gray-50 rounded-md text-left"
                >
                  Como Funciona
                </button>
                <button
                  onClick={() => scrollToSection("planos")}
                  className="px-4 py-2 text-[#575756] hover:text-[#084D6C] hover:bg-gray-50 rounded-md text-left"
                >
                  Planos
                </button>
                <button
                  onClick={() => scrollToSection("depoimentos")}
                  className="px-4 py-2 text-[#575756] hover:text-[#084D6C] hover:bg-gray-50 rounded-md text-left"
                >
                  Depoimentos
                </button>
                <button
                  onClick={() => scrollToSection("faq")}
                  className="px-4 py-2 text-[#575756] hover:text-[#084D6C] hover:bg-gray-50 rounded-md text-left"
                >
                  FAQ
                </button>
                <div className="pt-2 px-4">
                  <Button
                    className="bg-[#084D6C] hover:bg-[#084D6C]/90 text-white font-medium w-full"
                    onClick={() => {
                      scrollToSection("planos");
                      setMobileMenuOpen(false);
                    }}
                  >
                    ASSINE AGORA
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* CTA Banner */}
      <div className="bg-[#084D6C] text-white py-3">
        <a
          href="https://www.rsdata.com.br/store/"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="container mx-auto px-4 text-center">
            <span className="font-medium">Conheça o Plano Ecommerce da RSData</span>
            <ArrowRight className="inline-block ml-2 h-4 w-4" />
          </div>
        </a>
      </div>

      {/* Hero Section */}
      <section id="hero" className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Text content */}
            <div className="w-full lg:w-1/2 text-left">
              <AnimateOnScroll animation="fade-down" delay={0.1}>
                <Badge className="mb-4 bg-[#084D6C]/10 text-[#084D6C] hover:bg-[#084D6C]/10">
                  <Shield className="w-4 h-4 mr-1" />
                  Segurança e Saúde do Trabalho
                </Badge>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={0.2}>
                <h1 className="text-4xl lg:text-6xl font-bold text-[#575756] mb-6">
                  Transforme a sua
                  <span className="text-[#084D6C]"> Gestão de SST</span>
                </h1>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={0.3}>
                <p className="text-xl text-[#575756] mb-6 max-w-xl">
                  Aproveite a melhor oportunidade para solucionar a sua Gestão de SST, com o melhor software de SST.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={0.4}>
                <div className="flex flex-col gap-4 mb-8 sm:max-w-xs">
                  <Button
                    size="lg"
                    className="bg-[#084D6C] hover:bg-[#084D6C]/90"
                    onClick={() => scrollToSection("planos")}
                  >
                    ASSINE AGORA
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-[#084D6C] text-[#084D6C] hover:bg-[#084D6C] hover:text-white"
                    onClick={() => scrollToSection("planos")}
                  >
                    Ver Planos
                  </Button>
                </div>
              </AnimateOnScroll>
            </div>

            {/* Image/Mockup */}
            <div className="lg:w-1/2 hidden lg:block">
              <AnimateOnScroll animation="fade-left" delay={0.5}>
                <div className="relative rounded-lg shadow-xl overflow-hidden border border-gray-200">
                  <img
                    src="https://cdn.greatsoftwares.com.br/arquivos/paginas_editor/376927-a49f1118af057f7930f920763a8276c3.png"
                    alt="Dashboard RSData de Segurança e Saúde do Trabalho"
                    className="w-full h-auto rounded-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#084D6C]/10 to-transparent pointer-events-none"></div>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fade-up">
            <h2 className="text-3xl font-bold text-center text-[#575756] mb-4">Como funciona a assinatura</h2>
            <p className="text-center text-[#575756] mb-12 max-w-2xl mx-auto">
              Processo simples e rápido para começar a proteger seus colaboradores com nossa solução de SST.
            </p>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-4 gap-8">
            <AnimateOnScroll animation="fade-up" delay={0.1}>
              <div className="text-center">
                <div className="bg-[#084D6C]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-[#084D6C]">1</span>
                </div>
                <h3 className="font-semibold text-[#575756] mb-2">Escolha o plano ideal para você</h3>
                <p className="text-[#575756] text-sm">
                  Selecione o plano que melhor atende às necessidades da sua empresa
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" delay={0.2}>
              <div className="text-center">
                <div className="bg-[#084D6C]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-[#084D6C]">2</span>
                </div>
                <h3 className="font-semibold text-[#575756] mb-2">Realize o pagamento do seu plano</h3>
                <p className="text-[#575756] text-sm">Processo de pagamento seguro e rápido para ativar sua conta</p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" delay={0.3}>
              <div className="text-center">
                <div className="bg-[#084D6C]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-[#084D6C]">3</span>
                </div>
                <h3 className="font-semibold text-[#575756] mb-2">Receba as informações de acesso</h3>
                <p className="text-[#575756] text-sm">
                  Enviamos por email todos os dados necessários para acessar a plataforma
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" delay={0.4}>
              <div className="text-center">
                <div className="bg-[#084D6C]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-[#084D6C]">4</span>
                </div>
                <h3 className="font-semibold text-[#575756] mb-2">Agora você está seguro, com RSData</h3>
                <p className="text-[#575756] text-sm">Comece a usar imediatamente e proteja seus colaboradores</p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="planos" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#575756] mb-4">Escolha seu plano ideal</h2>
              <p className="text-lg text-[#575756] max-w-2xl mx-auto mb-8">
                Selecione o plano que melhor atende às necessidades da sua empresa
              </p>

              {/* Period Selector */}
              <div className="flex justify-center mb-8">
                <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                  <div className="flex">
                    <button
                      onClick={() => setPeriodSelected("mensal")}
                      className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                        periodSelected === "mensal"
                          ? "bg-[#084D6C] text-white shadow-sm"
                          : "text-[#575756] hover:text-[#084D6C]"
                      }`}
                    >
                      Mensal
                    </button>
                    <button
                      onClick={() => setPeriodSelected("anual")}
                      className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                        periodSelected === "anual"
                          ? "bg-[#084D6C] text-white shadow-sm"
                          : "text-[#575756] hover:text-[#084D6C]"
                      }`}
                    >
                      Anual
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </AnimateOnScroll>

{/* Plans Grid */}
<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
  {/* Basic Plan */}
  <AnimateOnScroll animation="fade-up" delay={0.1}>
    <Card className="relative bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 h-full">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-lg font-semibold text-[#575756] mb-1">
          {planData.basic.name}
        </CardTitle>
        <div className="mb-4">
          <div className="flex items-end justify-center mb-1">
            <span className="text-sm text-[#575756]">R$</span>
            <span className="text-3xl font-bold text-[#575756]">
              {planData.basic.prices[periodSelected].price}
            </span>
            <span className="text-sm text-[#575756]">
              /{periodSelected === "mensal" ? "mês" : "ano"}
            </span>
          </div>
          {periodSelected === "anual" && planData.basic.prices.anual.originalPrice && (
            <p className="text-xs text-gray-500">
              <span className="line-through">R$ {planData.basic.prices.anual.originalPrice}</span>
              {" "}• Total: R$ {planData.basic.prices.anual.totalPrice}/ano
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 mb-6">
          <div className="flex items-center text-sm">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-[#575756]">{planData.basic.lives}</span>
          </div>
          <div className="flex items-center text-sm">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-[#575756]">{planData.basic.users}</span>
          </div>
          <div className="flex items-center text-sm">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-[#575756]">{planData.basic.storage}</span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full border-[#084D6C] text-[#084D6C] hover:bg-[#084D6C] hover:text-white"
          onClick={() => navigateToForm(
            planData.basic.name,
            periodSelected === "mensal" ? "Mensal" : "Anual",
            planData.basic.prices[periodSelected].price,
            planData.basic.prices[periodSelected].link
          )}
        >
          ASSINAR AGORA
        </Button>
      </CardContent>
    </Card>
  </AnimateOnScroll>

  {/* Premium Plan - Highlighted */}
  <AnimateOnScroll animation="fade-up" delay={0.2}>
    <Card className="relative bg-white border-2 border-[#084D6C] shadow-lg transform md:scale-105">
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <Badge className="bg-[#084D6C] text-white px-3 py-1 text-xs">
          Recomendado
        </Badge>
      </div>
      <CardHeader className="text-center pb-4 pt-6">
        <CardTitle className="text-lg font-semibold text-[#084D6C] mb-1">
          {planData.premium.name}
        </CardTitle>
        <div className="mb-4">
          <div className="flex items-end justify-center gap-2 mb-1">
            <div className="flex items-end">
              <span className="text-sm text-[#084D6C]">R$</span>
              <span className="text-3xl font-bold text-[#084D6C]">
                {planData.premium.prices[periodSelected].price}
              </span>
              <span className="text-sm text-[#084D6C]">
                /{periodSelected === "mensal" ? "mês" : "ano"}
              </span>
            </div>
            {periodSelected === "anual" && planData.premium.prices.anual.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                R${planData.premium.prices.anual.originalPrice}
              </span>
            )}
          </div>
          {periodSelected === "anual" && planData.premium.prices.anual.totalPrice && (
            <p className="text-xs text-[#084D6C] font-medium">
              Total: R$ {planData.premium.prices.anual.totalPrice} por ano
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 mb-6">
          <div className="flex items-center text-sm">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-[#575756]">{planData.premium.lives}</span>
          </div>
          <div className="flex items-center text-sm">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-[#575756]">{planData.premium.users}</span>
          </div>
          <div className="flex items-center text-sm">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-[#575756]">{planData.premium.storage}</span>
          </div>
        </div>
        <Button
          className="w-full bg-[#084D6C] hover:bg-[#084D6C]/90 text-white"
          onClick={() => navigateToForm(
            planData.premium.name,
            periodSelected === "mensal" ? "Mensal" : "Anual",
            planData.premium.prices[periodSelected].price,
            planData.premium.prices[periodSelected].link
          )}
        >
          ASSINAR AGORA
        </Button>
      </CardContent>
    </Card>
  </AnimateOnScroll>

  {/* Plus Plan */}
  <AnimateOnScroll animation="fade-up" delay={0.3}>
    <Card className="relative bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 h-full">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-lg font-semibold text-[#575756] mb-1">
          {planData.plus.name}
        </CardTitle>
        <div className="mb-4">
          <div className="flex items-end justify-center mb-1">
            <span className="text-sm text-[#575756]">R$</span>
            <span className="text-3xl font-bold text-[#575756]">
              {planData.plus.prices[periodSelected].price}
            </span>
            <span className="text-sm text-[#575756]">
              /{periodSelected === "mensal" ? "mês" : "ano"}
            </span>
          </div>
          {periodSelected === "anual" && planData.plus.prices.anual.originalPrice && (
            <p className="text-xs text-gray-500">
              <span className="line-through">R$ {planData.plus.prices.anual.originalPrice}</span>
              {" "}• Total: R$ {planData.plus.prices.anual.totalPrice}/ano
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 mb-6">
          <div className="flex items-center text-sm">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-[#575756]">{planData.plus.lives}</span>
          </div>
          <div className="flex items-center text-sm">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-[#575756]">{planData.plus.users}</span>
          </div>
          <div className="flex items-center text-sm">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-[#575756]">{planData.plus.storage}</span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full border-[#084D6C] text-[#084D6C] hover:bg-[#084D6C] hover:text-white"
          onClick={() => navigateToForm(
            planData.plus.name,
            periodSelected === "mensal" ? "Mensal" : "Anual",
            planData.plus.prices[periodSelected].price,
            planData.plus.prices[periodSelected].link
          )}
        >
          ASSINAR AGORA
        </Button>
      </CardContent>
    </Card>
  </AnimateOnScroll>

  {/* Enterprise Plan */}
  <AnimateOnScroll animation="fade-up" delay={0.4}>
    <Card className="relative bg-white border-2 border-orange-500 hover:shadow-lg transition-all duration-300 h-full">
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <Badge className="bg-orange-500 text-white px-3 py-1 text-xs">
          Personalizado
        </Badge>
      </div>
      <CardHeader className="text-center pb-4 pt-6">
        <CardTitle className="text-lg font-semibold text-orange-500 mb-1">
          {planData.enterprise.name}
        </CardTitle>
        <div className="mb-4">
          <div className="flex items-center justify-center mb-1">
            <span className="text-lg font-bold text-orange-500">
              Consulte-nos
            </span>
          </div>
          <p className="text-xs text-orange-600 font-medium">
            Plano personalizado para sua empresa
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 mb-6">
          <div className="flex items-center text-sm">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-[#575756]">{planData.enterprise.lives}</span>
          </div>
          <div className="flex items-center text-sm">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-[#575756]">{planData.enterprise.users}</span>
          </div>
          <div className="flex items-center text-sm">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-[#575756]">{planData.enterprise.storage}</span>
          </div>
        </div>
        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => handleEnterprisePlan(planData.enterprise.prices[periodSelected].link)}
        >
          FALAR NO WHATSAPP
        </Button>
      </CardContent>
    </Card>
  </AnimateOnScroll>
</div>


          {/* Guarantees */}
          <AnimateOnScroll animation="fade-up" delay={0.4}>
            <div className="mt-12 text-center">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 max-w-3xl mx-auto">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-center">
                    <Shield className="h-5 w-5 text-[#084D6C] mr-2" />
                    <span className="text-sm font-medium text-[#575756]">Garantia de 7 dias</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <Check className="h-5 w-5 text-[#084D6C] mr-2" />
                    <span className="text-sm font-medium text-[#575756]">Sem taxa de setup</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <Heart className="h-5 w-5 text-[#084D6C] mr-2" />
                    <span className="text-sm font-medium text-[#575756]">Suporte especializado</span>
                  </div>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fade-up">
            <h2 className="text-3xl font-bold text-center text-[#575756] mb-12">
              Empresas que já protegem seus colaboradores conosco
            </h2>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-8">
            <AnimateOnScroll animation="fade-up" delay={0.1}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-[#575756] mb-4">
                    "Reduzimos em 85% os acidentes de trabalho no primeiro ano. O sistema da RSData nos ajudou a
                    identificar riscos que passavam despercebidos."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#084D6C]/10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-[#084D6C] font-semibold">MS</span>
                    </div>
                    <div>
                      <p className="font-semibold">Marcos Silva</p>
                      <p className="text-sm text-[#575756]">Gerente de SST, Metalúrgica Santos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" delay={0.2}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-[#575756] mb-4">
                    "Passamos em todas as auditorias do Ministério do Trabalho sem problemas. A conformidade com as NRs
                    ficou muito mais simples de gerenciar."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#084D6C]/10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-[#084D6C] font-semibold">LC</span>
                    </div>
                    <div>
                      <p className="font-semibold">Luciana Costa</p>
                      <p className="text-sm text-[#575756]">Coordenadora de RH, Construtora Horizonte</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" delay={0.3}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-[#575756] mb-4">
                    "A implementação foi rápida e a equipe se adaptou facilmente. Agora temos controle total sobre EPIs,
                    exames e treinamentos."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#084D6C]/10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-[#084D6C] font-semibold">RA</span>
                    </div>
                    <div>
                      <p className="font-semibold">Ricardo Almeida</p>
                      <p className="text-sm text-[#575756]">Diretor Industrial, Química Brasileira</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#575756] mb-4">Perguntas Frequentes</h2>
              <p className="text-lg text-[#575756] max-w-2xl mx-auto">
                Tire suas dúvidas sobre nossa plataforma de Saúde e Segurança do Trabalho
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={0.1}>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left font-medium text-[#575756]">
                    Como funciona o período de teste de 7 dias?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#575756]">
                    Oferecemos 7 dias de garantia para todos os nossos planos. Se você não estiver satisfeito com nossa
                    plataforma, basta entrar em contato com nosso suporte para solicitar o cancelamento e reembolso
                    dentro deste período.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left font-medium text-[#575756]">
                    Quais Normas Regulamentadoras (NRs) o sistema atende?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#575756]">
                    Nossa plataforma atende a todas as principais NRs relacionadas à Saúde e Segurança do Trabalho,
                    incluindo NR-1 (Disposições Gerais), NR-4 (SESMT), NR-5 (CIPA), NR-6 (EPI), NR-7 (PCMSO), NR-9
                    (PPRA), NR-12 (Máquinas e Equipamentos), NR-17 (Ergonomia), entre outras. Nosso sistema é
                    constantemente atualizado para se adequar às mudanças na legislação.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left font-medium text-[#575756]">
                    Posso mudar de plano depois da contratação?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#575756]">
                    Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento. Ao fazer upgrade, a
                    diferença será calculada proporcionalmente ao tempo restante da sua assinatura atual. Para
                    downgrades, as alterações serão aplicadas na próxima renovação.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left font-medium text-[#575756]">
                    Como é feita a implementação do sistema?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#575756]">
                    Após a contratação, você receberá acesso imediato à plataforma. Nossa equipe de suporte irá guiá-lo
                    no processo de configuração inicial e importação de dados. Oferecemos treinamentos pela Academia
                    RSData para garantir que sua equipe aproveite ao máximo todas as funcionalidades do sistema.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-7">
                  <AccordionTrigger className="text-left font-medium text-[#575756]">
                    Como funciona o suporte técnico?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#575756]">
                    Oferecemos suporte técnico via sistema de chamados com tempo de resposta garantido conforme o plano
                    contratado. Todos os clientes têm acesso à nossa base de conhecimento e tutoriais em vídeo. Planos
                    Premium e Plus contam com atendimento prioritário.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#575756] text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <img
                src="https://cadastro.rsdata.com.br/rsdata-logo.png"
                alt="RSData Logo"
                className="h-8 w-auto brightness-0 invert"
              />
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm text-gray-300">
              <a href="https://www.rsdata.com.br/quem-somos/" className="hover:text-white transition-colors">
                Quem Somos
              </a>
              <a href="#planos" className="hover:text-white transition-colors">
                Planos
              </a>
              <a href="https://www.rsdata.com.br/fale-conosco/" className="hover:text-white transition-colors">
                Contato
              </a>
              <a href="https://apps.rsdata.com.br/chamados/#/solicitacoes?token=24a79d5b-e909-4804-9d90-5b864dc49d81" className="hover:text-white transition-colors">
                Suporte
              </a>
              <a href="https://www.rsdata.com.br/politica-de-privacidade/" className="hover:text-white transition-colors">
                Privacidade
              </a>
            </div>
          </div>
          <div className="border-t border-gray-400 mt-6 pt-6 text-center text-sm text-gray-300">
            <p>&copy; {new Date().getFullYear()} RSData. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
