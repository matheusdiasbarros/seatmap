// seatmap-plugin.js

const WHEELCHAIR_SVG = `
<svg class="sm-seat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <path
        d="M192 96a48 48 0 1 0 0-96 48 48 0 1 0 0 96zM120.5 247.2c12.4-4.7 18.7-18.5
           14-30.9s-18.5-18.7-30.9-14C43.1 225.1 0 283.5 0 352c0 88.4 71.6 160
           160 160c61.2 0 114.3-34.3 141.2-84.7c6.2-11.7 1.8-26.2-9.9-32.5s-26.2
           -1.8-32.5 9.9C240 440 202.8 464 160 464C98.1 464 48 413.9 48 352c0-47.9
           30.1-88.8 72.5-104.8zM259.8 176l-1.9-9.7c-4.5-22.3-24-38.3-46.8-38.3
           c-30.1 0-52.7 27.5-46.8 57l23.1 115.5c6 29.9 32.2 51.4 62.8 51.4l5.1 0
           c.4 0 .8 0 1.3 0l94.1 0c6.7 0 12.6 4.1 15 10.4L402 459.2c6 16.1 23.8
           24.6 40.1 19.1l48-16c16.8-5.6 25.8-23.7 20.2-40.5s-23.7-25.8-40.5-20.2
           l-18.7 6.2-25.5-68c-11.7-31.2-41.6-51.9-74.9-51.9l-68.5 0-9.6-48 63.4
           0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-76.2 0z"/>
</svg>`;

const OBESE_SVG = `
<svg class="sm-seat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <path 
        d="M406.6 374.6l96-96c12.5-12.5 12.5-32.8 0-45.3l-96-96c-12.5-12.5-32.8-12.5-45.3
           0s-12.5 32.8 0 45.3L402.7 224l-293.5 0 41.4-41.4c12.5-12.5 12.5-32.8 
           0-45.3s-32.8-12.5-45.3 0l-96 96c-12.5 12.5-12.5 32.8 0 45.3l96 96c12.5 12.5 32.8
           12.5 45.3 0s12.5-32.8 0-45.3L109.3 288l293.5 0-41.4 41.4c-12.5 12.5-12.5 32.8 0
           45.3s32.8 12.5 45.3 0z"/>
</svg>`;

