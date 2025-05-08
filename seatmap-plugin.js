// seatmap-plugin.js

/**
 * Classe principal que representa o mapa de assentos
 * @class
 */
export class SeatMap {
    /**
     * Construtor da classe
     * @param {HTMLElement|string} container - Elemento ou seletor CSS onde o mapa será renderizado
     * @param {object} options - Opções de configuração do mapa
     */
    constructor(container, options) {
        // Configurações padrão
        this.defaultOptions = {
            floors: 1, // Número de andares
            floorsLabels: ["Térreo"], // Rótulos dos andares
            showFloorLabels: false, // Exibe rótulos dos andares
            rows: [0], // Número total de fileiras de assentos
            cols: [0], // Número total de colunas de assentos
            stage: [1, 1], // Extensão do palco
            showStage: false, // Exibe a extensão do palco
            stageLabel: "Palco", // Rótulo da extensão do palco
            disabledSeats: [], // Lista de assentos desabilitados
            excludedSeats: [], // Lista de assentos excluídos (espaços vazios)
            verticalAisles: [], // Posições dos corredores verticais
            horizontalAisles: [], // Posições dos corredores horizontais
            sections: [], // Configurações das seções especiais
            maxSeatsPerSection: {}, // Limite de assentos por seção
            exclusiveSection: null, // Seção exclusiva para seleção
            showLegends: false,
            // Eventos
            onSelect: null, // Callback quando assento é selecionado
            onDeselect: null, // Callback quando assento é desselecionado
            onMaxSeatsReached: null, // Callback quando limite de assentos é atingido
        };

        // Mescla opções padrão com as fornecidas pelo usuário
        this.options = { ...this.defaultOptions, ...options };
        // Container jQuery
        this.container = $(container);
        // Conjunto de assentos selecionados
        this.selectedSeats = new Set();
        // Contadores de assentos por seção
        this.sectionCounts = {};
        // Seção ativa (para modo exclusivo)
        this.activeSection = this.options.exclusiveSection;
        // Inicializa o plugin
        this.init();
    }

    /**
     * Inicializa o componente
     */
    init() {
        this.createSeatMap(); // Cria a estrutura do mapa
        this.bindEvents(); // Configura os eventos
    }

    /**
     * Converte número para letra (ex: 1 -> A, 2 -> B)
     * @param {number} n - Número a ser convertido
     * @returns {string} Letra correspondente
     */
    numberToColumn(n) {
        let result = "";
        while (n > 0) {
            let rem = (n - 1) % 26;
            result = String.fromCharCode(65 + rem) + result;
            n = Math.floor((n - 1) / 26);
        }
        return result;
    }

