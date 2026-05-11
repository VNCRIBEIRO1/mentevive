---
name: export-entrega
description: Export otimizado e entrega profissional do mockup animado — múltiplas resoluções e codecs, otimização de Lottie/Rive pra produção web, motion guidelines documentadas, handoff para desenvolvedores, versionamento e organização de arquivos finais. Use depois da edição final estar aprovada. Acionar quando o usuário disser: "exportar", "render final", "entregar", "handoff", "documentação", "motion guidelines", "Lottie otimizado", "tamanho de arquivo", "compressão", "H.264", "ProRes", "versionamento", "naming convention", "passar pro desenvolvedor", "Dev Mode", "Zeplin".
---

# Export & Entrega

A última fase. Mockup pronto não é mockup entregue. Aqui você converte o trabalho em arquivos otimizados pra cada destino, documenta o que foi feito, e prepara handoff limpo pra quem vai consumir (cliente, dev, Behance, Awwwards).

## Quando usar

- Master final aprovado em `07-edicao-video-final`
- Hora de gerar todas as versões finais
- Preparar handoff pra desenvolvedor (se motion vai virar produção)
- Submeter pra plataforma (Behance, Awwwards, Dribbble)
- Entregar pacote final pro cliente

## Workflow

### 1. Mapeamento de entregáveis

Antes de exportar, listar exatamente o que precisa ser entregue:

**Por destino:**

| Destino | Formatos esperados |
|---|---|
| Cliente final | MP4 (H.264) em alta qualidade + arquivo fonte (opcional) |
| Site / produção web | MP4 H.264 otimizado, WebM (alternativa), Lottie JSON, ou MP4 com fallback poster |
| Behance / Vimeo | MP4 H.264 alta qualidade ou ProRes 422 HQ |
| Awwwards | MP4 H.264 alta qualidade, screenshots, descrição em EN |
| Instagram Feed | MP4 H.264, 1080x1080, áudio AAC |
| Instagram Reels / TikTok / Shorts | MP4 H.264, 1080x1920, com legendas burned-in |
| LinkedIn | MP4 H.264, 1920x1080, áudio AAC |
| Email marketing | GIF otimizado (mais limitado) ou MP4 leve |
| Apresentação (Keynote/Slides) | MP4 H.264 ou ProRes |
| Animação em produto web | Lottie JSON ou Rive .riv |

### 2. Codecs e configurações

**MP4 H.264 (uso geral):**
- Bitrate: 12-20 Mbps pra 1080p, 40-60 Mbps pra 4K
- Profile: High
- Audio: AAC, 320kbps, 48kHz stereo
- Compatibilidade: máxima

**ProRes 422 HQ (alta qualidade, edição):**
- Pra Behance, Awwwards, ou se cliente vai re-editar
- Arquivo grande (~150MB/min em 1080p)

**WebM (web, alternativa):**
- Codec VP9, mais leve que H.264
- Melhor pra browsers modernos
- Servir como fallback ao H.264

**Lottie JSON (web/mobile produção):**
- Apenas se animação foi feita em AE com vetores limpos
- Tamanho típico: 50KB-2MB
- Não suporta: efeitos complexos, blur pesado, particles, video frames

**Rive (.riv):**
- Animação interativa em produção
- Mais leve que Lottie pra animações complexas
- Suporta state machines

**GIF:**
- Apenas pra preview rápido em chat / email
- Limitação 256 cores; arquivo grande
- Considerar APNG ou MP4 com autoplay sempre que possível

### 3. Otimização de Lottie

Lottie ingênuo do AE = arquivo gigante e travado. Otimização:

**No After Effects (antes de exportar):**
- Sem efeitos não suportados (motion blur, glow nativo, particles, video)
- Trocar shapes complexas por shapes geométricas
- Reduzir keyframes desnecessários (auto-bezier vira linear/bezier explícito)
- Não usar masks com muitos vértices
- Evitar text com muitos efeitos (converter pra shape em último caso)

