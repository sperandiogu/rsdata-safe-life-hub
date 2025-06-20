import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, Check, Star, Shield, Heart, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
  const [activeSection, setActiveSection] = useState("hero");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "premium" | "plus">("premium");

  // Define prices and information for each plan
  const planData = {
    basic: {
      name: "BASIC",
      description: "Para pequenas empresas",
      lives: "Até 100 vidas",
      users: "Para equipes de até 2 usuários",
      storage: "3 Gb de Espaço em Disco",
      color: "#084D6C",
      prices: {
        mensal: { price: 97, originalPrice: null, link: "https://buy.stripe.com/4gM8wP0rw7NBgGO4fr9ws03" },
        semestral: { price: 87, originalPrice: 97, link: "https://buy.stripe.com/4gM8wP0rw7NBgGO4fr9ws03" },
        anual: { price: 77, originalPrice: 97, link: "https://buy.stripe.com/4gM8wP0rw7NBgGO4fr9ws03" },
      },
    },
    premium: {
      name: "PREMIUM",
      description: "Melhor custo-benefício",
      lives: "Até 1000 vidas",
      users: "Para equipes de até 5 usuários",
      storage: "5 Gb de Espaço em Disco",
      color: "#EF7D17",
      prices: {
        mensal: { price: 499, originalPrice: null, link: "https://buy.stripe.com/cNi5kDdei9VJ62a8vH9ws02" },
        semestral: { price: 449, originalPrice: 499, link: "https://buy.stripe.com/cNi5kDdei9VJ62a8vH9ws02" },
        anual: { price: 399, originalPrice: 499, link: "https://buy.stripe.com/cNi5kDdei9VJ62a8vH9ws02" },
      },
    },
    plus: {
      name: "PLUS",
      description: "Para médias empresas",
      lives: "Até 500 vidas",
      users: "Para equipes de até 3 usuários",
      storage: "3 Gb de Espaço em Disco",
      color: "#084D6C",
      prices: {
        mensal: { price: 385, originalPrice: null, link: "https://buy.stripe.com/7sY00j2zE2thaiq5jv9ws01" },
        semestral: { price: 347, originalPrice: 385, link: "https://buy.stripe.com/7sY00j2zE2thaiq5jv9ws01" },
        anual: { price: 308, originalPrice: 385, link: "https://buy.stripe.com/7sY00j2zE2thaiq5jv9ws01" },
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
                onClick={() => window.open("https://buy.stripe.com/cNi5kDdei9VJ62a8vH9ws02", "_blank")}
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
                      window.open("https://buy.stripe.com/cNi5kDdei9VJ62a8vH9ws02", "_blank");
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
        <div className="container mx-auto px-4 text-center">
          <span className="font-medium">Reduza acidentes de trabalho e garanta conformidade com as NRs</span>
          <ArrowRight className="inline-block ml-2 h-4 w-4" />
        </div>
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
                  Saúde e Segurança do Trabalho
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
                    onClick={() => window.open("https://buy.stripe.com/cNi5kDdei9VJ62a8vH9ws02", "_blank")}
                  >
                    <Heart className="w-4 h-4 mr-2" />
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
                    src="/placeholder.svg?height=600&width=800"
                    alt="Dashboard RSData de Saúde e Segurança do Trabalho"
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
      <section id="planos" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-[#575756] mb-6">Escolha seu plano ideal</h2>
              <p className="text-xl text-[#575756] max-w-3xl mx-auto mb-12">
                Selecione o plano que melhor atende às necessidades da sua empresa e escolha o período de pagamento com as melhores condições
              </p>

              {/* Plan Selector */}
              <div className="flex justify-center mb-12">
                <div className="bg-white rounded-xl p-2 shadow-lg border border-gray-100">
                  <div className="flex">
                    <button
                      onClick={() => setSelectedPlan("basic")}
                      className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all ${
                        selectedPlan === "basic"
                          ? "bg-[#084D6C] text-white shadow-md"
                          : "text-[#575756] hover:text-[#084D6C] hover:bg-gray-50"
                      }`}
                    >
                      Basic
                    </button>
                    <button
                      onClick={() => setSelectedPlan("premium")}
                      className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all relative ${
                        selectedPlan === "premium"
                          ? "bg-[#EF7D17] text-white shadow-md"
                          : "text-[#575756] hover:text-[#EF7D17] hover:bg-orange-50"
                      }`}
                    >
                      Premium
                      <span className="absolute -top-1 -right-1 bg-[#EF7D17] text-white text-xs px-2 py-1 rounded-full font-medium">
                        Popular
                      </span>
                    </button>
                    <button
                      onClick={() => setSelectedPlan("plus")}
                      className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all ${
                        selectedPlan === "plus"
                          ? "bg-[#084D6C] text-white shadow-md"
                          : "text-[#575756] hover:text-[#084D6C] hover:bg-gray-50"
                      }`}
                    >
                      Plus
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Plan Information */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-4xl mx-auto mb-16">
                <div className="text-center">
                  <h3 className="text-3xl font-bold mb-3" style={{ color: currentPlan.color }}>
                    {currentPlan.name}
                  </h3>
                  <p className="text-lg text-[#575756] mb-2">{currentPlan.description}</p>
                  <p className="text-lg font-semibold text-[#084D6C] mb-6">{currentPlan.lives}</p>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      <span className="font-medium text-[#575756]">{currentPlan.users}</span>
                    </div>
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      <span className="font-medium text-[#575756]">{currentPlan.storage}</span>
                    </div>
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      <span className="font-medium text-[#575756]">Software Completo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Monthly Card */}
            <AnimateOnScroll animation="fade-up" delay={0.1}>
              <Card className="relative h-full border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-[#575756] mb-2">MENSAL</CardTitle>
                  <CardDescription className="text-base text-[#575756] mb-6">Pagamento mensal</CardDescription>
                  <div className="mb-6">
                    <div className="flex items-end justify-center mb-2">
                      <span className="text-sm text-[#575756] mr-1">R$</span>
                      <span className="text-5xl font-bold text-[#575756]">
                        {currentPlan.prices.mensal.price}
                      </span>
                      <span className="text-lg text-[#575756] ml-1">/mês</span>
                    </div>
                    <p className="text-sm text-[#575756]">Flexibilidade total</p>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-4 flex-shrink-0" />
                      <span className="text-[#575756]">Cancele quando quiser</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-4 flex-shrink-0" />
                      <span className="text-[#575756]">Ideal para testes</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-4 flex-shrink-0" />
                      <span className="text-[#575756]">Suporte completo</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-4 flex-shrink-0" />
                      <span className="text-[#575756]">Acesso imediato</span>
                    </li>
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-[#575756] text-[#575756] hover:bg-[#575756] hover:text-white font-semibold py-3 text-base"
                    onClick={() => window.open(currentPlan.prices.mensal.link, "_blank")}
                  >
                    ESCOLHER MENSAL
                  </Button>
                </CardContent>
              </Card>
            </AnimateOnScroll>

            {/* Annual Card - MAIN HIGHLIGHT */}
            <AnimateOnScroll animation="fade-up" delay={0.2}>
              <Card className="relative h-full border-4 border-[#EF7D17] bg-gradient-to-b from-orange-50 to-white transform scale-105 shadow-2xl">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-[#EF7D17] text-white px-6 py-2 text-sm font-bold shadow-lg">
                    MAIS POPULAR
                  </Badge>
                </div>
                <CardHeader className="text-center pb-4 pt-8">
                  <CardTitle className="text-2xl font-bold text-[#EF7D17] mb-2">ANUAL</CardTitle>
                  <CardDescription className="text-base text-[#575756] mb-6">
                    Melhor custo-benefício
                  </CardDescription>
                  <div className="mb-6">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="flex items-end">
                        <span className="text-sm text-[#EF7D17] mr-1">R$</span>
                        <span className="text-5xl font-bold text-[#EF7D17]">
                          {currentPlan.prices.anual.price}
                        </span>
                        <span className="text-lg text-[#EF7D17] ml-1">/mês</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg text-gray-400 line-through block">
                          R${currentPlan.prices.anual.originalPrice}
                        </span>
                      </div>
                    </div>
                    <div className="bg-[#EF7D17]/10 rounded-lg p-3">
                      <p className="text-sm font-bold text-[#EF7D17]">
                        💰 Economize R${(currentPlan.prices.anual.originalPrice! - currentPlan.prices.anual.price) * 12} por ano
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-4 flex-shrink-0" />
                      <span className="text-[#575756] font-medium">20% de desconto</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-4 flex-shrink-0" />
                      <span className="text-[#575756] font-medium">Máxima economia</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-4 flex-shrink-0" />
                      <span className="text-[#575756] font-medium">Um pagamento por ano</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-4 flex-shrink-0" />
                      <span className="text-[#575756] font-medium">Suporte VIP</span>
                    </li>
                  </ul>
                  <Button
                    className="w-full bg-[#EF7D17] hover:bg-[#EF7D17]/90 text-white font-bold py-4 text-lg shadow-lg"
                    onClick={() => window.open(currentPlan.prices.anual.link, "_blank")}
                  >
                    ESCOLHER ANUAL
                  </Button>
                </CardContent>
              </Card>
            </AnimateOnScroll>

            {/* Biannual Card */}
            <AnimateOnScroll animation="fade-up" delay={0.3}>
              <Card className="relative h-full border-2 border-[#084D6C] hover:border-[#084D6C]/80 transition-all duration-300">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-[#084D6C] text-white px-4 py-1 text-xs font-bold">
                    10% OFF
                  </Badge>
                </div>
                <CardHeader className="text-center pb-4 pt-8">
                  <CardTitle className="text-2xl font-bold text-[#084D6C] mb-2">SEMESTRAL</CardTitle>
                  <CardDescription className="text-base text-[#575756] mb-6">
                    Pagamento a cada 6 meses
                  </CardDescription>
                  <div className="mb-6">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="flex items-end">
                        <span className="text-sm text-[#084D6C] mr-1">R$</span>
                        <span className="text-5xl font-bold text-[#084D6C]">
                          {currentPlan.prices.semestral.price}
                        </span>
                        <span className="text-lg text-[#084D6C] ml-1">/mês</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg text-gray-400 line-through block">
                          R${currentPlan.prices.semestral.originalPrice}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-[#084D6C]">
                      Economize R${(currentPlan.prices.semestral.originalPrice! - currentPlan.prices.semestral.price) * 6} por semestre
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-4 flex-shrink-0" />
                      <span className="text-[#575756]">10% de desconto</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-4 flex-shrink-0" />
                      <span className="text-[#575756]">Menos preocupação</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-4 flex-shrink-0" />
                      <span className="text-[#575756]">Ótimo custo-benefício</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-4 flex-shrink-0" />
                      <span className="text-[#575756]">Suporte prioritário</span>
                    </li>
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-[#084D6C] text-[#084D6C] hover:bg-[#084D6C] hover:text-white font-semibold py-3 text-base"
                    onClick={() => window.open(currentPlan.prices.semestral.link, "_blank")}
                  >
                    ESCOLHER SEMESTRAL
                  </Button>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          </div>

          {/* Guarantees */}
          <AnimateOnScroll animation="fade-up" delay={0.4}>
            <div className="mt-16 text-center">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-4xl mx-auto">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-center justify-center bg-green-50 rounded-lg p-6">
                    <Shield className="h-6 w-6 text-green-600 mr-3" />
                    <span className="text-base font-semibold text-[#575756]">Garantia de 30 dias</span>
                  </div>
                  <div className="flex items-center justify-center bg-blue-50 rounded-lg p-6">
                    <Check className="h-6 w-6 text-blue-600 mr-3" />
                    <span className="text-base font-semibold text-[#575756]">Sem taxa de setup</span>
                  </div>
                  <div className="flex items-center justify-center bg-orange-50 rounded-lg p-6">
                    <Heart className="h-6 w-6 text-orange-600 mr-3" />
                    <span className="text-base font-semibold text-[#575756]">Suporte especializado</span>
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
                    Como funciona o período de teste de 30 dias?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#575756]">
                    Oferecemos 30 dias de garantia para todos os nossos planos. Se você não estiver satisfeito com nossa
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

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left font-medium text-[#575756]">
                    O que são "usuários SEC"?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#575756]">
                    Usuários SEC (Saúde e Segurança do Colaborador) são os colaboradores da empresa que têm acesso
                    limitado ao sistema para visualizar suas próprias informações, como exames médicos, treinamentos e
                    EPIs. Todos os nossos planos incluem usuários SEC ilimitados.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-left font-medium text-[#575756]">
                    O sistema funciona em dispositivos móveis?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#575756]">
                    Sim, nossa plataforma é totalmente responsiva e pode ser acessada de qualquer dispositivo com
                    conexão à internet. Além disso, oferecemos aplicativos móveis para iOS e Android que permitem
                    realizar inspeções, registrar ocorrências e acessar documentos mesmo offline.
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
              <a href="#" className="hover:text-white transition-colors">
                Sobre
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Planos
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contato
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Suporte
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Privacidade
              </a>
            </div>
          </div>
          <div className="border-t border-gray-400 mt-6 pt-6 text-center text-sm text-gray-300">
            <p>&copy; 2024 RSData. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
