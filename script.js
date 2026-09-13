/* =========================================================
   Chalé da Lucimar — script.js
   CONFIG, WhatsApp, menu mobile, galeria/lightbox,
   WhatsApp, menu mobile, galeria, acessibilidade e analytics.
   ========================================================= */

(function () {
  'use strict';

  /* -------------------------------------------------------
     1. CONFIGURAÇÃO CENTRAL
     Edite estes valores conforme as informações reais
     forem confirmadas pelo proprietário.
     ------------------------------------------------------- */
  const CONFIG = {
    nomeChale: 'Chalé da Lucimar',
    whatsappNumero: '5521967382027', // formato: 55 + DDD + número, somente dígitos
    instagramUrl: 'https://www.instagram.com/luxodosolar/',
    precoDiaria: null,
    capacidadeHospedes: 10,
    quantidadeQuartos: 2, // 1 quarto + 1 suíte
    quantidadeBanheiros: 3, // incluindo o da suíte
    checkin: null,
    checkout: null,
    aceitaAnimais: null,
    temEstacionamento: false, // não há vaga própria; estacionar na rua
    aceitaCriancas: null,
    politicaCancelamento: null,
    endereco: 'Condomínio Praia de Garatucaia, na Rua Engenheiro Irineu Marconi (Lote 6, Quadra 3), em Angra dos Reis, Rio de Janeiro'
  };

  /* Configuração da galeria: mantém sincronizado com os
     data-index do HTML. Se novas fotos forem adicionadas na
     Etapa 5, os itens são lidos direto do DOM (ver seção 4). */
  const GALERIA_CONFIG = {
    seletorItens: '.gallery-trigger'
  };

  /* -------------------------------------------------------
     2. UTILITÁRIOS
     ------------------------------------------------------- */
  function $(seletor, escopo) {
    return (escopo || document).querySelector(seletor);
  }

  function $$(seletor, escopo) {
    return Array.prototype.slice.call((escopo || document).querySelectorAll(seletor));
  }

  /* -------------------------------------------------------
     3. ANALYTICS (estrutura preparada para GA4)
     Não requer conta configurada agora. Quando o GA4 for
     adicionado (gtag.js), os eventos abaixo já disparam.
     ------------------------------------------------------- */
  function registrarEvento(nomeEvento, detalhes) {
    const payload = Object.assign({ event: nomeEvento }, detalhes || {});

    if (window.dataLayer && typeof window.dataLayer.push === 'function') {
      window.dataLayer.push(payload);
    }

    if (typeof window.gtag === 'function') {
      window.gtag('event', nomeEvento, detalhes || {});
    }

    // Log discreto para depuração em desenvolvimento.
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('[analytics]', nomeEvento, detalhes || {});
    }
  }

  /* Captura automaticamente cliques em qualquer elemento
     marcado com data-analytics="nome_do_evento". */
  function inicializarAnalyticsDeClique() {
    document.addEventListener('click', function (evento) {
      const alvo = evento.target.closest('[data-analytics]');
      if (!alvo) return;
      registrarEvento(alvo.getAttribute('data-analytics'), {
        elemento: alvo.tagName.toLowerCase(),
        texto: alvo.textContent.trim().slice(0, 60)
      });
    });
  }

  /* Profundidade de scroll: dispara em 25/50/75/100%. */
  function inicializarScrollDepth() {
    const marcos = [25, 50, 75, 100];
    const disparados = new Set();

    function verificarScroll() {
      const alturaDocumento = document.documentElement.scrollHeight - window.innerHeight;
      if (alturaDocumento <= 0) return;

      const percentual = Math.round((window.scrollY / alturaDocumento) * 100);

      marcos.forEach(function (marco) {
        if (percentual >= marco && !disparados.has(marco)) {
          disparados.add(marco);
          registrarEvento('profundidade_scroll', { percentual: marco });
        }
      });
    }

    let aguardando = false;
    window.addEventListener('scroll', function () {
      if (aguardando) return;
      aguardando = true;
      window.requestAnimationFrame(function () {
        verificarScroll();
        aguardando = false;
      });
    });
  }

  /* Clique no mapa (iframe não dispara eventos de clique padrão,
     então observamos perda de foco da janela ao interagir). */
  function inicializarEventoMapa() {
    const mapaWrapper = $('.mapa-wrapper');
    if (!mapaWrapper) return;

    let jaRegistrado = false;
    mapaWrapper.addEventListener('mouseenter', function () {
      window.addEventListener('blur', registrarCliqueMapa);
    });
    mapaWrapper.addEventListener('mouseleave', function () {
      window.removeEventListener('blur', registrarCliqueMapa);
    });

    function registrarCliqueMapa() {
      if (jaRegistrado) return;
      jaRegistrado = true;
      registrarEvento('clique_mapa');
      window.removeEventListener('blur', registrarCliqueMapa);
    }
  }

  /* -------------------------------------------------------
     4. WHATSAPP
     ------------------------------------------------------- */
  function montarLinkWhatsapp(mensagem) {
    const numero = CONFIG.whatsappNumero.replace(/\D/g, '');
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  }

  function mensagemGeral() {
    return `Olá! Tenho interesse no ${CONFIG.nomeChale}, em ${CONFIG.endereco}. Gostaria de mais informações.`;
  }


  /* Atualiza todos os botões "gerais" do WhatsApp (menu, hero,
     CTA final, footer) com o link correto. */
  function inicializarBotoesWhatsappGerais() {
    const botoes = $$('[data-whatsapp="geral"]');
    const link = montarLinkWhatsapp(mensagemGeral());
    botoes.forEach(function (botao) {
      botao.setAttribute('href', link);
    });
  }

  /* -------------------------------------------------------
     5. MENU MOBILE
     ------------------------------------------------------- */
  function inicializarMenuMobile() {
    const botaoToggle = $('#nav-toggle');
    const nav = $('#site-nav');
    if (!botaoToggle || !nav) return;

    function abrirMenu() {
      nav.classList.add('aberto');
      botaoToggle.setAttribute('aria-expanded', 'true');
      botaoToggle.setAttribute('aria-label', 'Fechar menu de navegação');
    }

    function fecharMenu() {
      nav.classList.remove('aberto');
      botaoToggle.setAttribute('aria-expanded', 'false');
      botaoToggle.setAttribute('aria-label', 'Abrir menu de navegação');
    }

    function alternarMenu() {
      const aberto = botaoToggle.getAttribute('aria-expanded') === 'true';
      if (aberto) {
        fecharMenu();
      } else {
        abrirMenu();
      }
    }

    botaoToggle.addEventListener('click', alternarMenu);

    // Fecha o menu ao clicar em um link (útil no mobile).
    $$('.nav-link', nav).forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.getComputedStyle(botaoToggle).display !== 'none') {
          fecharMenu();
        }
      });
    });

    // Fecha com Escape.
    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape' && botaoToggle.getAttribute('aria-expanded') === 'true') {
        fecharMenu();
        botaoToggle.focus();
      }
    });

    // Fecha o menu se a tela for redimensionada para desktop.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) {
        fecharMenu();
      }
    });
  }

  /* -------------------------------------------------------
     6. GALERIA + LIGHTBOX
     ------------------------------------------------------- */
  function inicializarGaleria() {
    const gatilhos = $$(GALERIA_CONFIG.seletorItens);
    if (gatilhos.length === 0) return;

    const lightbox = $('#lightbox');
    const imagemLightbox = $('#lightbox-image');
    const contador = $('#lightbox-counter');
    const botaoFechar = $('#lightbox-close');
    const botaoAnterior = $('#lightbox-prev');
    const botaoProximo = $('#lightbox-next');
    const botaoMostrarTodas = $('#gallery-show-all');

    if (!lightbox || !imagemLightbox || !contador || !botaoFechar || !botaoAnterior || !botaoProximo) {
      return;
    }

    // Monta a lista de imagens a partir do próprio DOM.
    const imagens = gatilhos.map(function (gatilho) {
      const img = $('img', gatilho);
      return {
        src: img ? img.getAttribute('src') : '',
        alt: img ? img.getAttribute('alt') : ''
      };
    });

    let indiceAtual = 0;
    let elementoComFocoAntesDeAbrir = null;

    function atualizarLightbox() {
      const imagem = imagens[indiceAtual];
      imagemLightbox.setAttribute('src', imagem.src);
      imagemLightbox.setAttribute('alt', imagem.alt);
      contador.textContent = `Foto ${indiceAtual + 1} de ${imagens.length}`;
    }

    function abrirLightbox(indice) {
      indiceAtual = indice;
      elementoComFocoAntesDeAbrir = document.activeElement;
      atualizarLightbox();
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      botaoFechar.focus();
      registrarEvento('abertura_galeria', { indice: indice + 1 });
    }

    function fecharLightbox() {
      lightbox.hidden = true;
      document.body.style.overflow = '';
      if (elementoComFocoAntesDeAbrir) {
        elementoComFocoAntesDeAbrir.focus();
      }
    }

    function irParaAnterior() {
      indiceAtual = (indiceAtual - 1 + imagens.length) % imagens.length;
      atualizarLightbox();
    }

    function irParaProxima() {
      indiceAtual = (indiceAtual + 1) % imagens.length;
      atualizarLightbox();
    }

    gatilhos.forEach(function (gatilho, indice) {
      gatilho.addEventListener('click', function () {
        abrirLightbox(indice);
      });
    });

    if (botaoMostrarTodas) {
      botaoMostrarTodas.addEventListener('click', function () {
        abrirLightbox(0);
      });
    }

    botaoFechar.addEventListener('click', fecharLightbox);
    botaoAnterior.addEventListener('click', irParaAnterior);
    botaoProximo.addEventListener('click', irParaProxima);

    // Fecha clicando fora do conteúdo.
    lightbox.addEventListener('click', function (evento) {
      if (evento.target === lightbox) {
        fecharLightbox();
      }
    });

    // Navegação por teclado + foco preso dentro do lightbox.
    lightbox.addEventListener('keydown', function (evento) {
      if (lightbox.hidden) return;

      if (evento.key === 'Escape') {
        fecharLightbox();
        return;
      }

      if (evento.key === 'ArrowLeft') {
        irParaAnterior();
        return;
      }

      if (evento.key === 'ArrowRight') {
        irParaProxima();
        return;
      }

      if (evento.key === 'Tab') {
        const focaveis = [botaoFechar, botaoAnterior, botaoProximo];
        const indiceFoco = focaveis.indexOf(document.activeElement);

        if (evento.shiftKey && (indiceFoco === 0 || indiceFoco === -1)) {
          evento.preventDefault();
          focaveis[focaveis.length - 1].focus();
        } else if (!evento.shiftKey && indiceFoco === focaveis.length - 1) {
          evento.preventDefault();
          focaveis[0].focus();
        }
      }
    });
  }
  /* -------------------------------------------------------
     8. INDICADOR DE SCROLL DO HERO
     ------------------------------------------------------- */
  function inicializarIndicadorScroll() {
    const indicador = $('#scroll-indicator');
    if (!indicador) return;

    const LIMITE_PIXELS = 80; // some após rolar essa distância

    function atualizarVisibilidade() {
      if (window.scrollY > LIMITE_PIXELS) {
        indicador.classList.add('escondido');
      } else {
        indicador.classList.remove('escondido');
      }
    }

    let aguardando = false;
    window.addEventListener('scroll', function () {
      if (aguardando) return;
      aguardando = true;
      window.requestAnimationFrame(function () {
        atualizarVisibilidade();
        aguardando = false;
      });
    });

    atualizarVisibilidade();
  }

  /* -------------------------------------------------------
     8b. BOTÃO FLUTUANTE DE WHATSAPP
     ------------------------------------------------------- */
  function inicializarBotaoFlutuante() {
    const botao = $('#whatsapp-flutuante');
    if (!botao) return;

    const LIMITE_PIXELS = 400; // aparece depois de passar o hero

    function atualizarVisibilidade() {
      if (window.scrollY > LIMITE_PIXELS) {
        botao.classList.add('visivel');
      } else {
        botao.classList.remove('visivel');
      }
    }

    let aguardando = false;
    window.addEventListener('scroll', function () {
      if (aguardando) return;
      aguardando = true;
      window.requestAnimationFrame(function () {
        atualizarVisibilidade();
        aguardando = false;
      });
    });

    atualizarVisibilidade();
  }

  /* -------------------------------------------------------
     9. RODAPÉ (ano atual e instagram)
     ------------------------------------------------------- */
  function inicializarRodape() {
    const anoAtual = $('#ano-atual');
    if (anoAtual) {
      anoAtual.textContent = new Date().getFullYear();
    }

    const linkInstagram = $('#footer-instagram');
    if (linkInstagram) {
      if (CONFIG.instagramUrl) {
        linkInstagram.setAttribute('href', CONFIG.instagramUrl);
      } else {
        // Sem Instagram configurado ainda: evita link quebrado.
        const itemInstagram = linkInstagram.closest('li');
        if (itemInstagram) {
          itemInstagram.hidden = true;
        }
      }
    }
  }

  /* -------------------------------------------------------
     10. INICIALIZAÇÃO
     ------------------------------------------------------- */
  function inicializar() {
    inicializarBotoesWhatsappGerais();
    inicializarMenuMobile();
    inicializarGaleria();
    inicializarIndicadorScroll();
    inicializarBotaoFlutuante();
    inicializarRodape();
    inicializarAnalyticsDeClique();
    inicializarScrollDepth();
    inicializarEventoMapa();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }
})();