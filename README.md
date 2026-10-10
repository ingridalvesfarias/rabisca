# ✎ Rabisca | Quadro Branco

Quadro branco leve e responsivo, com traço de "rabisco feito à mão", para desenhar formas, setas e anotações direto no navegador. Desenvolvido em JavaScript puro, sem frameworks e sem dependências, como projeto de estudo de Canvas 2D.

> Inspirado na ideia do Excalidraw. O código é totalmente autoral e foi escrito do zero para fins de aprendizado.

## 🚀 Sobre o Projeto

O Rabisca nasceu para entender, na prática, como funciona um editor de desenho: como guardar o que está na tela, como redesenhar tudo a cada mudança e como desfazer ações. O foco é um código curto, comentado em português e fácil de ler de cima a baixo.

Acesse: https://rabisca-chi.vercel.app/

### Destaques:

- **Modo Claro & Escuro**: Alternância de tema com um clique, lembrada entre visitas. Na primeira abertura, acompanha o tema do seu sistema.
- **Estilo Rabisco**: Traços com leve tremor e duas passadas, como lápis. Dá para desligar e ficar com linhas limpas.
- **Responsivo**: Painel de propriedades se reposiciona no celular e o desenho funciona com mouse e toque.
- **Salvamento Automático**: O quadro fica guardado no navegador (`localStorage`), então você fecha a aba e continua depois.
- **Funcionalidades**:
  - **Formas**: Retângulo, elipse, losango, linha e seta.
  - **Desenho Livre**: Lápis para rabiscar à mão.
  - **Texto**: Clique no quadro e digite, com suporte a várias linhas.
  - **Seleção**: Clique para selecionar, arraste para mover e `Delete` para apagar.
  - **Borracha**: Passe sobre um elemento para removê-lo.
  - **Propriedades**: Cor do traço, cor de fundo e espessura (alteram também o elemento selecionado).
  - **Histórico**: Desfazer e refazer ilimitados durante a sessão.
  - **Exportação**: Salva o quadro como imagem PNG.

## ⌨️ Atalhos

| Tecla | Ação |
| --- | --- |
| `V` | Selecionar / mover |
| `R` | Retângulo |
| `O` | Elipse |
| `D` | Losango |
| `L` | Linha |
| `A` | Seta |
| `P` | Lápis |
| `T` | Texto |
| `E` | Borracha |
| `Ctrl + Z` | Desfazer |
| `Ctrl + Y` ou `Ctrl + Shift + Z` | Refazer |
| `Delete` | Apagar elemento selecionado |

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica com barra de ferramentas e painel de propriedades.
- **CSS3**: Layout com Flexbox, variáveis CSS e dois temas definidos apenas trocando os tokens de cor.
- **JavaScript (Vanilla ES6+)**: Toda a lógica do editor, usando a API Canvas 2D e Pointer Events.

## 📁 Estrutura do Projeto

```
rabisca/
├── index.html   # estrutura da página
├── style.css    # temas claro/escuro e layout
├── app.js       # lógica do quadro (comentada)
└── README.md
```

## 📋 Como Executar

Projeto 100% estático, não precisa instalar nada.

1. Baixe ou clone o projeto.
2. Abra o arquivo `index.html` no navegador.

Se preferir um servidor local:

```bash
npx serve .
```

## 🧠 Como Estudar o Código

O `app.js` está organizado na ordem em que as ideias se constroem:

1. **Lista de elementos (`els`)**: o desenho inteiro é só um array de objetos.
2. **`render()`**: limpa o canvas e redesenha todos os elementos a cada mudança.
3. **Eventos de ponteiro**: `pointerdown`, `pointermove` e `pointerup` criam e movem elementos.
4. **Seleção**: caixa delimitadora e distância ponto-segmento para saber onde o usuário clicou.
5. **Histórico**: cada ação guarda uma cópia da lista, o que torna o desfazer e o refazer simples.
6. **Temas**: variáveis CSS trocadas pelo atributo `data-theme`.

## 🔭 Ideias para Evoluir

- Zoom e arrastar a tela (pan)
- Redimensionar e rotacionar elementos
- Salvar e abrir o quadro como arquivo `.json`
- Camadas e agrupamento
- Colaboração em tempo real com Firebase

## 🤝 Contribuição

Projeto criado com carinho para estudo. Sinta-se à vontade para expandir as ferramentas, personalizar as cores ou adaptar para outros usos.

Desenvolvido por **INDI.dev** (Ingrid Farias).
