---
name: edicao-video-final
description: Edição cinematográfica final do mockup animado — montagem, ritmo, narração, overlays/legendas animadas, color grading final, mixagem de áudio, export em múltiplas resoluções. Use depois do polish estar aprovado e antes do export final. Acionar quando o usuário disser: "edição final", "editar mockup", "montagem", "overlays", "legendas", "narração", "voice-over", "trilha sonora", "sound design", "color grading final", "Premiere", "DaVinci", "CapCut", "exportar pra Instagram", "exportar pra YouTube", "versão vertical", "versão quadrada".
---

# Edição de Vídeo Final

A fase de costura. Aqui, todas as cenas viram vídeo único, com narrativa, áudio e ritmo final. É a primeira vez que o mockup é assistido como produto, não como sequência de animações.

## Quando usar

- Composições do AE (do `06-zoom-effects-polish`) renderizadas
- Hora de montar tudo num vídeo coeso
- Adicionar áudio, narração, sound design
- Preparar versões pra plataformas diferentes (Instagram, YouTube, site, Behance)

## Workflow

### 1. Escolha de ferramenta

| Necessidade | Ferramenta |
|---|---|
| Edição padrão profissional | Premiere Pro |
| Color grading sério + edição | DaVinci Resolve (gratuito até pra uso pro) |
| Edição rápida com bons presets | CapCut Pro |
| Editar e voltar pro AE com Dynamic Link | Premiere Pro (integração nativa) |
| Mockup curto sem precisar de áudio elaborado | Direto no AE |

Para mockups longos (>30s) com narração ou trilha, **DaVinci Resolve é a escolha forte** — gratuito, color grading insuperável, e Fairlight (áudio) é profissional.

Para o stack do Vinicius (Windows + RTX 2060), DaVinci Resolve roda bem com a aceleração CUDA.

### 2. Setup do projeto

- Mesma resolução final do mockup (1920x1080 ou 1080x1920)
- 60fps consistente com a animação (não baixar pra 30 — perde fluidez)
- Color management: definir input color space (sRGB ou Rec.709 dependendo do destino)
- Pasta organizada:
  ```
  /Footage     ← renders do AE
  /Audio       ← música, SFX, narração
  /Graphics    ← overlays, lower thirds, legendas
  /Exports     ← versões finais
  ```

### 3. Montagem — princípios

**Ritmo manda.** Antes de qualquer coisa, ouvir a trilha (se houver) e marcar batidas/momentos-chave. Cortes idealmente acontecem em sintonia com a música.

**Cortes secos vs transições:**
- 80% cortes secos (J-cut, L-cut quando há áudio)
- 20% transições (fade, flash, whip pan, glitch)
- **Nunca** cross-dissolve genérico em mockup de alto nível — fica "Powerpoint"

**Pacing por seção:**
- Intro: cortes mais longos (1.5-3s), espaço pra estabelecer
- Demonstração: cortes mais curtos (0.8-1.5s), energia
- Resolução: corte longo (2-4s), respiração final

**Truque cinematográfico**: a última cena dura mais do que parece necessário. 1.5s extra de hold faz a peça toda parecer mais "cara".

### 4. Áudio — categorias

Mockup de alto nível tem áudio em 4 camadas:

**1. Trilha sonora (música de fundo)**
- Volume: -18dB a -22dB (não compete com narração)
- Estilo: depende do projeto — minimal techno, lo-fi, cinematic build, eletrônica suave
- Fontes: Artlist, Musicbed, Epidemic Sound (assinatura), Pixabay (gratuito)
- **Direitos**: nunca usar música sem licença, mesmo em mockup de portfolio

**2. Sound design (SFX micro)**
- UI clicks, swooshes, pops, whooshes nas transições
- Volume: -18dB a -12dB
- Bibliotecas: Sonniss GameAudio (gratuito, profissional), Zapsplat, freesound.org
- Sincronia: cada interação visual tem som correspondente; sound design é o que faz o motion "sentir caro"

**3. Narração / Voice-over (se aplicável)**
- Volume: -6dB a -3dB (acima da trilha)
- Equalização: cortar baixos < 100Hz, leve boost em 3-5kHz pra clareza
- De-noise se gravado em ambiente caseiro (Adobe Podcast Enhance é gratuito e excelente)
- ElevenLabs ou similares pra voz sintética premium (com consentimento ético claro)

**4. Ambient (se aplicável)**
- Sutil background atmosphere — drone, hum, room tone
- Volume: -28dB a -32dB
- Função: preencher silêncios e dar coesão sonora

### 5. Sincronização visual ↔ áudio

Pontos onde sincronizar é crítico:
- Beat principal da música = beat visual mais importante
- Transição entre cenas = corte musical ou SFX
- Reveal de elemento = SFX próprio (whoosh, click, pop)
- Último frame = última nota / silêncio com cauda

Em DaVinci/Premiere, ativar **scrubbing de áudio** e mover quadro a quadro nos pontos de sincronia.

### 6. Overlays e callouts animados

Mockup de portfolio frequentemente precisa de:
- **Lower thirds** (nome do projeto, cliente)
- **Callouts** (setas/anotações chamando atenção pra feature específica)
- **Legendas** (em PT-BR e EN se for caso internacional)
- **End card** (CTA final, link, contato)