    /**
     * Cria toda a estrutura HTML do mapa de assentos
     */
    createSeatMap() {
        this.container.empty(); // Limpa o container

        // Cria container para manipular com scroll o mapa
        const $scroll = $('<div class="sm-scroll"></div>');
        const $inner = $('<div class="sm-inner"></div>');
        $scroll.append($inner);
        this.container.append($scroll);

        var seatRows = this.getCumulativeRows(this.options.rows); // Calcula as fileiras cumulativas
        for (let f = 0; f < this.options.floors; f++) {
            // Para cada andar
            const divFloor = $('<div class="sm-floor"></div>');

            if (this.options.showFloorLabels) {
                const floorLabel = $(
                    '<div class="sm-floor-label">' +
                        this.options.floorsLabels[f] +
                        "</div>"
                );
                // Adiciona o label no início do container
                divFloor.prepend(floorLabel);
            }

            // Filtra os valores inválidos dos corredores
            const validVerticalAisles = (
                this.options.verticalAisles[f] || []
            ).filter(
                function (pos) {
                    return pos <= this.options.cols[f];
                }.bind(this)
            );

            const validHorizontalAisles = (
                this.options.horizontalAisles[f] || []
            ).filter(
                function (pos) {
                    return pos <= this.options.rows[f];
                }.bind(this)
            );

            // Ajusta posições dos corredores considerando deslocamentos
            const adjustedVerticalAisles = this.adjustAislePositions(
                validVerticalAisles.slice()
            );
            const adjustedHorizontalAisles = this.adjustAislePositions(
                validHorizontalAisles.slice()
            );

            // Calcula o total de colunas e fileiras (considerando corredores)
            const totalColsDisplay =
                parseInt(this.options.cols[f]) + validVerticalAisles.length;
            const totalRowsDisplay =
                parseInt(this.options.rows[f]) + validHorizontalAisles.length;

            if (f === 0 && this.options.showStage) {
                // Se for o primeiro andar e mostrar o palco estiver habilitado
                let seatColStage = 0;
                let stageContainer = null; // Div que agrupa as células do palco
                const stageStart = this.options.stage[0];
                const stageEnd = this.options.stage[1];

                // Cria a fileira do palco
                const stageRow = $('<div class="sm-seat-row"></div>');
                stageRow.append($('<div class="sm-cell sm-empty-cell"></div>'));

                for (let d = 1; d <= totalColsDisplay; d++) {
                    const isVerticalAisle = adjustedVerticalAisles.includes(d);
                    // Incrementa seatColStage somente se não for corredor vertical
                    if (!isVerticalAisle) {
                        seatColStage++;
                    }

                    // Verifica se o corredor está dentro da extensão do palco
                    const seatIndexEffective = isVerticalAisle
                        ? seatColStage + 1 // corredor “aponta” para a próxima cadeira
                        : seatColStage; // cadeira real

                    const isStage =
                        seatIndexEffective >= stageStart &&
                        seatIndexEffective <= stageEnd;

                    if (isStage) {
                        // Se ainda não foi criado o container, cria-o
                        if (!stageContainer) {
                            stageContainer = $(
                                '<div class="sm-stage-container"></div>'
                            );
                        }
                        // Cria a célula do palco
                        const cell = $('<div class="sm-cell sm-stage"></div>');
                        stageContainer.append(cell);
                    } else {
                        // Se estiver fora da extensão do palco e o container estiver aberto, fecha-o
                        if (stageContainer) {
                            stageRow.append(stageContainer);
                            stageContainer = null;
                        }
                        // Cria a célula normal (de espaço)
                        const cell = $('<div class="sm-cell sm-space"></div>');
                        stageRow.append(cell);
                    }
                }
                // Se o container ainda estiver aberto ao final do loop, o adiciona
                if (stageContainer) {
                    stageRow.append(stageContainer);
                }
                divFloor.append(stageRow);
            }

            // Cria header das colunas
            const headerRow = $('<div class="sm-seat-row"></div>');
            headerRow.append($('<div class="sm-cell sm-empty-cell"></div>'));

            // Preenche header com números das colunas
            let seatCol = 0;
            for (let d = 1; d <= totalColsDisplay; d++) {
                if (adjustedVerticalAisles.includes(d)) {
                    // Se for um corredor vertical
                    headerRow.append(
                        $('<div class="sm-cell sm-space sm-col-header"></div>')
                    );
                } else {
                    seatCol++;
                    headerRow.append(
                        $('<div class="sm-cell sm-col-header"></div>').text(
                            seatCol
                        )
                    );
                }
            }
            divFloor.append(headerRow);

            // Cria as linhas de assentos
            let seatRow = seatRows[f];
            for (let r = 1; r <= totalRowsDisplay; r++) {
                if (adjustedHorizontalAisles.includes(r)) {
                    // Se for um corredor horizontal
                    const corridorRow = $('<div class="sm-seat-row"></div>');
                    corridorRow.append(
                        $('<div class="sm-cell sm-space sm-row-header"></div>')
                    );
                    for (let d = 1; d <= totalColsDisplay; d++) {
                        corridorRow.append(
                            $('<div class="sm-cell sm-space"></div>')
                        );
                    }
                    divFloor.append(corridorRow);
                } else {
                    seatRow++;
                    const rowDiv = $('<div class="sm-seat-row"></div>');
                    const rowLabel = this.numberToColumn(seatRow);

                    // Adiciona label da fileira
                    rowDiv.append(
                        $('<div class="sm-cell sm-row-header"></div>').text(
                            rowLabel
                        )
                    );

                    // Preenche a linha com assentos
                    let seatColCounter = 0;
                    for (let d = 1; d <= totalColsDisplay; d++) {
                        if (adjustedVerticalAisles.includes(d)) {
                            // Se for um corredor vertical
                            rowDiv.append(
                                $('<div class="sm-cell sm-space"></div>')
                            );
                        } else {
                            seatColCounter++;
                            const seatId = rowLabel + seatColCounter;
                            const seatDiv = $(
                                '<div class="sm-cell sm-seat"></div>'
                            )
                                .text(seatId)
                                .data("id", seatId);

                            // Pega as configurações do assento
                            const seatInfo = this.getSeatInfo(
                                seatRow,
                                seatColCounter
                            );
                            const isDisabled = this.options.disabledSeats.some(
                                // Verifica se o assento está desabilitado
                                (s) =>
                                    s.row === seatRow &&
                                    s.col === seatColCounter
                            );
                            const isExcluded = this.options.excludedSeats.some(
                                // Verifica se o assento é excluido (espaço em branco)
                                (s) =>
                                    s.row === seatRow &&
                                    s.col === seatColCounter
                            );
                            const isExclusiveDisabled = // Verifica se o assento fora da seção exclusiva
                                this.options.exclusiveSection &&
                                seatInfo.id !== this.options.exclusiveSection;

                            // Aplica regras de exibição
                            // Se for um assento excluido
                            if (isExcluded) {
                                rowDiv.append(
                                    $('<div class="sm-cell sm-space"></div>')
                                );
                                continue;
                            }

                            // Se for um assento desabilitado
                            if (isDisabled || isExclusiveDisabled) {
                                seatDiv.addClass("sm-disable-click-seat");
                            } else {
                                seatDiv.addClass("sm-click-seat");
                            }

                            // Aplica estilo da seção
                            if (seatInfo.section) {
                                seatDiv
                                    .data("section", seatInfo.id)
                                    .css("background-color", seatInfo.color);
                            }

                            rowDiv.append(seatDiv);
                        }
                    }
                    divFloor.append(rowDiv);
                }
            }
            $inner.append(divFloor);
        }
        if (this.options.showLegends) this.createLegend(); // Cria a legenda
        $(".sm-stage-container").append(
            '<div class="sm-stage-label">' + this.options.stageLabel + "</div>"
        );
    }

