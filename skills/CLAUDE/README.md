# Mockup Animation Skills

Pipeline completa de skills no padrão Anthropic (YAML frontmatter + instruções acionáveis) para produção de mockups animados de alto nível — qualidade Awwwards/Behance Featured.

## Estrutura

```
mockup-animation-skills/
├── 00-motion-design-fundamentals/   ← base teórica (cross-cutting)
├── 01-research-discovery/           ← briefing + benchmark + motion principles
├── 02-wireframe-low-fidelity/       ← storyboard + ritmo + oportunidades
├── 03-ui-design-high-fidelity/      ← design system animation-ready
├── 04-prototipagem-interativa/      ← Smart Animate / ProtoPie / Framer (opcional)
├── 05-animacao-avancada/            ← stagger, spring, custom easing, charts
├── 06-zoom-effects-polish/          ← cinematic camera, parallax, polish premium
├── 07-edicao-video-final/           ← montagem, áudio, color grading global
└── 08-export-entrega/               ← export otimizado, motion guidelines, handoff
```

## Como funciona

A skill `00-motion-design-fundamentals` é **cross-cutting** — todas as outras a consomem. Ela define a base teórica (princípios, easings, durações de referência, ritmo).

As skills `01` a `08` formam um **pipeline sequencial**. Cada uma valida saídas antes de avançar pra próxima. Tem seções "Validação antes de avançar" exatamente pra isso.

A skill `04-prototipagem-interativa` é **opcional** — se o entregável é apenas mockup-vídeo, pode pular direto pra `05-animacao-avancada`.

## Como cada SKILL.md está estruturado

```yaml
---
name: skill-name
description: [O que ela faz + quando acionar + keywords de trigger]
---

# Título

## Quando usar
[Contextos específicos]

## Workflow
[Passo-a-passo acionável, em imperativo]

## Ferramentas
[O que usar e por quê]

## Pitfalls comuns
[O que evitar]

## Validação antes de avançar
[Checklist explícito]

## Output esperado
[O que deve ser entregue ao final]
```

## Como instalar / usar

Cada pasta com `SKILL.md` pode ser instalada como skill independente do Claude (no Claude Code, Cowork, ou Claude.ai com skill installer). A IA detecta automaticamente quando acionar baseado no `description` do frontmatter.

Para usar como documentação de equipe (sem skill system), todos os arquivos podem ser lidos como Markdown puro — funcionam como playbook do pipeline.

## Próximos passos sugeridos

1. Instalar todas as 9 skills no Claude (ou no editor de IA usado)
2. Testar acionamento: pedir algo como "comecei um projeto novo de mockup pra advogada" → deve acionar `research-discovery`
3. Iterar nas descriptions se algumas não acionarem como esperado (ver skill-creator pra otimização)
4. Adicionar reference files dentro de cada skill se quiser expandir (ex: `references/easing-cookbook.md` em `05-animacao-avancada`)