Padrões:
- **Lower third**: canto inferior esquerdo, animação de entrada/saída sutil (slide + fade)
- **Callouts**: aparece, segura 1.5-2s, sai. Tipografia limpa, contraste alto.
- **Legendas**: tipografia consistente, máximo 2 linhas, 35-40 caracteres por linha
- **End card**: 3-5s de hold, com info essencial

Animar tudo (overlays e legendas) com mesmo motion language do resto — easings consistentes (ver `00-motion-design-fundamentals`).

### 7. Color grading final

Diferente do polish em `06-zoom-effects-polish` (que é por cena no AE), este é o grading **global** do vídeo todo.

**Workflow recomendado (DaVinci Resolve):**
1. **Primary correction**: ajustar exposição, contraste, white balance globais
2. **Secondary correction**: por área específica (highlights, sombras, cor específica)
3. **LUT creativa**: aplicar look final (cinematic, clean tech, warm campaign)
4. **Análise final**: vectorscope (saturação balanceada), waveform (não estourar branco/preto)

**Looks comuns por categoria:**
- B2B serious: dessaturado leve, contraste médio, sombras teal
- SaaS modern: clean, contrastado, neutralidade preserved
- Luxury: paleta restrita, blacks profundos, golden highlights
- Jovem/B2C: saturação +15%, contraste alto, sombras coloridas

### 8. Versões pra plataformas (export count)

Quase sempre você vai precisar de múltiplas versões:

| Destino | Resolução | Aspect | Duração | Áudio |
|---|---|---|---|---|
| Site (hero) | 1920x1080 | 16:9 | 30-60s | Opcional, autoplay muted |
| Behance / Awwwards | 1920x1080 ou 4K | 16:9 | 30-90s | Sim, ligado |
| Instagram Feed | 1080x1080 | 1:1 | 15-30s | Sim, mas pensar em mute |
| Instagram Reels | 1080x1920 | 9:16 | 15-60s | Sim, com legendas |
| TikTok | 1080x1920 | 9:16 | 15-60s | Sim, com legendas |
| YouTube | 1920x1080 ou 4K | 16:9 | sem limite | Sim |
| LinkedIn | 1920x1080 | 16:9 | 30-90s | Sim, com legendas |
| Pitch deck | 1920x1080 | 16:9 | 15-30s | Opcional |

**Importante:**
- Versão vertical não é só crop — repensar enquadramento (UI no centro, espaço pra legenda no topo/base)
- Versões com áudio precisam de legendas (muita gente assiste mute)
- Versão pra Awwwards: render no máximo de qualidade (4K se possível)

### 9. Validação final

Antes de exportar de fato, assistir o vídeo final:
- ✅ Em laptop (tela média, qualidade média)
- ✅ Em celular (tela pequena, audio fone)
- ✅ Em monitor grande (revela falhas de qualidade)
- ✅ Com som e sem som
- ✅ Em loop (descobrir se a transição do final pro início parece travada)

Pedir feedback de pelo menos 1 pessoa não-envolvida. Frequente: você está cego pelo trabalho.

## Ferramentas

**Edição:**
- Premiere Pro (padrão de mercado, integra com AE)
- DaVinci Resolve (gratuito, color grading + edição + áudio)
- CapCut Pro (rápido, bom pra Reels/Tiktok)
- Final Cut Pro (Mac only)
- After Effects diretamente (pra mockup curto sem áudio elaborado)

**Áudio:**
- Adobe Audition / Audacity (edição de áudio)
- Adobe Podcast (de-noise grátis profissional)
- Fairlight (módulo do DaVinci Resolve)
- ElevenLabs (voz sintética premium)

**Bibliotecas:**
- Artlist (música, SFX, vídeos stock)
- Musicbed (música cinematográfica)
- Epidemic Sound (música, vasta library)
- Sonniss GameAudio Bundle (SFX gratuito anual)

**LUTs:**
- IWLTBAP, RocketStock, Lutify.me, presets nativos do DaVinci

## Pitfalls comuns

- **Cross-dissolve em tudo** — fica Powerpoint
- **Música genérica do banco grátis** — vira cara de Fiverr
- **Sound design ausente** — mockup soa "vazio", mesmo se motion estiver bom
- **Música muito alta** — compete com narração / dificulta atenção
- **Versão vertical = só crop** — quebra composição
- **Esquecer legendas** — mute é o default em redes sociais
- **Color grade inconsistente entre cenas** — quebra coesão
- **Edit muito rápido** — não dá tempo de ler/processar
- **Edit muito lento** — perde atenção
- **Não testar em telas diferentes** — surpresas no client review
- **Renderizar antes de validar com 1 pessoa externa** — viés de criador

## Validação antes de avançar

Checklist antes de ir pra `08-export-entrega`:

- ✅ Vídeo final montado, com ritmo aprovado
- ✅ Áudio em 4 camadas (trilha, SFX, narração se aplicável, ambient se aplicável)
- ✅ Color grading global aplicado
- ✅ Overlays e legendas animados em consistência
- ✅ Validação em telas diferentes feita
- ✅ Cliente / Vinicius aprovou versão master
- ✅ Listadas todas as versões necessárias (16:9, 9:16, 1:1, etc)

## Output esperado

1. Master final (1920x1080 ou 4K, 60fps, ProRes 422 HQ ou H.264 alta qualidade)
2. Aprovação documentada
3. Lista de versões a exportar (e suas especificações)
4. Arquivo do projeto (Premiere/DaVinci) salvo com naming consistente

Este output alimenta `08-export-entrega`.