    /**
     * Cria a legenda de cores das seções
     */
    createLegend() {
        if (!this.options.sections.length) return;

        const legendContainer = $('<div class="sm-legend"></div>');

        // Adiciona itens para cada seção
        this.options.sections.forEach((section) => {
            const legendItem = $('<div class="sm-legend-item"></div>');
            legendItem.append(
                $('<div class="sm-legend-color"></div>').css(
                    "background-color",
                    section.color
                )
            );
            legendItem.append(
                $('<span class="sm-legend-text"></span>').text(section.label)
            );
            legendContainer.append(legendItem);
        });

        // Adiciona item padrão (assentos comuns)
        const defaultItem = $('<div class="sm-legend-item"></div>');
        defaultItem.append(
            $('<div class="sm-legend-color"></div>').css(
                "background-color",
                "red"
            )
        );
        defaultItem.append(
            $('<span class="sm-legend-text"></span>').text("Comum")
        );
        legendContainer.append(defaultItem);

        this.container.append(legendContainer);
    }

    /**
     * Ajusta posições dos corredores considerando deslocamentos
     * @param {array} aisles - Array de posições originais
     * @returns {array} Posições ajustadas
     */
    adjustAislePositions(aisles) {
        return aisles.sort((a, b) => a - b).map((pos, index) => pos + index);
    }

    /**
     * Obtém informações da seção para um assento específico
     * @param {number} row - Número da fileira
     * @param {number} col - Número da coluna
     * @returns {object} Informações da seção {section: string, color: string}
     */
    getSeatInfo(row, col) {
        let result = { section: null, id: null, color: "red" };
        this.options.sections.forEach((section) => {
            if (section.rows.includes(row) && section.columns.includes(col)) {
                result.section = section.label;
                result.id = section.id;
                result.color = section.color;
            }
        });
        return result;
    }

    /**
     * Calcula a soma cumulativa das fileiras
     * @param {array} rows - Array de fileiras
     * @returns {array} Array com a soma cumulativa
     */
    getCumulativeRows(rows) {
        var cumulative = [];
        var sum = 0;
        $.each(rows, function (index, value) {
            cumulative.push(sum);
            sum += parseInt(value);
        });
        return cumulative;
    }

    /**
     * Configura os eventos de clique nos assentos
     */
    bindEvents() {
        this.container.on("click", ".sm-click-seat", (e) => {
            const seat = $(e.target);
            const seatId = seat.data("id");
            const section = seat.data("section") || "default";

            // Verifica limite de assentos na seção
            const maxSeats = this.options.maxSeatsPerSection[section] || 0;

            // Verifica se o limite de assentos foi atingido
            if (maxSeats === 0 || this.sectionCounts[section] >= maxSeats) {
                if (!seat.hasClass("sm-selected")) {
                    this.options.onMaxSeatsReached?.({
                        seatId,
                        section,
                        maxAllowed: maxSeats,
                    });
                    return;
                }
            }

            // Alterna estado de seleção
            seat.toggleClass("sm-selected");

            if (seat.hasClass("sm-selected")) {
                this.selectedSeats.add(seatId);
                this.sectionCounts[section] =
                    (this.sectionCounts[section] || 0) + 1;
                this.options.onSelect?.(seatId);
            } else {
                this.selectedSeats.delete(seatId);
                this.sectionCounts[section] =
                    (this.sectionCounts[section] || 0) - 1;
                this.options.onDeselect?.(seatId);
            }
        });
    }

    // ========== MÉTODOS PÚBLICOS ==========

    /**
     * Retorna lista de assentos selecionados
     * @returns {array} Array de IDs dos assentos selecionados
     */
    getSelectedSeats() {
        return Array.from(this.selectedSeats);
    }

    /**
     * Renderiza o mapa novamente
     * @returns {void}
     */
    renderMap() {
        this.container.empty();
        this.createMap();
    }

    /**
     * Atualiza as opções do plugin
     * @param {object} newOptions - Opções novas
     * @returns {void}
     */
    updateOptions(newOptions) {
        // Atualiza as opções mesclando as atuais com as novas
        this.options = { ...this.options, ...newOptions };
        // Remove eventos e conteúdo atual
        this.destroy();
        // Re-inicializa o plugin para renderizar com as novas opções
        this.init();
    }

    /**
     * Destroi a instância do plugin
     * @returns {void}
     */
    destroy() {
        this.container.off("click");
        this.container.empty();
    }
}