**Plugin de export:**
- Bodymovin (clássico) ou LottieFiles for After Effects (moderno)
- Configurar "Glyphs" pra texto se for manter como texto

**Pós-export:**
- LottieFiles Optimizer (web tool gratuito) — reduz 30-60% do tamanho
- lottie-web library no produto: usar `renderer: 'svg'` ou `'canvas'` conforme necessidade
- Lazy load se animação não for above-the-fold

**Validar:**
- Tamanho final < 500KB ideal pra web
- Performance em mobile (testar em device real)

### 4. Otimização de MP4

Para web:
- Encoder: x264 (Premiere/DaVinci) ou HandBrake (free, excelente)
- 2-pass encoding pra qualidade ideal em tamanho menor
- Bitrate constante (CBR) ou variável (VBR) — VBR economiza tamanho
- Faststart enabled (`moov atom` no início) — começa a tocar antes de download completo
- Otimização adicional: `ffmpeg` com flags específicas

**Comando ffmpeg útil pra otimização web:**

```bash
ffmpeg -i input.mp4 \
  -c:v libx264 -crf 23 -preset slow \
  -movflags +faststart \
  -c:a aac -b:a 128k \
  output.mp4
```

CRF 18-23: alta qualidade. CRF 24-28: web normal. Quanto menor, maior arquivo.

### 5. Naming convention

Arquivos sem padrão = caos. Usar convenção consistente:

```
[projeto]_[entregavel]_[resolucao]_[versao]_[data].[ext]

Exemplos:
luciana-advocacia_mockup-master_1920x1080_v03_2025-11-10.mp4
luciana-advocacia_reels-9x16_1080x1920_v01_2025-11-10.mp4
luciana-advocacia_lottie-hero_v02_2025-11-10.json
```

Vantagens:
- Fácil identificar versão correta
- Histórico de iterações preservado
- Não há "FINAL_FINAL_v3.mp4"

### 6. Motion guidelines documentadas

Se o motion vai virar produção real, documentar pra dev:

**Conteúdo das motion guidelines:**

```markdown
# Motion Guidelines — [Projeto]

## Easings primários
- Padrão UI: cubic-bezier(0.22, 1, 0.36, 1) (ease-out-quint)
- Entrada dramática: cubic-bezier(0.16, 1, 0.3, 1) (ease-out-expo)
- Transição entre states: cubic-bezier(0.76, 0, 0.24, 1) (ease-in-out-quart)

## Durações
- Hover/feedback: 150ms
- Reveal: 400ms
- Transição entre páginas: 600ms

## Stagger entre items em lista
- 60ms entre cada item

## Princípios
[Lista de motion principles do projeto, vinda de research]

## Componentes específicos
- Card hover: scale 1.02, shadow elevated, duration 200ms
- Button press: scale 0.96, duration 100ms ease-out
- Modal entrada: opacity 0→1 + scale 0.95→1, duration 300ms expo-out
- ...
```

Documentar em Notion (compartilhável), Figma (Dev Mode), ou Markdown no repo do projeto.

### 7. Handoff para desenvolvedor

Se motion vai pra produção web/mobile, entregar:

**Arquivos:**
- Motion guidelines (acima)
- Source files (Figma com Dev Mode aberto)
- Lottie JSONs ou .riv files (já otimizados)
- Vídeos de referência (mostram intenção quando código não consegue replicar 100%)

**Ferramentas de handoff:**
- Figma Dev Mode (mostra CSS, espaçamentos, easings)
- Zeplin (ainda usado em alguns times)
- Anima (gera código a partir de Figma — usar com cautela)
- LottieFiles direto (preview + integração)

**Sessão de pair com dev (recomendado):**
- 30-45min mostrando o motion ao vivo
- Identificar o que pode ser reproduzido em código direto vs precisa de Lottie/Rive
- Decidir trade-offs de performance ↔ fidelidade

### 8. Pacote final pro cliente

Estrutura de entrega típica:

