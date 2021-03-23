const Waveform = (function() {
  'use strict';
  var BUS_SIGNAL, CANVAS_MAX_HEIGHT, DEFAULT_COLOR, DEFAULT_OPACITY, GRID_SECTIONS, RADIX_BIN, RADIX_DEC, RADIX_HEX, RULER_HEIGHT, SIGNAL_BOX_HEIGHT, SIGNAL_BOX_PADDING, SIGNAL_BOX_WIDTH, SIGNAL_BUS_SLOPE, SIGNAL_HEIGHT, SIGNAL_NAMES_BOX_WIDTH, SIGNAL_NAME_WIDTH, WIRE_SIGNAL;

  RULER_HEIGHT = 14;

  GRID_SECTIONS = 11;

  SIGNAL_NAMES_BOX_WIDTH = 280;

  SIGNAL_NAME_WIDTH = 150;

  SIGNAL_BOX_HEIGHT = 20;

  SIGNAL_BOX_WIDTH = 160;

  SIGNAL_BOX_PADDING = 8;

  SIGNAL_HEIGHT = 20;

  SIGNAL_BUS_SLOPE = 3;

  WIRE_SIGNAL = 0;

  BUS_SIGNAL = 1;

  RADIX_BIN = 0;

  RADIX_DEC = 1;

  RADIX_HEX = 2;

  CANVAS_MAX_HEIGHT = 3000;

  DEFAULT_COLOR = {
    CANVAS_BACKGROUND: 'black',
    CURSOR: 'rgb(64, 186, 255)',
    GRID_TEXT: 'gray',
    SIGNAL: 'rgb(8, 255, 40)',
    SIGNAL_NAME_RECT: 'gray',
    SIGNAL_HIGHLIGHT: 'rgb(97, 255, 0)',
    SIGNAL_DC: 'red',
    SIGNAL_IMPED: 'blue',
    SIGNAL_DRAGGED: 'rgb(197, 255, 145)',
    GRID_LINE: 'gray',
    SIGNAL_NAME: 'white',
    SIGNAL_VALUE: 'white',
    SIGNAL_CURRENT_VALUE: 'white',
    CURRENT_VALUE_LINE: 'white'
  };

  DEFAULT_OPACITY = {
    CURSOR: 1.0,
    SIGNAL_NAME_RECT: 0.2,
    SIGNAL_HIGHLIGHT: 0.3,
    SIGNAL_DRAGGED: 0.3
  };

  function Waveform(_containerId, _data, _initDiagram) {
    var busSignal, depth, e, index, j, k, l, layoutNames, len, len1, len10, len2, len3, len4, len5, len6, len7, len8, len9, levels, m, n, o, p, q, r, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, s, signal, signalId, signalIndex, signalMap, signalNames, t;
    this._containerId = _containerId;
    this._data = _data;
    this._initDiagram = _initDiagram;
    this._container = $("#" + this._containerId);
    if (!this._container.length) {
      return null;
    }
    if (this._data.signal == null) {
      return null;
    }
    this._data.signal.sort(function(firstSignal, secondSignal) {
      if (firstSignal.name < secondSignal.name) {
        return -1;
      } else if (firstSignal.name > secondSignal.name) {
        return 1;
      } else {
        return 0;
      }
    });
    console.log(this._data);
    if (typeof this._initDiagram === 'string') {
      try {
        this._initDiagram = JSON.parse(this._initDiagram);
      } catch (error) {
        e = error;
        this._initDiagram = null;
      }
    }
    if (this._initDiagram != null) {
      signalNames = [];
      ref = this._data.signal;
      for (j = 0, len = ref.length; j < len; j++) {
        signal = ref[j];
        signalNames.push(signal.name);
      }
      layoutNames = [];
      ref1 = this._initDiagram.rendered;
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        signal = ref1[k];
        layoutNames.push(signal);
      }
      ref2 = this._initDiagram.hidden;
      for (l = 0, len2 = ref2.length; l < len2; l++) {
        signal = ref2[l];
        layoutNames.push(signal);
      }
      for (m = 0, len3 = layoutNames.length; m < len3; m++) {
        signal = layoutNames[m];
        if (signalNames.indexOf(signal) < 0) {
          console.error('Supplied layout is not compatible with the simulation.');
          this._initDiagram = null;
          break;
        }
      }
    }
    this.timeScale = this._data.scale.match(/(\d+)/);
    this.timeScaleUnit = this._data.scale.match(/(\D+)/);
    if ((this.timeScale == null) || !this.timeScaleUnit) {
      return null;
    }
    this.timeScale = this.timeScale[0];
    this.timeScaleUnit = this.timeScaleUnit[0];
    this.timeUnit = parseInt(this.timeScale);
    if (this.timeScaleUnit === 'ns') {
      this.timeUnit *= 1000;
    }
    this.radix = RADIX_BIN;
    this.originalEndTime = this._data.endtime;
    this.endTime = this.ceilFive(this.originalEndTime);
    this.renderFrom = 0;
    if (this.originalEndTime > 100) {
      this.renderTo = this.floorInt(this.endTime, 100);
    } else {
      this.renderTo = this.roundInt(this.endTime / 2.0, 10);
    }
    this.signals = this._data.signal;
    this._onChangeListener = void 0;
    this._onSaveListener = void 0;
    if (this._initDiagram != null) {
      if (this._initDiagram.from != null) {
        this.renderFrom = this._initDiagram.from;
      }
      if (this._initDiagram.to != null) {
        this.renderTo = this._initDiagram.to;
      }
      if (this._initDiagram.end != null) {
        this.endTime = this._initDiagram.end;
      }
      if (this._initDiagram.originalEnd != null) {
        this.originalEndTime = this._initDiagram.originalEnd;
      }
      if (this._initDiagram.timeScale != null) {
        this.timeScale = this._initDiagram.timeScale;
      }
      if (this._initDiagram.timeScaleUnit != null) {
        this.timeScale = this._initDiagram.timeScaleUnit;
      }
      if (this._initDiagram.timeUnit != null) {
        this.timeUnit = this._initDiagram.timeUnit;
      }
      if ((this._initDiagram.cursor != null) && (this._initDiagram.cursorExact != null)) {
        this.currentTime = this._initDiagram.cursor;
        this.currentExactTime = this._initDiagram.cursorExact;
      }
    }
    ref3 = this.signals;
    for (n = 0, len4 = ref3.length; n < len4; n++) {
      signal = ref3[n];
      signal.originalName = signal.name;
    }
    if (!((this._initDiagram != null) && (this._initDiagram.from != null) && (this._initDiagram.to != null))) {
      this.renderedSignals = [];
      this.removedSignals = [];
      this.includedSignals = [];
      this.excludedSignals = [];
      ref4 = this.signals;
      for (o = 0, len5 = ref4.length; o < len5; o++) {
        signal = ref4[o];
        if (!(typeof signal.name === 'string' || signal.name.trim() === '')) {
          continue;
        }
        levels = signal.name.split('.');
        depth = levels.length;
        signalId = signal.name;
        if (depth > 1) {
          levels.splice(0, 1);
        }
        signal.name = levels.join('.');
        busSignal = this.isBus(signal.name);
        if (depth === 2) {
          if (this.includedSignals.indexOf(signalId) < 0) {
            this.renderedSignals.push({
              id: signalId,
              signal: signal,
              text: null,
              ypos: null,
              currentValue: '0',
              type: busSignal ? BUS_SIGNAL : WIRE_SIGNAL,
              width: busSignal ? Math.abs(busSignal.start - busSignal.end) + 1 : 1
            });
            this.includedSignals.push(signalId);
          }
        } else if (depth > 2) {
          if (this.excludedSignals.indexOf(signalId) < 0) {
            this.removedSignals.push({
              id: signalId,
              signal: signal,
              text: null,
              ypos: null,
              currentValue: '0',
              type: busSignal ? BUS_SIGNAL : WIRE_SIGNAL,
              width: busSignal ? Math.abs(busSignal.start - busSignal.end) + 1 : 1
            });
            this.excludedSignals.push(signalId);
          }
        }
      }
    } else {
      signalMap = {};
      this.renderedSignals = [];
      this.removedSignals = [];
      this.includedSignals = [];
      this.excludedSignals = [];
      ref5 = this._initDiagram.rendered;
      for (p = 0, len6 = ref5.length; p < len6; p++) {
        index = ref5[p];
        if (this.includedSignals.indexOf(index) < 0) {
          this.includedSignals.push(index);
        }
      }
      ref6 = this._initDiagram.hidden;
      for (q = 0, len7 = ref6.length; q < len7; q++) {
        index = ref6[q];
        if (this.excludedSignals.indexOf(index) < 0) {
          this.excludedSignals.push(index);
        }
      }
      this._initDiagram.rendered = (function() {
        var len8, r, ref7, results;
        ref7 = this.includedSignals;
        results = [];
        for (r = 0, len8 = ref7.length; r < len8; r++) {
          index = ref7[r];
          results.push(index);
        }
        return results;
      }).call(this);
      this._initDiagram.hidden = (function() {
        var len8, r, ref7, results;
        ref7 = this.excludedSignals;
        results = [];
        for (r = 0, len8 = ref7.length; r < len8; r++) {
          index = ref7[r];
          results.push(index);
        }
        return results;
      }).call(this);
      ref7 = this.signals;
      for (r = 0, len8 = ref7.length; r < len8; r++) {
        signal = ref7[r];
        if (!(typeof signal.name === 'string' || signal.name.trim() === '')) {
          continue;
        }
        levels = signal.name.split('.');
        depth = levels.length;
        signalId = signal.name;
        if (depth > 1) {
          levels.splice(0, 1);
        }
        signal.name = levels.join('.');
        busSignal = this.isBus(signal.name);
        signalMap[signalId] = {
          id: signalId,
          signal: signal,
          text: null,
          ypos: null,
          currentValue: '0',
          type: busSignal ? BUS_SIGNAL : WIRE_SIGNAL,
          width: busSignal ? Math.abs(busSignal.start - busSignal.end) + 1 : 1
        };
      }
      ref8 = this._initDiagram.rendered;
      for (s = 0, len9 = ref8.length; s < len9; s++) {
        signalIndex = ref8[s];
        this.renderedSignals.push(signalMap[signalIndex]);
      }
      ref9 = this._initDiagram.hidden;
      for (t = 0, len10 = ref9.length; t < len10; t++) {
        signalIndex = ref9[t];
        this.removedSignals.push(signalMap[signalIndex]);
      }
      if (typeof this._initDiagram.highlightedIndex === 'number' && this._initDiagram.highlightedIndex < this.renderedSignals.length) {
        this.highlightedIndex = this._initDiagram.highlightedIndex;
      }
    }
    this._initLayout();
    this._initCanvas();
    this.redraw();
    if ((this._initDiagram != null) && (this._initDiagram.cursor != null) && (this._initDiagram.cursorExact != null)) {
      this.setCursorTime(this.currentExactTime);
    }
    if ((this._initDiagram != null) && (this._initDiagram.radix != null)) {
      if (this._initDiagram.radix === RADIX_BIN) {
        $("#" + this._radixSelectId).val("" + this._radixSelectBinId).selectmenu('refresh');
        this.radix = RADIX_BIN;
        this.setRadix(RADIX_BIN);
      } else if (this._initDiagram.radix === RADIX_HEX) {
        $("#" + this._radixSelectId).val("" + this._radixSelectHexId).selectmenu('refresh');
        this.radix = RADIX_HEX;
        this.setRadix(RADIX_HEX);
      } else if (this._initDiagram.radix === RADIX_DEC) {
        $("#" + this._radixSelectId).val("" + this._radixSelectDecId).selectmenu('refresh');
        this.radix = RADIX_DEC;
        this.setRadix(RADIX_DEC);
      }
      this.redraw();
    }
  }

  Waveform.prototype.setOnChangeListener = function(listener) {
    if (typeof listener === 'function') {
      return this._onChangeListener = listener;
    }
  };

  Waveform.prototype.setOnSaveListener = function(listener) {
    if (typeof listener === 'function') {
      return this._onSaveListener = listener;
    }
  };

  Waveform.prototype.exportTimingDiagram = function() {
    var exported, hiddenOrder, renderedOrder, signal;
    renderedOrder = (function() {
      var j, len, ref, results;
      ref = this.renderedSignals;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        signal = ref[j];
        results.push(signal.id);
      }
      return results;
    }).call(this);
    hiddenOrder = (function() {
      var j, len, ref, results;
      ref = this.removedSignals;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        signal = ref[j];
        results.push(signal.id);
      }
      return results;
    }).call(this);
    exported = {
      rendered: renderedOrder,
      hidden: hiddenOrder,
      from: this.renderFrom,
      to: this.renderTo,
      cursor: this.currentTime,
      cursorExact: this.currentExactTime,
      end: this.endTime,
      originalEnd: this.originalEndTime,
      radix: this.radix,
      timeScale: this.timeScale,
      timeScaleUnit: this.timeScaleUnit,
      timeUnit: this.timeUnit,
      highlightedIndex: this.highlightedIndex
    };
    return JSON.stringify(exported);
  };

  Waveform.prototype.resetTimingDiagram = function() {
    var busSignal, depth, j, k, len, len1, levels, ref, ref1, signal, signalId;
    this.timeScale = this._data.scale.match(/(\d+)/);
    this.timeScaleUnit = this._data.scale.match(/(\D+)/);
    if ((this.timeScale == null) || !this.timeScaleUnit) {
      return null;
    }
    this.timeScale = this.timeScale[0];
    this.timeScaleUnit = this.timeScaleUnit[0];
    this.timeUnit = parseInt(this.timeScale);
    if (this.timeScaleUnit === 'ns') {
      this.timeUnit *= 1000;
    }
    this.radix = RADIX_BIN;
    this.originalEndTime = this._data.endtime;
    this.endTime = this.ceilFive(this.originalEndTime);
    this.renderFrom = 0;
    if (this.originalEndTime > 100) {
      this.renderTo = this.floorInt(this.endTime, 100);
    } else {
      this.renderTo = this.roundInt(this.endTime / 2.0, 10);
    }
    ref = this.signals;
    for (j = 0, len = ref.length; j < len; j++) {
      signal = ref[j];
      signal.name = signal.originalName;
    }
    this._data.signal.sort(function(firstSignal, secondSignal) {
      if (firstSignal.name < secondSignal.name) {
        return -1;
      } else if (firstSignal.name > secondSignal.name) {
        return 1;
      } else {
        return 0;
      }
    });
    this.signals = this._data.signal;
    this.renderedSignals = [];
    this.removedSignals = [];
    this.includedSignals = [];
    this.excludedSignals = [];
    ref1 = this.signals;
    for (k = 0, len1 = ref1.length; k < len1; k++) {
      signal = ref1[k];
      if (!(typeof signal.name === 'string' || signal.name.trim() === '')) {
        continue;
      }
      levels = signal.name.split('.');
      depth = levels.length;
      signalId = signal.name;
      if (depth > 1) {
        levels.splice(0, 1);
      }
      signal.name = levels.join('.');
      busSignal = this.isBus(signal.name);
      if (depth === 2) {
        if (this.includedSignals.indexOf(signalId) < 0) {
          this.renderedSignals.push({
            id: signalId,
            signal: signal,
            text: null,
            ypos: null,
            currentValue: '0',
            type: busSignal ? BUS_SIGNAL : WIRE_SIGNAL,
            width: busSignal ? Math.abs(busSignal.start - busSignal.end) + 1 : 1
          });
          this.includedSignals.push(signalId);
        }
      } else if (depth > 2) {
        if (this.excludedSignals.indexOf(signalId) < 0) {
          this.removedSignals.push({
            id: signalId,
            signal: signal,
            text: null,
            ypos: null,
            currentValue: '0',
            type: busSignal ? BUS_SIGNAL : WIRE_SIGNAL,
            width: busSignal ? Math.abs(busSignal.start - busSignal.end) + 1 : 1
          });
          this.excludedSignals.push(signalId);
        }
      }
    }
    this.currentTime = void 0;
    this.currentExactTime = void 0;
    this.highlightedIndex = void 0;
    this.redraw();
    if (this._cursor) {
      this._cursor.setVisible(false);
      this._cursor.time = void 0;
      this.refreshCurrentValues();
      this._cursorValueDiv.text('');
    }
    $("#" + this._radixSelectId).val("" + this._radixSelectBinId).selectmenu('refresh');
    this.setRadix(RADIX_BIN);
    if (this._onChangeListener) {
      return this._onChangeListener({
        type: 'reset'
      });
    }
  };

  Waveform.prototype.redraw = function() {
    if (this.renderTo > this.endTime) {
      this.renderTo = this.endTime;
    }
    this.clearCanvas();
    this.drawGrid(this.renderFrom, this.renderTo);
    this.drawSignals(this.renderFrom, this.renderTo);
    if (this._cursor) {
      this._canvas.add(this._cursor);
    }
    if (this.highlighted) {
      this.highlighted.fill = void 0;
      this.highlighted.opacity = 0;
    }
    if (this.highlightedIndex) {
      this.highlighted = this.renderedSignals[this.highlightedIndex].highlight;
      this.highlighted.fill = DEFAULT_COLOR.SIGNAL_HIGHLIGHT;
      this.highlighted.opacity = DEFAULT_OPACITY.SIGNAL_HIGHLIGHT;
    }
    return this.setCursorTime(this.currentExactTime);
  };

  Waveform.prototype.setCursorTime = function(exactTime) {
    var cursorCurrentValueText, cursorPos, time;
    if (exactTime == null) {
      return;
    }
    time = exactTime.toFixed(2);
    cursorPos = this._timeToPos(exactTime, null, false);
    this.currentTime = time;
    this.currentExactTime = exactTime;
    if (this._cursor != null) {
      this._cursor.x1 = cursorPos;
      this._cursor.x2 = cursorPos;
      this._cursor.setLeft(cursorPos);
      this._cursor.setTop(0);
      this._cursor.setHeight(this.canvasHeight);
      this._cursor.width = 1;
    } else {
      this._cursor = new fabric.Line([cursorPos, 0, cursorPos, this.canvasHeight], {
        fill: DEFAULT_COLOR.CURSOR,
        stroke: DEFAULT_COLOR.CURSOR,
        strokeWidth: 1,
        opacity: DEFAULT_OPACITY.CURSOR,
        selectable: false,
        hasControls: false,
        hasRotatingPoint: false,
        width: 1
      });
      this._cursorValueDiv.show();
    }
    if (time < this.renderFrom || time > this.renderTo) {
      this._cursor.setVisible(false);
    } else {
      this._cursor.setVisible(true);
    }
    if (!this._canvas.contains(this._cursor)) {
      this._canvas.add(this._cursor);
    }
    this._cursor.time = this.currentTime;
    this.refreshCurrentValues();
    cursorCurrentValueText = 'Time: ' + this.currentTime + this.timeScaleUnit;
    if (this.highlighted) {
      cursorCurrentValueText = cursorCurrentValueText + ', Value: ' + this._getFormattedValue(this.highlighted.signal.currentValue, this.highlighted.signal.width);
    }
    this._cursorValueDiv.text(cursorCurrentValueText);
    if (this._onChangeListener) {
      this._onChangeListener({
        type: 'cursor'
      });
    }
    return this._canvas.renderAll();
  };

  Waveform.prototype.drawGrid = function(start, end) {
    var currentTarget, i, j, k, len, len1, line, lineCords, linePos, lineStep, ref, ref1, results, text;
    if (start == null) {
      start = this.renderFrom;
    }
    if (end == null) {
      end = this.renderTo;
    }
    this._signalsNamesRect = new fabric.Rect({
      width: SIGNAL_NAMES_BOX_WIDTH,
      height: this._canvas.height,
      fill: DEFAULT_COLOR.SIGNAL_NAME_RECT,
      opacity: DEFAULT_OPACITY.SIGNAL_NAME_RECT
    });
    this._renderDist = Math.abs(this.renderTo - this.renderFrom);
    lineStep = Math.floor(this._renderDist / (GRID_SECTIONS - 1));
    i = this.renderFrom + lineStep;
    while (i <= this.renderTo) {
      i += lineStep;
    }
    currentTarget = i - lineStep;
    i = this.renderFrom + lineStep;
    this._renderDistanceFactor = (this._canvas.width - SIGNAL_NAMES_BOX_WIDTH) / this._renderDist;
    this._gridLines = [];
    this._gridTexts = [];
    while (i <= currentTarget) {
      linePos = this._timeToPos(i);
      lineCords = [linePos, RULER_HEIGHT, linePos, this._canvas.height];
      this._gridLines.push(this._getGridLine(lineCords));
      this._gridTexts.push(new fabric.Text(i + this.timeScaleUnit, {
        fontFamily: 'monospace',
        left: linePos - 10,
        top: 0,
        fontSize: 11,
        selectable: false,
        hasControls: false,
        hasRotatingPoint: false,
        fill: DEFAULT_COLOR.GRID_TEXT
      }));
      i += lineStep;
    }
    ref = this._gridLines;
    for (j = 0, len = ref.length; j < len; j++) {
      line = ref[j];
      this._canvas.add(line);
    }
    ref1 = this._gridTexts;
    results = [];
    for (k = 0, len1 = ref1.length; k < len1; k++) {
      text = ref1[k];
      results.push(this._canvas.add(text));
    }
    return results;
  };

  Waveform.prototype.refreshSignalValues = function() {
    var j, len, ref, val;
    ref = this._signalValueText;
    for (j = 0, len = ref.length; j < len; j++) {
      val = ref[j];
      val.textbox.setText(this._getFormattedValue(val.value, val.width));
    }
    return this._canvas.renderAll();
  };

  Waveform.prototype.drawSignals = function(start, end) {
    var currentValueSpanWidth, currentValueText, currentValueWidth, highlightRect, initialValue, j, k, len, len1, originX, originY, overflowWidth, ranges, ref, ref1, rendered, signal, signalBus, signalIndex, valueIndex, valueObject;
    if (start == null) {
      start = this.renderFrom;
    }
    if (end == null) {
      end = this.renderTo;
    }
    this._drawSignalNames();
    signalIndex = -1;
    this._signalValueText = [];
    ref = this.renderedSignals;
    for (j = 0, len = ref.length; j < len; j++) {
      rendered = ref[j];
      signalIndex++;
      signal = rendered.signal;
      ranges = this._getSignalValues(signal.wave, start, end);
      signalBus = this.isBus(signal.name);
      initialValue = ranges[0].value;
      originX = SIGNAL_NAMES_BOX_WIDTH;
      originY = rendered.ypos;
      if (initialValue === '0' || initialValue === 'x' || initialValue === 'z') {
        originY += SIGNAL_HEIGHT;
      }
      if (signalBus) {
        originY = rendered.ypos + SIGNAL_HEIGHT / 2.0;
      }
      valueIndex = 0;
      for (k = 0, len1 = ranges.length; k < len1; k++) {
        valueObject = ranges[k];
        valueObject.width = rendered.width;
        if (valueIndex === ranges.length - 1) {
          valueObject.last = true;
        }
        ref1 = this._drawValue(valueObject, originX, originY, initialValue, DEFAULT_COLOR.SIGNAL, signalBus !== false), originX = ref1[0], originY = ref1[1], initialValue = ref1[2];
        valueIndex++;
      }
      highlightRect = new fabric.Rect({
        left: 2,
        top: rendered.ypos - 1,
        height: SIGNAL_HEIGHT + 3,
        width: this.canvasWidth,
        fill: void 0,
        opacity: 0,
        selectable: false,
        hasControls: false,
        hasRotatingPoint: false
      });
      highlightRect.signal = rendered;
      rendered.highlight = highlightRect;
      rendered.currentValue = ranges[0].value;
      currentValueText = this._getFormattedValue(ranges[0].value, ranges[0].width);
      this._signalCurrentValues[signalIndex].setText(currentValueText);
      currentValueWidth = this._signalCurrentValues[signalIndex].width;
      currentValueSpanWidth = Math.abs(SIGNAL_NAMES_BOX_WIDTH - SIGNAL_BOX_WIDTH - 10);
      overflowWidth = currentValueWidth > currentValueSpanWidth;
      while (currentValueWidth > currentValueSpanWidth) {
        currentValueText = currentValueText.substr(0, currentValueText.length - 1);
        this._signalCurrentValues[signalIndex].setText(currentValueText);
        currentValueWidth = this._signalCurrentValues[signalIndex].width;
      }
      if (overflowWidth) {
        currentValueWidth = currentValueWidth + '..';
      }
      this._canvas.add(this._signalCurrentValues[signalIndex]);
      this._canvas.add(highlightRect);
    }
    this._canvas.bringToFront(this._currentValueLineStart);
    this._canvas.bringToFront(this._currentValueLineEnd);
    return this._canvas.renderAll();
  };

  Waveform.prototype.refreshCurrentValues = function() {
    var currentValueSpanWidth, currentValueText, currentValueWidth, ind, j, k, len, len1, overflowWidth, ref, rendered, signal, signalIndex, value, wave;
    signalIndex = 0;
    ref = this.renderedSignals;
    for (j = 0, len = ref.length; j < len; j++) {
      rendered = ref[j];
      signal = rendered.signal;
      wave = signal.wave;
      ind = 0;
      for (k = 0, len1 = wave.length; k < len1; k++) {
        value = wave[k];
        if (this.currentTime >= Number.parseInt(value[0])) {
          if (ind === wave.length - 1 || this.currentTime <= Number.parseInt(wave[ind + 1])) {
            rendered.currentValue = value[1];
            break;
          }
        }
        ind++;
      }
      currentValueText = this._getFormattedValue(rendered.currentValue, rendered.width);
      this._signalCurrentValues[signalIndex].setText(currentValueText);
      currentValueWidth = this._signalCurrentValues[signalIndex].width;
      currentValueSpanWidth = Math.abs(SIGNAL_NAMES_BOX_WIDTH - SIGNAL_BOX_WIDTH - 14);
      overflowWidth = currentValueWidth > currentValueSpanWidth;
      while (currentValueWidth > currentValueSpanWidth) {
        currentValueText = currentValueText.substr(0, currentValueText.length - 1);
        this._signalCurrentValues[signalIndex].setText(currentValueText);
        currentValueWidth = this._signalCurrentValues[signalIndex].width;
      }
      if (overflowWidth) {
        currentValueWidth = currentValueWidth + '..';
      }
      signalIndex++;
    }
    return this._canvas.renderAll();
  };

  Waveform.prototype.addSignal = function() {
    var dialogMessage, dialogTitle, index, j, len, options, ref, removedSignal, selectableId;
    options = "";
    index = 0;
    this.removedSignals.sort(function(firstSignal, secondSignal) {
      if (firstSignal.signal.name < secondSignal.signal.name) {
        return -1;
      } else if (firstSignal.signal.name > secondSignal.signal.name) {
        return 1;
      } else {
        return 0;
      }
    });
    ref = this.removedSignals;
    for (j = 0, len = ref.length; j < len; j++) {
      removedSignal = ref[j];
      options = options + "<li class=\"ui-widget-content\" value=\"" + index + "\">" + removedSignal.signal.name + "</li>\n";
      index++;
    }
    selectableId = this._containerId + "-waveform-add-signal-select";
    dialogTitle = "Add Signals";
    dialogMessage = "<ol id=\"" + selectableId + "\" class=\"ui-widget ui-corner-all waveform-add-signal-select\" multiple>\n" + options + "</select>";
    $("#" + this._modalDialogId).html(dialogMessage);
    $("#" + selectableId).selectable();
    return $("#" + this._modalDialogId).dialog({
      resizable: false,
      modal: true,
      title: dialogTitle,
      height: 400,
      width: 300,
      buttons: {
        'Add': (function(_this) {
          return function() {
            var ind, k, l, len1, len2, rmCounter, rmIndices, selected, selection, selectionIndex, selectionName;
            selected = $("#" + selectableId + " .ui-selected");
            rmIndices = [];
            for (k = 0, len1 = selected.length; k < len1; k++) {
              selection = selected[k];
              selectionIndex = $(selection).val();
              selectionName = _this.removedSignals[selectionIndex].signal.name;
              if (_this.includedSignals.indexOf(selectionName) < 0) {
                _this.renderedSignals.push(_this.removedSignals[selectionIndex]);
                rmIndices.push(selectionIndex);
                _this.excludedSignals.splice(_this.excludedSignals.indexOf(selectionName, 1));
                _this.includedSignals.push(selectionName);
              }
            }
            rmIndices.sort();
            rmCounter = 0;
            for (l = 0, len2 = rmIndices.length; l < len2; l++) {
              ind = rmIndices[l];
              _this.removedSignals.splice(ind - rmCounter, 1);
              rmCounter++;
            }
            $("#" + _this._modalDialogId).dialog('close');
            $("[aria-describedby=\"" + _this._modalDialogId + "\"]").remove();
            if (rmIndices.length) {
              _this.redraw();
            }
            $("#" + _this._modalDialogId).empty();
            if (_this._onChangeListener) {
              return _this._onChangeListener({
                type: 'add'
              });
            }
          };
        })(this),
        'Cancel': function() {
          $(this).dialog('close');
          return $("[aria-describedby=\"" + this._modalDialogId + "\"]").remove();
        }
      },
      close: (function(_this) {
        return function() {
          $("#" + _this._modalDialogId).empty();
          return $("[aria-describedby=\"" + _this._modalDialogId + "\"]").remove();
        };
      })(this)
    });
  };

  Waveform.prototype.removeSignal = function() {
    var dialogMessage, dialogTitle, signal, signalIndex, signalName;
    if (!this.highlighted) {
      return;
    }
    signalIndex = this.renderedSignals.indexOf(this.highlighted.signal);
    signal = this.highlighted.signal.signal;
    signalName = signal.name;
    dialogTitle = "Remove Signal " + signalName + "?";
    dialogMessage = "<p><span class=\"ui-icon ui-icon-alert\" style=\"float:left; margin:0 7px 20px 0;\"></span>Do you want to remove the selected signal?</p>";
    $("#" + this._modalDialogId).html(dialogMessage);
    return $("#" + this._modalDialogId).dialog({
      resizable: false,
      modal: true,
      title: dialogTitle,
      height: 150,
      width: 320,
      buttons: {
        'Remove': (function(_this) {
          return function() {
            if (_this.highlighted) {
              _this.highlighted.fill = void 0;
              _this.highlighted.opacity = 0;
            }
            _this.highlighted = void 0;
            _this.highlightedIndex = void 0;
            if (_this.excludedSignals.indexOf(signalIndex) < 0) {
              _this.removedSignals.push(_this.renderedSignals[signalIndex]);
              _this.renderedSignals.splice(signalIndex, 1);
              _this.excludedSignals.push(signalIndex);
              _this.includedSignals.splice(_this.includedSignals.indexOf(signalIndex, 1));
              _this.redraw();
            }
            $("#" + _this._modalDialogId).dialog('close');
            $("[aria-describedby=\"" + _this._modalDialogId + "\"]").remove();
            if (_this._onChangeListener) {
              return _this._onChangeListener({
                type: 'remove'
              });
            }
          };
        })(this),
        'Cancel': function() {
          $(this).dialog('close');
          return $("[aria-describedby=\"" + this._modalDialogId + "\"]").remove();
        }
      },
      close: (function(_this) {
        return function() {
          return $("#" + _this._modalDialogId).html('');
        };
      })(this)
    });
  };

  Waveform.prototype.moveFirst = function() {
    if (this.renderFrom === 0) {
      return;
    }
    this.renderFrom = 0;
    this.renderTo = this.renderFrom + this._renderDist;
    if (this.renderTo > this.endTime) {
      this.renderTo = this.endTime;
    }
    this.redraw();
    return this.setCursorTime(this.currentExactTime);
  };

  Waveform.prototype.moveLeft = function() {
    var factor, newFrom, newTo;
    if (this.renderFrom === 0) {
      return;
    }
    factor = Math.floor(this._renderDist / 8.0);
    newFrom = this.renderFrom - factor;
    if (newFrom < 0) {
      newFrom = 0;
    }
    newTo = newFrom + this._renderDist;
    if (newTo > this.endTime) {
      newTo = this.endTime;
    }
    this.renderFrom = newFrom;
    this.renderTo = newTo;
    this.redraw();
    return this.setCursorTime(this.currentExactTime);
  };

  Waveform.prototype.moveRight = function() {
    var factor, newFrom, newTo;
    if (this.renderTo === this.endTime) {
      return;
    }
    factor = Math.floor(this._renderDist / 8.0);
    newTo = this.renderTo + factor;
    if (newTo > this.endTime) {
      newTo = this.endTime;
    }
    newFrom = newTo - this._renderDist;
    if (newFrom < 0) {
      newFrom = 0;
    }
    this.renderFrom = newFrom;
    this.renderTo = newTo;
    this.redraw();
    return this.setCursorTime(this.currentExactTime);
  };

  Waveform.prototype.zoomIn = function() {
    var cursorTime, factor, newDistance, newFrom, newTo;
    factor = Math.floor(this._renderDist / 4.0);
    newFrom = this.renderFrom + factor;
    newTo = this.renderTo - factor;
    if (this._cursor != null) {
      cursorTime = Math.round(this._cursor.time);
      if (cursorTime - factor < this.renderFrom) {
        newFrom = this.renderFrom;
        newTo = this.renderTo - 2 * factor;
      } else if (cursorTime + factor > this.renderTo) {
        newFrom = this.renderFrom + 2 * factor;
        newTo = this.renderTo;
      } else {
        newFrom = cursorTime - factor;
        newTo = cursorTime + factor;
      }
    }
    if (newFrom > newTo || newTo < 0 || newFrom >= newTo) {
      return;
    }
    newDistance = newTo - newFrom;
    this.scaleFactor = newDistance / this.originalEndTime;
    if (this.scaleFactor < 0.02) {
      return;
    }
    if (factor) {
      this.renderFrom = newFrom;
      this.renderTo = newTo;
      this.redraw();
      return this.setCursorTime(this.currentExactTime);
    }
  };

  Waveform.prototype.zoomOut = function() {
    var factor, newDistance, newFrom, newTo, zoomDistance;
    zoomDistance = 2 * this._renderDist;
    newFrom = void 0;
    newTo = void 0;
    if (zoomDistance > this.originalEndTime) {
      newFrom = 0;
      newTo = this.endTime;
    } else {
      factor = Math.floor(this._renderDist / 2.0);
      newFrom = this.renderFrom - factor;
      newTo = this.renderTo + factor;
      if (newTo > this.endTime) {
        newTo = this.endTime;
        newFrom = newTo - zoomDistance;
      }
      if (newFrom < 0) {
        newFrom = 0;
      }
    }
    newDistance = newTo - newFrom;
    this.scaleFactor = newDistance / this.originalEndTime;
    this.renderFrom = newFrom;
    this.renderTo = newTo;
    this.redraw();
    return this.setCursorTime(this.currentExactTime);
  };

  Waveform.prototype.zoomAll = function() {
    if (this.renderFrom === 0 && this.renderTo === this.endTime) {
      return;
    }
    this.renderFrom = 0;
    this.renderTo = this.endTime;
    this.redraw();
    return this.setCursorTime(this.currentExactTime);
  };

  Waveform.prototype.setRadix = function(newRadix) {
    var changed;
    if (newRadix !== RADIX_BIN && newRadix !== RADIX_DEC && newRadix !== RADIX_HEX) {
      return;
    }
    changed = this.radix !== newRadix;
    this.radix = newRadix;
    this.refreshCurrentValues();
    this.refreshSignalValues();
    if (changed) {
      return this.redraw();
    }
  };

  Waveform.prototype.isBus = function(signalName) {
    var matches;
    matches = /[\s\S]+\[(\d+)\:(\d+)\]\s*/.exec(signalName);
    if (matches == null) {
      return false;
    } else {
      return {
        start: matches[1],
        end: matches[2]
      };
    }
  };

  Waveform.prototype.clearCanvas = function() {
    return this._canvas.clear();
  };

  Waveform.prototype.binToDec = function(value) {
    return Number.parseInt(value, 2).toString(10);
  };

  Waveform.prototype.binToHex = function(value) {
    return Number.parseInt(value, 2).toString(16).toUpperCase();
  };

  Waveform.prototype.pad = function(value, width, padding) {
    if (padding == null) {
      padding = '0';
    }
    value = value + '';
    if (value.length >= width) {
      return value;
    } else {
      return new Array(width - value.length + 1).join(padding) + value;
    }
  };

  Waveform.prototype.pointDist = function(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  Waveform.prototype.getRandomColor = function() {
    var color, i, j, letters;
    letters = '0123456789ABCDEF'.split('');
    color = '#';
    for (i = j = 0; j < 6; i = ++j) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  Waveform.prototype.ceilInt = function(value, divis) {
    value = Math.round(value);
    while (value % divis) {
      value++;
    }
    return value;
  };

  Waveform.prototype.floorInt = function(value, divis) {
    value = Math.round(value);
    while (value % divis) {
      value--;
    }
    return value;
  };

  Waveform.prototype.roundInt = function(value, divis) {
    var ceilValue, floorValue;
    value = Math.round(value);
    if (!(value % divis)) {
      return value;
    }
    ceilValue = value;
    floorValue = value;
    while (ceilValue % divis && floorValue % divis) {
      ceilValue++;
      floorValue--;
    }
    if (ceilValue % divis) {
      return floorValue;
    } else {
      return ceilValue;
    }
  };

  Waveform.prototype.ceilFive = function(value) {
    return this.ceilInt(value, 5);
  };

  Waveform.prototype.floorFive = function(value) {
    return this.floorInt(value, 5);
  };

  Waveform.prototype.roundFive = function(value) {
    return this.roundInt(value, 5);
  };

  Waveform.prototype._initCanvas = function() {
    this._canvas = new fabric.Canvas(this._canvasId, {
      width: this.canvasWidth,
      height: this.canvasHeight,
      backgroundColor: DEFAULT_COLOR.CANVAS_BACKGROUND,
      renderOnAddRemove: false,
      selection: false,
      stateful: false
    });
    this._context = this._canvas.getContext('2d');
    this._isDragging = false;
    this._draggedSignal = void 0;
    this._draggedOriginalX = void 0;
    this._draggedOriginalY = void 0;
    this._draggedMouseX = void 0;
    this._draggedMouseY = void 0;
    this._dragRectangle = void 0;
    this._dragRectangleOriginalHeight = void 0;
    this._canvas.on('mouse:down', (function(_this) {
      return function(options) {
        var pointer;
        if (options.target) {
          pointer = _this._canvas.getPointer(options.e);
          if (options.target.signal) {
            if (_this.highlighted) {
              _this.highlighted.fill = void 0;
              _this.highlighted.opacity = 0;
            }
            _this.highlighted = options.target;
            _this.highlightedIndex = _this.renderedSignals.indexOf(options.target.signal);
            options.target.fill = DEFAULT_COLOR.SIGNAL_HIGHLIGHT;
            options.target.opacity = DEFAULT_OPACITY.SIGNAL_HIGHLIGHT;
          } else {
            if (_this.highlighted) {
              _this.highlighted.fill = void 0;
              _this.highlighted.opacity = 0;
            }
            _this.highlighted = void 0;
            _this.highlightedIndex = void 0;
          }
          if (options.target.signal) {
            _this._draggedSignal = options.target;
            _this._draggedOriginalX = options.target.left;
            _this._draggedOriginalY = options.target.top;
            _this._draggedMouseX = pointer.x;
            _this._draggedMouseY = pointer.y;
          }
          _this._isDragging = true;
          return _this._canvas.renderAll();
        }
      };
    })(this));
    this._canvas.on('mouse:move', (function(_this) {
      return function(options) {
        var pointer;
        if (_this._isDragging) {
          pointer = _this._canvas.getPointer(options.e);
          if (_this._draggedSignal != null) {
            _this._draggedSignal.setTop((pointer.y - _this._draggedMouseY) + _this._draggedOriginalY);
            _this._draggedSignal.opacity = DEFAULT_OPACITY.SIGNAL_DRAGGED;
          }
          if ((_this._dragRectangle != null) && options.target !== _this._dragRectangle) {
            _this._dragRectangle.setHeight(_this._dragRectangleOriginalHeight);
            _this._dragRectangleOriginalHeight = void 0;
            _this._dragRectangle.fill = void 0;
            _this._dragRectangle.opacity = 0;
            _this._dragRectangle = void 0;
          }
          if (options.target && options.target.signal && options.target !== _this._draggedSignal && options.target !== _this._dragRectangle) {
            _this._dragRectangle = options.target;
            _this._dragRectangle.fill = DEFAULT_COLOR.SIGNAL_DRAGGED;
            _this._dragRectangle.opacity = DEFAULT_OPACITY.SIGNAL_DRAGGED;
            _this._dragRectangleOriginalHeight = _this._dragRectangle.height;
            _this._dragRectangle.setHeight(_this._dragRectangle.height / 2.0);
          }
          return _this._canvas.renderAll();
        }
      };
    })(this));
    return this._canvas.on('mouse:up', (function(_this) {
      return function(options) {
        var pointer, sourceIndex, targetIndex, validTarget;
        if (_this._isDragging) {
          validTarget = options.target && options.target.signal && _this._draggedSignal !== options.target;
          if (_this._draggedSignal != null) {
            if (_this._draggedOriginalX != null) {
              if (validTarget) {
                sourceIndex = _this.renderedSignals.indexOf(_this._draggedSignal.signal);
                targetIndex = _this.renderedSignals.indexOf(options.target.signal);
                _this.renderedSignals.splice(targetIndex, 0, _this.renderedSignals.splice(sourceIndex, 1)[0]);
                _this._draggedSignal.set({
                  left: _this._draggedOriginalX,
                  top: _this._draggedOriginalY
                });
                if (_this._dragRectangle != null) {
                  _this._dragRectangle.setHeight(_this._dragRectangleOriginalHeight);
                  _this._dragRectangle.fill = void 0;
                  _this._dragRectangleOriginalHeight = void 0;
                  _this._dragRectangle.opacity = 0;
                  _this._dragRectangle = void 0;
                }
                _this.highlightedIndex = targetIndex;
                _this.redraw();
                if (_this._onChangeListener) {
                  _this._onChangeListener({
                    type: 'sort'
                  });
                }
              } else {
                _this._draggedSignal.set({
                  left: _this._draggedOriginalX,
                  top: _this._draggedOriginalY
                });
              }
            }
          }
        }
        if (_this._dragRectangle != null) {
          _this._dragRectangle.setHeight(_this._dragRectangleOriginalHeight);
          _this._dragRectangleOriginalHeight = void 0;
          _this._dragRectangle.fill = void 0;
          _this._dragRectangle.opacity = 0;
          _this._dragRectangle = void 0;
        }
        _this._isDragging = false;
        _this._draggedSignal = void 0;
        _this._draggedOriginalX = void 0;
        _this._draggedOriginalY = void 0;
        _this._draggedMouseX = void 0;
        _this._draggedMouseY = void 0;
        pointer = _this._canvas.getPointer(options.e);
        if (pointer.x > SIGNAL_NAMES_BOX_WIDTH) {
          _this.setCursorTime(_this._posToTime(pointer.x, null, false));
        }
        return _this._canvas.renderAll();
      };
    })(this));
  };

  Waveform.prototype._drawValue = function(valueObject, originX, originY, initialValue, signalColor, busSignal, start, end) {
    var centrePoint, endPos, isLast, lastPoint, pointsTime, polyLine, polyPoints, polyText, polyWidth, startPos, textValue, textWidth, value, widthOverflow;
    if (signalColor == null) {
      signalColor = DEFAULT_COLOR.SIGNAL;
    }
    if (busSignal == null) {
      busSignal = false;
    }
    if (start == null) {
      start = this.renderFrom;
    }
    if (end == null) {
      end = this.renderTo;
    }
    value = valueObject.value;
    startPos = this._timeToPos(valueObject.start);
    endPos = this._timeToPos(valueObject.end);
    isLast = valueObject.last;
    if (!busSignal) {
      polyPoints = [];
      lastPoint = [];
      polyLine = void 0;
      if (initialValue === '0' || initialValue === 'x' || initialValue === 'z') {
        if (value === '1') {
          polyPoints.push({
            x: this._timeToPos(valueObject.start),
            y: originY
          });
          polyPoints.push({
            x: this._timeToPos(valueObject.start),
            y: originY - SIGNAL_HEIGHT
          });
          polyPoints.push({
            x: this._timeToPos(valueObject.end),
            y: originY - SIGNAL_HEIGHT
          });
          lastPoint = [polyPoints[polyPoints.length - 1].x, polyPoints[polyPoints.length - 1].y];
          polyLine = new fabric.Polyline(polyPoints, {
            stroke: signalColor,
            fill: void 0,
            selectable: false,
            hasControls: false,
            hasRotatingPoint: false
          });
          this._canvas.add(polyLine);
        } else if (value === '0') {
          polyPoints.push({
            x: this._timeToPos(valueObject.start),
            y: originY
          });
          polyPoints.push({
            x: this._timeToPos(valueObject.end),
            y: originY
          });
          lastPoint = [polyPoints[polyPoints.length - 1].x, polyPoints[polyPoints.length - 1].y];
          polyLine = new fabric.Polyline(polyPoints, {
            stroke: signalColor,
            fill: void 0,
            selectable: false,
            hasControls: false,
            hasRotatingPoint: false
          });
          this._canvas.add(polyLine);
        } else if (value === 'x') {
          polyPoints.push({
            x: this._timeToPos(valueObject.start),
            y: originY
          });
          polyPoints.push({
            x: this._timeToPos(valueObject.end),
            y: originY
          });
          lastPoint = [polyPoints[polyPoints.length - 1].x, polyPoints[polyPoints.length - 1].y];
          polyLine = new fabric.Polyline(polyPoints, {
            stroke: DEFAULT_COLOR.SIGNAL_DC,
            fill: void 0,
            selectable: false,
            hasControls: false,
            hasRotatingPoint: false
          });
          this._canvas.add(polyLine);
        } else if (value.toLowerCase() === 'z') {
          polyPoints.push({
            x: this._timeToPos(valueObject.start),
            y: originY
          });
          polyPoints.push({
            x: this._timeToPos(valueObject.end),
            y: originY
          });
          lastPoint = [polyPoints[polyPoints.length - 1].x, polyPoints[polyPoints.length - 1].y];
          polyLine = new fabric.Polyline(polyPoints, {
            stroke: DEFAULT_COLOR.SIGNAL_IMPED,
            fill: void 0,
            selectable: false,
            hasControls: false,
            hasRotatingPoint: false
          });
          this._canvas.add(polyLine);
        }
      } else if (initialValue === '1') {
        if (value === '1') {
          polyPoints.push({
            x: this._timeToPos(valueObject.start),
            y: originY
          });
          polyPoints.push({
            x: this._timeToPos(valueObject.end),
            y: originY
          });
          lastPoint = [polyPoints[polyPoints.length - 1].x, polyPoints[polyPoints.length - 1].y];
          polyLine = new fabric.Polyline(polyPoints, {
            stroke: signalColor,
            fill: void 0,
            selectable: false,
            hasControls: false,
            hasRotatingPoint: false
          });
          this._canvas.add(polyLine);
        } else if (value === '0') {
          polyPoints.push({
            x: this._timeToPos(valueObject.start),
            y: originY
          });
          polyPoints.push({
            x: this._timeToPos(valueObject.start),
            y: originY + SIGNAL_HEIGHT
          });
          polyPoints.push({
            x: this._timeToPos(valueObject.end),
            y: originY + SIGNAL_HEIGHT
          });
          lastPoint = [polyPoints[polyPoints.length - 1].x, polyPoints[polyPoints.length - 1].y];
          polyLine = new fabric.Polyline(polyPoints, {
            stroke: signalColor,
            fill: void 0,
            selectable: false,
            hasControls: false,
            hasRotatingPoint: false
          });
          this._canvas.add(polyLine);
        } else if (value === 'x' || value.toLowerCase() === 'z') {
          polyPoints.push({
            x: this._timeToPos(valueObject.start),
            y: originY
          });
          polyPoints.push({
            x: this._timeToPos(valueObject.start),
            y: originY + SIGNAL_HEIGHT
          });
          polyPoints.push({
            x: this._timeToPos(valueObject.end),
            y: originY + SIGNAL_HEIGHT
          });
          lastPoint = [polyPoints[polyPoints.length - 1].x, polyPoints[polyPoints.length - 1].y];
          polyLine = new fabric.Polyline(polyPoints, {
            stroke: signalColor,
            fill: void 0,
            selectable: false,
            hasControls: false,
            hasRotatingPoint: false
          });
          this._canvas.add(polyLine);
        }
      }
      return [lastPoint[0], lastPoint[1], value, polyLine];
    } else {
      polyPoints = [];
      lastPoint = [];
      pointsTime = Date.now();
      polyPoints.push({
        x: this._timeToPos(valueObject.start) + SIGNAL_BUS_SLOPE,
        y: originY + SIGNAL_HEIGHT / 2.0
      });
      polyPoints.push({
        x: this._timeToPos(valueObject.start),
        y: originY
      });
      polyPoints.push({
        x: this._timeToPos(valueObject.start) + SIGNAL_BUS_SLOPE,
        y: originY - SIGNAL_HEIGHT / 2.0
      });
      polyPoints.push({
        x: this._timeToPos(valueObject.end) - SIGNAL_BUS_SLOPE,
        y: originY - SIGNAL_HEIGHT / 2.0
      });
      if (!isLast) {
        polyPoints.push({
          x: this._timeToPos(valueObject.end),
          y: originY
        });
      } else {
        polyPoints.push({
          x: this._timeToPos(valueObject.end) + SIGNAL_BUS_SLOPE + 2,
          y: originY - SIGNAL_HEIGHT / 2.0
        });
        polyPoints.push({
          x: this._timeToPos(valueObject.end) + SIGNAL_BUS_SLOPE + 2,
          y: originY + SIGNAL_HEIGHT / 2.0
        });
      }
      polyPoints.push({
        x: this._timeToPos(valueObject.end) - SIGNAL_BUS_SLOPE,
        y: originY + SIGNAL_HEIGHT / 2.0
      });
      polyPoints.push({
        x: this._timeToPos(valueObject.start) + SIGNAL_BUS_SLOPE,
        y: originY + SIGNAL_HEIGHT / 2.0
      });
      lastPoint = [polyPoints[polyPoints.length - 1].x, polyPoints[polyPoints.length - 1].y];
      polyWidth = this.pointDist(polyPoints[2].x, polyPoints[2].y, polyPoints[3].x, polyPoints[3].y);
      polyLine = new fabric.Polyline(polyPoints, {
        stroke: value === 'x' ? DEFAULT_COLOR.SIGNAL_DC : value.toLowerCase() === 'z' ? DEFAULT_COLOR.SIGNAL_IMPED : signalColor,
        fill: void 0,
        selectable: false,
        hasControls: false,
        hasRotatingPoint: false
      });
      this._canvas.add(polyLine);
      centrePoint = polyLine.getCenterPoint();
      polyText = new fabric.Text(this._getFormattedValue(value, valueObject.width), {
        fontFamily: 'monospace',
        fontSize: 11,
        selectable: false,
        hasControls: false,
        hasRotatingPoint: false,
        fill: DEFAULT_COLOR.SIGNAL_VALUE
      });
      textValue = ' ' + polyText.text;
      textWidth = polyText.width;
      widthOverflow = textWidth > polyWidth;
      while (textWidth > polyWidth) {
        textValue = textValue.substr(0, textValue.length - 1);
        polyText.setText(textValue);
        polyText.setLeft(polyText.left + 1);
        textWidth = polyText.width;
      }
      if (widthOverflow) {
        textValue = textValue + '..';
        polyText.setText(textValue);
        polyText.setLeft(polyText.left + 1);
      }
      polyText.set('left', centrePoint.x - polyText.width / 2.0);
      polyText.set('top', centrePoint.y - polyText.height / 2.0);
      this._signalValueText.push({
        textbox: polyText,
        width: valueObject.width,
        value: value
      });
      this._canvas.add(polyText);
      return [this._timeToPos(valueObject.end), originY, value, polyLine];
    }
  };

  Waveform.prototype._getGridLine = function(coords) {
    return new fabric.Line(coords, {
      fill: DEFAULT_COLOR.GRID_LINE,
      stroke: DEFAULT_COLOR.GRID_LINE,
      strokeWidth: 1,
      opacity: 0.3,
      selectable: false,
      hasControls: false,
      hasRotatingPoint: false
    });
  };

  Waveform.prototype._drawSignalNames = function() {
    var busSignal, j, k, len, len1, nameboxText, ref, ref1, rendered, results, signal, signalCurrentValue, signalPos, textarea;
    signalPos = SIGNAL_BOX_PADDING + RULER_HEIGHT;
    this._signalNames = [];
    this._signalCurrentValues = [];
    ref = this.renderedSignals;
    for (j = 0, len = ref.length; j < len; j++) {
      rendered = ref[j];
      signal = rendered.signal;
      busSignal = this.isBus(signal.name);
      nameboxText = new fabric.IText(signal.name, {
        fontFamily: 'monospace',
        left: 10,
        top: signalPos + 4,
        fontSize: 12,
        selectable: false,
        hasControls: false,
        hasRotatingPoint: false,
        width: SIGNAL_BOX_WIDTH,
        height: SIGNAL_BOX_HEIGHT,
        fill: DEFAULT_COLOR.SIGNAL_NAME
      });
      signalCurrentValue = new fabric.IText('0', {
        fontFamily: 'monospace',
        left: SIGNAL_BOX_WIDTH + 12,
        top: signalPos + 4,
        fontSize: 11,
        selectable: false,
        hasControls: false,
        hasRotatingPoint: false,
        width: SIGNAL_BOX_WIDTH,
        height: SIGNAL_BOX_HEIGHT,
        fill: DEFAULT_COLOR.SIGNAL_CURRENT_VALUE
      });
      this._signalNames.push(nameboxText);
      rendered.text = nameboxText;
      rendered.ypos = signalPos;
      this._signalCurrentValues.push(signalCurrentValue);
      signalPos += SIGNAL_BOX_HEIGHT + SIGNAL_BOX_PADDING;
    }
    this._currentValueLineStart = new fabric.Line([SIGNAL_BOX_WIDTH + 10, 0, SIGNAL_BOX_WIDTH + 10, this._canvas.height], {
      fill: DEFAULT_COLOR.CURRENT_VALUE_LINE,
      stroke: DEFAULT_COLOR.CURRENT_VALUE_LINE,
      strokeWidth: 1,
      opacity: 1,
      selectable: false,
      hasControls: false,
      hasRotatingPoint: false
    });
    this._currentValueLineEnd = new fabric.Line([SIGNAL_NAMES_BOX_WIDTH, 0, SIGNAL_NAMES_BOX_WIDTH, this._canvas.height], {
      fill: DEFAULT_COLOR.CURRENT_VALUE_LINE,
      stroke: DEFAULT_COLOR.CURRENT_VALUE_LINE,
      strokeWidth: 1,
      opacity: 1,
      selectable: false,
      hasControls: false,
      hasRotatingPoint: false
    });
    this._canvas.add(this._currentValueLineStart);
    this._canvas.add(this._currentValueLineEnd);
    ref1 = this._signalNames;
    results = [];
    for (k = 0, len1 = ref1.length; k < len1; k++) {
      textarea = ref1[k];
      this._canvas.add(textarea);
      if (textarea.width > SIGNAL_BOX_WIDTH) {
        results.push(textarea.scaleToWidth(SIGNAL_BOX_WIDTH - 10));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  Waveform.prototype._getSignalValues = function(wave, start, end) {
    var _between, newValue, valueAdded, valueEnd, valueStart, values, waveIndex, waveValue;
    if (start == null) {
      start = this.renderFrom;
    }
    if (end == null) {
      end = this.renderTo;
    }
    if (wave.length === 0) {
      return [];
    }
    values = [];
    valueAdded = false;
    waveIndex = 0;
    _between = function(val, startRange, endRange) {
      if (startRange == null) {
        startRange = start;
      }
      if (endRange == null) {
        endRange = end;
      }
      return (val >= startRange) && (val <= endRange);
    };
    while (waveIndex < wave.length) {
      waveValue = wave[waveIndex];
      valueStart = Number.parseInt(waveValue[0]);
      valueEnd = waveIndex === wave.length - 1 ? end : Number.parseInt(wave[waveIndex + 1][0]);
      newValue = {
        start: 0,
        end: 0,
        value: waveValue[1]
      };
      if (_between(valueStart) && _between(valueEnd)) {
        newValue.start = valueStart;
        newValue.end = valueEnd;
      } else if (_between(valueStart) && valueEnd > end) {
        newValue.start = valueStart;
        newValue.end = end;
      } else if (_between(valueEnd) && valueStart < start) {
        newValue.start = start;
        newValue.end = valueEnd;
      } else {
        waveIndex++;
        continue;
      }
      values.push(newValue);
      valueAdded = true;
      waveIndex++;
    }
    if (!valueAdded) {
      return [
        {
          start: start,
          end: end,
          value: wave[wave.length - 1][1]
        }
      ];
    }
    return values;
  };

  Waveform.prototype._timeToPos = function(time, from, round) {
    if (from == null) {
      from = this.renderFrom;
    }
    if (round == null) {
      round = true;
    }
    if (round) {
      return Math.round(SIGNAL_NAMES_BOX_WIDTH + time * this._renderDistanceFactor - Math.round(from * this._renderDistanceFactor));
    } else {
      return SIGNAL_NAMES_BOX_WIDTH + time * this._renderDistanceFactor - from * this._renderDistanceFactor;
    }
  };

  Waveform.prototype._posToTime = function(pos, from, round) {
    if (from == null) {
      from = this.renderFrom;
    }
    if (round == null) {
      round = true;
    }
    if (round) {
      return Math.round((pos - SIGNAL_NAMES_BOX_WIDTH) / this._renderDistanceFactor) + Math.round(from);
    } else {
      return (pos - SIGNAL_NAMES_BOX_WIDTH) / this._renderDistanceFactor + from;
    }
  };

  Waveform.prototype._getFormattedValue = function(value, length) {
    if (length == null) {
      length = 8;
    }
    if (this.radix === RADIX_DEC) {
      if (value === 'x') {
        return "" + (this.pad(value, length, 'x'));
      } else if (value.toLowerCase() === 'z') {
        return "" + (this.pad(value, length, 'z'));
      } else {
        return "" + (this.binToDec(value));
      }
    } else if (this.radix === RADIX_HEX) {
      if (value === 'x') {
        return "" + (this.pad(value, length, 'x'));
      } else if (value.toLowerCase() === 'z') {
        return "" + (this.pad(value, length, 'z'));
      } else {
        return "0x" + (this.binToHex(value));
      }
    } else if (this.radix === RADIX_BIN) {
      if (value === 'x') {
        return "" + (this.pad(value, length, 'x'));
      } else if (value.toLowerCase() === 'z') {
        return "" + (this.pad(value, length, 'z'));
      } else {
        return "" + (this.pad(value, length));
      }
    }
  };

  Waveform.prototype._initLayout = function() {
    this._addSignalButtonId = this._containerId + "-waveform-add-btn";
    this._addSignalButton = $("<button class=\"waveform-toolbar-btn\" id=\"" + this._addSignalButtonId + "\">Add Sginal</button>");
    this._removeSignalButtonId = this._containerId + "-waveform-remove-btn";
    this._removeSignalButton = $("<button class=\"waveform-toolbar-btn\" id=\"" + this._removeSignalButtonId + "\">Remove Sginal</button>");
    this._zoomInButtonId = this._containerId + "-waveform-zoomin-btn";
    this._zoomInButton = $("<button class=\"waveform-toolbar-btn\" id=\"" + this._zoomInButtonId + "\">Zoom In</button>");
    this._zoomOutButtonId = this._containerId + "-waveform-zoomout-btn";
    this._zoomOutButton = $("<button class=\"waveform-toolbar-btn\" id=\"" + this._zoomOutButtonId + "\">Zoom Out</button>");
    this._zoomAllButtonId = this._containerId + "-waveform-zoomall-btn";
    this._zoomAllButton = $("<button class=\"waveform-toolbar-btn\" id=\"" + this._zoomAllButtonId + "\">Zoom All</button>");
    this._gotoFirstButtonId = this._containerId + "-waveform-gotofirst-btn";
    this._gotoFirstButton = $("<button class=\"waveform-toolbar-btn\" id=\"" + this._gotoFirstButtonId + "\">Goto First</button>");
    this._goLeftButtonId = this._containerId + "-waveform-goleft-btn";
    this._goLeftButton = $("<button class=\"waveform-toolbar-btn\" id=\"" + this._goLeftButtonId + "\">Go Left</button>");
    this._goRightButtonId = this._containerId + "-waveform-goright-btn";
    this._goRightButton = $("<button class=\"waveform-toolbar-btn\" id=\"" + this._goRightButtonId + "\">Go Right</button>");
    this._resetButtonId = this._containerId + "-waveform-reset-btn";
    this._resetButton = $("<button class=\"waveform-toolbar-btn\" id=\"" + this._goRightButtonId + "\">Reset Timing Diagram</button>");
    this._radixSelectBinId = this._containerId + "-waveform-radix-bin";
    this._optionBin = $("<option class=\"waveform-toolbar-option\" id=\"" + this._radixSelectBinId + "\" value=\"" + this._radixSelectBinId + "\" selected>Binary</option>");
    this._radixSelectDecId = this._containerId + "-waveform-radix-dec";
    this._optionDec = $("<option class=\"waveform-toolbar-option\" id=\"" + this._radixSelectDecId + "\" value=\"" + this._radixSelectDecId + "\">Decimal</option>");
    this._radixSelectHexId = this._containerId + "-waveform-radix-hex";
    this._optionHex = $("<option class=\"waveform-toolbar-option\" id=\"" + this._radixSelectHexId + "\" value=\"" + this._radixSelectHexId + "\">Hexadecimal</option>");
    this._radixSelectId = this._containerId + "-waveform-radix-select";
    this._radixSelectLabelId = this._containerId + "-waveform-radix-select-label";
    this._radixSelectLabel = $("<label class=\"waveform-toolbar-label\" id=\"" + this._radixSelectLabelId + "\" for=\"" + this._radixSelectId + "\">Select a speed</label>");
    this._radixSelect = $("<select class=\"waveform-toolbar-select\" name=\"radix-select\" id=\"" + this._radixSelectId + "\"></select>");
    this._cursorValueId = this._containerId + "-waveform-toolbar-cursor-value";
    this._cursorValueDiv = $("<div id=\"" + this._cursorValueId + "\" class=\"cursor-toolbar-value\">Cursor: 0ns</div>");
    this._modalDialogId = this._containerId + "-waveform-modal";
    this._modalDialog = $("<div id=\"" + this._modalDialogId + "\"></div>");
    this._toolbardId = this._containerId + "-waveform-toolbar";
    this._waveformToolbar = $("<div id=\"" + this._toolbardId + "\" class=\"ui-widget-header ui-corner-all waveform-toolbar\"></div>");
    this._waveformToolbar.append(this._addSignalButton);
    this._waveformToolbar.append(this._removeSignalButton);
    this._waveformToolbar.append(this._zoomInButton);
    this._waveformToolbar.append(this._zoomOutButton);
    this._waveformToolbar.append(this._zoomAllButton);
    this._waveformToolbar.append(this._gotoFirstButton);
    this._waveformToolbar.append(this._goLeftButton);
    this._waveformToolbar.append(this._goRightButton);
    this._waveformToolbar.append(this._resetButton);
    this._radixSelect.append(this._optionBin);
    this._radixSelect.append(this._optionDec);
    this._radixSelect.append(this._optionHex);
    this._waveformToolbar.append(this._radixSelect);
    this._waveformToolbar.append(this._cursorValueDiv);
    this._cursorValueDiv.hide();
    this._container.append(this._waveformToolbar);
    this._container.append(this._modalDialog);
    this._canvasId = this._containerId + "-waveform-canvas";
    this._canvasWrapper = $("<canvas class=\"waveform-canvas\" id=\"" + this._canvasId + "\"></canvas>");
    this._canvasViewportId = this._containerId + "-waveform-canvas-viewport";
    this._canvasViewport = $("<div class=\"canvas-viewport\" id=\"" + this._canvasViewportId + "\"></div>");
    this._canvasViewport.append(this._canvasWrapper);
    this._container.append(this._canvasViewport);
    this.canvasHeight = CANVAS_MAX_HEIGHT;
    this.canvasWidth = this._container.width();
    this.viewportHeight = this._container.height();
    this.canvasHeight = CANVAS_MAX_HEIGHT;
    this._canvasViewport.attr('tabIndex', 1000);
    $("#" + this._canvasViewportId).keydown((function(_this) {
      return function(e) {
        if (e.keyCode === 38) {
          if (_this.highlighted) {
            _this.highlighted.fill = void 0;
            _this.highlighted.opacity = 0;
          }
          _this.highlightedIndex--;
          if (_this.highlightedIndex < 0) {
            _this.highlightedIndex = _this.renderedSignals.length - 1;
          }
          _this.highlighted = _this.renderedSignals[_this.highlightedIndex].highlight;
          _this.highlighted.fill = DEFAULT_COLOR.SIGNAL_HIGHLIGHT;
          _this.highlighted.opacity = DEFAULT_OPACITY.SIGNAL_HIGHLIGHT;
          _this._canvas.renderAll();
          _this.setCursorTime(_this.currentExactTime);
          return e.preventDefault();
        } else if (e.keyCode === 40) {
          if (_this.highlighted) {
            _this.highlighted.fill = void 0;
            _this.highlighted.opacity = 0;
          }
          _this.highlightedIndex++;
          if (_this.highlightedIndex >= _this.renderedSignals.length) {
            _this.highlightedIndex = 0;
          }
          _this.highlighted = _this.renderedSignals[_this.highlightedIndex].highlight;
          _this.highlighted.fill = DEFAULT_COLOR.SIGNAL_HIGHLIGHT;
          _this.highlighted.opacity = DEFAULT_OPACITY.SIGNAL_HIGHLIGHT;
          _this._canvas.renderAll();
          _this.setCursorTime(_this.currentExactTime);
          return e.preventDefault();
        } else if (e.ctrlKey && e.keyCode === 83) {
          if (_this._onSaveListener) {
            _this._onSaveListener(_this.exportTimingDiagram());
          }
          return e.preventDefault();
        }
      };
    })(this));
    this._addSignalButton.button({
      text: false,
      icons: {
        primary: 'ui-icon-plus'
      }
    });
    this._addSignalButton.click((function(_this) {
      return function(e) {
        return _this.addSignal();
      };
    })(this));
    this._removeSignalButton.button({
      text: false,
      icons: {
        primary: 'ui-icon-minus'
      }
    });
    this._removeSignalButton.click((function(_this) {
      return function(e) {
        return _this.removeSignal();
      };
    })(this));
    this._zoomInButton.button({
      text: false,
      icons: {
        primary: 'ui-icon-zoomin'
      }
    });
    this._zoomInButton.click((function(_this) {
      return function(e) {
        return _this.zoomIn();
      };
    })(this));
    this._zoomOutButton.button({
      text: false,
      icons: {
        primary: 'ui-icon-zoomout'
      }
    });
    this._zoomOutButton.click((function(_this) {
      return function(e) {
        return _this.zoomOut();
      };
    })(this));
    this._zoomAllButton.button({
      text: false,
      icons: {
        primary: 'ui-icon-arrow-4-diag'
      }
    });
    this._zoomAllButton.click((function(_this) {
      return function(e) {
        return _this.zoomAll();
      };
    })(this));
    this._gotoFirstButton.button({
      text: false,
      icons: {
        primary: 'ui-icon-arrowstop-1-w'
      }
    });
    this._gotoFirstButton.click((function(_this) {
      return function(e) {
        return _this.moveFirst();
      };
    })(this));
    this._goLeftButton.button({
      text: false,
      icons: {
        primary: 'ui-icon-triangle-1-w'
      }
    });
    this._goLeftButton.click((function(_this) {
      return function(e) {
        return _this.moveLeft();
      };
    })(this));
    this._goRightButton.button({
      text: false,
      icons: {
        primary: 'ui-icon-triangle-1-e'
      }
    });
    this._goRightButton.click((function(_this) {
      return function(e) {
        return _this.moveRight();
      };
    })(this));
    this._resetButton.button({
      text: false,
      icons: {
        primary: 'ui-icon-arrowrefresh-1-n'
      }
    });
    this._resetButton.click((function(_this) {
      return function(e) {
        return _this.resetTimingDiagram();
      };
    })(this));
    this._radixSelect.selectmenu();
    $("#" + this._containerId + "-waveform-radix-select-button").css('display', 'inline-table');
    $("#" + this._containerId + "-waveform-radix-select-button").find('.ui-selectmenu-text').css('line-height', '0.6');
    return this._radixSelect.on("selectmenuchange", (function(_this) {
      return function(ui, e) {
        var selectedRadixId;
        selectedRadixId = e.item.value;
        if (selectedRadixId === _this._radixSelectBinId) {
          return _this.setRadix(RADIX_BIN);
        } else if (selectedRadixId === _this._radixSelectDecId) {
          return _this.setRadix(RADIX_DEC);
        } else if (selectedRadixId === _this._radixSelectHexId) {
          return _this.setRadix(RADIX_HEX);
        }
      };
    })(this));
  };

  return Waveform;

})();