const COMPANION_SVG = `
<svg class="sm-seat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
    <path 
        d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 
           304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 
           512 0 498.7 0 482.3zM609.3 512l-137.8 0c5.4-9.4 8.6-20.3 
           8.6-32l0-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2l61.4 0C567.8 320 640 
           392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 
           196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 
           0 112 50.1 112 112s-50.1 112-112 112z"/>
</svg>`;

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
            wheelchairSeats: [], // Lista de assentos para cadeirantes
            obeseSeats: [], // Lista de assentos para obesos
            companionSeats: [], // Lista de assentos para acompanhantes de cadeirantes
            lockedSeats: [], // Lista de assentos bloqueados (selecionados sem evento de clique)
            verticalAisles: [], // Posições dos corredores verticais
            horizontalAisles: [], // Posições dos corredores horizontais
            sections: [], // Configurações das seções especiais
            maxSeatsPerSection: {}, // Limite de assentos por seção
            exclusiveSection: null, // Seção exclusiva para seleção
            showLegends: false, // Exibe legenda
            showLegendsSections: true, // Exibe legenda das seções
            legendTarget: null, // Elemento alvo para a legenda
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
        this.sectionCounts = [];
        // Seção ativa (para modo exclusivo)
        this.activeSection = this.options.exclusiveSection;
        // Assentos do mapa
        this.allSeats = [];
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
                        ? seatColStage < stageStart
                            ? seatColStage
                            : seatColStage + 1 // corredor “aponta” para a próxima cadeira se estiver criando palco
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

                            // Verifica se o assento esta na lista de Cadeirantes
                            const isWheel = this.isInList(
                                this.options.wheelchairSeats,
                                seatRow,
                                seatColCounter
                            );

                            // Verifica se o assento esta na lista de Obesos
                            const isObese = this.isInList(
                                this.options.obeseSeats,
                                seatRow,
                                seatColCounter
                            );

                            // Verifica se o assento esta na lista de Companheiros de Cadeirantes
                            const isCompan = this.isInList(
                                this.options.companionSeats,
                                seatRow,
                                seatColCounter
                            );

                            // Verifica se o assento esta na lista de Assentos Desabilitados
                            const isDisabled = this.isInList(
                                this.options.disabledSeats,
                                seatRow,
                                seatColCounter
                            );

                            const isLocked = this.isInList(
                                this.options.lockedSeats,
                                seatRow,
                                seatColCounter
                            );

                            // Verifica se o assento esta na lista de Assentos Excluidos
                            const isExcluded = this.isInList(
                                this.options.excludedSeats,
                                seatRow,
                                seatColCounter
                            );

                            // Verifica se o assento esta na Seção Exclusiva
                            const isExclusiveDisabled =
                                this.options.exclusiveSection &&
                                seatInfo.id !== this.options.exclusiveSection;

                            // Aplica regras de exibição
                            // Se for um assento para cadeirantes
                            if (isWheel) {
                                seatDiv
                                    .addClass("sm-wheelchair")
                                    .append(WHEELCHAIR_SVG);
                            }

                            // Se for um assento para obesos
                            if (isObese) {
                                seatDiv.addClass("sm-obese").append(OBESE_SVG);
                            }

                            // Se for um assento para companheiros de cadeirantes
                            if (isCompan) {
                                seatDiv.addClass("sm-companion").append(
                                    COMPANION_SVG
                                    // '<span class="sm-seat-extra">AC</span>'
                                );
                            }

                            // Se for um assento excluido
                            if (isExcluded) {
                                rowDiv.append(
                                    $('<div class="sm-cell sm-space"></div>')
                                );
                                continue;
                            }

                            // Se for um assento travado ou desabilitado
                            if (isLocked) {
                                seatDiv.addClass(
                                    "sm-fixed-selected sm-selected"
                                );
                            } else if (isDisabled || isExclusiveDisabled) {
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

                            seatDiv.data({
                                wheelchair: isWheel,
                                obese: isObese,
                                companion: isCompan,
                            });

                            rowDiv.append(seatDiv);

                            // Determine o tipo
                            let seatType = "normal";
                            if (isWheel) seatType = "wheelchair";
                            if (isObese) seatType = "obese";
                            if (isCompan) seatType = "companion";

                            this.allSeats.push({
                                id: seatId,
                                row: seatRow,
                                col: seatColCounter,
                                section: seatInfo.id || "default",
                                type: seatType,
                                disabled: isDisabled || isExclusiveDisabled,
                            });
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
        if (
            !this.options.sections.length &&
            !this.options.wheelchairSeats?.length &&
            !this.options.obeseSeats?.length &&
            !this.options.companionSeats?.length
        )
            return;

        const legendContainer = $('<div class="sm-legend"></div>');

        if (this.options.showLegendsSections) {
            /* ---------- Assento comum ---------- */
            if (this.allSeats.some((s) => s.section === "default")) {
                legendContainer.append(makeColorItem("darkgreen", "Comum"));
            }

            /* ---------- Seções coloridas normais ---------- */
            this.options.sections.forEach((section) => {
                legendContainer.append(
                    makeColorItem(section.color, section.label)
                );
            });
        }

        /* ---------- Categorias especiais ---------- */
        if (this.options.wheelchairSeats?.length) {
            legendContainer.append(
                $('<div class="sm-legend-item"></div>')
                    .append(
                        $(
                            '<div class="sm-legend-seat sm-legend-wheelchair"></div>'
                        ).html(
                            WHEELCHAIR_SVG.replace(
                                "sm-seat-icon",
                                "sm-legend-seat-icon"
                            )
                        )
                    )
                    .append(
                        $('<span class="sm-legend-text"></span>').text(
                            "Cadeirante"
                        )
                    )
            );
        }
        if (this.options.obeseSeats?.length) {
            // legendContainer.append(makeSeatItem("<span>O</span>", "Obeso"));
            legendContainer.append(
                makeSeatItem(
                    OBESE_SVG.replace("sm-seat-icon", "sm-legend-seat-icon"),
                    "Obeso",
                    "sm-legend-obese"
                )
            );
        }
        if (this.options.companionSeats?.length) {
            // legendContainer.append(makeSeatItem("<span>AC</span>", "Acomp. cadeirante"));
            legendContainer.append(
                makeSeatItem(
                    COMPANION_SVG.replace(
                        "sm-seat-icon",
                        "sm-legend-seat-icon"
                    ),
                    "Acomp. cadeirante"
                )
            );
        }

        /* ---------- Insere no alvo ---------- */
        const $target = this.options.legendTarget
            ? $(this.options.legendTarget)
            : this.container;

        ($target.length ? $target : this.container).append(legendContainer);

        /* ============ helpers ============ */
        function makeColorItem(color, label) {
            const item = $('<div class="sm-legend-item"></div>');
            item.append(
                $('<div class="sm-legend-color"></div>').css(
                    "background-color",
                    color
                )
            );
            item.append($('<span class="sm-legend-text"></span>').text(label));
            return item;
        }

        function makeSeatItem(innerHtml, label, extraClass = "") {
            const item = $('<div class="sm-legend-item"></div>');
            item.append(
                $(`<div class="sm-legend-seat ${extraClass}"></div>`).html(
                    innerHtml
                )
            );
            item.append($('<span class="sm-legend-text"></span>').text(label));
            return item;
        }
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
        let result = { section: null, id: null, color: null };

        this.options.sections.forEach((section) => {
            if (
                Array.isArray(section.seats) &&
                section.seats.some((s) => s.row === row && s.col === col)
            ) {
                result.section = section.label;
                result.id = section.id;
                result.color = section.color;
            }
        });
        return result;
    }

    /**
     *
     * @param {array} list - Array de assentos
     * @param {number} row - Número da fileira
     * @param {number} col - Número da coluna
     * @returns {boolean} Verifica se o assento está na lista
     */
    isInList(list, row, col) {
        return list.some((s) => s.row === row && s.col === col);
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

            const seatObj = this.allSeats.find((s) => s.id === seatId);
            const payload = {
                seat: seatObj,
                wheelchair: seat.data("wheelchair") === true,
                obese: seat.data("obese") === true,
                companion: seat.data("companion") === true,
            };

            // Alterna estado de seleção
            seat.toggleClass("sm-selected");

            if (seat.hasClass("sm-selected")) {
                this.selectedSeats.add(seatObj);
                this.sectionCounts[section] =
                    (this.sectionCounts[section] || 0) + 1;
                this.options.onSelect?.(payload);
            } else {
                this.selectedSeats.delete(seatObj);
                this.sectionCounts[section] =
                    (this.sectionCounts[section] || 0) - 1;
                this.options.onDeselect?.(payload);
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
     * Retorna a contagem de assentos por seção
     * @returns {object} Contagem de assentos por seção
     */
    getSectionCounts() {
        return { ...this.sectionCounts };
    }

    /**
     * Quantidade total + quebra por tipo (normal, wheelchair, obese, companion)
     * @returns {object} Quantidade total + quebra por tipo
     */
    getSeatTotals() {
        const counts = {
            total: 0,
            normal: 0,
            wheelchair: 0,
            obese: 0,
            companion: 0,
        };
        this.allSeats.forEach((s) => {
            counts.total++;
            counts[s.type]++;
        });
        return counts;
    }

    /**
     * Total por seção (já excluídas as cadeiras removidas)
     * @returns {object} Total por seção
     */
    getSectionTotals() {
        const totals = {};
        this.allSeats.forEach((s) => {
            totals[s.section] = (totals[s.section] || 0) + 1;
        });
        return totals;
    }

    /**
     * Disponibilidade: quantas clicáveis vs. desabilitadas
     * @returns {object} Disponibilidade
     */
    getAvailabilityTotals() {
        let available = 0,
            disabled = 0;
        this.allSeats.forEach((s) => {
            s.disabled ? disabled++ : available++;
        });
        return { available, disabled };
    }

    /**
     * Obter dados de todos assentos
     * @returns {object} Array de objetos com dados dos assentos
     */
    getAllSeats() {
        return { ...this.allSeats };
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
        // Reinicializa variáveis
        this.selectedSeats = new Set();
        this.sectionCounts = [];
        this.activeSection = this.options.exclusiveSection;
        this.allSeats = [];
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
        if (this.options.legendTarget) {
            $(this.options.legendTarget).find(".sm-legend").remove();
        }
    }
}