```
/Cliente_Projeto_2025-11/
├── /01_Master/
│   ├── master_1920x1080_60fps.mp4   (alta qualidade)
│   └── master_4K_60fps.mp4          (se aplicável)
├── /02_Versoes_redes/
│   ├── instagram_feed_1080x1080.mp4
│   ├── instagram_reels_1080x1920.mp4
│   ├── linkedin_1920x1080.mp4
│   └── tiktok_1080x1920.mp4
├── /03_Web/
│   ├── hero_1920x1080_optimized.mp4
│   ├── hero_lottie.json (se aplicável)
│   └── poster_frame.jpg
├── /04_Source/
│   ├── projeto.aep (After Effects)
│   ├── projeto.fig (link Figma)
│   └── projeto.prproj (Premiere/DaVinci)
├── /05_Documentacao/
│   ├── motion_guidelines.md
│   ├── credits_e_licencas.md
│   └── handoff_dev.md (se aplicável)
└── README.md (instruções de uso, naming, datas)
```

**README.md** explica o que cada arquivo é, restrições de uso (licenças de música, fontes), e contato pra revisões futuras.

### 9. Versionamento

- Versão final = `v1.0`. Pequenas correções pós-entrega = `v1.1`, `v1.2`. Mudanças grandes = `v2.0`.
- Manter pelo menos 2 backups (HD externo + nuvem)
- Source files do AE/Premiere/DaVinci salvos junto com renders
- Footage / áudio comprado: salvar comprovantes de licença

### 10. Submissão a plataformas (Behance, Awwwards, Dribbble)

**Behance:**
- Case completo: cover atraente + texto explicativo + processo + frames-chave + vídeo embed
- Tags estratégicas (motion design, mockup, UI, brand específico)
- Vincular ao perfil do estúdio / freelancer

**Awwwards:**
- Apenas se realmente está nível Awwwards (review honesto)
- Seguir formato: shot principal, descrição, link, screenshots
- Categoria correta

**Dribbble:**
- Shots curtos (4-12s), 800x600 ou 1600x1200
- Caption explicando contexto
- Tags relevantes

**Vimeo (preferido sobre YouTube pra portfolio profissional):**
- Upload em alta qualidade
- Privacy: "Hide from Vimeo" se for só pra cliente; "Public" se for portfolio
- Embed sem branding (Vimeo Pro)

## Pitfalls comuns

- **Exportar antes de mapear destinos** — refazer várias vezes
- **Lottie sem otimização** — arquivo gigante, performance ruim
- **MP4 sem faststart** — vídeo demora a iniciar em web
- **Naming "final_v2_FINAL.mp4"** — caos de versão
- **Não documentar motion guidelines** — dev tem que adivinhar
- **Source files perdidos** — cliente pede mudança 6 meses depois e você refaz do zero
- **Música sem comprovante de licença** — risco legal
- **Vídeo só com áudio (sem legendas) pra redes sociais** — perde audiência mute
- **Não testar Lottie em mobile real** — surpresas no produto
- **Pacote desorganizado pro cliente** — passa amadorismo

## Validação antes da entrega

Checklist final:

- ✅ Todas as versões necessárias renderizadas
- ✅ Naming consistente
- ✅ Lottie/Rive otimizados (se aplicável)
- ✅ Motion guidelines documentadas
- ✅ Source files preservados e organizados
- ✅ Licenças de áudio/footage arquivadas
- ✅ Pacote pro cliente organizado em pastas claras
- ✅ README.md explicando estrutura
- ✅ Backup feito (HD externo + nuvem)
- ✅ Testado em pelo menos 2 devices/plataformas diferentes

## Output esperado

1. Pacote final estruturado (conforme seção 8)
2. Motion guidelines em formato shareable
3. Versões de redes sociais já compactadas e prontas
4. Lottie/Rive otimizados se aplicável
5. Backup completo
6. (Opcional) Submissão a Behance/Awwwards/Dribbble feita
7. (Opcional) Sessão de handoff com dev concluída

Esta é a última skill da pipeline — após este, projeto está entregue.
